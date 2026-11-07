# -*- coding: utf-8 -*-
"""
RAG Service for Resonancia AI (Astrology & Tarot Assistant)
- Comprehensive Knowledge Base: 12 Zodiac signs, 12 Houses, Planets, Aspects, Tarot, Glossary & App Features
- Hybrid Retrieval: Semantic Vector Search (Gemini Embedding) + Lexical Keyword Matching (BM25-style)
- Persistent embedding cache for Knowledge Base
- In-RAM LRU Cache for query embeddings to eliminate duplicate Gemini embedding calls
- Resilient 429 / Quota Error Handling with friendly fallback
"""

import os
import json
import re
import time
import hashlib
import requests
import numpy as np
from datetime import datetime

EMBEDDING_MODEL = "gemini-embedding-001"
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
CACHE_FILE = os.path.join(BASE_DIR, "rag_embeddings_cache.json")

# In-RAM LRU Query Embedding Cache
QUERY_EMBEDDING_CACHE = {}
MAX_QUERY_CACHE_SIZE = 256

# ==============================================================================
# 1. KNOWLEDGE BASE (KHO TRI THỨC CHIÊM TINH, TAROT VÀ TÍNH NĂNG RESONANCIA)
# ==============================================================================

KNOWLEDGE_DOCS = [
    # --- 12 CUNG HOÀNG ĐẠO ---
    {
        "id": "zodiac_aries",
        "category": "zodiac",
        "title": "Bạch Dương (Aries - 21/03 đến 19/04)",
        "keywords": ["bạch dương", "aries", "lửa", "thống lĩnh", "hỏa tinh", "mars"],
        "content": "Bạch Dương (Aries): Thuộc nguyên tố Lửa, phẩm chất Thống lĩnh, hành tinh chủ quản là Sao Hỏa (Mars). Đặc trưng: tiên phong, dũng cảm, quyết đoán, nhiệt huyết, thẳng thắn nhưng đôi khi nóng vội và thiếu kiên nhẫn. Trong tình yêu: nồng nhiệt, thích chủ động theo đuổi, trung thực. Hợp nhất với: Sư Tử, Nhân Mã (cùng nhóm Lửa) và Song Tử, Bảo Bình (nhóm Khí). Khắc chế hoặc cần học kiên nhẫn với: Ma Kết, Cự Giải."
    },
    {
        "id": "zodiac_taurus",
        "category": "zodiac",
        "title": "Kim Ngưu (Taurus - 20/04 đến 20/05)",
        "keywords": ["kim ngưu", "taurus", "đất", "kiên định", "kim tinh", "venus"],
        "content": "Kim Ngưu (Taurus): Thuộc nguyên tố Đất, phẩm chất Kiên định, hành tinh chủ quản là Sao Kim (Venus). Đặc trưng: thực tế, kiên nhẫn, đáng tin cậy, yêu cái đẹp, sự ổn định tài chính và hưởng thụ giác quan; điểm yếu là bướng bỉnh, ngại thay đổi. Trong tình yêu: chung thủy, chăm sóc thực tế, tìm kiếm cam kết lâu dài. Hợp nhất với: Xử Nữ, Ma Kết (nhóm Đất) và Cự Giải, Song Ngư (nhóm Nước)."
    },
    {
        "id": "zodiac_gemini",
        "category": "zodiac",
        "title": "Song Tử (Gemini - 21/05 đến 20/06)",
        "keywords": ["song tử", "gemini", "khí", "biến đổi", "thủy tinh", "mercury"],
        "content": "Song Tử (Gemini): Thuộc nguyên tố Khí, phẩm chất Biến đổi, hành tinh chủ quản là Sao Thủy (Mercury). Đặc trưng: thông minh, tò mò, linh hoạt, khả năng giao tiếp và học hỏi nhanh; điểm yếu là dễ phân tâm, hay thay đổi tâm trạng. Trong tình yêu: cần sự kết nối về trí tuệ, thích trò chuyện, ghét sự nhàm chán. Hợp nhất với: Thiên Bình, Bảo Bình (nhóm Khí) và Bạch Dương, Sư Tử (nhóm Lửa)."
    },
    {
        "id": "zodiac_cancer",
        "category": "zodiac",
        "title": "Cự Giải (Cancer - 21/06 đến 22/07)",
        "keywords": ["cự giải", "cancer", "nước", "thống lĩnh", "mặt trăng", "moon"],
        "content": "Cự Giải (Cancer): Thuộc nguyên tố Nước, phẩm chất Thống lĩnh, được Mặt Trăng (Moon) cai quản. Đặc trưng: giàu lòng trắc ẩn, trực giác sâu sắc, hướng về gia đình và sự an toàn cảm xúc; điểm yếu là nhạy cảm, dễ tổn thương và hay hoài niệm. Trong tình yêu: tận tụy, thích chăm sóc đối phương, tìm kiếm sự thấu hiểu chân thành. Hợp nhất với: Bọ Cạp, Song Ngư (nhóm Nước) và Kim Ngưu, Xử Nữ (nhóm Đất)."
    },
    {
        "id": "zodiac_leo",
        "category": "zodiac",
        "title": "Sư Tử (Leo - 23/07 đến 22/08)",
        "keywords": ["sư tử", "leo", "lửa", "kiên định", "mặt trời", "sun"],
        "content": "Sư Tử (Leo): Thuộc nguyên tố Lửa, phẩm chất Kiên định, được Mặt Trời (Sun) cai quản. Đặc trưng: tự tin, quảng đại, có khí chất lãnh đạo, sáng tạo và ấm áp; điểm yếu là kiêu hãnh cao, thích được khen ngợi và sợ bị phớt lờ. Trong tình yêu: hào phóng, chung tình, luôn muốn người yêu tự hào về mình. Hợp nhất với: Bạch Dương, Nhân Mã (nhóm Lửa) và Song Tử, Thiên Bình (nhóm Khí)."
    },
    {
        "id": "zodiac_virgo",
        "category": "zodiac",
        "title": "Xử Nữ (Virgo - 23/08 đến 22/09)",
        "keywords": ["xử nữ", "virgo", "đất", "biến đổi", "thủy tinh", "mercury"],
        "content": "Xử Nữ (Virgo): Thuộc nguyên tố Đất, phẩm chất Biến đổi, hành tinh chủ quản là Sao Thủy (Mercury). Đặc trưng: tỉ mỉ, cầu toàn, phân tích logic sắc bén, tinh thần cống hiến và phụng sự; điểm yếu là hay lo âu, tự khắt khe và săm soi chi tiết. Trong tình yêu: kín đáo, thể hiện qua hành động chăm sóc cụ thể hơn lời nói hoa mỹ. Hợp nhất với: Kim Ngưu, Ma Kết (nhóm Đất) và Cự Giải, Bọ Cạp (nhóm Nước)."
    },
    {
        "id": "zodiac_libra",
        "category": "zodiac",
        "title": "Thiên Bình (Libra - 23/09 đến 22/10)",
        "keywords": ["thiên bình", "libra", "khí", "thống lĩnh", "kim tinh", "venus"],
        "content": "Thiên Bình (Libra): Thuộc nguyên tố Khí, phẩm chất Thống lĩnh, hành tinh chủ quản là Sao Kim (Venus). Đặc trưng: duyên dáng, công bằng, yêu hòa bình, thẩm mỹ tinh tế và ngoại giao khéo léo; điểm yếu là thiếu quyết đoán, sợ xung đột và hay do dự. Trong tình yêu: lãng mạn, tôn trọng sự bình đẳng và đồng hành đôi bên. Hợp nhất với: Song Tử, Bảo Bình (nhóm Khí) và Sư Tử, Nhân Mã (nhóm Lửa)."
    },
    {
        "id": "zodiac_scorpio",
        "category": "zodiac",
        "title": "Bọ Cạp / Thiên Yết (Scorpio - 23/10 đến 21/11)",
        "keywords": ["bọ cạp", "thiên yết", "scorpio", "hổ cáp", "nước", "kiên định", "diêm vương", "pluto"],
        "content": "Bọ Cạp (Scorpio): Thuộc nguyên tố Nước, phẩm chất Kiên định, chủ quản là Sao Diêm Vương (Pluto) và Sao Hỏa cổ điển. Đặc trưng: sâu sắc, bí ẩn, kiên cường, trực giác phi thường, khả năng tái sinh mạnh mẽ; điểm yếu là đa nghi, ghen tuông và khó tha thứ. Trong tình yêu: mãnh liệt, tuyệt đối trung thành, đòi hỏi sự thấu cảm tận cùng tâm can. Hợp nhất với: Cự Giải, Song Ngư (nhóm Nước) và Kim Ngưu, Ma Kết, Xử Nữ (nhóm Đất)."
    },
    {
        "id": "zodiac_sagittarius",
        "category": "zodiac",
        "title": "Nhân Mã (Sagittarius - 22/11 đến 21/12)",
        "keywords": ["nhân mã", "sagittarius", "lửa", "biến đổi", "mộc tinh", "jupiter"],
        "content": "Nhân Mã (Sagittarius): Thuộc nguyên tố Lửa, phẩm chất Biến đổi, hành tinh chủ quản là Sao Mộc (Jupiter). Đặc trưng: yêu tự do, lạc quan, triết lý, đam mê khám phá và thích mở rộng chân trời; điểm yếu là bộc trực quá mức, thiếu cam kết và dễ mất kiên nhẫn. Trong tình yêu: cởi mở, cần không gian riêng, thích bạn đời cùng chia sẻ hành trình khám phá cuộc sống. Hợp nhất với: Bạch Dương, Sư Tử (nhóm Lửa) và Thiên Bình, Bảo Bình (nhóm Khí)."
    },
    {
        "id": "zodiac_capricorn",
        "category": "zodiac",
        "title": "Ma Kết (Capricorn - 22/12 đến 19/01)",
        "keywords": ["ma kết", "capricorn", "đất", "thống lĩnh", "thổ tinh", "saturn"],
        "content": "Ma Kết (Capricorn): Thuộc nguyên tố Đất, phẩm chất Thống lĩnh, hành tinh chủ quản là Sao Thổ (Saturn). Đặc trưng: kỷ luật, kiên định, trách nhiệm, tham vọng thực tế và bền bỉ tiến lên đỉnh cao; điểm yếu là nghiêm khắc, bi quan và khó bộc lộ cảm xúc. Trong tình yêu: chậm rãi, đáng tin cậy, xem trọng sự cam kết lâu dài và xây dựng tương lai bền vững. Hợp nhất với: Kim Ngưu, Xử Nữ (nhóm Đất) và Bọ Cạp, Song Ngư (nhóm Nước)."
    },
    {
        "id": "zodiac_aquarius",
        "category": "zodiac",
        "title": "Bảo Bình (Aquarius - 20/01 đến 18/02)",
        "keywords": ["bảo bình", "aquarius", "khí", "kiên định", "thiên vương", "uranus"],
        "content": "Bảo Bình (Aquarius): Thuộc nguyên tố Khí, phẩm chất Kiên định, chủ quản là Sao Thiên Vương (Uranus) và Sao Thổ cổ điển. Đặc trưng: độc lập, tư duy tiến bộ, nhân đạo, độc đáo và phá vỡ quy chuẩn cũ; điểm yếu là có phần xa cách cảm xúc, cố chấp với lý lẽ riêng. Trong tình yêu: bắt đầu từ tình bạn tri kỷ, tôn trọng tự do cá nhân của nhau. Hợp nhất với: Song Tử, Thiên Bình (nhóm Khí) và Bạch Dương, Nhân Mã (nhóm Lửa)."
    },
    {
        "id": "zodiac_pisces",
        "category": "zodiac",
        "title": "Song Ngư (Pisces - 19/02 đến 20/03)",
        "keywords": ["song ngư", "pisces", "nước", "biến đổi", "hải vương", "neptune"],
        "content": "Song Ngư (Pisces): Thuộc nguyên tố Nước, phẩm chất Biến đổi, hành tinh chủ quản là Sao Hải Vương (Neptune) và Sao Mộc cổ điển. Đặc trưng: thấu cảm, giàu lòng vị tha, tâm hồn nghệ thuật, trực giác linh tính cao; điểm yếu là mơ mộng trốn tránh thực tại, ranh giới cảm xúc mong manh. Trong tình yêu: lãng mạn vô điều kiện, sẵn sàng hy sinh và nuôi dưỡng tâm hồn đối phương. Hợp nhất với: Cự Giải, Bọ Cạp (nhóm Nước) và Kim Ngưu, Ma Kết (nhóm Đất)."
    },

    # --- HỆ THỐNG 12 CUNG NHÀ (HOUSES) TRONG LÁ SỐ ---
    {
        "id": "house_1_to_3",
        "category": "houses",
        "title": "Các Nhà 1, 2, 3 trong Lá Số Chiêm Tinh",
        "keywords": ["nhà 1", "nhà 2", "nhà 3", "house 1", "house 2", "house 3", "cung mọc", "tài chính", "giao tiếp"],
        "content": "- Nhà 1 (Cung Mọc / Ascendant): Đại diện cho bản ngã ngoại hiện, ấn tượng đầu tiên, diện mạo, sức sống và cách bạn khởi đầu mọi thứ trong đời.\n- Nhà 2: Đại diện cho tài chính cá nhân, tài sản, khả năng kiếm tiền, cảm giác an toàn vật chất và giá trị tự thân.\n- Nhà 3: Đại diện cho tư duy thường nhật, giao tiếp, học tập ngắn hạn, việc đi lại gần, quan hệ với anh chị em và môi trường sống xung quanh."
    },
    {
        "id": "house_4_to_6",
        "category": "houses",
        "title": "Các Nhà 4, 5, 6 trong Lá Số Chiêm Tinh",
        "keywords": ["nhà 4", "nhà 5", "nhà 6", "house 4", "house 5", "house 6", "gia đình", "tình yêu", "công việc", "sức khỏe"],
        "content": "- Nhà 4 (IC - Thiên Đế): Đại diện cho cội nguồn, gia đình, nơi trú ẩn nội tâm, tuổi thơ và cảm giác an cư lập nghiệp.\n- Nhà 5: Đại diện cho niềm vui, sự sáng tạo, lãng mạn, hẹn hò giai đoạn đầu, con cái, sở thích và tinh thần mạo hiểm.\n- Nhà 6: Đại diện cho công việc hàng ngày, thói quen sinh hoạt, sức khỏe thể chất, sự kỷ luật và tinh thần phục vụ người khác."
    },
    {
        "id": "house_7_to_9",
        "category": "houses",
        "title": "Các Nhà 7, 8, 9 trong Lá Số Chiêm Tinh",
        "keywords": ["nhà 7", "nhà 8", "nhà 9", "house 7", "house 8", "house 9", "hôn nhân", "đối tác", "tài chính chung", "triết lý"],
        "content": "- Nhà 7 (Descendant): Đại diện cho hôn nhân, đối tác cam kết một - một, những người bạn đồng hành dài lâu và đối thủ công khai.\n- Nhà 8: Đại diện cho sự chuyển hóa sâu sắc, tài chính chung (thừa kế, vốn đầu tư), tình dục, chiều sâu tâm lý và sự tái sinh từ khủng hoảng.\n- Nhà 9: Đại diện cho triết lý sống, giáo dục bậc cao, xuất ngoại, tôn giáo, đức tin và sự mở rộng thế giới quan."
    },
    {
        "id": "house_10_to_12",
        "category": "houses",
        "title": "Các Nhà 10, 11, 12 trong Lá Số Chiêm Tinh",
        "keywords": ["nhà 10", "nhà 11", "nhà 12", "house 10", "house 11", "house 12", "sự nghiệp", "trung thiên", "mc", "bạn bè", "tiềm thức"],
        "content": "- Nhà 10 (MC - Trung Thiên): Đỉnh cao lá số, đại diện cho sự nghiệp, danh tiếng, địa vị xã hội, đóng góp cho cộng đồng và hình tượng công chúng.\n- Nhà 11: Đại diện cho mạng lưới bạn bè, hội nhóm, cộng đồng, các lý tưởng nhân văn và những ước mơ dài hạn cho tương lai.\n- Nhà 12: Đại diện cho tiềm thức vô thức, nghiệp quả tâm linh, nơi chữa lành ẩn dật, sự giải thoát và những bí mật nội tâm sâu kín."
    },

    # --- HÀNH TINH VÀ ĐIỂM QUAN TRỌNG (BIG 3 & PLANETS) ---
    {
        "id": "planets_big3",
        "category": "planets",
        "title": "Bộ Ba Cốt Lõi Big 3: Mặt Trời, Mặt Trăng, Cung Mọc",
        "keywords": ["big 3", "big three", "mặt trời", "mặt trăng", "cung mọc", "sun", "moon", "ascendant"],
        "content": "- Mặt Trời (Sun): Cái tôi cốt lõi, ý chí, nguồn năng lượng sống và mục đích phát triển bản thân của bạn.\n- Mặt Trăng (Moon): Bản năng cảm xúc, nhu cầu nội tâm vô thức, ký ức, cảm giác an toàn và cách bạn phản ứng khi ở một mình hoặc khi bị tổn thương.\n- Cung Mọc (Ascendant / Rising): Lăng kính bạn nhìn ra thế giới và chiếc 'mặt nạ' xã hội đầu tiên mọi người cảm nhận về bạn, ảnh hưởng lớn đến phong thái và ngoại hình."
    },
    {
        "id": "planets_personal",
        "category": "planets",
        "title": "Các Hành Tinh Cá Nhân: Sao Thủy, Sao Kim, Sao Hỏa",
        "keywords": ["sao thủy", "sao kim", "sao hỏa", "mercury", "venus", "mars", "giao tiếp", "tình yêu", "động lực"],
        "content": "- Sao Thủy (Mercury): Cách tư duy logic, xử lý thông tin, phong cách nói chuyện và học hỏi.\n- Sao Kim (Venus): Ngôn ngữ tình yêu, gu thẩm mỹ, cách thu hút tài chính và những giá trị bạn trân quý trong mối quan hệ.\n- Sao Hỏa (Mars): Ý chí hành động, năng lượng tính dục, sự dũng cảm và cách bạn xử lý xung đột hoặc vượt qua áp lực."
    },
    {
        "id": "planets_social_outer",
        "category": "planets",
        "title": "Các Hành Tinh Xã Hội & Vòng Ngoài: Mộc, Thổ, Thiên Vương, Hải Vương, Diêm Vương",
        "keywords": ["sao mộc", "sao thổ", "thiên vương", "hải vương", "diêm vương", "jupiter", "saturn", "uranus", "neptune", "pluto"],
        "content": "- Sao Mộc (Jupiter): Cơ hội mở rộng, may mắn, tri thức và niềm tin sống.\n- Sao Thổ (Saturn): Bài học nhân quả, trách nhiệm, giới hạn, sự rèn luyện bền bỉ và độ chín chắn theo thời gian.\n- Sao Thiên Vương (Uranus): Sự đột phá, giải phóng, sáng tạo độc đáo và những thay đổi bất ngờ.\n- Sao Hải Vương (Neptune): Giấc mơ, trực giác, linh cảm, tâm linh và nghệ thuật lãng mạn.\n- Sao Diêm Vương (Pluto): Quyền năng chuyển hóa tâm lý, sự buông bỏ điều cũ để tái sinh con người mới mạnh mẽ hơn."
    },

    # --- CÁC GÓC HỢP (ASPECTS) & VẬN HẠN (TRANSITS) ---
    {
        "id": "aspects_and_transits",
        "category": "aspects",
        "title": "Các Góc Hợp (Aspects) và Vận Hạn (Transits) trong Chiêm Tinh",
        "keywords": ["góc hợp", "aspects", "tam hợp", "trine", "vuông góc", "square", "đối đỉnh", "opposition", "trùng tụ", "conjunction", "transit", "vận hạn"],
        "content": "- Trùng tụ (Conjunction - 0°): Năng lượng hòa quyện mãnh liệt, vừa là điểm mạnh vừa cần kiểm soát sự thái quá.\n- Lục hợp (Sextile - 60°) & Tam hợp (Trine - 120°): Góc hài hòa, dòng chảy năng lượng thuận lợi, tài năng thiên bẩm và sự đồng điệu tự nhiên.\n- Vuông góc (Square - 90°): Góc căng thẳng, tạo xung đột nội tâm nhưng là động lực mạnh nhất để trưởng thành và đột phá.\n- Đối đỉnh (Opposition - 180°): Góc đối diện đòi hỏi sự thỏa hiệp và cân bằng giữa hai thái cực.\n- Transit (Vận hạn): Sự chuyển động thực tế của hành tinh trên bầu trời kích hoạt các góc hợp trong lá số sinh, báo hiệu thời kỳ biến chuyển hay cơ hội."
    },

    # --- BÓI BÀI TAROT ---
    {
        "id": "tarot_overview",
        "category": "tarot",
        "title": "Tổng quan Bài Tarot & 4 Bộ Ẩn Phụ",
        "keywords": ["tarot", "bói bài", "ẩn phụ", "minor arcana", "wands", "cups", "swords", "pentacles", "gậy", "chén", "kiếm", "tiền"],
        "content": "Bài Tarot Rider-Waite gồm 78 lá (22 lá Ẩn chính Major Arcana và 56 lá Ẩn phụ Minor Arcana chia thành 4 bộ):\n- Gậy (Wands - Hoả): Đại diện cho đam mê, cảm hứng sáng tạo, ý chí, sự nghiệp và hành động.\n- Chén (Cups - Thuỷ): Đại diện cho tình cảm, trái tim, trực giác, các mối quan hệ và cảm xúc sâu thẳm.\n- Kiếm (Swords - Khí): Đại diện cho lý trí, tư duy, sự thật, ranh giới và những thử thách về mặt tinh thần.\n- Tiền (Pentacles - Thổ): Đại diện cho vật chất, tài chính, công việc thực tế, sức khỏe và tính ổn định lâu dài."
    },
    {
        "id": "tarot_major_love",
        "category": "tarot",
        "title": "Các Lá Bài Tarot Nổi Tiếng trong Tình Yêu & Khởi Đầu",
        "keywords": ["the fool", "the lovers", "the empress", "the star", "two of cups", "the sun", "tình duyên tarot"],
        "content": "- The Fool: Khởi đầu mới đầy ngây thơ, sẵn sàng nhảy vào hành trình mới với niềm tin thuần khiết.\n- The Lovers: Sự lựa chọn từ con tim, mối liên kết tâm hồn sâu sắc, tình yêu hòa hợp và cam kết đạo đức.\n- Two of Cups: Tình cảm đôi lứa chân thành, sự trao đổi cảm xúc cân bằng và gắn kết thấu hiểu.\n- The Empress: Sự sinh sôi, nuôi dưỡng ấm áp, tình yêu bao dung và viên mãn giác quan.\n- The Star: Niềm hy vọng, sự chữa lành sau bão giông và niềm tin vào tương lai tươi sáng.\n- The Sun: Niềm vui thuần khiết, thành công rực rỡ, sự rõ ràng và hạnh phúc tràn đầy."
    },
    {
        "id": "tarot_major_challenges",
        "category": "tarot",
        "title": "Các Lá Bài Tarot Thách Thức & Chuyển Hóa",
        "keywords": ["the tower", "death", "the devil", "the moon", "ten of swords", "thách thức tarot"],
        "content": "- The Tower: Sự sụp đổ của ảo tưởng cũ, cú sốc mang tính thanh lọc giúp giải phóng bản thân khỏi nền tảng sai lầm.\n- Death (Cái Chết): Sự kết thúc của một chu kỳ cũ để nhường chỗ cho sự tái sinh mới, buông bỏ quá khứ.\n- The Devil: Sự ràng buộc độc hại, cám dỗ, nỗi sợ hãi hoặc thói quen tiêu cực giam cầm tâm trí.\n- The Moon: Sự bất an, ảo ảnh, hiểu lầm hoặc những cảm xúc tiềm thức chưa được gọi tên.\n- Ten of Swords: Đáy của nỗi đau, chấm dứt hoàn toàn một hoàn cảnh khó khăn để bắt đầu ngày mới."
    },

    # --- ĐIỀU HƯỚNG TÍNH NĂNG ỨNG DỤNG RESONANCIA ---
    {
        "id": "feature_navigation",
        "category": "features",
        "title": "Bản Đồ Tính Năng Trực Tiếp của Resonancia",
        "keywords": ["tính năng", "bản đồ sao", "bói bài", "ghép đôi", "dự đoán", "vận hạn", "nhật ký", "từ điển"],
        "content": "Resonancia cung cấp các tính năng chiêm tinh toàn diện:\n- Khám phá Bản Đồ Sao cá nhân (Natal Chart Wheel & Big 3): đường dẫn /natal\n- Xem Bản Đồ Đôi (Synastry Chart & phân tích góc hợp 2 người): đường dẫn /synastry\n- Bói bài Tarot (trải bài tình cảm, công việc hàng ngày): đường dẫn /tarot\n- Ghép Đôi Hẹn Hò (tìm kiếm đối tượng hợp cung & nguyên tố): đường dẫn /match\n- Dự Báo Chiêm Tinh (Horoscope năng lượng ngày/tháng): đường dẫn /prediction\n- Vận Hạn Quá Cảnh (Transit thời gian thực): đường dẫn /transit\n- Từ Điển Chiêm Tinh Học (Giải thích chi tiết mọi thuật ngữ): đường dẫn /glossary\n- Nhật Ký Vũ Trụ (Ghi lại cảm xúc & hành trình): đường dẫn /journal"
    }
]

# ==============================================================================
# 2. VECTOR EMBEDDING, PERSISTENT CACHE & IN-RAM QUERY CACHE
# ==============================================================================

def normalize_text(text: str) -> str:
    """Chuẩn hóa tiếng Việt không dấu để hỗ trợ search từ khóa."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[àáạảãâầấậẩẫăằắặẳẵ]', 'a', text)
    text = re.sub(r'[èéẹẻẽêềếệểễ]', 'e', text)
    text = re.sub(r'[ìíịỉĩ]', 'i', text)
    text = re.sub(r'[òóọỏõôồốộổỗơờớợởỡ]', 'o', text)
    text = re.sub(r'[ùúụủũưừứựửữ]', 'u', text)
    text = re.sub(r'[ỳýỵỷỹ]', 'y', text)
    text = re.sub(r'[đ]', 'd', text)
    return re.sub(r'\s+', ' ', text).strip()

def get_kb_version() -> str:
    """Tính SHA-256 fingerprint từ nội dung chuẩn hóa của KNOWLEDGE_DOCS."""
    content_list = [(d["id"], d["title"], d["content"]) for d in KNOWLEDGE_DOCS]
    serialized = json.dumps(content_list, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]

def get_gemini_embedding(text: str, api_key: str) -> list:
    """Tạo vector embedding qua Gemini API với cơ chế xử lý lỗi an toàn."""
    if not api_key:
        return []
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{EMBEDDING_MODEL}:embedContent"
    try:
        response = requests.post(
            url,
            params={"key": api_key},
            json={
                "model": f"models/{EMBEDDING_MODEL}",
                "content": {"parts": [{"text": text[:2048]}]}
            },
            timeout=12
        )
        if response.status_code == 200:
            return response.json().get("embedding", {}).get("values", [])
        elif response.status_code == 429:
            print("Embedding rate limit 429, fallback to lexical matching.")
            return []
        else:
            print(f"Embedding status {response.status_code}: {response.text[:120]}")
    except Exception as e:
        print(f"Embedding API error for '{text[:30]}':", e)
    return []

def get_query_embedding_cached(query: str, api_key: str) -> tuple:
    """
    Lấy embedding cho câu hỏi với in-RAM LRU cache.
    Trả về (embedding_vector, is_cache_hit).
    """
    norm_q = normalize_text(query)
    cache_key = f"{EMBEDDING_MODEL}:{norm_q}"
    if cache_key in QUERY_EMBEDDING_CACHE:
        return QUERY_EMBEDDING_CACHE[cache_key], True

    emb = get_gemini_embedding(query, api_key)
    if emb:
        if len(QUERY_EMBEDDING_CACHE) >= MAX_QUERY_CACHE_SIZE:
            first_k = next(iter(QUERY_EMBEDDING_CACHE))
            QUERY_EMBEDDING_CACHE.pop(first_k, None)
        QUERY_EMBEDDING_CACHE[cache_key] = emb
    return emb, False

class RagKnowledgeRetriever:
    """Bộ máy tìm kiếm lai (Hybrid Retriever) cho Resonancia RAG."""
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.docs = KNOWLEDGE_DOCS
        self.doc_embeddings = {}
        self._load_or_build_embeddings()

    def _load_or_build_embeddings(self):
        """Tải embedding từ file cache hoặc khởi tạo."""
        cache_loaded = False
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    self.doc_embeddings = json.load(f)
                    cache_loaded = True
            except Exception as e:
                print("Could not load embedding cache:", e)

        # Kiểm tra xem có doc nào chưa có embedding trong cache không
        missing_docs = [d for d in self.docs if d["id"] not in self.doc_embeddings]
        if missing_docs and self.api_key:
            print(f"Building embeddings for {len(missing_docs)} knowledge documents...")
            for doc in missing_docs:
                full_text = f"{doc['title']}\n{doc['content']}"
                emb = get_gemini_embedding(full_text, self.api_key)
                if emb:
                    self.doc_embeddings[doc["id"]] = emb
            try:
                with open(CACHE_FILE, "w", encoding="utf-8") as f:
                    json.dump(self.doc_embeddings, f)
            except Exception as e:
                print("Could not save embedding cache:", e)

    def _cosine_similarity(self, v1, v2) -> float:
        if not v1 or not v2:
            return 0.0
        a = np.array(v1, dtype=float)
        b = np.array(v2, dtype=float)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    def _lexical_score(self, query: str, doc: dict) -> float:
        """Tính điểm trùng khớp từ khóa (BM25-style lexical matching)."""
        norm_q = normalize_text(query)
        q_tokens = set(re.findall(r'\w+', norm_q))
        if not q_tokens:
            return 0.0

        score = 0.0
        doc_text = normalize_text(f"{doc['title']} {doc['content']} {' '.join(doc.get('keywords', []))}")

        # Khớp nguyên cụm từ khóa (Exact phrase)
        for kw in doc.get("keywords", []):
            norm_kw = normalize_text(kw)
            if norm_kw and norm_kw in norm_q:
                score += 2.5

        # Khớp các token từ đơn
        matched_tokens = 0
        for token in q_tokens:
            if len(token) > 2 and token in doc_text:
                matched_tokens += 1

        score += (matched_tokens / len(q_tokens)) * 2.0
        return score

    def retrieve(self, query: str, top_k: int = 3) -> list:
        """
        Tìm kiếm tài liệu liên quan nhất bằng Hybrid Search:
        Score = 0.65 * Semantic_Sim + 0.35 * Normalized_Lexical_Score
        Trả về list of docs (giữ tương thích 100% contract).
        """
        query_emb = None
        self.last_cache_hit = False
        self.last_emb_calls = 0

        if self.api_key:
            query_emb, self.last_cache_hit = get_query_embedding_cached(query, self.api_key)
            self.last_emb_calls = 0 if self.last_cache_hit else (1 if query_emb else 0)

        ranked = []
        for doc in self.docs:
            doc_id = doc["id"]
            sem_score = 0.0
            if query_emb and doc_id in self.doc_embeddings:
                sem_score = self._cosine_similarity(query_emb, self.doc_embeddings[doc_id])

            lex_score = self._lexical_score(query, doc)
            # Chuẩn hóa điểm hybrid
            total_score = (sem_score * 0.65) + (min(lex_score / 3.0, 1.0) * 0.35)
            ranked.append((total_score, doc))

        ranked.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in ranked[:top_k]]


# ==============================================================================
# 3. PROMPT AUGMENTATION & ANSWER GENERATION WITH QUOTA RETRY
# ==============================================================================

def generate_rag_chat_response(
    messages: list,
    user_data: dict,
    api_key: str,
    model_name: str,
    rewritten_query: str = None,
    emotional_level: str = "none"
) -> dict:
    """
    Sinh câu trả lời thông minh dựa trên RAG cho AstroBot Resonancia.
    Trả về:
    {
        "answer": str,
        "retrieved_topics": list,
        "fallback": bool,
        "embedding_calls": int,
        "generation_calls": int,
        "query_cache_hit": bool
    }
    """
    last_msg = messages[-1].get("content", "").strip() if messages else ""
    if not last_msg:
        return {"error": "Tin nhắn rỗng"}

    query_for_retrieval = rewritten_query.strip() if rewritten_query else last_msg

    # 1. Truy xuất tài liệu liên quan qua Hybrid Retriever
    retriever = RagKnowledgeRetriever(api_key=api_key)
    retrieved_docs = retriever.retrieve(query_for_retrieval, top_k=3)
    is_query_cache_hit = getattr(retriever, "last_cache_hit", False)
    emb_calls = getattr(retriever, "last_emb_calls", 0)

    context_snippets = []
    for d in retrieved_docs:
        context_snippets.append(f"### {d['title']}:\n{d['content']}")
    knowledge_context = "\n\n".join(context_snippets)

    # 2. Xử lý thông tin người dùng
    user_name = str(user_data.get("name") or "Bạn").strip()
    sun = user_data.get("sun")
    moon = user_data.get("moon")
    ascendant = user_data.get("ascendant")

    has_natal_info = bool(sun and str(sun).lower() != "chưa cung cấp" and str(sun).strip())

    if has_natal_info:
        user_info_str = f"- Tên: {user_name}\n- Mặt Trời: {sun}\n- Mặt Trăng: {moon or 'Chưa rõ'}\n- Cung Mọc: {ascendant or 'Chưa rõ'}"
    else:
        user_info_str = f"- Tên: {user_name}\n- Trạng thái lá số: Người dùng chưa cập nhật ngày sinh/lá số trên hồ sơ cá nhân."

    # 3. Lấy 6 lượt hội thoại gần nhất để giữ mạch trò chuyện tối ưu
    turns = []
    for item in messages[-6:]:
        role_label = "Người dùng" if item.get("role") == "user" else "AstroBot"
        text = str(item.get("content", "")).strip()[:800]
        turns.append(f"{role_label}: {text}")
    chat_history_str = "\n".join(turns)

    # Chỉ dẫn cảm xúc nếu có
    emotional_instruction = ""
    if emotional_level == "sad":
        emotional_instruction = (
            "\n* CHỈ DẪN CẢM XÚC: Người dùng đang cảm thấy buồn bã hoặc tổn thương. "
            "Hãy thể hiện sự lắng nghe ân cần, đồng cảm sâu sắc, không đùa cợt, mang đến sự an ủi và góc nhìn chiêm tinh chữa lành nhẹ nhàng."
        )

    # 4. Thiết kế System Prompt chuẩn RAG cho Resonancia
    system_instruction = f"""Bạn là AstroBot - Cố vấn Chiêm tinh học và Tarot AI thông thái, ấm áp và sâu sắc của nền tảng Resonancia.
Nhiệm vụ của bạn:
1. Trả lời trực tiếp, chính xác, tự nhiên và đúng trọng tâm câu hỏi của người dùng bằng tiếng Việt.
2. Áp dụng CƠ SỞ TRI THỨC CHIÊM TINH & TAROT được cung cấp bên dưới để giải thích thuyết phục, có chiều sâu tâm lý và triết lý chiêm tinh hiện đại.
3. Phân biệt rõ thông tin trong CƠ SỞ TRI THỨC với suy luận/diễn giải; không trình bày suy luận như dữ kiện tuyệt đối; chiêm tinh là góc nhìn tham khảo định hướng tích cực.
4. Trả lời ngắn gọn, cô đọng từ 2 đến 4 đoạn súc tích, tránh lan man.{emotional_instruction}
5. Đối với thông tin người dùng:
   - Nếu người dùng ĐÃ có thông tin lá số ({'Mặt Trời ' + str(sun) if has_natal_info else ''}): hãy kết hợp góc nhìn năng lượng chiêm tinh tương ứng để cá nhân hóa câu trả lời.
   - Nếu người dùng CHƯA có thông tin lá số: ĐỪNG nói 'Mặt Trời chưa cung cấp' hay 'Mặt Trăng chưa cung cấp'. Hãy xưng hô thân mật là {user_name}, trả lời chuẩn xác câu hỏi và nếu phù hợp, có thể khéo léo gợi ý họ cập nhật ngày giờ sinh tại mục Hồ Sơ để xem lá số chiêm tinh chính xác nhất.
6. Khi người dùng hỏi về bói bài, xem lá số, xem độ hợp đôi, hoặc dự báo hôm nay, hãy tự nhiên đề xuất tính năng tương ứng của Resonancia (như Mở Tarot, Mở Bản Đồ Sao, Mở Bản Đồ Đôi Synastry, Mở Ghép Đôi, Mở Dự Đoán, v.v.).

=== CƠ SỞ TRI THỨC CHIÊM TINH & TAROT LIÊN QUAN ===
{knowledge_context}

=== THÔNG TIN NGƯỜI DÙNG ===
{user_info_str}

=== LỊCH SỬ HỘI THOẠI GẦN ĐÂY ===
{chat_history_str}

Hãy đóng vai AstroBot và trả lời câu hỏi cuối cùng của người dùng một cách chuyên nghiệp, ân cần và giàu cảm hứng."""

    # 5. Gọi Gemini API với xử lý lỗi 429 và quota rate limit
    api_model = model_name or "gemini-3.5-flash-lite"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{api_model}:generateContent"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": system_instruction}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 600,
        }
    }

    gen_calls = 0
    try:
        gen_calls += 1
        response = requests.post(url, params={"key": api_key}, headers=headers, json=payload, timeout=25)

        # Xử lý 429 / Rate Limit
        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After")
            err_text = response.text.lower()
            is_quota_exhausted = "resource_exhausted" in err_text or "quota" in err_text

            if not is_quota_exhausted and retry_after and retry_after.isdigit() and int(retry_after) <= 3:
                time.sleep(int(retry_after))
                gen_calls += 1
                response = requests.post(url, params={"key": api_key}, headers=headers, json=payload, timeout=25)

            if not response.ok:
                return {
                    "answer": "Mình đang gặp giới hạn xử lý một chút, bạn thử lại sau nhé.",
                    "retrieved_topics": [d["title"] for d in retrieved_docs],
                    "fallback": True,
                    "embedding_calls": emb_calls,
                    "generation_calls": gen_calls,
                    "query_cache_hit": is_query_cache_hit
                }

        if response.ok:
            data = response.json()
            candidates = data.get("candidates", [])
            parts = candidates[0].get("content", {}).get("parts", []) if candidates else []
            answer = "\n".join(p.get("text", "") for p in parts if p.get("text")).strip()
            if answer:
                return {
                    "answer": answer,
                    "retrieved_topics": [d["title"] for d in retrieved_docs],
                    "fallback": False,
                    "embedding_calls": emb_calls,
                    "generation_calls": gen_calls,
                    "query_cache_hit": is_query_cache_hit
                }
    except Exception as e:
        print("Gemini RAG Generate Error:", e)

    # 6. Fallback thông minh dựa trên chính tài liệu RAG đã retrieve
    top_doc = retrieved_docs[0] if retrieved_docs else None
    if top_doc:
        doc_brief = top_doc['content'].split('\n')[0]
        fallback = f"Chào {user_name}! Dưới góc nhìn chiêm tinh học về chủ đề bạn vừa hỏi ({top_doc['title']}): {doc_brief}\n\nBạn có muốn khám phá chi tiết hơn về vấn đề này hay xem trực tiếp trong lá số chiêm tinh của mình không?"
    else:
        fallback = f"Chào {user_name}! AstroBot đang kết nối lại với dòng năng lượng chiêm tinh. Bạn có thể thử hỏi lại về các cung hoàng đạo, ý nghĩa lá bài Tarot hoặc mở trực tiếp Bản Đồ Sao để tra cứu nhé."

    return {
        "answer": fallback,
        "fallback": True,
        "embedding_calls": emb_calls,
        "generation_calls": gen_calls,
        "query_cache_hit": is_query_cache_hit
    }

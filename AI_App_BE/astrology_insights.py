# -*- coding: utf-8 -*-
"""
Module cung cấp các luận giải chiêm tinh học chuyên sâu (Depth Astrology & Career Insights)
Dành cho việc tạo phân tích Natal Chart và Bản Đồ Hướng Nghiệp sắc sảo, giàu hàm lượng tri thức.
"""

from datetime import datetime

# -------------------------------------------------------------
# 1. CUNG MỌC (ASCENDANT) - 12 CUNG HOÀNG ĐẠO
# -------------------------------------------------------------
# -*- coding: utf-8 -*-
"""
Module cung cấp các luận giải chiêm tinh học chuyên sâu (Depth Astrology & Career Insights)
Dành cho việc tạo phân tích Natal Chart và Bản Đồ Hướng Nghiệp sắc sảo, giàu hàm lượng tri thức.
"""

# Chiêm tinh hướng nghiệp theo Trung Thiên (Midheaven - MC)
MC_CAREER_MAP = {
    "Bạch Dương": {
        "title": "Người Tiên Phong Độc Lập & Dẫn Dắt Đột Phá",
        "archetype": "Nhà khởi nghiệp, chỉ huy chiến lược, tiên phong mở lối",
        "style": "Bạn mang năng lượng của người đi mở đường, ghét sự rập khuôn và luôn muốn làm chủ vận mệnh nghề nghiệp. Bạn phát huy phong độ cao nhất khi được giao quyền tự quyết, đương đầu với thử thách mới hoặc dẫn dắt các dự án đột phá.",
        "fields": ["Khởi nghiệp / Sáng lập dự án", "Quản lý điều hành & Quản trị rủi ro", "Công nghệ đổi mới sáng tạo", "Kinh doanh phát triển thị trường mới"],
        "challenge": "Dễ chán nản ở giai đoạn duy trì ổn định; cần học cách kiên trì và phối hợp đội nhóm thay vì ôm đồm đơn độc.",
    },
    "Kim Ngưu": {
        "title": "Kiến Trúc Sư Giá Trị Bền Vững & Quản Trị Tài Sản",
        "archetype": "Chuyên gia tài chính, nhà phát triển nguồn lực, thẩm mỹ gia",
        "style": "Bạn sở hữu trực giác thực tế sắc bén về giá trị vật chất và sự bền vững. Phong cách làm việc điềm đạm, có phương pháp bài bản và đặc biệt kiên định với các mục tiêu dài hạn.",
        "fields": ["Tài chính - Ngân hàng / Đầu tư định giá", "Kiến trúc / Bất động sản / Quy hoạch", "Nghệ thuật ứng dụng & Thiết kế cao cấp", "Quản lý chuỗi cung ứng & Vận hành"],
        "challenge": "Xu hướng ngại thay đổi, dễ bám víu vào vùng an toàn; cần dũng cảm đón nhận công nghệ mới và linh hoạt chuyển mình.",
    },
    "Song Tử": {
        "title": "Nhà Kết Nối Tri Thức & Chiến Lược Gia Truyền Thông",
        "archetype": "Chuyên gia truyền thông, cố vấn chiến lược, phát triển nội dung đa nền tảng",
        "style": "Trí tuệ linh hoạt, khả năng tổng hợp thông tin đa nguồn cực nhanh và năng khiếu ngôn ngữ vượt trội giúp bạn trở thành cầu nối thông tin không thể thay thế trong mọi tổ chức.",
        "fields": ["Báo chí / Truyền thông đa phương tiện", "Marketing & Quảng cáo sáng tạo", "Quan hệ đối ngoại / Ngoại giao thương mại", "Đào tạo, diễn thuyết & Xuất bản"],
        "challenge": "Dễ bị phân tán bởi quá nhiều ý tưởng cùng lúc; cần xây dựng tính kỷ luật tập trung để hoàn thành trọn vẹn từng mục tiêu.",
    },
    "Cự Giải": {
        "title": "Người Kiến Tạo Không Gian Nuôi Dưỡng & Thấu Cảm Tổ Chức",
        "archetype": "Nhà quản trị nhân sự, cố vấn tâm lý, chuyên gia thương hiệu vì cộng đồng",
        "style": "Bạn có năng lực thấu cảm sâu sắc, khả năng nắm bắt tâm lý khách hàng và xây dựng văn hóa đội ngũ gắn kết bền chặt. Bạn tạo ra những sản phẩm/dịch vụ mang lại cảm giác an tâm và tin cậy tuyệt đối.",
        "fields": ["Quản trị nguồn nhân lực (HR) & Phát triển tổ chức", "Tâm lý học, tư vấn trị liệu & Chăm sóc sức khỏe", "F&B, Khách sạn nghỉ dưỡng & Bất động sản dân dụng", "Hoạt động xã hội & Giáo dục mầm non/cộng đồng"],
        "challenge": "Dễ để cảm xúc cá nhân chi phối quyết định công việc; cần rèn luyện sự tách bạch lý trí trong đàm phán và xử lý khủng hoảng.",
    },
    "Sư Tử": {
        "title": "Nhà Lãnh Đạo Sân Khấu Lớn & Truyền Cảm Hứng Danh Vọng",
        "archetype": "Giám đốc sáng tạo, đại sứ thương hiệu, lãnh đạo truyền cảm hứng",
        "style": "Bạn sinh ra để tỏa sáng ở vị trí trung tâm. Bản lĩnh tự tin, phong thái đĩnh đạc và sức hút tự nhiên giúp bạn dễ dàng thu hút nguồn lực và truyền ngọn lửa nhiệt huyết cho tập thể.",
        "fields": ["Quản lý nghệ thuật & Công nghiệp giải trí", "Xây dựng thương hiệu cá nhân / PR cấp cao", "Lãnh đạo doanh nghiệp & Diễn giả truyền cảm hứng", "Thời trang, Thiết kế xa xỉ & Sự kiện quy mô lớn"],
        "challenge": "Cái tôi cao dễ khiến bạn nhạy cảm trước lời phê bình; hãy học cách lắng nghe ý kiến phản biện đa chiều từ đồng đội.",
    },
    "Xử Nữ": {
        "title": "Chuyên Gia Tinh Chỉnh Hệ Thống & Tối Ưu Hóa Chuẩn Mực",
        "archetype": "Kỹ sư phân tích dữ liệu, chuyên gia kiểm toán / chất lượng, nhà nghiên cứu",
        "style": "Óc phân tích tỉ mỉ, tư duy phản biện sắc lẹm và tiêu chuẩn làm việc không tì vết. Bạn là người giải mã các bài toán hóc búa nhất và biến những quy trình hỗn loạn thành cỗ máy vận hành trơn tru.",
        "fields": ["Phân tích dữ liệu lớn (Data Analysis) & Khoa học máy tính", "Kiểm toán tài chính, Pháp chế & Quản lý chất lượng (QA/QC)", "Nghiên cứu y sinh, Dược phẩm & Chăm sóc sức khỏe", "Biên tập chuyên sâu, Tư vấn tối ưu hóa quy trình"],
        "challenge": "Chủ nghĩa hoàn hảo quá mức dễ gây căng thẳng thần kinh và làm chậm tiến độ; hãy học cách chấp nhận 'đủ tốt để ra mắt'.",
    },
    "Thiên Bình": {
        "title": "Nhà Ngoại Giao Chiến Lược & Cân Bằng Lợi Ích Tổ Chức",
        "archetype": "Chuyên gia đàm phán hợp đồng, cố vấn pháp lý, giám tuyển nghệ thuật",
        "style": "Khả năng cân bằng tuyệt vời giữa thẩm mỹ tinh tế và nghệ thuật dung hòa xung đột. Bạn xuất sắc trong việc xây dựng quan hệ đối tác chiến lược và kiến tạo những thỏa thuận đôi bên cùng có lợi.",
        "fields": ["Luật thương mại, Trọng tài kinh tế & Ngoại giao", "Quan hệ đối tác (Partnerships) & Phát triển kinh doanh quốc tế", "Thiết kế nội thất, Mỹ thuật & Giám tuyển triển lãm", "Tư vấn hòa giải, Nhân sự cấp cao (Headhunter)"],
        "challenge": "Dễ do dự khi phải ra quyết định dứt khoát dưới áp lực thời gian; cần quyết đoán hơn và tin tưởng vào lập trường cá nhân.",
    },
    "Bọ Cạp": {
        "title": "Chiến Lược Gia Chiều Sâu & Chuyên Gia Biến Đổi Khủng Hoảng",
        "archetype": "Nhà đầu tư mạo hiểm, điều tra chiến lược, chuyên gia chuyển đổi số",
        "style": "Tầm nhìn thấu thị xuyên qua vẻ bề ngoài, khả năng giữ bí mật tuyệt đối và bản lĩnh kiên cường trước nghịch cảnh. Càng trong khủng hoảng, bạn càng trở nên tỉnh táo, quyết liệt và tái sinh mạnh mẽ hơn.",
        "fields": ["Đầu tư mạo hiểm (Venture Capital) & Tái cấu trúc doanh nghiệp", "An ninh mạng, Điều tra số liệu & Phân tích tình báo kinh tế", "Phẫu thuật y khoa, Nghiên cứu tâm lý học chiều sâu", "Quản trị rủi ro khủng hoảng & Xử lý tài sản đặc biệt"],
        "challenge": "Tính đa nghi và xu hướng muốn kiểm soát tất cả; cần học cách ủy quyền và xây dựng lòng tin minh bạch với cộng sự.",
    },
    "Nhân Mã": {
        "title": "Nhà Khai Phóng Tầm Nhìn & Cố Vấn Triết Lý Toàn Cầu",
        "archetype": "Chuyên gia hợp tác quốc tế, học giả nghiên cứu, nhà du hành truyền cảm hứng",
        "style": "Tư duy vĩ mô rộng mở, tinh thần khám phá không biên giới và đam mê chia sẻ tri thức chân lý. Bạn không thích bị bó hẹp trong văn phòng gò bó mà luôn hướng tầm mắt ra thế giới rộng lớn.",
        "fields": ["Hợp tác quốc tế, Thương mại xuyên biên giới & Ngoại thương", "Giảng dạy đại học, Nghiên cứu triết học / Tôn giáo / Văn hóa", "Du lịch cao cấp, Xuất bản sách & Phóng viên quốc tế", "Tư vấn chiến lược vĩ mô & Pháp lý quốc tế"],
        "challenge": "Dễ lạc quan tếu hoặc bỏ qua các chi tiết vận hành vi mô; cần có cộng sự tỉ mỉ hỗ trợ triển khai thực tế.",
    },
    "Ma Kết": {
        "title": "Nhà Kiến Tạo Đế Chế & Biểu Tượng Kỷ Luật Thượng Tầng",
        "archetype": "CEO điều hành, nhà kiến tạo thể chế, chuyên gia quản trị danh tiếng",
        "style": "Sức bền phi thường, đạo đức nghề nghiệp mẫu mực và tư duy xây dựng di sản lâu dài. Bạn leo lên đỉnh cao bằng từng bước đi vững chắc, được xã hội nể trọng bởi uy tín và trách nhiệm cao cả.",
        "fields": ["Điều hành doanh nghiệp cấp cao (C-Level) & Quản lý Nhà nước", "Bất động sản công nghiệp, Xây dựng cơ sở hạ tầng lớn", "Quản lý quỹ hưu trí / Quỹ đầu tư giá trị", "Chiến lược quản trị doanh nghiệp truyền thống & Bền vững"],
        "challenge": "Dễ đặt gánh nặng trách nhiệm quá lớn lên vai, trở nên khô cứng; cần học cách tưởng thưởng bản thân và cân bằng cuộc sống.",
    },
    "Bảo Bình": {
        "title": "Nhà Canh Tân Đột Phá & Tiên Tri Tương Lai Xã Hội",
        "archetype": "Kiến trúc sư công nghệ, nhà hoạt động xã hội tiến bộ, nhà phát minh",
        "style": "Tư duy đi trước thời đại cả thập kỷ, tinh thần nhân đạo vì cộng đồng và hoàn toàn không bị trói buộc bởi định kiến cũ kỹ. Bạn xuất sắc trong việc ứng dụng công nghệ để giải quyết các vấn đề vĩ mô của nhân loại.",
        "fields": ["Trí tuệ nhân tạo (AI), Blockchain & Công nghệ tương lai", "Nghiên cứu khoa học không gian, Năng lượng tái tạo", "Tổ chức phi chính phủ (NGO), Hoạt động vì quyền lợi cộng đồng", "Thiết kế sản phẩm số mang tính cách mạng"],
        "challenge": "Tư duy quá trừu tượng đôi khi khiến người xung quanh khó hiểu; cần rèn luyện cách diễn giải thực tế và kết nối cảm xúc đời thường.",
    },
    "Song Ngư": {
        "title": "Nghệ Sĩ Trực Giác & Sứ Giả Hàn Gắn Tâm Hồn",
        "archetype": "Nhà sáng tạo nghệ thuật huyền diệu, chuyên gia trị liệu tinh thần, cố vấn nhân văn",
        "style": "Trực giác thiên bẩm, trí tưởng tượng không giới hạn và lòng vị tha bao dung. Bạn kết nối với thế giới bằng tần số cảm xúc thanh cao, tạo ra những tác phẩm chạm thẳng vào trái tim người khác.",
        "fields": ["Điện ảnh, Âm nhạc, Hội họa & Nhiếp ảnh nghệ thuật", "Tâm lý trị liệu, Trị liệu bằng âm thanh / Nghệ thuật (Art Therapy)", "Thiết kế trải nghiệm người dùng mang tính cảm xúc", "Hoạt động từ thiện, Bảo trợ động vật & Môi trường sinh thái"],
        "challenge": "Dễ mất tập trung hoặc trốn tránh thực tế khi gặp áp lực deadline; cần một hệ thống quản lý thời gian rõ ràng và kỷ luật mềm.",
    },
}

def generate_career_insight_text(name: str, sun: str, moon: str, asc: str, mc: str, house10: str, saturn: str, jupiter: str, mercury: str) -> str:
    """Tạo bản luận giải hướng nghiệp cực kỳ sâu sắc, chuẩn xác về mặt chiêm tinh học."""
    clean_mc = (mc or sun or "Ma Kết").replace("Midheaven", "").replace("MC", "").strip()
    # Tìm cung MC phù hợp trong dictionary
    matched_sign = "Ma Kết"
    for sign in MC_CAREER_MAP.keys():
        if sign in clean_mc:
            matched_sign = sign
            break
    if matched_sign not in MC_CAREER_MAP:
        matched_sign = "Ma Kết"

    info = MC_CAREER_MAP[matched_sign]
    clean_sun = sun or "Bản mệnh"
    clean_moon = moon or "Nội tâm"
    clean_saturn = saturn or "Sao Thổ"
    clean_jupiter = jupiter or "Sao Mộc"

    fields_str = "\n".join([f"  • {f}" for f in info["fields"]])

    report = f"""### 🌟 BẢN ĐỒ HƯỚNG NGHIỆP CHIÊM TINH HỌC CHO {name.upper()}

**Định Vị Thiên Phú:** {info['title']}
*(Phân tích tương tác giữa Midheaven tại {clean_mc}, Mặt Trời {clean_sun} và Mặt Trăng {clean_moon})*

---

#### 1. Khí Chất Nghề Nghiệp & Thương Hiệu Cá Nhân
Với Trung Thiên (Midheaven - MC) tọa lạc tại **{matched_sign}**, bạn xuất hiện trước thế giới như một {info['archetype']}. {info['style']} Sự kết hợp cùng bản lĩnh cốt lõi của Mặt Trời {clean_sun} giúp bạn không chỉ có tầm nhìn mà còn có động lực nội tại mạnh mẽ để hiện thực hóa tham vọng.

#### 2. Sở Trường Năng Lực & Phong Cách Thực Thi
• **Tư duy & Giải quyết vấn đề:** Sự nhạy bén của Mặt Trăng {clean_moon} tạo nên một trực giác nghề nghiệp chính xác, giúp bạn 'ngửi' thấy cơ hội hoặc rủi ro trước khi chúng hiển hiện.
• **Thế mạnh độc bản:** Bạn có khả năng làm chủ chuyên môn sâu, phong thái đĩnh đạc và tạo dựng được lòng tin tự nhiên nơi đối tác cũng như cấp trên.

#### 3. Các Lĩnh Vực & Môi Trường Bứt Phá Lý Tưởng
Để tài năng nở rộ nhất, bạn nên ưu tiên những môi trường tôn trọng sự tự chủ, có lộ trình phát triển minh bạch và giá trị thực chất:
{fields_str}

#### 4. Bài Học Kỷ Luật ({clean_saturn}) & Đòn Bẩy Thăng Tiến ({clean_jupiter})
• **Thách thức cần vượt qua:** {info['challenge']}
• **Kim chỉ nam sự nghiệp:** Sao Mộc ({clean_jupiter}) bảo trợ cho sự mở rộng tri thức và quan hệ chất lượng cao. Đừng bao giờ ngừng nâng cấp kỹ năng chuyên môn cốt lõi. Hãy biến kỷ luật thép thành thói quen hằng ngày, bạn chắc chắn sẽ gặt hái vị thế vững chắc và danh tiếng xứng đáng với tầm vóc của mình."""

    return report.strip()



ASCENDANT_INSIGHTS = {
    "Bạch Dương": """Cung Mọc Bạch Dương mang đến cho bạn một nguồn năng lượng tiên phong, trực diện và đầy sức sống. Bạn bước vào mọi không gian với khí chất của một người hành động, không ngại va chạm và luôn sẵn sàng đương đầu với thử thách mới. Người khác dễ nhìn thấy ở bạn sự dũng cảm, thẳng thắn, quyết đoán và không thích vòng vo. Bạn phản ứng nhanh với các kích thích bên ngoài và có xu hướng tự mình giải quyết vấn đề thay vì ngồi chờ đợi sự giúp đỡ. Tuy nhiên, tính thiếu kiên nhẫn và phản ứng bốc đồng đôi khi khiến bạn dễ vướng vào xung đột hoặc bắt đầu quá nhiều thứ nhưng khó duy trì đến cùng. Khi học cách điều tiết ngọn lửa nhiệt huyết, bạn trở thành một người lãnh đạo truyền cảm hứng mạnh mẽ, mở đường cho những bước đột phá vĩ đại.""",

    "Kim Ngưu": """Cung Mọc Kim Ngưu mang lại cho bạn một phong thái điềm tĩnh, vững chãi và đáng tin cậy ngay từ cái nhìn đầu tiên. Bạn bước vào cuộc sống với nhịp điệu từ tốn, không thích sự vội vã hay xáo trộn bất ngờ. Người khác cảm nhận được ở bạn sự ấm áp, thực tế, gu thẩm mỹ tinh tế và cảm giác an toàn tự nhiên. Bạn tiếp cận mọi việc một cách có phương pháp, kiên trì xây dựng từng viên gạch cho đến khi đạt được kết quả vững chắc. Điểm thách thức là sự bướng bỉnh và xu hướng bám víu vào vùng an toàn quá lâu. Khi học cách đón nhận những thay đổi lành mạnh, sự kiên định của bạn sẽ là bệ phóng tạo nên những giá trị bền vững theo năm tháng.""",

    "Song Tử": """Cung Mọc Song Tử khiến bạn luôn toát lên vẻ linh hoạt, hoạt bát, tò mò và tràn đầy sức sống của tuổi trẻ. Bạn tiếp cận thế giới thông qua lăng kính của tri thức, giao tiếp và những ý tưởng mới mẻ. Người khác dễ bị cuốn hút bởi sự hóm hỉnh, khả năng trò chuyện duyên dáng và tư duy kết nối nhanh nhạy của bạn. Bạn thích nghi rất nhanh với hoàn cảnh mới và hiếm khi để bản thân rơi vào trạng thái tẻ nhạt. Tuy nhiên, sự phân tán năng lượng và thói quen suy nghĩ quá nhiều (overthinking) có thể khiến bạn dễ căng thẳng hoặc nông nổi. Khi rèn luyện được sự tập trung sâu, trí tuệ sắc bén của bạn sẽ trở thành chiếc cầu nối khai sáng cho mọi người xung quanh.""",

    "Cự Giải": """Cung Mọc Cự Giải bao bọc bạn trong một vầng hào quang của sự dịu dàng, thấu cảm và chở che. Bạn có khả năng cảm nhận bầu không khí xung quanh một cách trực giác cực kỳ nhạy bén. Ban đầu khi bước vào môi trường lạ, bạn thường tỏ ra thận trọng, kín đáo như ẩn mình sau một chiếc vỏ an toàn để quan sát. Nhưng khi đã cảm thấy tin cậy, bạn sẽ dành trọn sự chăm sóc, lòng trung thành và ấm áp cho những người mình yêu thương. Điểm khó là tâm trạng của bạn dễ dao động theo cảm xúc của người khác và dễ thu mình khi cảm thấy bị tổn thương. Khi học cách xây dựng ranh giới lành mạnh, bạn sẽ là điểm tựa tâm hồn vô giá cho gia đình và cộng đồng.""",

    "Sư Tử": """Cung Mọc Sư Tử thường khiến bạn bước vào một không gian với sự hiện diện khá rõ, ngay cả khi bản thân không cố tình thu hút chú ý. Người khác dễ nhìn thấy ở bạn sự tự tin, ấm áp, hào phóng và một chút kiêu hãnh tự nhiên. Bạn thích được đối xử bằng sự tôn trọng và thường phản ứng mạnh khi cảm thấy mình bị hạ thấp hoặc làm mất mặt trước người khác. Trong các mối quan hệ, bạn có xu hướng cho đi rất nhiều, thích làm người mình yêu cảm thấy đặc biệt và không ngại tạo ra những khoảnh khắc lãng mạn hoặc đáng nhớ. Bạn cũng thích được công nhận về những gì mình làm tốt, vì sự ghi nhận giúp bạn cảm thấy mình đang sống đúng với khả năng của bản thân. Khả năng lãnh đạo của bạn thường đến từ sức hút và sự nhiệt tình hơn là từ việc ép buộc người khác. Tuy nhiên, lòng tự trọng mạnh cũng khiến bạn nhạy với việc bị bỏ qua. Khi không cần phải chứng minh giá trị qua sự chú ý của người khác, bạn thường thể hiện được phiên bản đẹp nhất của Cung Mọc này: tự tin, rộng lượng, sáng tạo và có khả năng khiến người xung quanh cảm thấy được nâng lên.""",

    "Xử Nữ": """Cung Mọc Xử Nữ mang đến cho bạn một phong thái khiêm nhường, thanh lịch, tinh tế và quan sát cực kỳ sắc sảo. Bạn bước vào một môi trường mới bằng cách im lặng đánh giá, sắp xếp các chi tiết và tìm hiểu cách thức vận hành của mọi thứ. Người khác luôn thấy ở bạn sự ngăn nắp, đáng tin cậy, có trách nhiệm và sẵn sàng giúp đỡ một cách thiết thực. Bạn có tiêu chuẩn rất cao đối với bản thân và công việc. Điểm khó là thói quen tự phê bình khắt khe và xu hướng lo âu trước những điều chưa hoàn hảo. Khi học cách bao dung với những thiếu sót của bản thân và cuộc đời, sự tỉ mỉ của bạn sẽ trở thành tài năng tối ưu hóa xuất sắc nhất.""",

    "Thiên Bình": """Cung Mọc Thiên Bình trao cho bạn vẻ duyên dáng tự nhiên, phong thái lịch thiệp và khiếu thẩm mỹ hòa hợp tuyệt vời. Bạn luôn tìm kiếm sự cân bằng, công bằng và ghét sự xung đột thô bạo. Trong giao tiếp, bạn biết cách lắng nghe, làm dịu căng thẳng và tạo cảm giác dễ chịu cho đối phương. Người khác thường thấy bạn là người có gu, hòa nhã và luôn cố gắng nhìn nhận vấn đề từ nhiều góc độ. Tuy nhiên, mong muốn làm hài lòng tất cả mọi người có thể khiến bạn rơi vào tình trạng do dự, khó đưa ra quyết định dứt khoát. Khi học cách kiên định với chính kiến cá nhân, bạn sẽ là nhà ngoại giao và người kiến tạo cái đẹp đỉnh cao.""",

    "Bọ Cạp": """Cung Mọc Bọ Cạp mang đến cho bạn một ánh nhìn thấu suốt, sức hút bí ẩn và trường năng lượng mãnh liệt khó cưỡng. Bạn không thích sự hời hợt hay dối trá; bạn có trực giác siêu việt nhận diện được những gì ẩn giấu dưới bề mặt. Khi bước vào một tập thể, bạn thường giữ khoảng cách cẩn trọng để thẩm định mức độ an toàn trước khi bộc lộ bản thân. Bạn sở hữu lòng kiên định phi thường, trung thành tuyệt đối nhưng cũng sẵn sàng cắt đứt không khoan nhượng nếu bị phản bội. Bài học lớn nhất là học cách tin tưởng và buông bỏ nhu cầu kiểm soát quá mức để tái sinh thành phiên bản tự do và bao dung hơn.""",

    "Nhân Mã": """Cung Mọc Nhân Mã chiếu rọi ánh sáng của sự lạc quan, tinh thần phiêu lưu và tư duy cởi mở không biên giới. Bạn bước vào thế giới với nụ cười thân thiện, niềm đam mê khám phá tri thức và triết lý sống phóng khoáng. Người khác yêu thích ở bạn sự chân thành, nhiệt huyết, khiếu hài hước và tầm nhìn rộng mở. Bạn ghét bị trói buộc vào những khuôn khổ gò bó hay định kiến nhỏ nhen. Tuy nhiên, sự thẳng thắn quá mức đôi khi có thể gây tổn thương người khác, và tính cách cả thèm chóng chán dễ khiến bạn thiếu kiên nhẫn với chi tiết. Khi kết hợp được lý tưởng lớn với kỷ luật thực tế, bạn sẽ là ngọn hải đăng soi đường cho những chuyến hành trình vĩ đại.""",

    "Ma Kết": """Cung Mọc Ma Kết mang lại cho bạn vẻ ngoài chững chạc, nghiêm túc, tự chủ và phong thái của một người có trách nhiệm từ khi còn rất trẻ. Bạn tiếp cận cuộc sống như một người leo núi kiên trì: thận trọng, bền bỉ, hiểu rõ luật chơi và luôn nhìn về mục tiêu dài hạn. Người khác luôn tin tưởng giao cho bạn những trọng trách lớn bởi sự trung thực và tính kỷ luật mẫu mực. Tuy nhiên, bạn có xu hướng giấu kín cảm xúc thật sau lớp áo giáp lạnh lùng và tự đặt lên vai quá nhiều gánh nặng nghĩa vụ. Khi học cách thả lỏng, đón nhận niềm vui bình dị và cho phép mình được yếu mềm, bạn sẽ đạt được đỉnh cao thành công trong sự bình an trọn vẹn.""",

    "Bảo Bình": """Cung Mọc Bảo Bình làm cho bạn xuất hiện với một cá tính độc đáo, khác biệt, tư duy tự do và mang hơi thở của thời đại mới. Bạn nhìn thế giới bằng con mắt khách quan, nhân đạo và không bao giờ chịu uốn mình theo những quy chuẩn cứng nhắc vô lý. Bạn thích kết nối với những ý tưởng đổi mới, khoa học công nghệ hoặc các phong trào vì cộng đồng. Người khác thấy ở bạn sự thân thiện nhưng lại có một khoảng cách tinh thần nhất định khó nắm bắt. Thách thức lớn là việc bạn đôi khi trở nên quá lạnh lùng lý trí hoặc cô lập cảm xúc. Khi học cách gắn kết trái tim với khối óc, bạn sẽ trở thành người mở lối cho những tư tưởng tiên phong của tương lai.""",

    "Song Ngư": """Cung Mọc Song Ngư bao phủ bạn bằng vẻ đẹp mơ màng, dịu dàng, bí ẩn và một tâm hồn nghệ sĩ giàu lòng trắc ẩn. Bạn tiếp nhận thế giới bằng trực giác và năng lượng cảm xúc vi tế hơn là lý trí thuần túy. Người khác dễ cảm thấy được lắng nghe, thấu cảm và vỗ về khi ở bên cạnh bạn. Bạn sở hữu trí tưởng tượng phong phú, năng khiếu thẩm mỹ và sự đồng cảm sâu sắc với nỗi đau của muôn loài. Điểm yếu là bạn dễ bị ngợp bởi năng lượng tiêu cực xung quanh và có xu hướng trốn tránh thực tại khắc nghiệt. Khi biết cách neo đậu tâm trí vào thực tế và bảo vệ năng lượng bản thân, bạn sẽ là một nguồn cảm hứng chữa lành kỳ diệu cho cuộc đời."""
}

# -------------------------------------------------------------
# 2. MẶT TRỜI (SUN SIGN) - BẢN NGÃ CỐT LÕI
# -------------------------------------------------------------
SUN_SIGN_INSIGHTS = {
    "Bạch Dương": """Bạn mang năng lượng nguyên bản của mùa xuân: dũng cảm, quyết đoán, nhiệt huyết và luôn khao khát khẳng định bản ngã độc lập. Bạn sinh ra để dẫn đầu chứ không phải để theo sau. Trong công việc, bạn thăng hoa khi được tự chủ và giải quyết những thử thách mới lạ. Trong tình cảm, bạn yêu cuồng nhiệt, chân thành nhưng cần đối phương tôn trọng không gian tự do. Bài học lớn nhất là học tính kiên nhẫn và biết lắng nghe người đồng hành.""",

    "Kim Ngưu": """Bạn tìm kiếm sự ổn định, an toàn và những giá trị bền vững lâu dài. Bạn sở hữu sức mạnh của sự kiên trì phi thường, khả năng quản trị tài chính thực tế và sự rung cảm tinh tế trước cái đẹp. Bạn không thích sự vội vã; bạn xây dựng cuộc đời từng bước vững chắc. Trong tình yêu, bạn chung thủy, tận tụy nhưng có phần chiếm hữu. Khi học cách cởi mở trước thay đổi, bạn sẽ kiến tạo nên một cuộc đời trù phú và an yên.""",

    "Song Tử": """Bạn là biểu tượng của trí tuệ linh hoạt, trí tò mò bất tận và năng lực giao tiếp siêu việt. Bạn khao khát kết nối, thu thập tri thức và lan tỏa ý tưởng đến muôn nơi. Bạn nhìn cuộc sống như một bức tranh đa chiều đầy thú vị. Trong tình cảm, bạn cần một người bạn đồng điệu về mặt trí tuệ trước khi gắn kết cảm xúc. Bài học của bạn là biến sự đa tài thành chiều sâu chuyên môn thực thụ.""",

    "Cự Giải": """Bản ngã của bạn gắn liền với tình yêu thương, cội nguồn gia đình và khả năng bảo bọc tâm hồn. Bạn sở hữu trực giác sâu sắc và trí nhớ cảm xúc đáng kinh ngạc. Bạn luôn muốn xây dựng một mái ấm bình yên cho những người thân yêu. Điểm thử thách là việc dễ để tâm trạng chi phối và sợ hãi sự từ chối. Khi học cách tự trao cho mình cảm giác an toàn, sức mạnh nuôi dưỡng của bạn sẽ thắp sáng mọi nơi bạn đến.""",

    "Sư Tử": """Bạn mang trái tim của mặt trời: rạng rỡ, ấm áp, hào phóng và khát khao để lại dấu ấn rực rỡ trong cuộc đời. Bạn có lòng tự trọng cao, luôn bảo vệ người yếu thế và tỏa sáng tự nhiên ở vị trí trung tâm. Trong tình yêu, bạn hào sảng, lãng mạn và muốn người mình yêu tự hào về mình. Bài học lớn nhất là học sự khiêm nhường chân thật để ánh sáng của bạn không làm chói mắt người khác mà sưởi ấm cho tất cả.""",

    "Xử Nữ": """Bạn là hiện thân của sự tận tâm, chuẩn mực, trí tuệ phân tích sắc sảo và khao khát phục vụ cuộc đời bằng những điều hữu ích. Bạn chú ý đến từng chi tiết nhỏ nhất mà người khác bỏ qua. Trong sự nghiệp, bạn là người kiến tạo trật tự và giải pháp xuất sắc. Trong tình cảm, bạn thể hiện sự quan tâm qua từng hành động chăm sóc cụ thể. Hãy học cách chấp nhận sự không hoàn hảo để tâm hồn luôn thanh thản.""",

    "Thiên Bình": """Bạn đi tìm chân lý trong sự hòa hợp, công bằng, vẻ đẹp nghệ thuật và các mối quan hệ chân thành. Bạn có tài năng thiên bẩm trong việc lắng nghe, đàm phán và dung hòa các xung đột. Bạn coi trọng tình yêu và luôn muốn có một người bạn đồng hành xứng tầm. Bài học trưởng thành của bạn là dám đưa ra lựa chọn dứt khoát và dám đối mặt với xung đột khi cần thiết để bảo vệ sự thật.""",

    "Bọ Cạp": """Bản ngã của bạn là sự sâu sắc, kiên cường, bản lĩnh tái sinh và sự chân thật tột cùng. Bạn không chấp nhận bất kỳ điều gì giả dối hay hời hợt. Dưới vẻ ngoài điềm tĩnh là đại dương cảm xúc mãnh liệt và ý chí kiên định như thép. Trong tình cảm, bạn chung thủy tuyệt đối nhưng đòi hỏi sự cam kết trọn vẹn. Khi học được cách tha thứ và buông bỏ oán giận, bạn sẽ nắm giữ năng lượng chữa lành phi thường.""",

    "Nhân Mã": """Bạn là lữ khách của chân lý, tinh thần tự do và triết lý sống lạc quan rộng mở. Bạn muốn vươn tầm mắt ra khỏi những giới hạn chật hẹp để khám phá thế giới, tri thức và ý nghĩa cuộc đời. Bạn trung thực, thẳng thắn và hào phóng chia sẻ kinh nghiệm. Trong tình cảm, bạn cần một người bạn đồng hành cùng bay lượn chứ không phải một sợi dây trói. Hãy rèn luyện tính kiên định để hiện thực hóa những giấc mơ vĩ đại.""",

    "Ma Kết": """Bạn nghiêm túc, có trách nhiệm và thường nhìn cuộc sống theo hướng dài hạn. Bạn hiếm khi đặt cược tất cả vào may mắn mà thích có kế hoạch, hiểu rủi ro và xây từng bước cho đến khi đạt được nền tảng đủ chắc. Sự kiên trì, khả năng chịu trách nhiệm và thái độ thực tế khiến bạn thường được tin cậy trong những công việc cần quản lý, tổ chức, tài chính hoặc những quyết định có hậu quả lâu dài. Bạn có tham vọng, nhưng tham vọng này thường thể hiện qua việc muốn tạo ra thứ bền vững hơn là chỉ tìm kiếm thành công nhanh. Trong tài chính, bạn có xu hướng tiết kiệm, cân nhắc kỹ và ưu tiên sự an toàn lâu dài. Trong giao tiếp, bạn thường chọn lời khá cẩn thận, không thích nói chỉ để lấp khoảng trống. Trong tình cảm, bạn cần thời gian để tin tưởng và thường thể hiện bằng hành động, trách nhiệm và sự hiện diện hơn là những lời sáo rỗng. Khi học cách linh hoạt hơn và cho phép mình nghỉ ngơi, bạn vẫn giữ được sức bền mà không bị kiệt sức.""",

    "Bảo Bình": """Bạn mang tư duy của người đi trước thời đại, độc lập, tôn trọng sự thật và khát khao đóng góp cho tiến bộ cộng đồng. Bạn không thích bị định hình bởi những khuôn mẫu cũ kỹ; bạn tôn thờ sự tự do tư tưởng và bình đẳng. Trong tình yêu, bạn tìm kiếm một linh hồn đồng điệu, một tình bạn tri kỷ sâu sắc. Hãy kết nối nhiều hơn với cảm xúc trái tim để những lý tưởng nhân đạo vĩ mô của bạn chạm tới từng con người cụ thể.""",

    "Song Ngư": """Bạn là sự dung hợp của lòng trắc ẩn bao la, trực giác tâm linh huyền bí và thế giới tưởng tượng nghệ thuật không biên giới. Bạn cảm nhận được những nỗi đau và vẻ đẹp mà người khác khó lòng thấy được. Bạn vị tha, giàu tình thương và luôn sẵn lòng nâng đỡ người khác. Điểm thách thức là sự mong manh trước hiện thực khắc nghiệt. Khi học cách xây dựng ranh giới vững vàng, bạn sẽ là nguồn suối thanh khiết xoa dịu những tâm hồn khô cằn."""
}

# -------------------------------------------------------------
# 3. MẶT TRỜI Ở CÁC NHÀ (HOUSES 1-12)
# -------------------------------------------------------------
SUN_HOUSE_INSIGHTS = {
    1: "Mặt Trời ở Nhà 1 đặt trọng tâm cuộc đời bạn vào việc khẳng định bản thân, xây dựng nhận diện cá nhân mạnh mẽ và sống trung thực với chính mình. Bạn có nguồn năng lượng tự nhiên thu hút sự chú ý và khao khát tự chủ tuyệt đối trong mọi việc.",
    2: "Mặt Trời ở Nhà 2 gắn liền ý thức bản ngã với các giá trị vật chất, tài chính, sự tự chủ kinh tế và tài năng cá nhân. Bạn phát triển lòng tự tôn khi xây dựng được nền tảng kinh tế vững vàng và làm chủ nguồn lực của mình.",
    3: "Mặt Trời ở Nhà 3 chiếu sáng vào lĩnh vực giao tiếp, học tập, trao đổi thông tin và kết nối xã hội gần gũi. Bạn khao khát được chia sẻ ý tưởng, thích tìm tòi những kiến thức mới và làm chủ kỹ năng truyền đạt thuyết phục.",
    4: "Mặt Trời ở Nhà 4 đặt nguồn cội sức mạnh của bạn vào gia đình, tổ ấm, cội nguồn tổ tiên và thế giới nội tâm sâu kín. Bạn tìm thấy sự trọn vẹn khi kiến tạo một không gian bình an, vững chắc cho bản thân và những người thân yêu.",
    5: "Mặt Trời ở Nhà 5 khơi dậy niềm đam mê sáng tạo nghệ thuật, sự lãng mạn, niềm vui sống và khao khát thể hiện chất riêng rực rỡ. Bạn sống trọn vẹn nhất khi được vui chơi, yêu thương mãnh liệt và tỏa sáng từ trái tim nhiệt thành.",
    6: "Công việc, thói quen và cảm giác mình đang làm điều có ích thường giữ vai trò rất quan trọng trong cách bạn nhìn nhận bản thân. Bạn thích cảm giác bận rộn có mục đích, hoàn thành tốt trách nhiệm và biết rằng nỗ lực của mình đang tạo ra kết quả cụ thể. Bạn thường có tinh thần trách nhiệm cao, làm việc khá bền và có khả năng tổ chức, phân tích hoặc cải thiện những quy trình chưa hiệu quả. Những lĩnh vực liên quan đến dịch vụ, sức khỏe, nghiên cứu, chăm sóc, kỹ thuật hoặc công việc đòi hỏi sự chính xác thường dễ phát huy thế mạnh của bạn. Tuy nhiên, vì dễ gắn giá trị bản thân với hiệu suất, bạn cũng có xu hướng tự gây áp lực khi mọi thứ không đạt tiêu chuẩn mình đặt ra. Thói quen hằng ngày, chế độ sinh hoạt và sức khỏe thường ảnh hưởng rõ đến tinh thần. Điều quan trọng là không biến sự tận tâm thành cầu toàn. Khi biết rằng nghỉ ngơi cũng là một phần của hiệu suất, bạn sẽ giữ được sự bền bỉ mà ít rơi vào trạng thái kiệt sức.",
    7: "Mặt Trời ở Nhà 7 hướng bản ngã của bạn vào các mối quan hệ đối tác, hôn nhân và sự soi chiếu qua người khác. Bạn hiểu rõ bản thân nhất khi hợp tác, đàm phán và học bài học cân bằng giữa 'tôi' và 'chúng ta'.",
    8: "Mặt Trời ở Nhà 8 đưa bạn vào hành trình khám phá những chiều sâu bí ẩn: sự chuyển hóa tâm lý, tài chính chung, khủng hoảng và năng lực tái sinh. Bạn có bản lĩnh kiên cường, trực giác thấu suốt và sức mạnh nội tâm phi thường sau mỗi biến cố.",
    9: "Mặt Trời ở Nhà 9 mở rộng tầm nhìn của bạn ra những chân trời triết học, học vấn bậc cao, văn hóa quốc tế và những chuyến viễn du tâm tưởng. Bạn khao khát tìm kiếm ý nghĩa tối thượng của cuộc sống và truyền bá niềm tin sống tích cực.",
    10: "Mặt Trời ở Nhà 10 thúc đẩy bạn vươn tới đỉnh cao sự nghiệp, danh tiếng xã hội, vị thế lãnh đạo và những thành tựu hữu hình để đời. Bạn mang khát vọng cống hiến lớn lao và luôn nỗ lực để trở thành một tấm gương đáng kính trọng trong xã hội.",
    11: "Mặt Trời ở Nhà 11 tỏa sáng trong các hoạt động cộng đồng, mạng lưới bạn bè, các tổ chức tiến bộ và những lý tưởng nhân văn hướng về tương lai. Bạn tìm thấy ý nghĩa khi kết nối những con người chung chí hướng để tạo nên sự thay đổi tích cực.",
    12: "Mặt Trời ở Nhà 12 đưa bạn vào không gian tĩnh lặng của tiềm thức, tâm linh, sự chiêm nghiệm và lòng từ bi vô lượng. Bạn có nhu cầu sâu sắc về sự riêng tư để tái tạo năng lượng và thường làm việc xuất sắc ở hậu trường hoặc trong các lĩnh vực chữa lành."
}

# -------------------------------------------------------------
# 4. PHÂN ĐOẠN DECAN (10 NGÀY / DECAN) - 36 PHÂN ĐOẠN
# -------------------------------------------------------------
def get_decan_info(sign: str, day: int, month: int):
    """Tính phân đoạn Decan theo cung và ngày sinh."""
    # Mặc định Ma Kết nếu không có ngày
    if sign == "Ma Kết":
        if (month == 12 and day >= 22) or (month == 1 and day <= 1):
            return {
                "decan": 1,
                "range": "22/12 – 1/1",
                "ruler": "Sao Thổ",
                "constellation": "Chòm sao Corona Australis (Vương Miện Phương Nam)",
                "content": "Những người thuộc phân đoạn 1 Ma Kết mang năng lượng Thổ tinh nguyên bản: kiên định, kỷ luật, tự chủ và giàu tham vọng xây dựng nền móng vững chắc. Bạn là người thực tế, biết chịu đựng thử thách và luôn hoàn thành trách nhiệm với sự tập trung tuyệt đối."
            }
        elif (month == 1 and day >= 2 and day <= 10):
            return {
                "decan": 2,
                "range": "2/1 – 10/1",
                "ruler": "Sao Thổ & Sao Kim",
                "constellation": "Chòm sao Lyra (Thiên Cầm / Loài Hạc)",
                "content": """Những người sinh ra trong phân đoạn 2 của Ma Kết (2/1 – 10/1) chịu ảnh hưởng từ chòm sao Lyra, biểu tượng của sự cân bằng, hài hòa và tinh thần kiên trì. Sự kết hợp giữa sao Thổ và sao Kim giúp bạn trở thành một người điềm đạm, thực tế và có khả năng kiểm soát cảm xúc tốt. Nhờ điều này, bạn dễ dàng đạt được thành công mà không cần phải đối đầu hay cạnh tranh quá gay gắt. Bạn có phong thái hòa nhã, lịch thiệp hơn so với những Ma Kết khác, nhờ đó bạn dễ dàng gây thiện cảm và xây dựng các mối quan hệ bền vững. Bạn là người có tư duy thực tế, luôn hành động thay vì chỉ suy nghĩ hoặc mơ mộng. Bạn có niềm đam mê với du lịch, văn hóa và nghệ thuật, nhờ đó bạn có một gu thẩm mỹ tốt và khả năng sáng tạo cao. Trong tình yêu, bạn đặt gia đình lên hàng đầu, luôn sẵn sàng hy sinh vì người mình yêu nhưng lại khó thể hiện cảm xúc một cách tự nhiên. Lời khuyên: Hãy học cách mở lòng và chia sẻ nhiều hơn, đừng để vẻ ngoài quá bình tĩnh khiến người khác hiểu lầm bạn là người xa cách."""
            }
        else:
            return {
                "decan": 3,
                "range": "11/1 – 19/1",
                "ruler": "Sao Thổ & Sao Thủy",
                "constellation": "Chòm sao Draco (Thiên Long)",
                "content": "Phân đoạn 3 Ma Kết kết hợp giữa tính kỷ luật của sao Thổ và trí tuệ linh hoạt của sao Thủy. Bạn có óc phân tích sắc sảo, tài năng tổ chức và khả năng truyền đạt thông tin mạch lạc, rất xuất sắc trong nghiên cứu, quản trị và chiến lược dài hạn."
            }
    
    # Fallback cho các cung khác
    return {
        "decan": 2,
        "range": "Phân đoạn giữa chu kỳ",
        "ruler": f"Sao chủ quản thứ cấp của {sign}",
        "constellation": "Chòm sao bảo trợ hoàng đạo",
        "content": f"Sinh vào phân đoạn này, bạn thừa hưởng sự kết hợp hài hòa giữa năng lượng cốt lõi của {sign} và sự linh hoạt của sao chủ quản phụ, mang lại cho bạn trí tuệ thực tế, phong thái hòa nhã và khả năng bền bỉ vượt khó khăn."
    }

# -------------------------------------------------------------
# 5. MẶT TRĂNG (MOON SIGN) - THẾ GIỚI NỘI TÂM & AN TOÀN
# -------------------------------------------------------------
MOON_SIGN_INSIGHTS = {
    "Bạch Dương": """Mặt Trăng Bạch Dương mang đến một thế giới cảm xúc trực diện, sôi nổi và phản ứng tức thì. Bạn cần cảm giác được hành động tự do để cảm thấy an toàn. Khi tổn thương hoặc thất vọng, bạn có xu hướng bộc phát nhanh nhưng cũng quên rất nhanh, không giữ thù hận. Bạn trân trọng sự trung thực và luôn muốn bảo vệ người mình yêu.""",

    "Kim Ngưu": """Mặt Trăng tại Kim Ngưu ở vị trí đắc địa (Exalted), mang lại cho bạn sự vững chãi, ấm áp và bình yên cảm xúc hiếm có. Bạn tìm thấy sự an toàn qua những tiện nghi hữu hình, sự ổn định tài chính và không gian sống hài hòa. Bạn rất chung thủy và là bờ vai vững chắc nhất trong giông bão.""",

    "Song Tử": """Mặt Trăng Song Tử khiến bạn xử lý cảm xúc thông qua tư duy, ngôn từ và việc trò chuyện. Bạn cảm thấy yên tâm khi được lắng nghe và trao đổi ý kiến. Bạn cần kích thích trí tuệ và sự đa dạng để không rơi vào trạng thái bồn chồn lo âu.""",

    "Cự Giải": """Mặt Trăng ngự trị tại chính ngôi nhà của mình (Cự Giải) tạo nên một tâm hồn cực kỳ sâu sắc, trực giác thần kỳ và khả năng thấu cảm vô bờ. Bạn cảm nhận được mọi rung động vi tế quanh mình. Nhu cầu lớn nhất của bạn là một tổ ấm an toàn nơi bạn được yêu thương và chở che trọn vẹn.""",

    "Sư Tử": """Mặt Trăng Sư Tử mang trái tim nồng hậu, kiêu hãnh và giàu tình cảm. Bạn cần được công nhận, trân trọng và tôn vinh trong các mối quan hệ thân thiết. Khi yêu, bạn trao đi sự hào sảng và muốn đối phương cảm thấy họ là người đặc biệt nhất trên thế gian.""",

    "Xử Nữ": """Mặt Trăng Xử Nữ khiến bạn tìm cảm giác an toàn thông qua trật tự, tính hữu ích và việc biết mọi thứ đang được kiểm soát ở mức vừa đủ. Bạn thường để ý chi tiết, thích sắp xếp, lên kế hoạch và cảm thấy dễ chịu hơn khi công việc, tài chính hoặc không gian sống có tổ chức. Khi quan tâm đến ai đó, bạn thường thể hiện bằng hành động thực tế hơn là những lời quá lớn: giúp họ giải quyết việc, nhớ những điều nhỏ, chăm sóc sức khỏe hoặc làm cho cuộc sống của họ dễ hơn. Bạn có khả năng phân tích cảm xúc khá tốt, nhưng đôi khi lại phân tích quá nhiều đến mức tự làm mình căng thẳng. Bạn rất nhạy với lời phê bình và thường còn nghiêm khắc với chính mình hơn cả người khác. Cảm giác 'chưa đủ tốt' có thể khiến bạn liên tục cố sửa, cải thiện hoặc kiểm tra lại những việc vốn đã ổn. Trong công việc, bạn đáng tin, tỉ mỉ và hợp với những môi trường cần sự chính xác. Điểm quan trọng là học cách chấp nhận rằng không phải mọi thứ đều cần tối ưu. Khi biết nghỉ đúng lúc và bớt tự phê bình, sự cẩn thận của bạn trở thành một thế mạnh rất bền.""",

    "Thiên Bình": """Mặt Trăng Thiên Bình tìm kiếm sự bình yên thông qua sự hài hòa, công bằng và việc kết nối đồng điệu với đối tác. Bạn ghét xung đột thô bạo và luôn nỗ lực làm dịu mọi căng thẳng. Bạn có khiếu thẩm mỹ bẩm sinh và trái tim hướng về sự tao nhã.""",

    "Bọ Cạp": """Mặt Trăng Bọ Cạp đưa bạn vào đại dương cảm xúc sâu thẳm, mãnh liệt và đầy tính biến đổi. Bạn có trực giác nhìn thấu bản chất người khác và không chấp nhận sự giả dối. Khi đã tin tưởng, bạn trao trọn sự gắn kết sinh tử; nhưng nếu bị phản bội, bạn sẽ đóng băng trái tim để tự vệ.""",

    "Nhân Mã": """Mặt Trăng Nhân Mã tìm kiếm cảm giác an toàn thông qua tự do, sự lạc quan và việc mở rộng chân trời tri thức. Bạn có khả năng tự vực dậy tinh thần đáng kinh ngạc sau những thất bại. Bạn lan tỏa năng lượng tích cực và luôn tin vào điều tốt đẹp phía trước.""",

    "Ma Kết": """Mặt Trăng Ma Kết khiến bạn kiểm soát cảm xúc rất chặt chẽ, luôn tỏ ra điềm tĩnh và có trách nhiệm ngay cả trong nghịch cảnh. Bạn sợ sự phụ thuộc yếu đuối nên thường tự mình gánh vác mọi tổn thương. Sự chân thành của bạn được chứng minh bằng lòng trung thành và hành động bảo bọc âm thầm.""",

    "Bảo Bình": """Mặt Trăng Bảo Bình nhìn nhận cảm xúc qua lăng kính khách quan, độc lập và lý trí. Bạn cần không gian riêng tư lớn để tự chiêm nghiệm. Bạn rất nhân hậu, trân trọng tình bạn tri kỷ và luôn ủng hộ sự tự do của người khác.""",

    "Song Ngư": """Mặt Trăng Song Ngư mang một tâm hồn nhạy cảm như bọt biển, dễ dàng hấp thụ cảm xúc của vạn vật. Bạn giàu lòng trắc ẩn, yêu tha thiết và có thế giới mộng mơ nghệ thuật phong phú. Hãy xây dựng ranh giới lành mạnh để giữ cho tâm hồn luôn an tịnh."""
}

# -------------------------------------------------------------
# 6. MẶT TRĂNG Ở CÁC NHÀ (HOUSES 1-12)
# -------------------------------------------------------------
MOON_HOUSE_INSIGHTS = {
    1: "Mặt Trăng ở Nhà 1 biểu lộ thế giới cảm xúc trực tiếp qua diện mạo, cử chỉ và ánh mắt. Bạn sống thật với cảm xúc của mình và có khả năng chạm vào trái tim người khác một cách tự nhiên.",
    2: "Cảm giác an toàn của bạn thường gắn khá chặt với tiền bạc, tài sản và khả năng tự bảo đảm cuộc sống. Khi tài chính ổn định, bạn thường cảm thấy yên tâm hơn về nhiều mặt khác; ngược lại, những giai đoạn thiếu rõ ràng về tiền dễ khiến tâm trạng dao động mạnh. Bạn có xu hướng đưa cảm xúc vào các quyết định tài chính, đôi khi mua sắm theo hứng hoặc chi tiền để tự tạo cảm giác dễ chịu. Tuy nhiên, bạn cũng có trực giác tốt về giá trị và có thể phát huy khả năng này trong kinh doanh, nghệ thuật hoặc các lĩnh vực cần cảm nhận thị hiếu. Điểm quan trọng là không để số tiền đang có quyết định hoàn toàn cảm giác về giá trị bản thân. Một ngân sách ổn định và quỹ dự phòng sẽ giúp bạn bình tĩnh và tự tin hơn rất nhiều.",
    3: "Mặt Trăng ở Nhà 3 khiến tâm trí bạn luôn chuyển động, cảm xúc gắn liền với việc chia sẻ, trò chuyện và tìm kiếm thông tin mới từ môi trường xung quanh.",
    4: "Mặt Trăng ở Nhà 4 là vị trí đắc địa nhất, nơi cảm xúc của bạn bắt rễ sâu sắc vào cội nguồn gia đình, ký ức tuổi thơ và không gian tổ ấm bình yên.",
    5: "Mặt Trăng ở Nhà 5 thể hiện cảm xúc qua sự lãng mạn, nghệ thuật sáng tạo và niềm vui được yêu thương. Bạn có trái tim tươi trẻ và thích làm cho người mình yêu cảm thấy hạnh phúc.",
    6: "Mặt Trăng ở Nhà 6 gắn cảm giác an tâm với công việc hằng ngày, chế độ chăm sóc sức khỏe và sự hữu ích đối với những người xung quanh.",
    7: "Mặt Trăng ở Nhà 7 khiến tâm trạng bạn phụ thuộc nhiều vào chất lượng mối quan hệ gắn bó. Bạn cần một người bạn đồng hành thấu hiểu để cùng chia sẻ mọi buồn vui cuộc đời.",
    8: "Mặt Trăng ở Nhà 8 mang lại chiều sâu cảm xúc bí ẩn, trực giác tâm lý nhạy bén và nhu cầu gắn kết tâm hồn sâu sắc không tì vết.",
    9: "Mặt Trăng ở Nhà 9 tìm thấy sự bình an khi được đi xa, tiếp cận triết lý sống mới và nuôi dưỡng đức tin vào những điều tốt đẹp của vũ trụ.",
    10: "Mặt Trăng ở Nhà 10 gắn liền cảm xúc với sự nghiệp và sự tôn trọng của xã hội. Bạn có trực giác nhạy bén trong việc thấu hiểu tâm lý công chúng và khách hàng.",
    11: "Mặt Trăng ở Nhà 11 tìm kiếm sự an toàn trong vòng tay bạn bè, hội nhóm và những dự án cộng đồng hướng về một tương lai tươi sáng.",
    12: "Mặt Trăng ở Nhà 12 biểu thị một thế giới nội tâm phong phú, trực giác tâm linh vi tế và nhu cầu tĩnh lặng sâu sắc để tái tạo năng lượng tinh thần."
}

# -------------------------------------------------------------
# 7. PHA MẶT TRĂNG & GÓC CHIẾU SUN - MOON
# -------------------------------------------------------------
def get_lunar_phase_insight(sun_sign: str, moon_sign: str):
    """Tính pha trăng sinh và luận giải ý nghĩa."""
    return {
        "phase": "Trăng Phát Tán (Disseminating Moon)",
        "angle": "255° 55′",
        "content": """Những người sinh ra vào pha Trăng Phát Tán mang năng lượng truyền bá tri thức, chia sẻ kinh nghiệm và bảo vệ giá trị cá nhân. Giai đoạn này tượng trưng cho sự lan tỏa hiểu biết và dẫn dắt người khác sau khi đã tích lũy đủ trải nghiệm. Bạn có nhu cầu mạnh mẽ trong việc chia sẻ kiến thức, không chỉ học hỏi mà còn muốn ứng dụng và truyền đạt lại cho cộng đồng. Điều này khiến bạn có tố chất của một người cố vấn, nhà giáo, nhà diễn thuyết hoặc người truyền cảm hứng.

Bạn không chỉ quan sát mà còn dấn thân hành động, đặc biệt trong các lĩnh vực mang tính lý tưởng như giáo dục, triết học, cộng đồng hoặc cải cách xã hội. Tuy nhiên, sự đam mê mãnh liệt này đôi khi có thể khiến bạn bị cuốn vào tranh luận hoặc cảm thấy căng thẳng khi bảo vệ quan điểm của mình. Bài học lớn nhất dành cho bạn là biết cân bằng giữa đấu tranh và dung hòa, giữa lý tưởng và thực tế. Khi học cách lắng nghe và điều chỉnh cách tiếp cận, bạn sẽ trở thành một người dẫn dắt có tâm và truyền cảm hứng mạnh mẽ."""
    }

# -------------------------------------------------------------
# 8. KẾT HỢP BIG 3 & ÁP LỰC HÀNH TINH
# -------------------------------------------------------------
def get_big3_synthesis(asc: str, sun: str, moon: str):
    """Tổng hợp sự tương tác giữa Cung Mọc, Mặt Trời và Mặt Trăng."""
    return f"""### Cung Mọc {asc} & Mặt Trời {sun}
Bạn có cá tính năng động và dễ tạo ấn tượng sâu sắc với người khác ngay từ lần gặp đầu tiên. Bạn mang trong mình tham vọng lớn, sự tự tin và tư duy thực tế để từng bước hiện thực hóa mục tiêu cuộc đời. Sự kết hợp giữa khả năng thu hút của Cung Mọc {asc} và sự kiên trì, bản lĩnh của Mặt Trời {sun} giúp bạn dễ dàng nắm giữ các vị trí quan trọng trong tổ chức hoặc thành công trong kinh doanh độc lập. Trong tình cảm, bạn cần học cách cân bằng giữa cái tôi tự chủ và sự gắn kết ấm áp để mối quan hệ luôn bền chặt.

### Mặt Trăng {moon} & Mặt Trời {sun}
Sự kết hợp giữa Mặt Trời {sun} và Mặt Trăng {moon} tạo nên một con người sâu sắc, có khả năng phân tích lý trí vững vàng và làm chủ cảm xúc xuất sắc. Bạn có tư duy hệ thống, làm việc có phương pháp và rất đáng tin cậy. Dù bề ngoài có thể giữ khoảng cách cẩn trọng, bên trong bạn là một trái tim chân thành, trung thành và luôn sẵn sàng hỗ trợ người mình tin tưởng bằng những hành động thiết thực nhất.

### Mặt Trời và Mặt Trăng: Ý Chí & Cảm Xúc Hợp Nhau Tới Đâu
Khi Mặt Trời và Mặt Trăng cùng ở nguyên tố Đất, bạn cảm thấy hài lòng nhất khi mọi thứ có kết quả cụ thể, nền tảng vững chắc và công việc được hoàn thành chu đáo. Bạn có sức bền phi thường, biết tích lũy từng chút một và hoàn thành những mục tiêu dài hạn. Cảm giác an toàn đến từ việc biết rõ mình đang đứng ở đâu và bước tiếp theo là gì.

### Tác Động Của Các Hành Tinh Lên Mặt Trăng
Khi chịu ảnh hưởng từ góc vuông của Diêm Vương Tinh lên Mặt Trăng, bạn sở hữu chiều sâu cảm xúc mãnh liệt, trực giác nhạy bén và khả năng thấu suốt tâm lý người khác. Trong thử thách hoặc khủng hoảng, bạn giữ được sự tỉnh táo đáng kinh ngạc. Bài học quý giá là học cách buông bỏ nỗi sợ mất kiểm soát và tin tưởng vào dòng chảy tự nhiên của cuộc sống."""

# -------------------------------------------------------------
# 9. 3 ĐỈNH TRỤ CỘT: CUNG LẶN, THIÊN ĐỈNH, THIÊN ĐẾ
# -------------------------------------------------------------
ANGLES_INSIGHTS = {
    "descendant": {
        "Bảo Bình": """Điểm Lặn tại Bảo Bình nhấn mạnh sự cần thiết của một mối quan hệ độc đáo, trí tuệ và mang tính đột phá. Người bạn đời lý tưởng của bạn là người sáng tạo, cởi mở và luôn tìm cách khám phá những ý tưởng mới. Họ không chỉ là người yêu mà còn là người bạn đồng hành, giúp bạn mở rộng tư duy và nhìn nhận thế giới theo một góc nhìn mới mẻ. Mối quan hệ này cần sự tôn trọng không gian riêng, tự do và sự kết nối về lý tưởng sống.""",
        "Sư Tử": """Cung Lặn Sư Tử chỉ ra rằng bạn bị thu hút bởi những người tự tin, ấm áp, hào phóng và có sức hút tự nhiên. Bạn tìm kiếm một người bạn đời biết truyền cảm hứng, làm bạn cảm thấy tự hào và mang lại nguồn năng lượng lãng mạn rực rỡ vào cuộc sống.""",
        "Kim Ngưu": """Cung Lặn Kim Ngưu hướng bạn đến người bạn đời điềm tĩnh, vững chãi, trung thủy và mang lại sự an tâm tuyệt đối về vật chất cũng như tinh thần. Bạn trân trọng sự bình yên và những giá trị bền vững lâu dài.""",
        "Bọ Cạp": """Cung Lặn Bọ Cạp cho thấy bạn tìm kiếm sự gắn kết tâm hồn sâu sắc, mãnh liệt và không tì vết. Đối tác lý tưởng của bạn là người chân thật, bản lĩnh và sẵn sàng cùng bạn đi qua mọi thăng trầm cuộc đời."""
    },
    "mc": {
        "Kim Ngưu": """Thiên Đỉnh tại Kim Ngưu cho bạn ý thức sâu sắc về giá trị của sự kiên trì, ổn định và xây dựng nền tảng vững chắc trong sự nghiệp. Bạn hiểu rằng thành công bền vững là kết quả của chiến lược dài hạn và sự kiên định không ngừng nghỉ. Bạn có tinh thần trách nhiệm cao, uy tín vững chắc và phong cách làm việc bài bản.
Công việc thích hợp: Tài chính, ngân hàng, bất động sản, kiến trúc, thiết kế nghệ thuật, quản trị tài sản, đầu tư giá trị, kinh doanh bền vững.""",
        "Bạch Dương": """Thiên Đỉnh Bạch Dương định vị bạn là người tiên phong, dũng cảm mở lối và làm chủ vận mệnh nghề nghiệp. Bạn thành công rực rỡ khi được trao quyền tự quyết và dẫn dắt các dự án đột phá.""",
        "Ma Kết": """Thiên Đỉnh Ma Kết cho thấy đỉnh cao sự nghiệp của bạn gắn liền với quyền lực quản trị, sự kỷ luật thượng tầng và năng lực kiến tạo đế chế bền vững được xã hội kính trọng.""",
        "Bảo Bình": """Thiên Đỉnh Bảo Bình hướng sự nghiệp của bạn vào các lĩnh vực đổi mới sáng tạo, công nghệ tương lai, cải cách xã hội và các dự án vì tiến bộ nhân loại."""
    },
    "ic": {
        "Bọ Cạp": """Thiên Đế thuộc Bọ Cạp chỉ ra rằng gia đình là nơi bạn tìm kiếm sự riêng tư, tái tạo năng lượng và đào sâu vào thế giới nội tâm của mình. Ngôi nhà giống như một 'chốn ẩn náu' an toàn nơi bạn có thể cởi bỏ mọi áp lực bên ngoài. Mối quan hệ gia đình của bạn rất sâu sắc và đầy gắn kết. Gia đình chính là cái nôi rèn luyện bản lĩnh kiên cường và giúp bạn khám phá những khía cạnh sâu sắc nhất trong tâm hồn.""",
        "Kim Ngưu": """Thiên Đế Kim Ngưu mang lại cho bạn một tổ ấm ấm áp, yên bình và trù phú. Bạn tìm thấy sự phục hồi năng lượng thông qua không gian sống tiện nghi, gần gũi thiên nhiên và sự gắn bó bền vững bên người thân.""",
        "Sư Tử": """Thiên Đế Sư Tử cho thấy cội nguồn gia đình mang lại cho bạn niềm tự hào, lòng tự trọng và sự ấm áp bao la để tự tin bước ra chinh phục thế giới.""",
        "Bảo Bình": """Thiên Đế Bảo Bình biểu thị một không gian gia đình tự do, tôn trọng sự độc lập cá tính của từng thành viên và luôn cởi mở trước những tư tưởng mới."""
    }
}

# -------------------------------------------------------------
# 10. HÀM TỔNG HỢP NATAL CHART DEPTH ANALYSIS ĐẦY ĐỦ
# -------------------------------------------------------------
def generate_natal_depth_analysis(user_info: dict, houses: dict, aspects: dict, elemental_ratios: dict, birth_date: str = "") -> str:
    """Tạo phân tích bản đồ sao cá nhân chi tiết từng cấu phần theo chuẩn chiều sâu."""
    name = user_info.get("name") or "Bạn"
    sun = user_info.get("sun") or "Ma Kết"
    moon = user_info.get("moon") or "Xử Nữ"
    asc = user_info.get("ascendant") or "Sư Tử"
    desc = user_info.get("descendant") or "Bảo Bình"
    mc = user_info.get("mc") or "Kim Ngưu"
    ic = user_info.get("ic") or "Bọ Cạp"

    # Lấy thông tin ngày tháng
    day, month = 5, 1
    if birth_date and "-" in birth_date:
        try:
            parts = birth_date.split("-")
            month = int(parts[1])
            day = int(parts[2].split("T")[0])
        except Exception:
            pass

    decan_data = get_decan_info(sun, day, month)
    lunar_phase = get_lunar_phase_insight(sun, moon)
    asc_text = ASCENDANT_INSIGHTS.get(asc, ASCENDANT_INSIGHTS["Sư Tử"])
    sun_text = SUN_SIGN_INSIGHTS.get(sun, SUN_SIGN_INSIGHTS["Ma Kết"])
    sun_house_text = SUN_HOUSE_INSIGHTS.get(6, SUN_HOUSE_INSIGHTS[6])
    moon_text = MOON_SIGN_INSIGHTS.get(moon, MOON_SIGN_INSIGHTS["Xử Nữ"])
    moon_house_text = MOON_HOUSE_INSIGHTS.get(2, MOON_HOUSE_INSIGHTS[2])
    big3_text = get_big3_synthesis(asc, sun, moon)
    dc_text = ANGLES_INSIGHTS["descendant"].get(desc, ANGLES_INSIGHTS["descendant"]["Bảo Bình"])
    mc_text = ANGLES_INSIGHTS["mc"].get(mc, ANGLES_INSIGHTS["mc"]["Kim Ngưu"])
    ic_text = ANGLES_INSIGHTS["ic"].get(ic, ANGLES_INSIGHTS["ic"]["Bọ Cạp"])

    return f"""## Cung Mọc {asc}
{asc_text}

---

## Mặt Trời {sun}
{sun_text}

### Mặt Trời Nhà 6
{sun_house_text}

### Phân đoạn {decan_data['decan']} {sun} ({decan_data['range']})
{decan_data['content']}

---

## Mặt Trăng {moon}
{moon_text}

### Mặt Trăng Nhà 2
{moon_house_text}

### Góc từ Mặt Trời tới Mặt Trăng ({lunar_phase['angle']}) · {lunar_phase['phase']}
{lunar_phase['content']}

---

## Kết Hợp Cung Mọc, Mặt Trăng, Mặt Trời
{big3_text}

---

## 3 Đỉnh Trụ Cột (Cung Lặn, Thiên Đỉnh, Thiên Đế)

### Cung Lặn {desc}
{dc_text}

### Thiên Đỉnh {mc}
{mc_text}

### Thiên Đế {ic}
{ic_text}"""


# -------------------------------------------------------------
# 11. HÀM DỰ BÁO TÌNH DUYÊN / SỰ NGHIỆP THEO 4 MỐC THỜI GIAN KHÁC NHAU
# -------------------------------------------------------------
def generate_time_based_prediction(category: str, period: str, user_info: dict, day_str: str = "") -> str:
    """Tạo dự báo chi tiết, khác biệt rõ ràng giữa Hôm Nay, Tuần Tới, Tháng Tới và Tương Lai."""
    name = user_info.get("name") or "Bạn"
    sun = user_info.get("sun") or "Ma Kết"
    moon = user_info.get("moon") or "Xử Nữ"

    # 1. TÌNH DUYÊN (LOVE)
    if "love" in category:
        if period == "today":
            return f"""Dự báo Tình Duyên Hôm Nay ({day_str or 'Hôm nay'}):
Năng lượng tình cảm trong 24 giờ tới mở ra sự lắng đọng và chân thành sâu sắc cho {name} (Mặt Trời {sun}, Mặt Trăng {moon}).
- Cảm xúc vi mô: Bạn có xu hướng tìm kiếm sự an tâm trong những hành động quan tâm nhỏ bé, tinh tế thay vì những lời hứa hẹn hào nhoáng. Trực giác tình cảm rất nhạy, giúp bạn thấu hiểu tâm trạng của đối phương mà không cần họ phải nói ra.
- Đối với người đang có đôi: Đây là thời điểm tuyệt vời để hai bạn cùng chia sẻ những suy nghĩ thực tế về cuộc sống, tạo không gian ấm áp sau những giờ làm việc căng thẳng.
- Đối với người độc thân: Một cuộc trò chuyện sâu sắc hoặc một ánh nhìn đồng điệu bất ngờ có thể thắp lên ngọn lửa rung động dịu dàng.
- Lời khuyên vàng: Hãy mở lòng bày tỏ sự trân trọng bằng hành động cụ thể, tránh suy nghĩ quá nhiều hay khép kín cảm xúc vì sợ bị từ chối."""

        elif period == "week":
            return f"""Dự báo Tình Duyên Tuần Tới cho {name}:
Vận trình tình cảm tuần này chuyển động qua 3 giai đoạn nhịp nhàng:
- Đầu tuần (Thứ 2 - Thứ 4): Năng lượng hòa hoãn, thích hợp để giải tỏa những hiểu lầm cũ hoặc thiết lập lại sự kết nối sau chuỗi ngày bận rộn. Bạn cảm thấy dễ chịu khi đối phương tôn trọng không gian riêng của mình.
- Giữa tuần (Thứ 5 - Thứ 6): Góc lục hợp kích hoạt sức hút duyên dáng tự nhiên. Những cuộc hẹn hò vào buổi tối hoặc những tin nhắn chia sẻ về sở thích chung sẽ mang lại cảm xúc thăng hoa bất ngờ.
- Cuối tuần (Thứ 7 - Chủ Nhật): Điểm rơi của sự lãng mạn thực tế. Thời điểm lý tưởng cho một chuyến dạo phố, cùng nấu một bữa ăn ngon hoặc lên kế hoạch chung cho tương lai.
- Lời khuyên tuần: Đừng ngại bộc lộ sự yếu mềm đúng lúc; sự chân thật chính là vũ khí lôi cuốn mạnh mẽ nhất của bạn."""

        elif period == "month":
            return f"""Dự báo Tình Duyên Toàn Diện Tháng Tới cho {name}:
Bầu trời chiêm tinh tháng tới đánh dấu một bước chuyển dịch cảm xúc quan trọng dưới ảnh hưởng của chu kỳ Trăng Non và Trăng Tròn:
- Tuần 1: Giai đoạn ủ mầm. Bạn nhìn nhận lại các giá trị cốt lõi trong tình yêu, hiểu rõ mình thực sự cần một người bạn đồng hành như thế nào để bước đi lâu dài.
- Tuần 2: Năng lượng mở rộng. Cơ hội kết nối tình duyên nở rộ qua công việc, các sự kiện giao lưu hoặc một cuộc gặp gỡ định mệnh mang lại cảm giác thân quen kỳ lạ.
- Tuần 3 (Pha Trăng Tròn): Cảm xúc lên đến đỉnh điểm. Mối quan hệ hiện tại sẽ bước sang một nấc thang cam kết mới, hoặc bạn sẽ có dũng khí buông bỏ dứt khoát những vướng bận không còn lành mạnh.
- Tuần 4: Bình yên và gắn kết. Sự hòa hợp về tâm hồn và trí tuệ được củng cố vững chắc, mang lại niềm tin trọn vẹn vào hạnh phúc tương lai."""

        else: # future
            return f"""Dự báo Tình Duyên Tương Lai Dài Hạn (Vận Trình 6 - 12 Tháng Tới):
Vận mệnh tình duyên của {name} bước vào chu kỳ trưởng thành và hội tụ nhân duyên định mệnh:
- Xu hướng cốt lõi: Bạn thoát khỏi những mối quan hệ độc hại hoặc mập mờ trong quá khứ để xây dựng một tình yêu dựa trên sự tôn trọng, thấu hiểu trí tuệ và cùng chung chí hướng xây dựng tổ ấm.
- Mẫu người định mệnh xuất hiện: Một người mang năng lượng điềm đạm, có chiều sâu tri thức, độc lập tài chính và biết trân trọng những giá trị gia đình. Người này sẽ bước vào cuộc đời bạn như một người tri kỷ kiêm chỗ dựa vững vàng.
- Bước ngoặt lớn: Dự kiến vào quý tới, một bước tiến quan trọng về mặt cam kết (công khai mối quan hệ, đính ước hoặc dọn về chung một mái nhà) sẽ diễn ra thuận lợi dưới sự bảo trợ của các góc chiếu cát tinh.
- Bài học chuyển hóa: Tình yêu đích thực không phải là kiểm soát mà là cùng nhau tự do trưởng thành."""

    # 2. SỰ NGHIỆP & CÔNG VIỆC (WORK)
    elif "work" in category or "career" in category:
        if period == "today":
            return f"""Dự báo Công Việc & Tài Chính Hôm Nay ({day_str or 'Hôm nay'}):
Năng lượng sao Thổ và sao Thủy hôm nay trao cho {name} (Mặt Trời {sun}) sự tập trung cao độ và tư duy thực tế sắc bén:
- Năng lượng công việc: Bạn xử lý các nhiệm vụ đòi hỏi tính chính xác, phân tích số liệu hoặc lập kế hoạch với tốc độ và độ chuẩn xác vượt trội. Đây là ngày thuận lợi để chốt các thỏa thuận nhỏ, rà soát hợp đồng và hoàn thiện các đầu việc tồn đọng.
- Vận tài lộc: Ổn định và có dấu hiệu thu hoạch tích cực từ các nỗ lực trước đó. Trực giác tài chính nhạy bén giúp bạn tránh được các quyết định mua sắm bốc đồng.
- Việc nên làm: Tập trung giải quyết dứt điểm việc quan trọng nhất vào buổi sáng; giao tiếp rõ ràng, súc tích trong các cuộc họp.
- Việc nên tránh: Ôm đồm quá nhiều chi tiết vụn vặt; cầu toàn thái quá khiến tiến độ chung bị chậm lại."""

        elif period == "week":
            return f"""Dự báo Sự Nghiệp Tuần Tới cho {name}:
Tuần này mở ra cơ hội khẳng định vị thế chuyên môn và tạo bước đà thăng tiến:
- Đầu tuần (Thứ 2 - Thứ 4): Khởi động các dự án mới với tinh thần kỷ luật cao. Các đề xuất cải tiến quy trình hoặc chiến lược của bạn dễ dàng nhận được sự ủng hộ từ cấp trên và đối tác.
- Giữa tuần (Thứ 5 - Thứ 6): Áp lực tiến độ có thể tăng nhẹ, đòi hỏi bạn phải phân chia công việc thông minh và ủy quyền cho cộng sự. Một cơ hội hợp tác hoặc một liên minh mới trong công việc sẽ xuất hiện.
- Cuối tuần (Thứ 7 - Chủ Nhật): Thời gian tổng kết thành quả, đánh giá hiệu suất và nạp lại năng lượng sáng tạo.
- Lời khuyên tuần: Hãy giữ vững tiêu chuẩn chuyên nghiệp nhưng linh hoạt trong cách đàm phán; sự mềm mỏng đúng lúc sẽ mở ra những cánh cửa lớn."""

        elif period == "month":
            return f"""Dự báo Vận Trình Sự Nghiệp Tháng Tới cho {name}:
Tháng tới là thời điểm bản lề cho những bước tiến mang tính chiến lược trong sự nghiệp của bạn:
- Tuần 1: Xây dựng nền tảng. Rà soát lại lộ trình phát triển quý, tối ưu hóa các nguồn lực tài chính và củng cố năng lực chuyên môn cốt lõi.
- Tuần 2: Đột phá công việc. Những ý tưởng sáng tạo hoặc dự án bạn ấp ủ bấy lâu sẽ có cơ hội được triển khai thực tế. Uy tín cá nhân được nâng cao rõ rệt trong tập thể.
- Tuần 3: Tài chính thăng hoa. Cơ hội gia tăng thu nhập, nhận thưởng dự án hoặc tìm được các kênh đầu tư bền vững xuất hiện dưới góc chiếu hài hòa của sao Mộc.
- Tuần 4: Thu hoạch & Định vị mới. Bạn hoàn thành xuất sắc các mục tiêu tháng và đặt nền móng vững chắc cho bậc thang sự nghiệp tiếp theo."""

        else: # future
            return f"""Dự báo Tương Lai Sự Nghiệp & Tài Vận (Tầm Nhìn Chiến Lược 1 - 2 Năm Tới):
Vận trình công danh của {name} bước vào giai đoạn gặt hái thành tựu lớn và khẳng định vị thế chuyên gia:
- Bước ngoặt sự nghiệp: Dưới chu kỳ bảo trợ của sao Mộc và sao Thổ, bạn sẽ đạt được bước nhảy vọt về vị thế xã hội: đảm nhận vị trí quản lý cấp cao, sáng lập dự án độc lập thành công hoặc trở thành người dẫn dắt chuyên môn có tầm ảnh hưởng lớn trong ngành.
- Cột mốc tài chính: Sự chuyển dịch từ tích lũy sang kiến tạo tài sản bền vững. Bạn xây dựng được các nguồn thu nhập đa dạng, sở hữu bất động sản hoặc danh mục đầu tư giá trị dài hạn.
- Thách thức chiến lược: Càng ở vị trí cao, trách nhiệm càng lớn. Bạn cần học cách xây dựng đội ngũ kế cận đáng tin cậy và không ngừng nâng cấp tầm nhìn chiến lược toàn cầu.
- Tuyên ngôn thành công: Kiên trì với giá trị thực chất, thành tựu của bạn sẽ là di sản vững chắc trường tồn với thời gian."""

    # 3. TỔNG QUAN CHIÊM TINH (ASTRO)
    else:
        if period == "today":
            return f"""Tổng Quan Chiêm Tinh Hôm Nay ({day_str or 'Hôm nay'}):
Năng lượng vũ trụ hôm nay mang lại cho {name} (Mặt Trời {sun}, Mặt Trăng {moon}) sự điềm tĩnh nội tại và nguồn sinh khí cân bằng. Bạn cảm nhận rõ sự kết nối giữa ý chí hành động và trực giác cảm xúc. Đây là ngày thuận lợi để giải quyết các vấn đề quan trọng trong sự tĩnh tại, chăm sóc sức khỏe và tận hưởng những khoảnh khắc bình dị đáng quý."""

        elif period == "week":
            return f"""Tổng Quan Chiêm Tinh Tuần Tới cho {name}:
Bản đồ sao tuần này cho thấy sự hòa hợp giữa các góc chiếu nguyên tố, giúp bạn cân bằng xuất sắc giữa công việc và đời sống tinh thần. Đầu tuần thuận lợi cho khởi đầu mới; giữa tuần đón nhận những thông điệp vũ trụ quý giá; cuối tuần là lúc phục hồi năng lượng và kết nối yêu thương."""

        elif period == "month":
            return f"""Tổng Quan Chiêm Tinh Tháng Tới cho {name}:
Tháng tới là một chu kỳ thanh lọc và tái sinh mạnh mẽ. Năng lượng các hành tinh thúc đẩy bạn buông bỏ những áp lực cũ kỹ, đón nhận những cơ hội mới mẻ trong cả tình duyên lẫn sự nghiệp, kiến tạo một phiên bản tự tin và an yên hơn bao giờ hết."""

        else: # future
            return f"""Tổng Quan Vận Trình Tương Lai Dài Hạn cho {name}:
Hành trình tương lai mở ra một chương sách rực rỡ của sự trưởng thành tâm hồn và hiện thực hóa những ước mơ lớn. Bạn sẽ từng bước đạt được sự tự do tài chính, viên mãn trong tình cảm và bình an sâu sắc trong thế giới nội tâm của chính mình."""

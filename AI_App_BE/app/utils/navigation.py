# -*- coding: utf-8 -*-
"""
Navigation Registry for Resonancia AstroBot
Single Source of Truth for frontend routing, labels, and local response templates.
Only registers routes that exist in frontend (App.tsx).
"""

import random

# Whitelist các route có thật trong ResonanciaWeb (App.tsx)
VALID_ROUTES = {
    "/natal",
    "/synastry",
    "/tarot",
    "/match",
    "/prediction",
    "/profile",
    "/transit",
    "/glossary",
    "/journal",
    "/register/step2"
}

NAVIGATION_REGISTRY = {
    "natal": {
        "route": "/natal",
        "label": "Mở Bản Đồ Sao",
        "description": "Lá số chiêm tinh cá nhân, biểu đồ vòng tròn và phân tích 8 khía cạnh",
        "keywords": ["bản đồ sao", "lá số", "natal", "birth chart", "biểu đồ sao", "bản đồ sinh"],
        "templates": [
            "Tôi sẽ đưa bạn đến trang Bản Đồ Sao cá nhân để bạn khám phá các hành tinh và cung nhà của mình ngay nhé!",
            "Bản Đồ Sao của bạn đã sẵn sàng. Hãy bấm nút bên dưới để mở biểu đồ chiêm tinh cá nhân nhé.",
            "Tuyệt vời! Hãy cùng giải mã năng lượng vũ trụ độc bản của bạn tại trang Bản Đồ Sao.",
            "Mời bạn khám phá vị trí Mặt Trời, Mặt Trăng và Cung Mọc trong Bản Đồ Sao cá nhân ngay bên dưới."
        ]
    },
    "tarot": {
        "route": "/tarot",
        "label": "Mở Tarot",
        "description": "Bói bài Tarot, rút bài ngày, trải bài 1 lá hoặc 3 lá",
        "keywords": ["tarot", "bói bài", "rút bài", "trải bài", "quẻ bài", "xem bài"],
        "templates": [
            "Tôi đã chuẩn bị bộ bài Tarot cho bạn. Hãy bấm nút bên dưới để bắt đầu rút bài và đón nhận thông điệp nhé!",
            "Cánh cổng Tarot đang mở ra. Hãy giữ tâm trí tĩnh lặng và bấm mở trang Tarot bên dưới để trải bài.",
            "Vũ trụ có những thông điệp muốn nhắn gửi đến bạn qua các lá bài Tarot. Mời bạn mở Tarot ngay nhé.",
            "Hãy để các lá bài Tarot soi sáng câu hỏi của bạn. Bấm nút bên dưới để tiến hành rút bài."
        ]
    },
    "synastry": {
        "route": "/synastry",
        "label": "Mở Bản Đồ Đôi",
        "description": "So sánh 2 lá số, phân tích tương thích tình duyên và góc hợp",
        "keywords": ["bản đồ đôi", "synastry", "so sánh lá số", "tương hợp", "độ hợp nhau", "hợp nhau"],
        "templates": [
            "Tôi sẽ chuyển bạn đến tính năng Bản Đồ Đôi Synastry để bạn xem chi tiết độ hòa hợp giữa hai lá số nhé!",
            "Hãy khám phá điểm chạm cảm xúc và góc hợp giữa hai bạn tại trang Bản Đồ Đôi Synastry bên dưới.",
            "Bản Đồ Đôi Synastry sẽ giúp bạn thấu hiểu sâu sắc năng lượng của cả hai. Mời bạn bấm mở ngay bên dưới.",
            "Tuyệt vời! Hãy cùng đối chiếu hai biểu đồ sao tại trang Bản Đồ Đôi Synastry để xem mức độ đồng điệu nhé."
        ]
    },
    "partner": {
        "route": "/synastry",
        "label": "Nhập Thông Tin Đối Phương",
        "description": "Nhập thông tin người yêu / đối phương (Tên, Sun, Moon, Ascendant) để phân tích",
        "keywords": ["người yêu", "đối phương", "crush", "người ấy", "bạn đời", "thông tin người yêu"],
        "templates": [
            "Để xem mức độ tương thích với người ấy, bạn có thể điền thông tin (Tên, Cung Mặt Trời, Mặt Trăng) tại trang Bản Đồ Đôi nhé!",
            "Tôi sẽ mở trang Bản Đồ Đôi để bạn nhập thông tin người yêu / đối phương và bắt đầu phân tích tương hợp ngay nhé.",
            "Bạn hãy bấm nút bên dưới để vào trang Bản Đồ Đôi và điền thông tin của người ấy nhé.",
            "Trang Bản Đồ Đôi đã sẵn sàng form nhập thông tin đối phương (Tên, Sun, Moon). Mời bạn vào điền thông tin!"
        ]
    },
    "match": {
        "route": "/match",
        "label": "Mở Ghép Đôi",
        "description": "Quẹt ghép đôi hẹn hò dựa trên độ hợp chiêm tinh học",
        "keywords": ["ghép đôi", "ghép cặp", "match", "soulmate", "tìm người yêu", "hẹn hò"],
        "templates": [
            "Tôi sẽ chuyển bạn đến không gian Ghép Đôi Hẹn Hò để bạn kết nối cùng những người có tần số tương hợp nhé!",
            "Bạn đang tìm kiếm một nửa đồng điệu? Hãy bấm nút bên dưới để bước vào tính năng Ghép Đôi của Resonancia.",
            "Những tâm hồn cùng tần số vũ trụ đang chờ bạn kết nối. Mời bạn mở trang Ghép Đôi ngay bên dưới.",
            "Tính năng Ghép Đôi chiêm tinh đã sẵn sàng. Hãy bấm nút bên dưới để khám phá những người hợp cung với bạn nhé!"
        ]
    },
    "prediction": {
        "route": "/prediction",
        "label": "Mở Dự Đoán",
        "description": "Dự báo tử vi, năng lượng chiêm tinh theo ngày, tuần, tháng",
        "keywords": ["dự đoán", "horoscope", "tử vi", "dự báo", "hôm nay", "ngày mai", "vận mệnh"],
        "templates": [
            "Tôi sẽ mở trang Dự Báo Chiêm Tinh để bạn đón xem thông điệp năng lượng hôm nay và thời gian tới nhé!",
            "Hãy khám phá dòng chảy năng lượng của bạn qua tính năng Dự Báo Chiêm Tinh bên dưới.",
            "Dự báo tử vi chiêm tinh hôm nay của bạn đã sẵn sàng. Mời bạn bấm mở xem chi tiết bên dưới nhé.",
            "Vũ trụ đang gửi đến bạn những dự báo quan trọng. Hãy bấm nút bên dưới để mở trang Dự Báo."
        ]
    },
    "profile": {
        "route": "/profile",
        "label": "Mở Hồ Sơ Cá Nhân",
        "description": "Cập nhật ngày sinh, giờ sinh, nơi sinh và thông tin tài khoản",
        "keywords": ["hồ sơ", "profile", "ngày sinh", "giờ sinh", "nơi sinh", "cập nhật", "đổi ngày sinh", "nhập ngày sinh", "sửa thông tin"],
        "templates": [
            "Tôi sẽ đưa bạn đến trang Hồ Sơ để bạn có thể xem và cập nhật ngày, giờ và nơi sinh của mình nhé!",
            "Bạn có thể điều chỉnh ngày sinh, giờ sinh và thông tin cá nhân ngay tại trang Hồ Sơ bên dưới.",
            "Để lá số chiêm tinh chính xác nhất, bạn hãy bấm nút bên dưới để vào trang Hồ Sơ và cập nhật thông tin nhé.",
            "Trang Hồ Sơ đã sẵn sàng. Mời bạn bấm mở để kiểm tra và cập nhật thông tin sinh của mình."
        ]
    },
    "transit": {
        "route": "/transit",
        "label": "Mở Vận Hạn",
        "description": "Xem quá cảnh các hành tinh trên bầu trời thời gian thực",
        "keywords": ["vận hạn", "transit", "quá cảnh", "hành tinh quá cảnh"],
        "templates": [
            "Tôi sẽ mở trang Vận Hạn Quá Cảnh để bạn xem các hành tinh hiện tại đang tương tác thế nào với lá số của mình nhé!",
            "Mời bạn khám phá các góc chiếu vận hạn thời gian thực tại trang Vận Hạn bên dưới.",
            "Dòng chuyển động của các hành tinh đang tác động trực tiếp đến bạn. Hãy bấm mở trang Vận Hạn để theo dõi.",
            "Tính năng Vận Hạn Quá Cảnh đã sẵn sàng. Mời bạn bấm nút bên dưới để tra cứu chi tiết."
        ]
    },
    "glossary": {
        "route": "/glossary",
        "label": "Mở Từ Điển Chiêm Tinh",
        "description": "Tra cứu định nghĩa các thuật ngữ, cung nhà, hành tinh",
        "keywords": ["từ điển", "glossary", "thuật ngữ", "tra cứu thuật ngữ"],
        "templates": [
            "Tôi sẽ mở Từ Điển Chiêm Tinh để bạn tra cứu chi tiết ý nghĩa các thuật ngữ, cung hoàng đạo và cung nhà nhé!",
            "Bạn muốn tìm hiểu thêm các khái niệm chiêm tinh học? Mời bạn mở Từ Điển Chiêm Tinh bên dưới.",
            "Từ Điển Chiêm Tinh Resonancia chứa giải thích chi tiết mọi thuật ngữ. Bấm nút bên dưới để tra cứu nhé.",
            "Hãy khám phá kho từ điển chiêm tinh phong phú tại nút bấm bên dưới nhé."
        ]
    },
    "journal": {
        "route": "/journal",
        "label": "Mở Nhật Ký Vũ Trụ",
        "description": "Ghi chép cảm xúc, nhật ký chiêm tinh và trải nghiệm cá nhân",
        "keywords": ["nhật ký", "journal", "ghi chép", "nhật ký vũ trụ"],
        "templates": [
            "Tôi sẽ đưa bạn đến Nhật Ký Vũ Trụ để bạn ghi lại những cảm xúc và chiêm nghiệm của mình nhé!",
            "Hãy lưu giữ lại những suy ngẫm và hành trình nội tâm của bạn tại trang Nhật Ký Vũ Trụ bên dưới.",
            "Nhật Ký Vũ Trụ đã sẵn sàng để đón nhận những dòng suy tư của bạn. Mời bạn mở ngay bên dưới.",
            "Mời bạn bấm mở Nhật Ký Vũ Trụ để ghi lại trải nghiệm năng lượng của ngày hôm nay."
        ]
    }
}

def create_action(key: str) -> dict:
    """Tạo action object theo chuẩn contract."""
    item = NAVIGATION_REGISTRY.get(key)
    if not item or item["route"] not in VALID_ROUTES:
        return None
    return {
        "type": "navigate",
        "route": item["route"],
        "label": item["label"]
    }

def get_navigation_response(key: str, user_name: str = "Bạn") -> dict:
    """Tạo phản hồi điều hướng 1 đích kèm action hợp lệ."""
    item = NAVIGATION_REGISTRY.get(key)
    if not item:
        return get_unknown_feature_response(user_name)

    templates = item.get("templates", [])
    text = random.choice(templates) if templates else f"Mời bạn mở {item['label']} bên dưới nhé."
    action = create_action(key)

    return {
        "answer": f"Chào {user_name}! {text}",
        "action": action,
        "actions": [action] if action else []
    }

def get_multi_navigation_response(keys: list, user_name: str = "Bạn") -> dict:
    """Tạo phản hồi điều hướng nhiều đích (tối đa 2 action)."""
    valid_keys = [k for k in keys if k in NAVIGATION_REGISTRY][:2]
    if not valid_keys:
        return get_unknown_feature_response(user_name)

    if len(valid_keys) == 1:
        return get_navigation_response(valid_keys[0], user_name)

    item1 = NAVIGATION_REGISTRY[valid_keys[0]]
    item2 = NAVIGATION_REGISTRY[valid_keys[1]]
    act1 = create_action(valid_keys[0])
    act2 = create_action(valid_keys[1])

    actions = [a for a in [act1, act2] if a]
    answer = f"Chào {user_name}! Bạn có thể mở trực tiếp cả hai tính năng **{item1['label']}** và **{item2['label']}** bằng các nút bên dưới nhé."

    return {
        "answer": answer,
        "action": act1,
        "actions": actions
    }

def get_form_help_response(user_name: str = "Bạn") -> dict:
    """Phản hồi giải thích các trường cần điền trong form và hướng dẫn đến Hồ sơ/Lá số."""
    answer = (
        f"Chào {user_name}! Để Resonancia lập Bản Đồ Sao và tính toán năng lượng chiêm tinh chính xác nhất cho bạn, "
        "bạn chỉ cần điền các thông tin cơ bản sau tại mục **Hồ Sơ**:\n\n"
        "1. **Họ và tên**: Tên hiển thị của bạn.\n"
        "2. **Ngày, tháng, năm sinh**: Ví dụ 27/06/2001 (xác định Cung Mặt Trời).\n"
        "3. **Giờ sinh**: Định dạng Giờ:Phút, ví dụ 06:30 (rất quan trọng để xác định Cung Mọc và 12 Cung Nhà).\n"
        "4. **Nơi sinh**: Tỉnh/Thành phố nơi bạn chào đời (xác định kinh độ/vĩ độ múi giờ).\n\n"
        "Sau khi cập nhật đầy đủ, toàn bộ Bản Đồ Sao, phân tích tính cách và gợi ý hướng nghiệp sẽ tự động kích hoạt!"
    )
    act_profile = create_action("profile")
    act_natal = create_action("natal")
    return {
        "answer": answer,
        "action": act_profile,
        "actions": [act_profile, act_natal]
    }

def get_unknown_feature_response(user_name: str = "Bạn", feature_name: str = "") -> dict:
    """Phản hồi an toàn khi người dùng yêu cầu trang/chức năng không tồn tại."""
    name_str = f" '{feature_name}'" if feature_name else ""
    answer = (
        f"Chào {user_name}! Resonancia hiện chưa có chức năng{name_str} này. "
        "Tuy nhiên, bạn có thể khám phá các tính năng chiêm tinh nổi bật có sẵn bên dưới nhé:"
    )
    act_natal = create_action("natal")
    act_tarot = create_action("tarot")
    act_synastry = create_action("synastry")
    return {
        "answer": answer,
        "action": act_natal,
        "actions": [act_natal, act_tarot, act_synastry]
    }

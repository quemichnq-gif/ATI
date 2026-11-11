# -*- coding: utf-8 -*-
import datetime

def safe_print(*args, **kwargs):
    try:
        print(*args, **kwargs)
    except Exception:
        pass

PREDICTION_CACHE = {}

def get_cached_prediction(uid, name, sun, moon, category, day):
    cache_key = f"{uid}_{category}_{day}"
    return PREDICTION_CACHE.get(cache_key)

def save_prediction(uid, name, sun, moon, category, day, data):
    cache_key = f"{uid}_{category}_{day}"
    doc = {
        "uid": uid,
        "name": name,
        "sun": sun,
        "moon": moon,
        "category": category,
        "day": day,
        "created_at": datetime.datetime.now().isoformat(),
    }
    if isinstance(data, dict):
        doc.update(data)
    else:
        doc["prediction"] = data
    PREDICTION_CACHE[cache_key] = doc

def is_valid_user(u):
    try:
        planets = u.get("planets", {})
        required_planets = ["sun", "moon", "mercury", "venus", "mars"]
        if any(p not in planets or not planets[p] for p in required_planets):
            return False
        return True
    except Exception:
        return False

IN_MEMORY_MATCH_REQUESTS = {}
IN_MEMORY_NOTIFICATIONS = {}
IN_MEMORY_USER_RELATIONSHIPS = {}
REGISTERED_ACTIVE_USERS = {}

DEFAULT_MATCH_CANDIDATES = [
    {
        "uid": "cand_1_nghia",
        "name": "Trần Đại Nghĩa",
        "zodiac": "Bảo Bình",
        "sun": "Bảo Bình",
        "moon": "Nhân Mã",
        "age": 23,
        "gender": "Nam",
        "element": "Khí",
        "job": "Product Designer & Sáng tạo nội dung",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "personality": "Sáng tạo, tự do và cởi mở",
        "planets": {"sun": "Bảo Bình", "moon": "Nhân Mã", "mercury": "Bảo Bình", "venus": "Bạch Dương", "mars": "Song Tử"},
        "houses": {},
        "elements": {"fire": 25, "earth": 15, "air": 45, "water": 15}
    },
    {
        "uid": "cand_2_hamy",
        "name": "Hà My",
        "zodiac": "Song Ngư",
        "sun": "Song Ngư",
        "moon": "Cự Giải",
        "age": 21,
        "gender": "Nữ",
        "element": "Nước",
        "job": "Nhiếp ảnh gia & Nhà trị liệu nghệ thuật",
        "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        "personality": "Dịu dàng, trực giác và lãng mạn",
        "planets": {"sun": "Song Ngư", "moon": "Cự Giải", "mercury": "Bảo Bình", "venus": "Kim Ngưu", "mars": "Song Ngư"},
        "houses": {},
        "elements": {"fire": 10, "earth": 20, "air": 20, "water": 50}
    },
    {
        "uid": "cand_3_linhdan",
        "name": "Linh Đan",
        "zodiac": "Kim Ngưu",
        "sun": "Kim Ngưu",
        "moon": "Xử Nữ",
        "age": 22,
        "gender": "Nữ",
        "element": "Đất",
        "job": "Chuyên viên Phân tích Dữ liệu",
        "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
        "personality": "Chân thành, kiên định và ấm áp",
        "planets": {"sun": "Kim Ngưu", "moon": "Xử Nữ", "mercury": "Song Tử", "venus": "Cự Giải", "mars": "Kim Ngưu"},
        "houses": {},
        "elements": {"fire": 15, "earth": 50, "air": 15, "water": 20}
    },
    {
        "uid": "cand_4_maianh",
        "name": "Mai Anh",
        "zodiac": "Cự Giải",
        "sun": "Cự Giải",
        "moon": "Kim Ngưu",
        "age": 22,
        "gender": "Nữ",
        "element": "Nước",
        "job": "Giảng viên Yoga & Thiền định",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
        "personality": "Chu đáo, biết lắng nghe và tình cảm",
        "planets": {"sun": "Cự Giải", "moon": "Kim Ngưu", "mercury": "Cự Giải", "venus": "Sư Tử", "mars": "Xử Nữ"},
        "houses": {},
        "elements": {"fire": 20, "earth": 25, "air": 10, "water": 45}
    },
    {
        "uid": "cand_5_quocbao",
        "name": "Quốc Bảo",
        "zodiac": "Thiên Bình",
        "sun": "Thiên Bình",
        "moon": "Bảo Bình",
        "age": 24,
        "gender": "Nam",
        "element": "Khí",
        "job": "Kiến trúc sư",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        "personality": "Lịch thiệp, hòa nhã và tinh tế",
        "planets": {"sun": "Thiên Bình", "moon": "Bảo Bình", "mercury": "Thiên Bình", "venus": "Nhân Mã", "mars": "Thiên Bình"},
        "houses": {},
        "elements": {"fire": 25, "earth": 10, "air": 50, "water": 15}
    },
    {
        "uid": "cand_6_khanhlinh",
        "name": "Khánh Linh",
        "zodiac": "Xử Nữ",
        "sun": "Xử Nữ",
        "moon": "Ma Kết",
        "age": 23,
        "gender": "Nữ",
        "element": "Đất",
        "job": "Biên kịch & Nhà sáng tạo nội dung",
        "avatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
        "personality": "Thông minh, sắc sảo và sâu sắc",
        "planets": {"sun": "Xử Nữ", "moon": "Ma Kết", "mercury": "Xử Nữ", "venus": "Bọ Cạp", "mars": "Ma Kết"},
        "houses": {},
        "elements": {"fire": 10, "earth": 55, "air": 15, "water": 20}
    },
    {
        "uid": "cand_7_hoangnam",
        "name": "Hoàng Nam",
        "zodiac": "Bạch Dương",
        "sun": "Bạch Dương",
        "moon": "Nhân Mã",
        "age": 24,
        "gender": "Nam",
        "element": "Lửa",
        "job": "Nhiếp ảnh gia đường phố & Nhà thám hiểm",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
        "personality": "Năng động, quả quyết, bộc trực và nhiệt huyết",
        "planets": {"sun": "Bạch Dương", "moon": "Nhân Mã", "mercury": "Song Ngư", "venus": "Kim Ngưu", "mars": "Bạch Dương"},
        "houses": {},
        "elements": {"fire": 55, "earth": 10, "air": 20, "water": 15}
    },
    {
        "uid": "cand_8_thutrang",
        "name": "Thu Trang",
        "zodiac": "Kim Ngưu",
        "sun": "Kim Ngưu",
        "moon": "Ma Kết",
        "age": 22,
        "gender": "Nữ",
        "element": "Đất",
        "job": "Giảng viên Mỹ thuật & Gốm thủ công",
        "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
        "personality": "Điềm đạm, ấm áp, kiên nhẫn và bình dị",
        "planets": {"sun": "Kim Ngưu", "moon": "Ma Kết", "mercury": "Kim Ngưu", "venus": "Song Ngư", "mars": "Kim Ngưu"},
        "houses": {},
        "elements": {"fire": 10, "earth": 55, "air": 15, "water": 20}
    },
    {
        "uid": "cand_9_minhtriet",
        "name": "Minh Triết",
        "zodiac": "Song Tử",
        "sun": "Song Tử",
        "moon": "Thiên Bình",
        "age": 23,
        "gender": "Nam",
        "element": "Khí",
        "job": "Kỹ sư AI & Podcaster công nghệ",
        "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
        "personality": "Hoạt ngôn, hài hước, tư duy logic nhạy bén",
        "planets": {"sun": "Song Tử", "moon": "Thiên Bình", "mercury": "Song Tử", "venus": "Bảo Bình", "mars": "Sư Tử"},
        "houses": {},
        "elements": {"fire": 20, "earth": 10, "air": 55, "water": 15}
    },
    {
        "uid": "cand_10_ngocanh",
        "name": "Ngọc Ánh",
        "zodiac": "Sư Tử",
        "sun": "Sư Tử",
        "moon": "Bạch Dương",
        "age": 23,
        "gender": "Nữ",
        "element": "Lửa",
        "job": "Brand Manager & Stylist thời trang",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "personality": "Tự tin, cuốn hút, hào phóng và tích cực",
        "planets": {"sun": "Sư Tử", "moon": "Bạch Dương", "mercury": "Sư Tử", "venus": "Song Tử", "mars": "Nhân Mã"},
        "houses": {},
        "elements": {"fire": 55, "earth": 15, "air": 20, "water": 10}
    },
    {
        "uid": "cand_11_tuananh",
        "name": "Tuấn Anh",
        "zodiac": "Bọ Cạp",
        "sun": "Bọ Cạp",
        "moon": "Cự Giải",
        "age": 25,
        "gender": "Nam",
        "element": "Nước",
        "job": "Chuyên viên Phân tích Đầu tư",
        "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
        "personality": "Trầm tĩnh, sâu sắc, trực giác bén nhọn",
        "planets": {"sun": "Bọ Cạp", "moon": "Cự Giải", "mercury": "Bọ Cạp", "venus": "Ma Kết", "mars": "Bọ Cạp"},
        "houses": {},
        "elements": {"fire": 15, "earth": 20, "air": 15, "water": 50}
    },
    {
        "uid": "cand_12_phuongthao",
        "name": "Phương Thảo",
        "zodiac": "Nhân Mã",
        "sun": "Nhân Mã",
        "moon": "Sư Tử",
        "age": 22,
        "gender": "Nữ",
        "element": "Lửa",
        "job": "Hướng dẫn viên du lịch & Blogger",
        "avatar": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80",
        "personality": "Phóng khoáng, lạc quan và yêu tự do",
        "planets": {"sun": "Nhân Mã", "moon": "Sư Tử", "mercury": "Bảo Bình", "venus": "Nhân Mã", "mars": "Bạch Dương"},
        "houses": {},
        "elements": {"fire": 50, "earth": 15, "air": 25, "water": 10}
    },
    {
        "uid": "cand_13_duclong",
        "name": "Đức Long",
        "zodiac": "Ma Kết",
        "sun": "Ma Kết",
        "moon": "Kim Ngưu",
        "age": 24,
        "gender": "Nam",
        "element": "Đất",
        "job": "Quản lý Dự án Bền vững",
        "avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80",
        "personality": "Điềm tĩnh, có trách nhiệm và kiên trì",
        "planets": {"sun": "Ma Kết", "moon": "Kim Ngưu", "mercury": "Ma Kết", "venus": "Xử Nữ", "mars": "Kim Ngưu"},
        "houses": {},
        "elements": {"fire": 10, "earth": 60, "air": 15, "water": 15}
    },
    {
        "uid": "cand_14_thanhhuyen",
        "name": "Thanh Huyền",
        "zodiac": "Bảo Bình",
        "sun": "Bảo Bình",
        "moon": "Song Tử",
        "age": 23,
        "gender": "Nữ",
        "element": "Khí",
        "job": "UI/UX Designer & Nghệ sĩ minh họa",
        "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        "personality": "Độc lập, sáng tạo và nhân hậu",
        "planets": {"sun": "Bảo Bình", "moon": "Song Tử", "mercury": "Bảo Bình", "venus": "Bạch Dương", "mars": "Bảo Bình"},
        "houses": {},
        "elements": {"fire": 20, "earth": 10, "air": 55, "water": 15}
    },
    {
        "uid": "cand_15_vietanh",
        "name": "Việt Anh",
        "zodiac": "Song Ngư",
        "sun": "Song Ngư",
        "moon": "Bọ Cạp",
        "age": 23,
        "gender": "Nam",
        "element": "Nước",
        "job": "Nhạc sĩ Indie & Sản xuất âm nhạc",
        "avatar": "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=400&q=80",
        "personality": "Giàu cảm xúc, lãng tử và thấu cảm",
        "planets": {"sun": "Song Ngư", "moon": "Bọ Cạp", "mercury": "Song Ngư", "venus": "Kim Ngưu", "mars": "Cự Giải"},
        "houses": {},
        "elements": {"fire": 10, "earth": 15, "air": 20, "water": 55}
    },
    {
        "uid": "cand_16_thuyduong",
        "name": "Thùy Dương",
        "zodiac": "Thiên Bình",
        "sun": "Thiên Bình",
        "moon": "Bảo Bình",
        "age": 24,
        "gender": "Nữ",
        "element": "Khí",
        "job": "Chuyên viên Quan hệ Công chúng (PR)",
        "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        "personality": "Thanh lịch, khéo léo và hòa nhã",
        "planets": {"sun": "Thiên Bình", "moon": "Bảo Bình", "mercury": "Thiên Bình", "venus": "Sư Tử", "mars": "Thiên Bình"},
        "houses": {},
        "elements": {"fire": 20, "earth": 15, "air": 50, "water": 15}
    }
]

# Tải và đồng bộ 100 ứng viên từ usersMockData.json
try:
    import os
    import json
    _be_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    _mock_path = os.path.abspath(os.path.join(_be_dir, "..", "AI_App_FE", "ResonanciaWeb", "src", "mocks", "usersMockData.json"))
    if os.path.exists(_mock_path):
        with open(_mock_path, "r", encoding="utf-8") as _f:
            _mock_data = json.load(_f)
        _elem_map = {
            'Bạch Dương': 'Lửa', 'Sư Tử': 'Lửa', 'Nhân Mã': 'Lửa',
            'Kim Ngưu': 'Đất', 'Xử Nữ': 'Đất', 'Ma Kết': 'Đất',
            'Song Tử': 'Khí', 'Thiên Bình': 'Khí', 'Bảo Bình': 'Khí',
            'Cự Giải': 'Nước', 'Bọ Cạp': 'Nước', 'Song Ngư': 'Nước'
        }
        for _u in _mock_data:
            _z = _u.get("zodiacSign", "Bảo Bình")
            _elem = _elem_map.get(_z, "Đất")
            _birth_year = int(_u["dateOfBirth"][:4]) if _u.get("dateOfBirth") else 1998
            DEFAULT_MATCH_CANDIDATES.append({
                "uid": _u["id"],
                "name": _u.get("fullName", "Thành viên Resonancia"),
                "email": _u.get("email"),
                "zodiac": _z,
                "sun": _z,
                "moon": _u.get("moon", "Xử Nữ"),
                "age": 2026 - _birth_year,
                "gender": _u.get("gender", ""),
                "element": _elem,
                "job": _u.get("occupation", "Thành viên Resonancia"),
                "avatar": _u.get("avatar", ""),
                "bio": _u.get("bio", ""),
                "personality": _u.get("bio", "Chân thành, ấm áp"),
                "planets": {"sun": _z, "moon": "Xử Nữ", "mercury": _z, "venus": "Kim Ngưu", "mars": "Bạch Dương"},
                "houses": {},
                "elements": {
                    "fire": 45 if _elem == "Lửa" else 15,
                    "earth": 45 if _elem == "Đất" else 15,
                    "air": 45 if _elem == "Khí" else 15,
                    "water": 45 if _elem == "Nước" else 15
                }
            })
except Exception:
    pass

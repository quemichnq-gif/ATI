# -*- coding: utf-8 -*-
"""
Sync mock users from AI_App_FE/ResonanciaWeb/src/mocks/usersMockData.json to Firebase:
1. Firebase Authentication: Create or update 100 mock user accounts (password: 123456)
2. Firebase Firestore: Store 100 user profiles in 'users' collection with full astrology data
"""

import os
import sys
import json
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore, auth

# Fix console encoding on Windows/cross-platform
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
KEY_PATH = os.path.join(BASE_DIR, "firebase-key.json")
MOCK_JSON_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "AI_App_FE", "ResonanciaWeb", "src", "mocks", "usersMockData.json"))

if not os.path.exists(KEY_PATH):
    print(f"❌ Không tìm thấy file khóa Firebase: {KEY_PATH}")
    sys.exit(1)

if not os.path.exists(MOCK_JSON_PATH):
    print(f"❌ Không tìm thấy file mock users: {MOCK_JSON_PATH}")
    sys.exit(1)

cred = credentials.Certificate(KEY_PATH)
try:
    app = firebase_admin.get_app()
except ValueError:
    app = firebase_admin.initialize_app(cred)

db = firestore.client()

ZODIAC_LIST = [
    'Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải',
    'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp',
    'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'
]

ELEMENT_MAP = {
    'Bạch Dương': 'Lửa', 'Sư Tử': 'Lửa', 'Nhân Mã': 'Lửa',
    'Kim Ngưu': 'Đất', 'Xử Nữ': 'Đất', 'Ma Kết': 'Đất',
    'Song Tử': 'Khí', 'Thiên Bình': 'Khí', 'Bảo Bình': 'Khí',
    'Cự Giải': 'Nước', 'Bọ Cạp': 'Nước', 'Song Ngư': 'Nước'
}

COSMIC_COVERS = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516339901601-2e1562986307?auto=format&fit=crop&w=1200&q=80',
]

def calculate_astrology(birth_date_str, birth_time_str, zodiac_sign, user_idx):
    try:
        parts = [int(p) for p in birth_date_str.split('-')]
        year, month, day = parts[0], parts[1], parts[2]
    except Exception:
        year, month, day = 1998, 1, 1

    try:
        t_parts = [int(p) for p in birth_time_str.split(':')]
        hours, minutes = t_parts[0], t_parts[1]
    except Exception:
        hours, minutes = 6, 0

    sun_sign = zodiac_sign if zodiac_sign in ZODIAC_LIST else 'Bạch Dương'
    sun_index = ZODIAC_LIST.index(sun_sign)

    def get_sign(offset):
        return ZODIAC_LIST[(sun_index + offset + 12) % 12]

    ascendant = get_sign(int((hours * 60 + minutes) / 120))
    moon = get_sign(int(day / 2.5) % 12)
    mercury = get_sign((day % 3) - 1)
    venus = get_sign((day % 5) - 2)
    mars = get_sign((day % 7) - 3)
    jupiter = get_sign(year % 12)
    saturn = get_sign((year * 2) % 12)
    uranus = get_sign(7)
    neptune = get_sign(10)
    pluto = get_sign(8)

    descendant = ZODIAC_LIST[(ZODIAC_LIST.index(ascendant) + 6) % 12]
    mc = ZODIAC_LIST[(ZODIAC_LIST.index(ascendant) + 9) % 12]
    ic = ZODIAC_LIST[(ZODIAC_LIST.index(ascendant) + 3) % 12]

    planets = {
        'sun': sun_sign,
        'moon': moon,
        'mercury': mercury,
        'venus': venus,
        'mars': mars,
        'jupiter': jupiter,
        'saturn': saturn,
        'uranus': uranus,
        'neptune': neptune,
        'pluto': pluto,
        'ascendant': ascendant,
        'descendant': descendant,
        'mc': mc,
        'ic': ic,
    }

    asc_index = ZODIAC_LIST.index(ascendant)
    houses = {}
    for i in range(1, 13):
        houses[f'house{i}'] = ZODIAC_LIST[(asc_index + i - 1) % 12]

    counts = {'Lửa': 0, 'Đất': 0, 'Khí': 0, 'Nước': 0}
    for p_name, sign in planets.items():
        elem = ELEMENT_MAP.get(sign)
        if elem in counts:
            counts[elem] += 1
    total = sum(counts.values()) or 1

    ratios = {
        'fireRatio': round((counts['Lửa'] / total) * 100),
        'earthRatio': round((counts['Đất'] / total) * 100),
        'airRatio': round((counts['Khí'] / total) * 100),
        'waterRatio': round((counts['Nước'] / total) * 100),
    }

    age = 2026 - year

    return {
        'age': age,
        'element': ELEMENT_MAP.get(sun_sign, 'Đất'),
        'mainElement': ELEMENT_MAP.get(sun_sign, 'Đất'),
        'coverImage': COSMIC_COVERS[user_idx % len(COSMIC_COVERS)],
        **planets,
        **houses,
        **ratios,
        'conjunctionAspect': 'Mặt Trời - Sao Thủy, Sao Kim - Sao Hải Vương',
        'oppositionAspect': 'Mặt Trời - Sao Thổ',
        'trineAspect': 'Mặt Trời - Sao Mộc, Mặt Trăng - Sao Thổ',
        'squareAspect': 'Mặt Trời - Sao Hỏa',
        'sextileAspect': 'Sao Hỏa - Sao Mộc',
    }

def sync():
    with open(MOCK_JSON_PATH, 'r', encoding='utf-8') as f:
        mock_users = json.load(f)

    print(f"🚀 Bắt đầu đồng bộ {len(mock_users)} tài khoản lên Firebase...")

    # 1. Sync Firebase Authentication
    auth_success = 0
    auth_skipped = 0
    auth_errors = 0

    user_auth_map = {}

    for idx, u in enumerate(mock_users):
        u_id = u["id"]
        email = u["email"].strip().lower()
        full_name = u["fullName"]
        avatar = u.get("avatar", "")
        password = "password123"  # chuẩn mật khẩu dễ nhớ, tối thiểu 6 ký tự

        try:
            # Kiểm tra xem user đã tồn tại chưa
            existing = None
            try:
                existing = auth.get_user(u_id)
            except Exception:
                try:
                    existing = auth.get_user_by_email(email)
                except Exception:
                    pass

            if existing:
                # Update user
                auth.update_user(
                    existing.uid,
                    display_name=full_name,
                    photo_url=avatar,
                    email_verified=True,
                )
                user_auth_map[u_id] = existing.uid
                auth_skipped += 1
            else:
                # Create user with exact uid
                created = auth.create_user(
                    uid=u_id,
                    email=email,
                    password=password,
                    display_name=full_name,
                    photo_url=avatar,
                    email_verified=True,
                )
                user_auth_map[u_id] = created.uid
                auth_success += 1
        except Exception as e:
            # In case email belongs to another uid or error
            auth_errors += 1
            user_auth_map[u_id] = u_id
            print(f"⚠️ Auth error for {u_id} ({email}): {e}")

    print(f"✅ Firebase Auth: {auth_success} tạo mới, {auth_skipped} cập nhật, {auth_errors} lỗi.")

    # 2. Sync Firestore 'users' collection
    batch = db.batch()
    batch_count = 0
    total_firestore = 0

    for idx, u in enumerate(mock_users):
        u_id = u["id"]
        astro_data = calculate_astrology(u["dateOfBirth"], u["birthTime"], u["zodiacSign"], idx)

        doc_data = {
            "uid": u_id,
            "name": u["fullName"],
            "fullName": u["fullName"],
            "email": u["email"],
            "phone": u.get("phone", ""),
            "gender": u.get("gender", ""),
            "birthDate": u["dateOfBirth"],
            "dateOfBirth": u["dateOfBirth"],
            "birthTime": u["birthTime"],
            "birthPlace": u.get("address", "Việt Nam"),
            "zodiac": u["zodiacSign"],
            "zodiacSign": u["zodiacSign"],
            "sun": u["zodiacSign"],
            "relationshipStatus": u.get("relationshipStatus", "Độc thân"),
            "nationality": u.get("nationality", "Việt Nam"),
            "address": u.get("address", ""),
            "occupation": u.get("occupation", "Thành viên Resonancia"),
            "job": u.get("occupation", "Thành viên Resonancia"),
            "education": u.get("education", ""),
            "height": u.get("height", 170),
            "hobbies": u.get("hobbies", []),
            "bio": u.get("bio", ""),
            "avatar": u.get("avatar", ""),
            "coverImage": astro_data.get("coverImage", ""),
            "createdAt": u.get("createdAt", "2026-01-01"),
            "profileComplete": True,
            "isMockUser": True,
            "updatedAt": firestore.SERVER_TIMESTAMP,
            **astro_data
        }

        doc_ref = db.collection("users").document(u_id)
        batch.set(doc_ref, doc_data, merge=True)
        batch_count += 1
        total_firestore += 1

        # Commit batch if reaching 400 operations
        if batch_count >= 400:
            batch.commit()
            print(f"💾 Đã lưu batch {batch_count} bản ghi Firestore...")
            batch = db.batch()
            batch_count = 0

    if batch_count > 0:
        batch.commit()
        print(f"💾 Đã lưu batch cuối ({batch_count} bản ghi) Firestore...")

    print(f"🎉 Hoàn thành đồng bộ thành công {total_firestore} hồ sơ người dùng lên Firestore collection 'users'!")

if __name__ == '__main__':
    sync()

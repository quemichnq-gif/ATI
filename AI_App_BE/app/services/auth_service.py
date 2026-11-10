# -*- coding: utf-8 -*-
import requests
import cloudinary.uploader
from firebase_admin import auth, firestore
from app.config import FIREBASE_AVAILABLE, FIREBASE_API_KEY, db
from app.shared_state import IN_MEMORY_USER_RELATIONSHIPS
try:
    from app.repositories.storage_db import set_user_relationship, get_user_relationship
except ImportError:
    from storage_db import set_user_relationship, get_user_relationship


def verify_user_password(email, password, authenticated_user):
    if not email or not password:
        return {"success": False, "error": "Thiếu email hoặc password", "status": 400}

    user_email = str(authenticated_user.get("email", "")).strip().casefold()
    if user_email and email.strip().casefold() != user_email:
        return {"success": False, "error": "Tài khoản không khớp phiên đăng nhập", "status": 403}

    if not FIREBASE_API_KEY:
        return {"success": False, "error": "Dịch vụ xác thực chưa được cấu hình", "status": 503}

    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
    payload = {
        "email": email.strip(),
        "password": password,
        "returnSecureToken": True
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        result = response.json()
        if response.status_code == 200 and result.get("idToken"):
            return {"success": True, "status": 200}
        return {"success": False, "error": "Mật khẩu không đúng", "status": 401}
    except requests.RequestException:
        return {"success": False, "error": "Dịch vụ xác thực tạm thời không khả dụng", "status": 502}
    except Exception:
        return {"success": False, "error": "Không thể xác thực yêu cầu", "status": 500}


def update_user_profile(uid, fields):
    if not uid or not fields:
        return {"error": "Thiếu uid hoặc fields", "status": 400}

    auth_updated = False
    auth_updates = {}
    if "email" in fields:
        auth_updates["email"] = fields["email"]
        auth_updated = True
    if "password" in fields:
        auth_updates["password"] = fields["password"]
        auth_updated = True

    if auth_updated and FIREBASE_AVAILABLE:
        try:
            auth.update_user(uid, **auth_updates)
            print(f"✅ Đã cập nhật Firebase Authentication cho {uid}")
        except Exception as e:
            print(f"❌ Lỗi cập nhật Authentication: {str(e)}")
            return {"error": f"Không thể cập nhật thông tin xác thực: {str(e)}", "status": 500}

    clean_fields = {k: v for k, v in fields.items() if k != "password"}
    if clean_fields:
        if FIREBASE_AVAILABLE and db is not None:
            try:
                user_ref = db.collection("users").document(uid)
                save_data = {**clean_fields, "updatedAt": firestore.SERVER_TIMESTAMP}
                user_ref.set(save_data, merge=True)
                print(f"✅ Đã cập nhật Firestore cho user {uid}")
            except Exception as fe:
                print(f"⚠️ Lỗi cập nhật Firestore cho user {uid}: {fe}")
        else:
            print(f"ℹ️ Firebase Admin ở chế độ fallback, đã ghi nhận cập nhật thông tin cho {uid}")

    if "relationshipStatus" in clean_fields:
        existing_rel = get_user_relationship(uid)
        set_user_relationship(
            uid,
            relationship_status=clean_fields["relationshipStatus"],
            partner_id=existing_rel.get("partnerId"),
            match_id=existing_rel.get("matchId")
        )
        if uid not in IN_MEMORY_USER_RELATIONSHIPS:
            IN_MEMORY_USER_RELATIONSHIPS[uid] = {}
        IN_MEMORY_USER_RELATIONSHIPS[uid]["relationshipStatus"] = clean_fields["relationshipStatus"]

    return {
        "success": True,
        "message": "Cập nhật thành công",
        "authUpdated": auth_updated,
        "status": 200
    }


def upload_user_image(uid, image_type, image_data):
    if not uid or not image_data:
        return {"error": "Thiếu uid hoặc dữ liệu ảnh (imageData/imageBase64)", "status": 400}

    try:
        if "," in image_data:
            _, image_data = image_data.split(",", 1)

        upload_result = cloudinary.uploader.upload(
            f"data:image/jpeg;base64,{image_data}",
            folder=f"astrolove/{image_type}",
            public_id=f"{uid}_{image_type}",
            overwrite=True,
            resource_type="image"
        )
        image_url = upload_result.get("secure_url")

        if db is not None:
            try:
                user_ref = db.collection("users").document(uid)
                user_ref.set({
                    image_type: image_url,
                    "updatedAt": firestore.SERVER_TIMESTAMP
                }, merge=True, timeout=1.5)
            except Exception as fe:
                print(f"⚠️ Cảnh báo Firestore Admin update: {fe}")

        return {
            "success": True,
            "imageUrl": image_url,
            "imageType": image_type,
            "status": 200
        }
    except Exception as e:
        print(f"❌ Cloudinary upload error: {str(e)}")
        return {"error": f"Lỗi upload: {str(e)}", "status": 400}


def delete_user_image(uid, image_type, image_url):
    if not uid or not image_type:
        return {"error": "Thiếu uid hoặc imageType", "status": 400}

    if image_url and "cloudinary" in image_url:
        try:
            public_id = f"astrolove/{image_type}/{uid}_{image_type}"
            cloudinary.uploader.destroy(public_id)
            print(f"🗑️ Đã xóa ảnh: {public_id}")
        except Exception as e:
            print(f"⚠️ Không thể xóa ảnh: {str(e)}")

    if db is not None:
        try:
            user_ref = db.collection("users").document(uid)
            user_ref.update({
                image_type: "",
                "updatedAt": firestore.SERVER_TIMESTAMP
            })
        except Exception:
            pass

    return {"success": True, "message": "Đã xóa ảnh", "status": 200}


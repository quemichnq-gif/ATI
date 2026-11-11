# -*- coding: utf-8 -*-
import json
import re
import uuid
import threading
from datetime import datetime
import google.generativeai as genai
from firebase_admin import firestore
from app.config import GEMINI_MODEL, FIREBASE_AVAILABLE, db
from app.shared_state import (
    safe_print,
    DEFAULT_MATCH_CANDIDATES,
    REGISTERED_ACTIVE_USERS,
    IN_MEMORY_MATCH_REQUESTS,
    IN_MEMORY_NOTIFICATIONS,
    IN_MEMORY_USER_RELATIONSHIPS
)
try:
    from app.repositories.storage_db import (
        save_match_request as db_save_match_request,
        cancel_previous_requests,
        get_match_request_by_id,
        find_pending_match_request,
        update_match_request_status,
        end_match_requests_between,
        get_user_match_requests,
        get_latest_match_request_between,
        create_notification as db_create_notification,
        get_user_notifications,
        mark_notifications_read,
        delete_notification as db_delete_notification,
        get_user_relationship,
        set_user_relationship,
        break_relationship,
        uid_aliases
    )
except ImportError:
    from storage_db import (
        save_match_request as db_save_match_request,
        cancel_previous_requests,
        get_match_request_by_id,
        find_pending_match_request,
        update_match_request_status,
        end_match_requests_between,
        get_user_match_requests,
        get_latest_match_request_between,
        create_notification as db_create_notification,
        get_user_notifications,
        mark_notifications_read,
        delete_notification as db_delete_notification,
        get_user_relationship,
        set_user_relationship,
        break_relationship,
        uid_aliases
    )


def get_user_match_info(uid):
    if not uid:
        return {"name": "Người dùng", "avatar": "", "relationshipStatus": "Độc thân"}
    rel = get_user_relationship(uid)
    if uid in IN_MEMORY_USER_RELATIONSHIPS:
        rel.update(IN_MEMORY_USER_RELATIONSHIPS[uid])

    try:
        from app.services.chat_service import KNOWN_USER_INFO, CANONICAL_UID_MAP
        canonical = CANONICAL_UID_MAP.get(uid, uid)
        k_info = KNOWN_USER_INFO.get(canonical) or KNOWN_USER_INFO.get(uid)
        if k_info:
            return {
                "name": k_info.get("name", "Người dùng"),
                "avatar": k_info.get("avatar", ""),
                "partnerId": rel.get("partnerId"),
                "relationshipStatus": rel.get("relationshipStatus", "Độc thân")
            }
    except Exception:
        pass

    if uid in REGISTERED_ACTIVE_USERS:
        u = dict(REGISTERED_ACTIVE_USERS[uid])
        u.update(rel)
        return u
    cand = next((c for c in DEFAULT_MATCH_CANDIDATES if c.get("uid") == uid or c.get("id") == uid), None)
    if cand:
        return {
            "name": cand.get("name") or cand.get("fullName", "Người dùng"),
            "avatar": cand.get("avatar", ""),
            "age": cand.get("age", 24),
            "job": cand.get("job") or cand.get("occupation", "Thành viên Resonancia"),
            "partnerId": rel.get("partnerId"),
            "relationshipStatus": rel.get("relationshipStatus", "Độc thân")
        }
    return {
        "name": "Người dùng",
        "avatar": "",
        "partnerId": rel.get("partnerId"),
        "relationshipStatus": rel.get("relationshipStatus", "Độc thân")
    }


def send_match_request_service(sender_id, receiver_id, message, sender_name, sender_avatar, receiver_name):
    if not sender_id or not receiver_id:
        return {"error": "Thiếu thông tin sender hoặc receiver", "status": 400}

    sender_data = get_user_match_info(sender_id)
    receiver_data = get_user_match_info(receiver_id)

    s_name = sender_data.get("name") or sender_name or "Người dùng"
    s_avatar = sender_data.get("avatar") or sender_avatar or ""
    r_name = receiver_data.get("name") or receiver_name or "Người dùng"

    cancel_previous_requests(sender_id, receiver_id)
    for rid, req_item in list(IN_MEMORY_MATCH_REQUESTS.items()):
        if (req_item.get("senderId") == sender_id and req_item.get("receiverId") == receiver_id) or \
           (req_item.get("senderId") == receiver_id and req_item.get("receiverId") == sender_id):
            req_item["status"] = "canceled"

    request_id = str(uuid.uuid4())
    match_request = {
        "requestId": request_id,
        "senderId": sender_id,
        "receiverId": receiver_id,
        "senderName": s_name,
        "senderAvatar": s_avatar,
        "receiverName": r_name,
        "message": message or "Xin chào! Hãy kết nối chiêm tinh cùng mình nhé ✨",
        "status": "pending",
        "createdAt": datetime.now().isoformat(),
    }
    db_save_match_request(match_request)
    IN_MEMORY_MATCH_REQUESTS[request_id] = match_request

    notif_id = str(uuid.uuid4())
    notification = {
        "id": notif_id,
        "userId": receiver_id,
        "type": "match_request",
        "title": "Lời mời kết đôi mới ✨",
        "message": f"{s_name} đã gửi lời mời kết bạn và ghép đôi tới bạn!",
        "senderId": sender_id,
        "senderName": s_name,
        "senderAvatar": s_avatar,
        "requestId": request_id,
        "read": False,
        "createdAt": datetime.now().isoformat(),
    }
    db_create_notification(notification)
    if receiver_id not in IN_MEMORY_NOTIFICATIONS:
        IN_MEMORY_NOTIFICATIONS[receiver_id] = []
    IN_MEMORY_NOTIFICATIONS[receiver_id].insert(0, notification)

    if FIREBASE_AVAILABLE and db is not None:
        def sync_fs():
            try:
                db.collection("match_requests").document(request_id).set({
                    **match_request,
                    "createdAt": firestore.SERVER_TIMESTAMP,
                }, timeout=2.0)
            except Exception as fe:
                safe_print("⚠️ Firestore sync match request warning:", fe)
        threading.Thread(target=sync_fs, daemon=True).start()

    return {
        "success": True,
        "requestId": request_id,
        "message": "Đã gửi lời mời ghép đôi thành công",
        "status": 200
    }


def accept_match_request_service(request_id, receiver_id, sender_id, response_message):
    req = get_match_request_by_id(request_id) if request_id else None
    if not req and sender_id and receiver_id:
        req = find_pending_match_request(sender_id, receiver_id)

    if not req and request_id:
        req = IN_MEMORY_MATCH_REQUESTS.get(request_id)
    if not req and sender_id and receiver_id:
        s_aliases = uid_aliases(sender_id) if sender_id else [sender_id]
        r_aliases = uid_aliases(receiver_id) if receiver_id else [receiver_id]
        for r in IN_MEMORY_MATCH_REQUESTS.values():
            if ((r.get("senderId") in s_aliases and r.get("receiverId") in r_aliases) or
                (r.get("senderId") in r_aliases and r.get("receiverId") in s_aliases)) and r.get("status") == "pending":
                req = r
                break

    actual_req_id = req.get("requestId") if req else (request_id or f"{sender_id}_{receiver_id}")
    actual_sender = req.get("senderId") if req else sender_id
    actual_receiver = req.get("receiverId") if req else receiver_id

    if not actual_sender or not actual_receiver:
        return {"error": "Không tìm thấy yêu cầu ghép đôi tương ứng", "status": 404}

    resp_msg = response_message or "Đã đồng ý kết nối cùng bạn!"
    update_match_request_status(actual_req_id, "accepted", resp_msg)
    if actual_req_id in IN_MEMORY_MATCH_REQUESTS:
        IN_MEMORY_MATCH_REQUESTS[actual_req_id]["status"] = "accepted"
        IN_MEMORY_MATCH_REQUESTS[actual_req_id]["responseMessage"] = resp_msg

    set_user_relationship(actual_sender, "Đã có đôi", partner_id=actual_receiver, match_id=actual_req_id)
    set_user_relationship(actual_receiver, "Đã có đôi", partner_id=actual_sender, match_id=actual_req_id)

    for uid, pid in [(actual_sender, actual_receiver), (actual_receiver, actual_sender)]:
        if uid not in IN_MEMORY_USER_RELATIONSHIPS:
            IN_MEMORY_USER_RELATIONSHIPS[uid] = {}
        IN_MEMORY_USER_RELATIONSHIPS[uid]["partnerId"] = pid
        IN_MEMORY_USER_RELATIONSHIPS[uid]["matchId"] = actual_req_id
        IN_MEMORY_USER_RELATIONSHIPS[uid]["relationshipStatus"] = "Đã có đôi"

    receiver_info = get_user_match_info(actual_receiver)
    r_name = receiver_info.get("name") or "Người ấy"
    r_avatar = receiver_info.get("avatar") or ""

    notif_id = str(uuid.uuid4())
    notification = {
        "id": notif_id,
        "userId": actual_sender,
        "type": "match_accepted",
        "title": "Lời mời kết đôi đã được chấp nhận! ✨",
        "message": f"{r_name} đã đồng ý lời mời kết đôi của bạn!",
        "senderId": actual_receiver,
        "senderName": r_name,
        "senderAvatar": r_avatar,
        "requestId": actual_req_id,
        "read": False,
        "createdAt": datetime.now().isoformat(),
    }
    db_create_notification(notification)
    if actual_sender not in IN_MEMORY_NOTIFICATIONS:
        IN_MEMORY_NOTIFICATIONS[actual_sender] = []
    IN_MEMORY_NOTIFICATIONS[actual_sender].insert(0, notification)

    if FIREBASE_AVAILABLE and db is not None:
        def sync_fs():
            try:
                db.collection("match_requests").document(actual_req_id).update({
                    "status": "accepted",
                    "responseMessage": resp_msg,
                    "acceptedAt": firestore.SERVER_TIMESTAMP,
                }, timeout=1.5)
            except Exception as fe:
                safe_print("⚠️ Firestore sync accept warning:", fe)
        threading.Thread(target=sync_fs, daemon=True).start()

    return {
        "success": True,
        "message": "Đã chấp nhận lời mời ghép đôi thành công",
        "status": 200
    }


def reject_match_request_service(request_id, receiver_id, sender_id=None, response_message=""):
    req = get_match_request_by_id(request_id) if request_id else None
    if not req and sender_id and receiver_id:
        req = find_pending_match_request(sender_id, receiver_id)
    if not req and request_id in IN_MEMORY_MATCH_REQUESTS:
        req = IN_MEMORY_MATCH_REQUESTS[request_id]

    actual_req_id = req.get("requestId") if req else request_id
    if actual_req_id:
        resp_msg = response_message or "Đã từ chối lời mời"
        update_match_request_status(actual_req_id, "rejected", resp_msg)
        if actual_req_id in IN_MEMORY_MATCH_REQUESTS:
            IN_MEMORY_MATCH_REQUESTS[actual_req_id]["status"] = "rejected"
            IN_MEMORY_MATCH_REQUESTS[actual_req_id]["responseMessage"] = resp_msg

    return {"success": True, "message": "Đã từ chối lời mời ghép đôi", "status": 200}


def breakup_match_service(user_id, partner_id):
    if not user_id:
        return {"error": "Thiếu user_id", "status": 400}

    break_relationship(user_id, partner_id)
    if user_id in IN_MEMORY_USER_RELATIONSHIPS:
        p_id = partner_id or IN_MEMORY_USER_RELATIONSHIPS[user_id].get("partnerId")
        IN_MEMORY_USER_RELATIONSHIPS[user_id]["relationshipStatus"] = "Độc thân"
        IN_MEMORY_USER_RELATIONSHIPS[user_id]["partnerId"] = None
        IN_MEMORY_USER_RELATIONSHIPS[user_id]["matchId"] = None
        if p_id and p_id in IN_MEMORY_USER_RELATIONSHIPS:
            IN_MEMORY_USER_RELATIONSHIPS[p_id]["relationshipStatus"] = "Độc thân"
            IN_MEMORY_USER_RELATIONSHIPS[p_id]["partnerId"] = None
            IN_MEMORY_USER_RELATIONSHIPS[p_id]["matchId"] = None

    if partner_id:
        end_match_requests_between(user_id, partner_id)

    return {"success": True, "message": "Đã hủy ghép đôi và cập nhật trạng thái độc thân", "status": 200}


def check_match_status_service(user_id, target_id):
    if not user_id or not target_id:
        return {"status": "none", "requestId": None, "response_status": 200}

    u_aliases = uid_aliases(user_id) if user_id else [user_id]
    t_aliases = uid_aliases(target_id) if target_id else [target_id]

    req = get_latest_match_request_between(user_id, target_id)
    if req:
        status = req.get("status", "none")
        role = "sender" if req.get("senderId") in u_aliases else "receiver"
        return {
            "status": status,
            "requestId": req.get("requestId"),
            "role": role,
            "senderId": req.get("senderId"),
            "receiverId": req.get("receiverId"),
            "message": req.get("message", ""),
            "response_status": 200
        }

    for r in IN_MEMORY_MATCH_REQUESTS.values():
        s_id = r.get("senderId")
        r_id = r.get("receiverId")
        if (s_id in u_aliases and r_id in t_aliases) or (s_id in t_aliases and r_id in u_aliases):
            return {
                "status": r.get("status", "none"),
                "requestId": r.get("requestId"),
                "role": "sender" if s_id in u_aliases else "receiver",
                "senderId": s_id,
                "receiverId": r_id,
                "message": r.get("message", ""),
                "response_status": 200
            }

    return {"status": "none", "requestId": None, "response_status": 200}


def get_notifications_service(user_id):
    if not user_id:
        return {"success": True, "notifications": [], "status": 200}

    notifs = get_user_notifications(user_id)
    if not notifs:
        from app.repositories.storage_db import uid_aliases
        aliases = uid_aliases(user_id) if user_id else [user_id]
        for a in aliases:
            if a in IN_MEMORY_NOTIFICATIONS and IN_MEMORY_NOTIFICATIONS[a]:
                notifs = IN_MEMORY_NOTIFICATIONS[a]
                break

    return {"success": True, "notifications": notifs or [], "status": 200}


def mark_notifications_read_service(user_id, notif_ids, notif_id):
    ids_to_mark = []
    if notif_id:
        ids_to_mark.append(notif_id)
    if isinstance(notif_ids, list):
        ids_to_mark.extend(notif_ids)

    if user_id and ids_to_mark:
        mark_notifications_read(user_id, ids_to_mark)
        if user_id in IN_MEMORY_NOTIFICATIONS:
            for n in IN_MEMORY_NOTIFICATIONS[user_id]:
                if n.get("id") in ids_to_mark:
                    n["read"] = True

    return {"success": True, "message": "Đã đánh dấu đã đọc", "status": 200}


def delete_notification_service(user_id, notification_id):
    if not notification_id:
        return {"error": "Thiếu notificationId", "status": 400}

    db_delete_notification(user_id, notification_id)
    if user_id and user_id in IN_MEMORY_NOTIFICATIONS:
        IN_MEMORY_NOTIFICATIONS[user_id] = [
            n for n in IN_MEMORY_NOTIFICATIONS[user_id] if n.get("id") != notification_id
        ]

    return {"success": True, "message": "Đã xóa thông báo", "status": 200}


def get_match_requests_service(user_id, req_type):
    if not user_id:
        return {"success": True, "requests": [], "status": 200}

    results = get_user_match_requests(user_id, req_type)
    if not results:
        results = []
        u_aliases = uid_aliases(user_id) if user_id else [user_id]
        for r in IN_MEMORY_MATCH_REQUESTS.values():
            if req_type == "sent" and r.get("senderId") in u_aliases:
                results.append(r)
            elif req_type == "received" and r.get("receiverId") in u_aliases:
                results.append(r)
            elif not req_type and (r.get("senderId") in u_aliases or r.get("receiverId") in u_aliases):
                results.append(r)

    return {"success": True, "requests": results, "status": 200}


def analyze_compatibility_service(data):
    my_uid = data.get("myUid") or data.get("uid1") or data.get("uid", "")
    partner_uid = data.get("partnerUid") or data.get("uid2") or data.get("targetUid", "")

    if not my_uid or not partner_uid:
        return {"error": "Thiếu thông tin UID", "status": 400}

    user1_req = data.get("user1Data") or {}
    user2_req = data.get("user2Data") or {}

    me_raw = user1_req
    if not me_raw:
        me_raw = next((c for c in DEFAULT_MATCH_CANDIDATES if c["uid"] == my_uid), None)

    partner_raw = user2_req
    if not partner_raw:
        partner_raw = next((c for c in DEFAULT_MATCH_CANDIDATES if c["uid"] == partner_uid), None)

    if not me_raw:
        me_raw = {"name": "Bạn", "sun": "Ma Kết", "moon": "Kim Ngưu"}
    if not partner_raw:
        partner_raw = {"name": "Đối phương", "sun": "Bảo Bình", "moon": "Nhân Mã"}

    def extract_info(u):
        return {
            "name": u.get("name", ""),
            "sun": u.get("sun", ""),
            "moon": u.get("moon", ""),
            "mercury": u.get("mercury", ""),
            "venus": u.get("venus", ""),
            "mars": u.get("mars", ""),
            "jupiter": u.get("jupiter", ""),
            "saturn": u.get("saturn", ""),
            "ascendant": u.get("ascendant", ""),
            "descendant": u.get("descendant", ""),
            "mc": u.get("mc", ""),
            "ic": u.get("ic", ""),
        }

    me_info = extract_info(me_raw)
    partner_info = extract_info(partner_raw)
    my_name = me_info.get("name") or "Bạn"
    partner_name = partner_info.get("name") or "Đối phương"
    s1 = me_info.get("sun") or "Ma Kết"
    s2 = partner_info.get("sun") or "Bảo Bình"

    prompt = f"""
    Phân tích tương hợp chi tiết cặp đôi:
    Người 1: {my_name} ({s1}, Mặt Trăng {me_info['moon']}, Mọc {me_info['ascendant']})
    Người 2: {partner_name} ({s2}, Mặt Trăng {partner_info['moon']}, Mọc {partner_info['ascendant']})

    Đánh giá chiêm tinh học sâu sắc, ấm áp, văn phong tiếng Việt chuyên nghiệp:
    1. Tổng quan mối quan hệ
    2. Tương thích cảm xúc
    3. Giao tiếp và tư duy
    4. Tình yêu và lãng mạn
    5. Điểm mạnh và lời khuyên

    SCORES:
    compatibility_score: [số 0-100]
    love_score: [số 0-100]
    trust_score: [số 0-100]
    communication_score: [số 0-100]
    marriage_score: [số 0-100]
    """

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt, request_options={"timeout": 5.0})
        analysis_text = response.text if hasattr(response, "text") else str(response)
        analysis_text = re.sub(r"(```|'''|\"\"\")", "", analysis_text).strip()
    except Exception as gemini_err:
        safe_print("⚠️ Gemini Compatibility Error (fallback):", gemini_err)
        analysis_text = f"""1. Tổng quan về mối quan hệ:
Sự kết hợp giữa {my_name} ({s1}) và {partner_name} ({s2}) tạo nên một liên kết chiêm tinh học vô cùng bền vững và hài hòa. Hai bạn có tiếng nói chung trong quan điểm sống và dễ dàng đồng cảm với nhau.

2. Tương thích cảm xúc & tình yêu:
Năng lượng giữa hai biểu đồ sao mang đến sự ấm áp, tin cậy và gắn kết tự nhiên. Cả hai luôn tôn trọng ranh giới cá nhân và ủng hộ ước mơ của nhau.

3. Lời khuyên nuôi dưỡng mối quan hệ:
Hãy dành cho nhau những khoảng không gian lãng mạn riêng tư và thường xuyên chia sẻ những suy nghĩ nhỏ bé nhất trong cuộc sống hàng ngày.

SCORES:
compatibility_score: 92
love_score: 90
trust_score: 95
communication_score: 88
marriage_score: 93"""

    scores = {
        "compatibility_score": 85,
        "love_score": 85,
        "trust_score": 88,
        "communication_score": 82,
        "marriage_score": 86,
    }
    score_pattern = r"(compatibility_score|love_score|trust_score|communication_score|marriage_score):\s*(\d+)"
    matches = re.findall(score_pattern, analysis_text, re.IGNORECASE)
    for key, value in matches:
        scores[key.lower()] = int(value)

    clean_text = re.sub(r"SCORES:[\s\S]*$", "", analysis_text).strip()
    return {
        "analysis": clean_text,
        "compatibility_score": scores["compatibility_score"],
        "love_score": scores["love_score"],
        "trust_score": scores["trust_score"],
        "communication_score": scores["communication_score"],
        "marriage_score": scores["marriage_score"],
        "scores": {
            "overall": scores["compatibility_score"],
            "love": scores["love_score"],
            "trust": scores["trust_score"],
            "communication": scores["communication_score"],
            "marriage": scores["marriage_score"],
        },
        "cached": False,
        "status": 200
    }


def calculate_love_matching_service(match_type, data):
    valid_types = ["redflag", "greenflag", "karmic", "destiny", "twinflame"]
    if match_type not in valid_types:
        return {"error": "Loại kết nối không hợp lệ", "status": 400}

    uid = data.get("uid") or data.get("userId")
    user_data_req = data.get("userData", {})
    if not uid:
        return {"error": "Thiếu uid", "status": 400}

    my_sign = user_data_req.get("sun") or user_data_req.get("zodiac", "Ma Kết")
    my_gender = user_data_req.get("gender", "")

    me = {
        "uid": uid,
        "name": user_data_req.get("name", "Bạn"),
        "zodiac": my_sign,
        "age": user_data_req.get("age") or 22,
        "element": user_data_req.get("element") or user_data_req.get("mainElement", "Đất"),
        "personality": user_data_req.get("bio") or user_data_req.get("personality", "Kiên định, chân thành"),
    }

    REGISTERED_ACTIVE_USERS[uid] = {
        "uid": uid,
        "name": me["name"],
        "zodiac": my_sign,
        "sun": my_sign,
        "moon": user_data_req.get("moon", "Kim Ngưu"),
        "ascendant": user_data_req.get("ascendant", "Song Tử"),
        "age": me["age"],
        "gender": my_gender,
        "element": me["element"],
        "job": user_data_req.get("job", "Thành viên Resonancia"),
        "avatar": user_data_req.get("avatar", ""),
        "personality": me["personality"],
        "isRealUser": True
    }

    ZODIAC_ORDER = [
        "Bạch Dương", "Kim Ngưu", "Song Tử", "Cự Giải",
        "Sư Tử", "Xử Nữ", "Thiên Bình", "Bọ Cạp",
        "Nhân Mã", "Ma Kết", "Bảo Bình", "Song Ngư"
    ]

    def calculate_synastry(s1, s2, target_tag):
        if s1 not in ZODIAC_ORDER or s2 not in ZODIAC_ORDER:
            return 75, "Năng lượng hai cung hoàng đạo mang lại cơ hội gắn kết.", 75, 75, 75, 75
        i1 = ZODIAC_ORDER.index(s1)
        i2 = ZODIAC_ORDER.index(s2)
        diff = abs(i1 - i2)
        dist = min(diff, 12 - diff)

        if dist == 4:
            base = 95
            reason = f"Góc tam hợp 120° giữa {s1} và {s2} mang lại sự đồng điệu tâm hồn sâu sắc và bình yên tự nhiên."
            love, trust, comm, marr = 96, 95, 93, 94
            suitability = {"greenflag": 100, "twinflame": 95, "destiny": 90, "karmic": 70, "redflag": 40}
        elif dist == 2:
            base = 90
            reason = f"Góc lục hợp 60° giữa {s1} và {s2} kích thích cảm hứng sáng tạo và sự tôn trọng lẫn nhau."
            love, trust, comm, marr = 89, 91, 93, 88
            suitability = {"greenflag": 95, "destiny": 88, "twinflame": 85, "karmic": 75, "redflag": 45}
        elif dist == 6:
            base = 88
            reason = f"Trục đối đỉnh 180° giữa {s1} và {s2} tạo lực hút nam châm mãnh liệt, vừa bù trừ vừa định mệnh."
            love, trust, comm, marr = 93, 82, 85, 90
            suitability = {"destiny": 98, "twinflame": 92, "greenflag": 80, "karmic": 85, "redflag": 65}
        elif dist == 0:
            base = 92
            reason = f"Cùng mang cung {s1}, hai bạn như hai mảnh gương phản chiếu chính xác cảm xúc và suy nghĩ của nhau."
            love, trust, comm, marr = 92, 90, 94, 89
            suitability = {"twinflame": 100, "greenflag": 88, "destiny": 85, "karmic": 78, "redflag": 50}
        elif dist == 3:
            base = 62
            reason = f"Góc vuông 90° giữa {s1} và {s2} tạo ra lực hút bốc đồng ban đầu nhưng đòi hỏi rất nhiều bao dung để hóa giải bất đồng."
            love, trust, comm, marr = 68, 58, 60, 56
            suitability = {"redflag": 100, "karmic": 82, "destiny": 60, "greenflag": 50, "twinflame": 45}
        elif dist == 5:
            base = 78
            reason = f"Góc 150° báo hiệu mối liên kết nghiệp duyên sâu sắc, giúp cả hai đối diện và chữa lành tổn thương nội tâm."
            love, trust, comm, marr = 79, 76, 75, 80
            suitability = {"karmic": 100, "destiny": 82, "redflag": 78, "greenflag": 65, "twinflame": 60}
        else:
            base = 74
            reason = f"Hai cung kề cận mang năng lượng kế thừa bài học cuộc sống, cần thời gian để thấu hiểu sự khác biệt."
            love, trust, comm, marr = 75, 76, 78, 73
            suitability = {"karmic": 88, "greenflag": 72, "redflag": 70, "destiny": 68, "twinflame": 65}

        rank_score = suitability.get(target_tag, base)
        return rank_score, reason, love, trust, comm, marr

    def get_connection_type(s1, s2):
        if s1 not in ZODIAC_ORDER or s2 not in ZODIAC_ORDER:
            return "greenflag"
        i1 = ZODIAC_ORDER.index(s1)
        i2 = ZODIAC_ORDER.index(s2)
        diff = abs(i1 - i2)
        dist = min(diff, 12 - diff)
        if dist in [4, 2]:
            return "greenflag"
        elif dist == 6:
            return "destiny"
        elif dist == 0:
            return "twinflame"
        elif dist == 3:
            return "redflag"
        else:
            return "karmic"

    # Lấy danh sách partner đã kết bạn (accepted) của người dùng hiện tại
    user_aliases = set(uid_aliases(uid) or [uid])
    accepted_partner_map = {}
    try:
        db_reqs = get_user_match_requests(uid, request_type="all")
        for r in db_reqs:
            if r.get("status") == "accepted":
                s_id = r.get("senderId")
                r_id = r.get("receiverId")
                p_id = r_id if s_id in user_aliases else s_id
                if p_id and p_id not in user_aliases:
                    p_name = r.get("receiverName") if s_id in user_aliases else r.get("senderName")
                    p_avt = r.get("senderAvatar") if r_id in user_aliases else ""
                    accepted_partner_map[p_id] = {"name": p_name, "avatar": p_avt}
                    for a in uid_aliases(p_id):
                        accepted_partner_map[a] = {"name": p_name, "avatar": p_avt}
    except Exception as e:
        safe_print(f"[MatchService] Error reading accepted partner requests: {e}")

    try:
        for r in IN_MEMORY_MATCH_REQUESTS.values():
            if r.get("status") == "accepted":
                s_id = r.get("senderId")
                r_id = r.get("receiverId")
                p_id = r_id if s_id in user_aliases else (s_id if r_id in user_aliases else None)
                if p_id and p_id not in user_aliases:
                    p_name = r.get("receiverName") if s_id in user_aliases else r.get("senderName")
                    p_avt = r.get("senderAvatar") if r_id in user_aliases else ""
                    accepted_partner_map[p_id] = {"name": p_name, "avatar": p_avt}
                    for a in uid_aliases(p_id):
                        accepted_partner_map[a] = {"name": p_name, "avatar": p_avt}
    except Exception:
        pass

    all_candidates_pool = list(DEFAULT_MATCH_CANDIDATES)
    for act_uid, act_user in REGISTERED_ACTIVE_USERS.items():
        if act_uid not in user_aliases and act_user.get("name") != me["name"]:
            if not any(c.get("uid") == act_uid for c in all_candidates_pool):
                all_candidates_pool.append(act_user)

    # Đảm bảo các đối tác đã kết bạn nằm trong all_candidates_pool
    for p_uid, p_data in accepted_partner_map.items():
        if p_uid in user_aliases:
            continue
        in_pool = any(c.get("uid") == p_uid or p_uid in uid_aliases(c.get("uid", "")) for c in all_candidates_pool)
        if not in_pool:
            try:
                from app.services.chat_service import KNOWN_USER_INFO, CANONICAL_UID_MAP
                canon = CANONICAL_UID_MAP.get(p_uid, p_uid)
                k_info = KNOWN_USER_INFO.get(canon) or KNOWN_USER_INFO.get(p_uid) or {}
            except Exception:
                k_info = {}
            z_sign = k_info.get("zodiac") or k_info.get("sun") or "Bọ Cạp"
            all_candidates_pool.append({
                "uid": p_uid,
                "name": p_data.get("name") or k_info.get("name", "Người dùng"),
                "zodiac": z_sign,
                "sun": z_sign,
                "moon": "Kim Ngưu",
                "ascendant": "Song Tử",
                "age": 24,
                "gender": "Nam",
                "element": "Nước",
                "job": "Thành viên Resonancia",
                "avatar": p_data.get("avatar") or k_info.get("avatar", ""),
                "personality": "Chân thành, ấm áp, sâu sắc",
                "isRealUser": True
            })

    pool = [c for c in all_candidates_pool if c.get("uid") not in user_aliases and c.get("name") != me["name"]]
    if my_gender in ["Nam", "Nữ"]:
        target_gender = "Nữ" if my_gender == "Nam" else "Nam"
        gender_matches = [c for c in pool if c.get("gender") == target_gender]
        other_matches = [c for c in pool if c.get("gender") != target_gender]
        pool = gender_matches + other_matches

    scored_candidates = []
    seen_cand_uids = set()
    for c in pool:
        cand_uid = c.get("uid", "")
        if cand_uid in seen_cand_uids:
            continue
        for a in uid_aliases(cand_uid):
            seen_cand_uids.add(a)
        seen_cand_uids.add(cand_uid)

        cand_sign = c.get("zodiac") or c.get("sun") or "Bạch Dương"
        score, reason, love, trust, comm, marr = calculate_synastry(my_sign, cand_sign, match_type)

        # Kiểm tra trạng thái đã kết bạn
        is_accepted_friend = cand_uid in accepted_partner_map or any(a in accepted_partner_map for a in uid_aliases(cand_uid))
        primary_type = get_connection_type(my_sign, cand_sign)

        # Nếu đã kết bạn và đúng phân loại kết nối này -> ưu tiên đẩy lên hàng đầu
        is_priority_partner = is_accepted_friend and (primary_type == match_type)
        if is_priority_partner:
            score = 100
            reason = f"Đã kết bạn & ghép đôi thành công! Hai bạn có sự kết nối {match_type.upper()} tự nhiên và đồng điệu."

        scored_candidates.append({
            "candidate": c,
            "score": score,
            "reason": reason,
            "love": love,
            "trust": trust,
            "comm": comm,
            "marr": marr,
            "isMatched": is_accepted_friend,
            "is_priority_partner": is_priority_partner
        })

    # Ưu tiên đẩy partner đã kết bạn thuộc nhóm này lên đầu tiên (index 0)
    scored_candidates.sort(key=lambda x: (1 if x.get("is_priority_partner") else 0, x["score"]), reverse=True)
    selected_pairs = scored_candidates[:12] if len(scored_candidates) >= 12 else scored_candidates

    result = []
    for p in selected_pairs:
        c = p["candidate"]
        score = p["score"]
        level = "high" if score >= 85 else "medium" if score >= 70 else "challenge"
        level_text = "Tương hợp cao" if score >= 85 else "Tương hợp vừa" if score >= 70 else "Thử thách / Khác biệt"
        result.append({
            "uid": c.get("uid", ""),
            "name": c.get("name", "Người dùng"),
            "zodiac": c.get("zodiac", ""),
            "age": c.get("age", 22),
            "gender": c.get("gender", ""),
            "element": c.get("element", "Đất"),
            "job": c.get("job", "Thành viên Resonancia"),
            "personality": c.get("personality", ""),
            "reason": p["reason"],
            "compatibility_score": score,
            "match_level": level,
            "match_level_text": level_text,
            "love": p["love"],
            "trust": p["trust"],
            "communication": p["comm"],
            "marriage": p["marr"],
            "avatar": c.get("avatar", ""),
            "isRealUser": c.get("isRealUser", False),
            "isMatched": p.get("isMatched", False),
            "isFriend": p.get("isMatched", False),
        })

    return {
        "success": True,
        "type": match_type,
        "user_sign": my_sign,
        "total": len(result),
        "users": result,
        "status": 200
    }


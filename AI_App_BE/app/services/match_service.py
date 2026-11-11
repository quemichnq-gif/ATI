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
        break_relationship
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
        break_relationship
    )


def get_user_match_info(uid):
    if not uid:
        return {"name": "Người dùng", "avatar": "", "relationshipStatus": "Độc thân"}
    rel = get_user_relationship(uid)
    if uid in IN_MEMORY_USER_RELATIONSHIPS:
        rel.update(IN_MEMORY_USER_RELATIONSHIPS[uid])
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
    if FIREBASE_AVAILABLE and db is not None:
        try:
            doc = db.collection("users").document(uid).get()
            if doc.exists:
                d = doc.to_dict()
                return {
                    "name": d.get("name") or d.get("fullName", "Người dùng"),
                    "avatar": d.get("avatar", ""),
                    "age": d.get("age", 24),
                    "job": d.get("job") or d.get("occupation", "Thành viên Resonancia"),
                    "partnerId": rel.get("partnerId"),
                    "relationshipStatus": rel.get("relationshipStatus", "Độc thân")
                }
        except Exception:
            pass
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
        if not req:
            req = find_pending_match_request(receiver_id, sender_id)

    if not req and request_id:
        req = IN_MEMORY_MATCH_REQUESTS.get(request_id)
    if not req and sender_id and receiver_id:
        for r in IN_MEMORY_MATCH_REQUESTS.values():
            if (r.get("senderId") == sender_id and r.get("receiverId") == receiver_id) or \
               (r.get("senderId") == receiver_id and r.get("receiverId") == sender_id):
                if r.get("status") == "pending":
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

    sender_info = get_user_match_info(actual_sender)
    s_name = sender_info.get("name") or "Người ấy"
    s_avatar = sender_info.get("avatar") or ""

    receiver_info = get_user_match_info(actual_receiver)
    r_name = receiver_info.get("name") or "Người ấy"
    r_avatar = receiver_info.get("avatar") or ""

    now_iso = datetime.now().isoformat()

    # 1. Thông báo cho người gửi lời mời (Sender): được chấp nhận
    notif_sender_id = f"notif_match_{actual_sender}_{actual_receiver}_{int(datetime.now().timestamp())}"
    notif_sender = {
        "id": notif_sender_id,
        "userId": actual_sender,
        "type": "match_accepted",
        "title": "Kết đôi thành công! ✨",
        "message": f"{r_name} đã chấp nhận lời mời kết đôi của bạn! Hai bạn đã chính thức kết đôi thành công.",
        "body": f"{r_name} đã chấp nhận lời mời kết đôi của bạn! Hai bạn đã chính thức kết đôi thành công.",
        "senderId": actual_receiver,
        "senderName": r_name,
        "senderAvatar": r_avatar,
        "requestId": actual_req_id,
        "read": False,
        "createdAt": now_iso,
    }
    db_create_notification(notif_sender)
    if actual_sender not in IN_MEMORY_NOTIFICATIONS:
        IN_MEMORY_NOTIFICATIONS[actual_sender] = []
    IN_MEMORY_NOTIFICATIONS[actual_sender].insert(0, notif_sender)

    # 2. Thông báo cho người chấp nhận lời mời (Receiver): xác nhận kết đôi
    notif_receiver_id = f"notif_match_{actual_receiver}_{actual_sender}_{int(datetime.now().timestamp())}"
    notif_receiver = {
        "id": notif_receiver_id,
        "userId": actual_receiver,
        "type": "match_accepted",
        "title": "Kết đôi thành công! ✨",
        "message": f"Bạn và {s_name} đã kết đôi thành công! Hãy gửi tin nhắn đầu tiên để cùng kết nối vũ trụ.",
        "body": f"Bạn và {s_name} đã kết đôi thành công! Hãy gửi tin nhắn đầu tiên để cùng kết nối vũ trụ.",
        "senderId": actual_sender,
        "senderName": s_name,
        "senderAvatar": s_avatar,
        "requestId": actual_req_id,
        "read": False,
        "createdAt": now_iso,
    }
    db_create_notification(notif_receiver)
    if actual_receiver not in IN_MEMORY_NOTIFICATIONS:
        IN_MEMORY_NOTIFICATIONS[actual_receiver] = []
    IN_MEMORY_NOTIFICATIONS[actual_receiver].insert(0, notif_receiver)

    if FIREBASE_AVAILABLE and db is not None:
        def sync_fs():
            try:
                db.collection("match_requests").document(actual_req_id).set({
                    "requestId": actual_req_id,
                    "senderId": actual_sender,
                    "receiverId": actual_receiver,
                    "status": "accepted",
                    "responseMessage": resp_msg,
                    "acceptedAt": firestore.SERVER_TIMESTAMP,
                }, merge=True, timeout=2.0)

                db.collection("notifications").document(notif_sender_id).set({
                    **notif_sender,
                    "createdAt": firestore.SERVER_TIMESTAMP,
                }, merge=True, timeout=2.0)
                db.collection("notifications").document(notif_receiver_id).set({
                    **notif_receiver,
                    "createdAt": firestore.SERVER_TIMESTAMP,
                }, merge=True, timeout=2.0)
            except Exception as fe:
                safe_print("⚠️ Firestore sync accept warning:", fe)
        threading.Thread(target=sync_fs, daemon=True).start()

    return {
        "success": True,
        "message": "Đã chấp nhận lời mời ghép đôi thành công",
        "status": 200
    }


def reject_match_request_service(request_id, receiver_id, response_message):
    req = get_match_request_by_id(request_id) if request_id else None
    if not req and request_id in IN_MEMORY_MATCH_REQUESTS:
        req = IN_MEMORY_MATCH_REQUESTS[request_id]

    if req:
        resp_msg = response_message or "Đã từ chối lời mời"
        update_match_request_status(request_id, "rejected", resp_msg)
        if request_id in IN_MEMORY_MATCH_REQUESTS:
            IN_MEMORY_MATCH_REQUESTS[request_id]["status"] = "rejected"
            IN_MEMORY_MATCH_REQUESTS[request_id]["responseMessage"] = resp_msg

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

    req = get_latest_match_request_between(user_id, target_id)
    if req:
        status = req.get("status", "none")
        role = "sender" if req.get("senderId") == user_id else "receiver"
        return {
            "status": status,
            "requestId": req.get("requestId"),
            "role": role,
            "message": req.get("message", ""),
            "response_status": 200
        }

    for r in IN_MEMORY_MATCH_REQUESTS.values():
        if (r.get("senderId") == user_id and r.get("receiverId") == target_id) or \
           (r.get("senderId") == target_id and r.get("receiverId") == user_id):
            return {
                "status": r.get("status", "none"),
                "requestId": r.get("requestId"),
                "role": "sender" if r.get("senderId") == user_id else "receiver",
                "message": r.get("message", ""),
                "response_status": 200
            }

    if FIREBASE_AVAILABLE and db is not None:
        try:
            req_id_1 = f"{user_id}_{target_id}"
            req_id_2 = f"{target_id}_{user_id}"
            doc1 = db.collection("match_requests").document(req_id_1).get(timeout=1.5)
            if doc1.exists:
                d = doc1.to_dict()
                st = d.get("status", "none")
                return {
                    "status": st,
                    "requestId": req_id_1,
                    "role": "sender",
                    "message": d.get("message", ""),
                    "response_status": 200
                }
            doc2 = db.collection("match_requests").document(req_id_2).get(timeout=1.5)
            if doc2.exists:
                d = doc2.to_dict()
                st = d.get("status", "none")
                return {
                    "status": st,
                    "requestId": req_id_2,
                    "role": "receiver",
                    "message": d.get("message", ""),
                    "response_status": 200
                }
        except Exception:
            pass

    return {"status": "none", "requestId": None, "response_status": 200}


def get_notifications_service(user_id):
    if not user_id:
        return {"success": True, "notifications": [], "status": 200}

    notifs = get_user_notifications(user_id) or []
    from app.repositories.storage_db import uid_aliases
    aliases = uid_aliases(user_id) if user_id else [user_id]
    existing_ids = {n.get("id") for n in notifs if n.get("id")}

    for a in aliases:
        if a in IN_MEMORY_NOTIFICATIONS and IN_MEMORY_NOTIFICATIONS[a]:
            for mem_notif in IN_MEMORY_NOTIFICATIONS[a]:
                mid = mem_notif.get("id")
                if mid and mid not in existing_ids:
                    notifs.append(mem_notif)
                    existing_ids.add(mid)

    if FIREBASE_AVAILABLE and db is not None:
        try:
            fs_stream = db.collection("notifications").where("userId", "in", aliases[:10]).limit(30).stream(timeout=1.5)
            for doc in fs_stream:
                d = doc.to_dict()
                d["id"] = doc.id
                if d["id"] not in existing_ids:
                    notifs.append(d)
                    existing_ids.add(d["id"])
                else:
                    # Giữ nguyên read: True nếu một trong hai nguồn đã đánh dấu đã đọc
                    for ex in notifs:
                        if ex.get("id") == d["id"]:
                            if ex.get("read") or d.get("read"):
                                ex["read"] = True
                                d["read"] = True
                            break
        except Exception:
            pass

    notifs.sort(key=lambda x: str(x.get("createdAt") or x.get("created_at") or ""), reverse=True)
    return {"success": True, "notifications": notifs, "status": 200}


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

        if FIREBASE_AVAILABLE and db is not None:
            def sync_fs():
                try:
                    for nid in ids_to_mark:
                        db.collection("notifications").document(nid).set({"read": True}, merge=True, timeout=1.5)
                except Exception as fe:
                    safe_print("⚠️ Firestore sync mark read warning:", fe)
            threading.Thread(target=sync_fs, daemon=True).start()

    return {"success": True, "message": "Đã đánh dấu đã đọc", "status": 200}


def delete_notification_service(user_id, notification_id):
    if not notification_id:
        return {"error": "Thiếu notificationId", "status": 400}

    db_delete_notification(user_id, notification_id)
    if user_id and user_id in IN_MEMORY_NOTIFICATIONS:
        IN_MEMORY_NOTIFICATIONS[user_id] = [
            n for n in IN_MEMORY_NOTIFICATIONS[user_id] if n.get("id") != notification_id
        ]

    if FIREBASE_AVAILABLE and db is not None:
        def sync_fs():
            try:
                db.collection("notifications").document(notification_id).delete(timeout=1.5)
            except Exception as fe:
                safe_print("⚠️ Firestore sync delete notif warning:", fe)
        threading.Thread(target=sync_fs, daemon=True).start()

    return {"success": True, "message": "Đã xóa thông báo", "status": 200}


def get_match_requests_service(user_id, req_type):
    if not user_id:
        return {"success": True, "requests": [], "status": 200}

    results = get_user_match_requests(user_id, req_type)
    if not results:
        results = []
        for r in IN_MEMORY_MATCH_REQUESTS.values():
            if req_type == "sent" and r.get("senderId") == user_id:
                results.append(r)
            elif req_type == "received" and r.get("receiverId") == user_id:
                results.append(r)
            elif not req_type and (r.get("senderId") == user_id or r.get("receiverId") == user_id):
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

    ELEMENT_MAP = {
        "Bạch Dương": "Lửa", "Sư Tử": "Lửa", "Nhân Mã": "Lửa",
        "Kim Ngưu": "Đất", "Xử Nữ": "Đất", "Ma Kết": "Đất",
        "Song Tử": "Khí", "Thiên Bình": "Khí", "Bảo Bình": "Khí",
        "Cự Giải": "Nước", "Bọ Cạp": "Nước", "Song Ngư": "Nước"
    }

    def get_element_synergy(e1, e2):
        if e1 == "Nước" and e2 == "Đất":
            return "Nước × Đất · Tương Sinh Màu Mỡ", "Đất tạo bến đỗ an toàn, Nước tưới mát nuôi dưỡng tâm hồn."
        if e1 == "Đất" and e2 == "Nước":
            return "Đất × Nước · Tương Sinh Nuôi Dưỡng", "Nước mang đến sự dịu dàng, Đất là điểm tựa thực tế vững vàng."
        if e1 == "Lửa" and e2 == "Khí":
            return "Lửa × Khí · Thổi Bùng Đam Mê", "Khí tiếp thêm cảm hứng cho Lửa, Lửa sưởi ấm hoài bão của Khí."
        if e1 == "Khí" and e2 == "Lửa":
            return "Khí × Lửa · Cảm Hứng Vô Tận", "Lửa thắp sáng nhiệt huyết, Khí chắp cánh cho đam mê bay xa."
        if e1 == "Nước" and e2 == "Nước":
            return "Nước × Nước · Đại Dương Thấu Cảm", "Đồng điệu cảm xúc tuyệt đối, trực giác hòa quyện không cần lời nói."
        if e1 == "Đất" and e2 == "Đất":
            return "Đất × Đất · Thành Trì Vững Chãi", "Chung thủy, kiên định và luôn cùng nhìn về một tương lai bền chặt."
        if e1 == "Lửa" and e2 == "Lửa":
            return "Lửa × Lửa · Ngọn Lửa Cuồng Nhiệt", "Nhiệt huyết và đam mê bùng nổ, luôn cùng nhau tiến về phía trước."
        if e1 == "Khí" and e2 == "Khí":
            return "Khí × Khí · Bầu Trời Tự Do", "Đôi tri kỷ trí tuệ, những cuộc trò chuyện bất tận không bao giờ cạn."
        if (e1 == "Lửa" and e2 == "Nước") or (e1 == "Nước" and e2 == "Lửa"):
            return "Lửa × Nước · Sóng Lửa Mãnh Liệt", "Sức hút đối lập cuốn hút nhưng cần sự dịu dàng để hóa giải va chạm."
        if (e1 == "Đất" and e2 == "Khí") or (e1 == "Khí" and e2 == "Đất"):
            return "Đất × Khí · Cánh Diều & Bến Đỗ", "Khí mang đến ý tưởng mới, Đất giúp tiếp đất thực tế; cần kiên nhẫn dung hòa."
        return f"{e1} × {e2} · Bù Trừ Năng Lượng", "Sự khác biệt nguyên tố là mảnh ghép mở rộng thế giới quan cho cả hai."

    def calculate_synastry(s1, s2, target_tag, cand_moon=""):
        if s1 not in ZODIAC_ORDER or s2 not in ZODIAC_ORDER:
            return 75, "Năng lượng hai cung hoàng đạo mang lại cơ hội gắn kết.", 75, 75, 75, 75, "Lục Hợp 60° (Sextile)", "Góc chiếu hòa ái", "Tương Sinh", "Hòa hợp tự nhiên", "Cởi mở và tôn trọng", "Hãy cùng nhau trải nghiệm"
        i1 = ZODIAC_ORDER.index(s1)
        i2 = ZODIAC_ORDER.index(s2)
        diff = abs(i1 - i2)
        dist = min(diff, 12 - diff)

        elem1 = ELEMENT_MAP.get(s1, "Đất")
        elem2 = ELEMENT_MAP.get(s2, "Đất")
        elem_synergy, elem_detail = get_element_synergy(elem1, elem2)

        if dist == 4:
            base = 96
            aspect_name = "Tam Hợp 120° (Trine)"
            aspect_detail = f"Cùng mang nguyên tố {elem1}, hai bạn có sự đồng điệu tâm hồn sâu sắc và bình yên tự nhiên."
            love, trust, comm, marr = 97, 96, 94, 95
            suitability = {"greenflag": 98, "twinflame": 95, "destiny": 91, "karmic": 72, "redflag": 38}
            highlight = "Sự đồng điệu sâu sắc trong nhân sinh quan và cảm xúc."
            advice = "Hãy trân trọng dòng chảy hòa hợp tự nhiên và tạo dựng mái ấm vững vàng."
        elif dist == 2:
            base = 90
            aspect_name = "Lục Hợp 60° (Sextile)"
            aspect_detail = f"Nguyên tố {elem1} và {elem2} tương sinh kích thích cảm hứng sáng tạo và sự tôn trọng lẫn nhau."
            love, trust, comm, marr = 91, 93, 94, 89
            suitability = {"greenflag": 95, "destiny": 90, "twinflame": 88, "karmic": 75, "redflag": 44}
            highlight = "Khả năng chia sẻ mọi điều trong cuộc sống một cách thoải mái."
            advice = "Duy trì các buổi trò chuyện sâu sắc và các chuyến đi ngắn cùng nhau."
        elif dist == 6:
            base = 89
            aspect_name = "Đối Đỉnh 180° (Opposition)"
            aspect_detail = f"Trục đối xứng 180° giữa {s1} và {s2} tạo lực hút nam châm mãnh liệt, vừa bù trừ vừa định mệnh."
            love, trust, comm, marr = 95, 84, 86, 92
            suitability = {"destiny": 99, "twinflame": 93, "greenflag": 82, "karmic": 86, "redflag": 68}
            highlight = "Sức hút đối lập khó cưỡng và sự bù trừ phẩm chất hoàn hảo."
            advice = "Học cách nhìn nhận góc nhìn của đối phương như một món quà bổ khuyết."
        elif dist == 0:
            base = 93
            aspect_name = "Trùng Tụ 0° (Conjunction)"
            aspect_detail = f"Cùng mang cung {s1}, hai bạn như hai mảnh gương phản chiếu chính xác cảm xúc và suy nghĩ của nhau."
            love, trust, comm, marr = 93, 92, 96, 90
            suitability = {"twinflame": 100, "greenflag": 90, "destiny": 87, "karmic": 80, "redflag": 50}
            highlight = "Trực giác thấu suốt tâm can, không cần lời nói cũng hiểu ý đối phương."
            advice = "Dành cho nhau không gian riêng để không bị cuốn vào sự phản chiếu quá mức."
        elif dist == 3:
            base = 65
            aspect_name = "Vuông Góc 90° (Square)"
            aspect_detail = f"Góc vuông 90° giữa {s1} và {s2} tạo ra lực hút bốc đồng ban đầu nhưng đòi hỏi rất nhiều bao dung để hóa giải bất đồng."
            love, trust, comm, marr = 75, 62, 64, 60
            suitability = {"redflag": 98, "karmic": 86, "destiny": 64, "greenflag": 52, "twinflame": 46}
            highlight = "Lực hút mãnh liệt từ những khác biệt sâu sắc trong tính cách."
            advice = "Hạ cái tôi xuống và lắng nghe mà không phán xét trong những lúc bất đồng."
        elif dist == 5:
            base = 79
            aspect_name = "Bất Tương Hợp 150° (Quincunx)"
            aspect_detail = f"Góc 150° báo hiệu mối liên kết nghiệp duyên sâu sắc, giúp cả hai đối diện và chữa lành tổn thương nội tâm."
            love, trust, comm, marr = 82, 78, 77, 83
            suitability = {"karmic": 99, "destiny": 85, "redflag": 76, "greenflag": 68, "twinflame": 64}
            highlight = "Mối liên kết tâm hồn kỳ lạ, như đã từng gắn bó từ tiền kiếp."
            advice = "Kiên nhẫn điều chỉnh thói quen và đón nhận những thay đổi tích cực."
        else:
            base = 75
            aspect_name = "Bán Lục Hợp 30° (Semi-sextile)"
            aspect_detail = f"Hai cung kề cận mang năng lượng kế thừa bài học cuộc sống, cần thời gian để thấu hiểu sự khác biệt."
            love, trust, comm, marr = 77, 78, 80, 75
            suitability = {"karmic": 88, "greenflag": 75, "redflag": 70, "destiny": 70, "twinflame": 65}
            highlight = "Sự tò mò lành mạnh về thế giới quan mới mẻ của đối phương."
            advice = "Tôn trọng nhịp điệu sinh hoạt và cách bộc lộ cảm xúc riêng của mỗi người."

        rank_score = suitability.get(target_tag, base)
        reason = f"{aspect_name} mang lại sự gắn kết đặc biệt giữa {s1} và {s2}. Mối liên kết {elem_synergy} giúp cả hai tìm thấy sự thấu hiểu và hòa hợp."
        return rank_score, reason, love, trust, comm, marr, aspect_name, aspect_detail, elem_synergy, elem_detail, highlight, advice

    all_candidates_pool = list(DEFAULT_MATCH_CANDIDATES)
    for act_uid, act_user in REGISTERED_ACTIVE_USERS.items():
        if act_uid != uid and act_user.get("name") != me["name"]:
            if not any(c.get("uid") == act_uid for c in all_candidates_pool):
                all_candidates_pool.append(act_user)

    pool = [c for c in all_candidates_pool if c.get("uid") != uid and c.get("name") != me["name"]]
    if my_gender in ["Nam", "Nữ"]:
        target_gender = "Nữ" if my_gender == "Nam" else "Nam"
        gender_matches = [c for c in pool if c.get("gender") == target_gender]
        other_matches = [c for c in pool if c.get("gender") != target_gender]
        pool = gender_matches + other_matches

    scored_candidates = []
    for c in pool:
        cand_sign = c.get("zodiac") or c.get("sun") or "Bạch Dương"
        score, reason, love, trust, comm, marr, asp_name, asp_detail, el_syn, el_det, hl, adv = calculate_synastry(my_sign, cand_sign, match_type, c.get("moon", ""))
        scored_candidates.append({
            "candidate": c,
            "score": score,
            "reason": reason,
            "love": love,
            "trust": trust,
            "comm": comm,
            "marr": marr,
            "aspect_name": asp_name,
            "aspect_detail": asp_detail,
            "element_synergy": el_syn,
            "element_detail": el_det,
            "highlight": hl,
            "advice": adv
        })

    scored_candidates.sort(key=lambda x: x["score"], reverse=True)
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
            "sun": c.get("sun") or c.get("zodiac", ""),
            "moon": c.get("moon", "Kim Ngưu"),
            "ascendant": c.get("ascendant", ""),
            "age": c.get("age", 22),
            "gender": c.get("gender", ""),
            "element": c.get("element", "Đất"),
            "job": c.get("job", "Thành viên Resonancia"),
            "personality": c.get("personality", ""),
            "reason": p["reason"],
            "compatibility_score": score,
            "match_level": level,
            "match_level_text": level_text,
            "aspect_name": p["aspect_name"],
            "aspect_detail": p["aspect_detail"],
            "element_synergy": p["element_synergy"],
            "element_detail": p["element_detail"],
            "breakdown": {
                "love": p["love"],
                "trust": p["trust"],
                "communication": p["comm"],
                "commitment": p["marr"]
            },
            "love": p["love"],
            "trust": p["trust"],
            "communication": p["comm"],
            "marriage": p["marr"],
            "highlight": p["highlight"],
            "advice": p["advice"],
            "avatar": c.get("avatar", ""),
            "isRealUser": c.get("isRealUser", False)
        })

    return {
        "success": True,
        "type": match_type,
        "user_sign": my_sign,
        "total": len(result),
        "users": result,
        "status": 200
    }


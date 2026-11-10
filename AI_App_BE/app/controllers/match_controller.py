# -*- coding: utf-8 -*-
from flask import Blueprint, request, jsonify, g
from app.services.match_service import (
    send_match_request_service,
    accept_match_request_service,
    reject_match_request_service,
    breakup_match_service,
    check_match_status_service,
    get_notifications_service,
    mark_notifications_read_service,
    delete_notification_service,
    get_match_requests_service,
    analyze_compatibility_service,
    calculate_love_matching_service
)

match_bp = Blueprint("match", __name__)


@match_bp.route("/send-match-request", methods=["POST"])
def send_match_request():
    data = request.get_json(silent=True) or {}
    auth_uid = getattr(g, "firebase_user", {}).get("uid") if hasattr(g, "firebase_user") and g.firebase_user else None
    sender_id = data.get("senderId") or auth_uid
    receiver_id = data.get("receiverId")
    message = data.get("message", "")
    sender_name = data.get("senderName")
    sender_avatar = data.get("senderAvatar")
    receiver_name = data.get("receiverName")

    res = send_match_request_service(sender_id, receiver_id, message, sender_name, sender_avatar, receiver_name)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@match_bp.route("/accept-match-request", methods=["POST"])
def accept_match_request():
    data = request.get_json(silent=True) or {}
    request_id = data.get("requestId")
    receiver_id = data.get("receiverId") or getattr(g, "firebase_user", {}).get("uid")
    sender_id = data.get("senderId")
    response_message = data.get("responseMessage", "")

    res = accept_match_request_service(request_id, receiver_id, sender_id, response_message)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@match_bp.route("/reject-match-request", methods=["POST"])
def reject_match_request():
    data = request.get_json(silent=True) or {}
    request_id = data.get("requestId")
    receiver_id = data.get("receiverId") or getattr(g, "firebase_user", {}).get("uid")
    response_message = data.get("responseMessage", "")

    res = reject_match_request_service(request_id, receiver_id, response_message)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@match_bp.route("/breakup", methods=["POST"])
def breakup():
    data = request.get_json(silent=True) or {}
    user_id = data.get("userId") or getattr(g, "firebase_user", {}).get("uid")
    partner_id = data.get("partnerId")

    res = breakup_match_service(user_id, partner_id)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@match_bp.route("/check-match-status", methods=["GET"])
def check_match_status():
    user_id = request.args.get("userId") or request.args.get("uid1") or getattr(g, "firebase_user", {}).get("uid")
    target_id = request.args.get("targetId") or request.args.get("uid2")

    res = check_match_status_service(user_id, target_id)
    status_code = res.pop("response_status", 200)
    return jsonify(res), status_code


@match_bp.route("/get-notifications", methods=["GET"])
def get_notifications():
    user_id = request.args.get("userId") or request.args.get("uid") or getattr(g, "firebase_user", {}).get("uid")
    res = get_notifications_service(user_id)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@match_bp.route("/mark-notification-read", methods=["POST"])
def mark_notification_read():
    data = request.get_json(silent=True) or {}
    user_id = data.get("userId") or getattr(g, "firebase_user", {}).get("uid")
    notif_ids = data.get("notificationIds")
    notif_id = data.get("notificationId")

    res = mark_notifications_read_service(user_id, notif_ids, notif_id)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@match_bp.route("/delete-notification", methods=["POST"])
def delete_notification():
    data = request.get_json(silent=True) or {}
    user_id = data.get("userId") or getattr(g, "firebase_user", {}).get("uid")
    notification_id = data.get("notificationId")

    res = delete_notification_service(user_id, notification_id)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@match_bp.route("/get-match-requests", methods=["GET"])
def get_match_requests():
    user_id = request.args.get("userId") or request.args.get("uid") or getattr(g, "firebase_user", {}).get("uid")
    req_type = request.args.get("type", "")

    res = get_match_requests_service(user_id, req_type)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@match_bp.route("/compatibility-analysis", methods=["POST"])
def compatibility_analysis():
    data = request.get_json(silent=True) or {}
    res = analyze_compatibility_service(data)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@match_bp.route("/love-matching/<match_type>", methods=["POST"])
def love_matching_single(match_type):
    data = request.get_json(silent=True) or {}
    res = calculate_love_matching_service(match_type, data)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@match_bp.route("/love-matching/history/<uid>/<match_type>", methods=["GET"])
def get_matching_history(uid, match_type):
    return jsonify({
        "success": True,
        "cached": False,
        "users": []
    }), 200


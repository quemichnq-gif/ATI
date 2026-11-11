# -*- coding: utf-8 -*-
from flask import Blueprint, request, jsonify, g
from app.services.chat_service import (
    create_or_update_chat,
    send_chat_message,
    get_chat_messages,
    get_chat_list,
    delete_chat
)

chat_bp = Blueprint("chat", __name__)


def authenticated_uid():
    user = getattr(g, "firebase_user", None) or {}
    return user.get("uid", "")


@chat_bp.route("/api/chat/init", methods=["POST"])
def init_chat():
    data = request.get_json(silent=True) or {}
    chat_id = data.get("chatId")
    participants = data.get("participants", [])
    names = data.get("participantNames", {})
    avatars = data.get("participantAvatars", {})
    last_msg = data.get("lastMessage", "Đã bắt đầu cuộc trò chuyện ✨")
    uid = authenticated_uid()

    res = create_or_update_chat(chat_id, participants, names, avatars, last_msg, uid)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@chat_bp.route("/api/chat/send", methods=["POST"])
def send_message():
    data = request.get_json(silent=True) or {}
    chat_id = data.get("chatId")
    sender_id = data.get("senderId")
    sender_name = data.get("senderName", "Người dùng")
    sender_avatar = data.get("senderAvatar", "")
    text = (data.get("text") or "").strip()
    msg_type = data.get("type", "text")
    file_url = data.get("fileUrl")
    file_name = data.get("fileName")
    file_size = data.get("fileSize")
    uid = authenticated_uid()

    res = send_chat_message(chat_id, sender_id, sender_name, sender_avatar, text, msg_type, file_url, file_name, file_size, uid)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@chat_bp.route("/api/chat/messages/<path:chat_id>", methods=["GET"])
def get_messages(chat_id):
    since = request.args.get("since", 0, type=int)
    uid = authenticated_uid()
    res = get_chat_messages(chat_id, since, uid)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@chat_bp.route("/api/chat/list", methods=["GET"])
def get_conversations():
    user_id = request.args.get("userId", "")
    res = get_chat_list(user_id)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@chat_bp.route("/api/chat/<path:chat_id>", methods=["DELETE"])
def delete_conversation(chat_id):
    uid = authenticated_uid()
    res = delete_chat(chat_id, uid)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code



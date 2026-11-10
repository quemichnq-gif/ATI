# -*- coding: utf-8 -*-
from flask import Blueprint, request, jsonify, g
from app.services.auth_service import (
    verify_user_password,
    update_user_profile,
    upload_user_image,
    delete_user_image
)

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "online",
        "service": "Resonancia AI Astrology & Matchmaking API",
        "version": "1.0.0"
    }), 200


@auth_bp.route("/verify-password", methods=["POST"])
def verify_password():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")
    auth_user = getattr(g, "firebase_user", {}) or {}
    res = verify_user_password(email, password, auth_user)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@auth_bp.route("/update-profile", methods=["POST"])
def update_profile():
    data = request.get_json(silent=True) or {}
    uid = data.get("uid")
    fields = data.get("fields", {})
    res = update_user_profile(uid, fields)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@auth_bp.route("/upload-image", methods=["POST"])
def upload_image():
    data = request.get_json(silent=True) or {}
    uid = data.get("uid") or data.get("userId")
    image_type = data.get("imageType", "avatar")
    image_data = data.get("imageData") or data.get("imageBase64") or data.get("image")
    res = upload_user_image(uid, image_type, image_data)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@auth_bp.route("/delete-image", methods=["POST"])
def delete_image():
    data = request.get_json(silent=True) or {}
    uid = data.get("uid")
    image_type = data.get("imageType")
    image_url = data.get("imageUrl")
    res = delete_user_image(uid, image_type, image_url)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


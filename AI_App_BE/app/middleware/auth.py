# -*- coding: utf-8 -*-
from flask import request, jsonify, g
import requests
from firebase_admin import auth
from app.config import FIREBASE_AVAILABLE, FIREBASE_API_KEY


def authenticate_api_request():
    """Require a valid Firebase ID token on every application API route."""
    if request.method == "OPTIONS" or request.endpoint in ("auth.home", "astrology.astrology_chat", "home", "astrology_chat"):
        return None

    auth_header = request.headers.get("Authorization", "")
    scheme, _, token = auth_header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return jsonify({"error": "Authentication required"}), 401

    if FIREBASE_AVAILABLE:
        try:
            g.firebase_user = auth.verify_id_token(token.strip())
        except Exception:
            return jsonify({"error": "Invalid or expired authentication token"}), 401
    elif FIREBASE_API_KEY:
        try:
            response = requests.post(
                f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={FIREBASE_API_KEY}",
                json={"idToken": token.strip()},
                timeout=8,
            )
            if response.status_code != 200:
                return jsonify({"error": "Invalid or expired authentication token"}), 401
            firebase_users = response.json().get("users", [])
            if not firebase_users or not firebase_users[0].get("localId"):
                return jsonify({"error": "Invalid or expired authentication token"}), 401
            g.firebase_user = {
                "uid": firebase_users[0]["localId"],
                "email": firebase_users[0].get("email", "")
            }
        except requests.RequestException:
            return jsonify({"error": "Authentication service temporarily unavailable"}), 503
    else:
        return jsonify({"error": "Authentication is not configured on the server"}), 503

    user_uid = g.firebase_user.get("uid")
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        body = {}
    view_args = request.view_args or {}
    requested_uids = (
        body.get("uid"),
        request.args.get("uid"),
        view_args.get("uid"),
        body.get("userId"),
        request.args.get("userId"),
        body.get("senderId"),
    )
    if any(uid and uid != user_uid for uid in requested_uids):
        return jsonify({"error": "User does not have access to this resource"}), 403

    return None


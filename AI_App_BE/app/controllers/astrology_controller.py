# -*- coding: utf-8 -*-
from flask import Blueprint, request, jsonify
from app.services.astrology_service import (
    proxy_astrology_call,
    process_astrology_chat,
    generate_prediction_content,
    analyze_natal_chart
)

astrology_bp = Blueprint("astrology", __name__)


@astrology_bp.route("/astrology/<endpoint>", methods=["POST"])
def astrology_proxy(endpoint):
    payload = request.get_json(silent=True) or {}
    res = proxy_astrology_call(endpoint, payload)
    status_code = res.pop("status", 200)
    data = res.pop("data", None)
    if data is not None:
        return jsonify(data), status_code
    return jsonify(res), status_code


@astrology_bp.route("/astrology-chat", methods=["POST"])
def astrology_chat():
    data = request.get_json(silent=True) or {}
    messages = data.get("messages")
    user_data = data.get("userData") or {}
    res = process_astrology_chat(messages, user_data)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@astrology_bp.route("/generate", methods=["POST"])
def generate_prediction():
    data = request.get_json(silent=True) or {}
    res = generate_prediction_content(data)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


@astrology_bp.route("/natal-analysis", methods=["POST"])
def natal_chart_analysis():
    data = request.get_json(silent=True) or {}
    res = analyze_natal_chart(data)
    status_code = res.pop("status", 200)
    return jsonify(res), status_code


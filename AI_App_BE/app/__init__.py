# -*- coding: utf-8 -*-
from flask import Flask
from flask_cors import CORS
from app.config import (
    GEMINI_API_KEY,
    FIREBASE_AVAILABLE,
    ASTROLOGY_API_KEY,
    GEMINI_MODEL
)
from app.middleware.auth import authenticate_api_request
from app.controllers.auth_controller import auth_bp
from app.controllers.chat_controller import chat_bp
from app.controllers.astrology_controller import astrology_bp
from app.controllers.match_controller import match_bp


def create_app():
    """Application Factory for Resonancia Backend"""
    app = Flask(__name__)
    app.config["JSON_AS_ASCII"] = False

    # Enable CORS
    CORS(app)

    # Register Global Auth Middleware
    app.before_request(authenticate_api_request)

    # Register Blueprints / Controllers
    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(astrology_bp)
    app.register_blueprint(match_bp)

    return app


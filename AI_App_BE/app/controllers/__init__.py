# -*- coding: utf-8 -*-
from app.controllers.auth_controller import auth_bp
from app.controllers.chat_controller import chat_bp
from app.controllers.astrology_controller import astrology_bp
from app.controllers.match_controller import match_bp

__all__ = ["auth_bp", "chat_bp", "astrology_bp", "match_bp"]


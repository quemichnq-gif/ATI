# -*- coding: utf-8 -*-
from app.services.auth_service import verify_user_password, update_user_profile, upload_user_image, delete_user_image
from app.services.chat_service import create_or_update_chat, send_chat_message, get_chat_messages, get_chat_list
from app.services.astrology_service import proxy_astrology_call, process_astrology_chat, generate_prediction_content, analyze_natal_chart
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


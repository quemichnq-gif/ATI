# -*- coding: utf-8 -*-
"""
Tests for Intent Router & Navigation Registry
Verifies all required cases in Section 4 of Task specification.
"""

import os
import sys
import pytest

# Add backend directory to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "AI_App_BE"))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from intent_router import route_intent
from navigation import NAVIGATION_REGISTRY, VALID_ROUTES

# ==============================================================================
# 1. NAVIGATION TESTS
# ==============================================================================

@pytest.mark.parametrize("query,expected_route", [
    ("Mở tarot", "/tarot"),
    ("Tôi muốn xem Tarot", "/tarot"),
    ("XEM LA SO", "/natal"),
    ("Ok, mở Tarot cho tôi", "/tarot"),
    ("Cảm ơn, cho tôi xem lá số", "/natal"),
    ("Tôi muốn cập nhật ngày sinh", "/profile"),
    ("Tôi muốn nhập thông tin người yêu", "/synastry"),
])
def test_navigation_cases(query, expected_route):
    res = route_intent(query, user_name="Quang")
    assert res["intent"] == "navigation", f"Failed intent for: {query}"
    assert res["should_call_gemini"] is False
    assert len(res["actions"]) > 0
    assert res["actions"][0]["route"] == expected_route
    assert res["actions"][0]["route"] in VALID_ROUTES

def test_multi_destination_navigation():
    query = "Xem lá số và tarot"
    res = route_intent(query, user_name="Quang")
    assert res["intent"] == "navigation"
    assert len(res["actions"]) == 2
    routes = [a["route"] for a in res["actions"]]
    assert "/natal" in routes
    assert "/tarot" in routes

def test_mixed_intent_form_help():
    query = "Muốn xem lá số nhưng chưa biết nhập gì"
    res = route_intent(query, user_name="Quang")
    assert res["intent"] == "navigation"
    assert "Họ và tên" in res["direct_response"]
    assert "Giờ sinh" in res["direct_response"]
    assert "Nơi sinh" in res["direct_response"]
    assert len(res["actions"]) >= 1
    assert res["actions"][0]["route"] in VALID_ROUTES

def test_unknown_page_navigation():
    query = "Mở trang abc"
    res = route_intent(query, user_name="Quang")
    assert res["intent"] == "navigation"
    # Không được bịa route /abc
    for a in res["actions"]:
        assert a["route"] != "/abc"
        assert a["route"] in VALID_ROUTES
    assert "Resonancia hiện chưa có chức năng 'abc'" in res["direct_response"]

# ==============================================================================
# 2. SMALL TALK TESTS
# ==============================================================================

@pytest.mark.parametrize("query", [
    "Chào",
    "xin chào bạn",
    "Cảm ơn nha",
    "thanks",
    "tạm biệt",
    "bạn là ai",
])
def test_small_talk_cases(query):
    res = route_intent(query, user_name="Quang")
    assert res["intent"] == "small_talk", f"Expected small_talk for: {query}"
    assert res["should_call_gemini"] is False
    assert bool(res["direct_response"])

# ==============================================================================
# 3. UNSUPPORTED TESTS
# ==============================================================================

@pytest.mark.parametrize("query", [
    "Viết giúp tôi code Python",
    "Giải bài tập toán này với",
    "Dịch hộ tôi đoạn văn tiếng anh sang tiếng việt",
])
def test_unsupported_cases(query):
    res = route_intent(query, user_name="Quang")
    assert res["intent"] == "unsupported", f"Expected unsupported for: {query}"
    assert res["should_call_gemini"] is False
    assert "nằm ngoài phạm vi chiêm tinh" in res["direct_response"]

# ==============================================================================
# 4. KNOWLEDGE TESTS
# ==============================================================================

@pytest.mark.parametrize("query", [
    "Tarot là gì?",
    "Nhà 7 nghĩa là gì?",
    "Bọ Cạp tính cách thế nào?",
    "Lá số của tôi nói gì về tình yêu?",
])
def test_knowledge_cases(query):
    res = route_intent(query, user_name="Quang")
    assert res["intent"] == "knowledge", f"Expected knowledge for: {query}"
    assert res["should_call_gemini"] is True

# ==============================================================================
# 5. CONTEXTUAL CONTINUATION TESTS
# ==============================================================================

def test_contextual_continuation():
    history = [
        {"role": "user", "content": "Song Tử có tính cách thế nào?"},
        {"role": "assistant", "content": "Song Tử là cung Khí thông minh, nhanh nhẹn..."}
    ]
    query = "Thế trong tình yêu thì sao?"
    res = route_intent(query, history=history, user_name="Quang")
    assert res["intent"] == "contextual"
    assert res["should_call_gemini"] is True
    assert "song tu" in res["rewritten_query"].lower()

# ==============================================================================
# 6. EMOTIONAL DETECTION TESTS
# ==============================================================================

def test_emotional_sadness():
    query = "Tôi vừa chia tay người yêu, buồn quá và thấy bế tắc"
    res = route_intent(query, user_name="Quang")
    assert res["emotional"] is True
    assert res["emotional_level"] == "sad"

def test_emotional_crisis_local_response():
    query = "Tôi tuyệt vọng quá, không muốn sống nữa, muốn tự tử"
    res = route_intent(query, user_name="Quang")
    assert res["emotional"] is True
    assert res["emotional_level"] == "crisis"
    assert res["should_call_gemini"] is False
    assert "Ngày Mai" in res["direct_response"]
    assert "096 306 1414" in res["direct_response"]

# ==============================================================================
# 7. REGISTRY VALIDITY TESTS
# ==============================================================================

def test_navigation_registry_routes_are_in_whitelist():
    for key, item in NAVIGATION_REGISTRY.items():
        assert item["route"] in VALID_ROUTES, f"Route {item['route']} for {key} is not in VALID_ROUTES"
        assert item["route"].startswith("/"), f"Route {item['route']} is not relative"
        assert "?" not in item["route"], "No personal data/params in URL"

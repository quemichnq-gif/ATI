# -*- coding: utf-8 -*-
"""
Mock Gemini Tests for AstroBot
Verifies Gemini call counts (0 for router, 1 emb + 1 gen for RAG cache miss,
0 emb + 1 gen for query cache hit), 429 rate limit handling & non-crash fallback.
"""

import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# Add backend directory to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "AI_App_BE"))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from rag_service import generate_rag_chat_response, QUERY_EMBEDDING_CACHE, RagKnowledgeRetriever
from intent_router import route_intent
from main import app

# Determine embedding dimension from loaded doc_embeddings (default 3072)
_temp_retriever = RagKnowledgeRetriever()
EMB_DIM = len(next(iter(_temp_retriever.doc_embeddings.values()))) if _temp_retriever.doc_embeddings else 3072

# ==============================================================================
# 1. TEST GEMINI CALL COUNTS VIA ENDPOINT
# ==============================================================================

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_router_cases_make_zero_gemini_calls(client):
    """Navigation, small_talk, and unsupported must make exactly 0 Gemini calls."""
    test_queries = [
        "Mở tarot",
        "Chào bạn",
        "Cảm ơn nha",
        "Viết code python cho tôi"
    ]

    with patch("requests.post") as mock_post:
        for q in test_queries:
            res = client.post("/astrology-chat", json={
                "messages": [{"role": "user", "content": q}],
                "userData": {"name": "Quang"}
            })
            assert res.status_code == 200
            data = res.get_json()
            assert data["answer"]
            assert not data.get("fallback")
        # Ensure requests.post was NEVER called (0 Gemini calls)
        assert mock_post.call_count == 0

def test_rag_cache_miss_makes_one_emb_and_one_gen():
    """RAG query on fresh cache makes 1 embedding call and 1 generation call."""
    QUERY_EMBEDDING_CACHE.clear()

    # Mock embedding response
    mock_emb_resp = MagicMock()
    mock_emb_resp.status_code = 200
    mock_emb_resp.ok = True
    mock_emb_resp.json.return_value = {"embedding": {"values": [0.1] * EMB_DIM}}

    # Mock generation response
    mock_gen_resp = MagicMock()
    mock_gen_resp.status_code = 200
    mock_gen_resp.ok = True
    mock_gen_resp.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "Bọ Cạp là cung Nước sâu sắc..."}]}}]
    }

    with patch("requests.post", side_effect=[mock_emb_resp, mock_gen_resp]) as mock_post:
        res = generate_rag_chat_response(
            messages=[{"role": "user", "content": "Bọ Cạp có tính cách thế nào?"}],
            user_data={"name": "Quang"},
            api_key="dummy_key",
            model_name="gemini-3.5-flash-lite"
        )
        assert res["fallback"] is False
        assert "Bọ Cạp" in res["answer"]
        assert res["embedding_calls"] == 1
        assert res["generation_calls"] == 1
        assert res["query_cache_hit"] is False
        assert mock_post.call_count == 2

def test_rag_query_cache_hit_makes_zero_emb_and_one_gen():
    """Repeated query hits in-RAM query cache: 0 embedding call and 1 generation call."""
    # Ensure cache has the entry from previous test
    query = "Song Tử có tính cách thế nào?"
    norm_q = "gemini-embedding-001:song tu co tinh cach the nao?"
    QUERY_EMBEDDING_CACHE[norm_q] = [0.1] * EMB_DIM

    mock_gen_resp = MagicMock()
    mock_gen_resp.status_code = 200
    mock_gen_resp.ok = True
    mock_gen_resp.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "Song Tử là cung Khí thông minh..."}]}}]
    }

    with patch("requests.post", return_value=mock_gen_resp) as mock_post:
        res = generate_rag_chat_response(
            messages=[{"role": "user", "content": query}],
            user_data={"name": "Quang"},
            api_key="dummy_key",
            model_name="gemini-3.5-flash-lite"
        )
        assert res["fallback"] is False
        assert res["embedding_calls"] == 0
        assert res["generation_calls"] == 1
        assert res["query_cache_hit"] is True
        # Only 1 POST call was made (to generateContent), NONE to embedContent
        assert mock_post.call_count == 1

# ==============================================================================
# 2. RATE LIMIT (429) & QUOTA EXHAUSTION RESILIENCE
# ==============================================================================

def test_rate_limit_429_graceful_handling_and_no_crash():
    """When Gemini returns 429 Quota Exhausted, return user-friendly message without crash."""
    mock_429_resp = MagicMock()
    mock_429_resp.status_code = 429
    mock_429_resp.ok = False
    mock_429_resp.text = "RESOURCE_EXHAUSTED: quota exceeded"
    mock_429_resp.headers = {}

    with patch("requests.post", return_value=mock_429_resp):
        res = generate_rag_chat_response(
            messages=[{"role": "user", "content": "Tarot là gì?"}],
            user_data={"name": "Quang"},
            api_key="dummy_key",
            model_name="gemini-3.5-flash-lite"
        )
        assert res["fallback"] is True
        assert "Mình đang gặp giới hạn xử lý một chút, bạn thử lại sau nhé." in res["answer"]

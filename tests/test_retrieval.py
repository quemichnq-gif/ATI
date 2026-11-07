# -*- coding: utf-8 -*-
"""
Retrieval Benchmark Test for Resonancia AstroBot
Evaluates hit@3 on Tune set (16 questions) and Holdout set (13 questions)
without calling LLM-judge.
"""

import os
import sys
import json
import pytest

# Add backend directory to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "AI_App_BE"))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from rag_service import RagKnowledgeRetriever

BENCHMARK_FILE = os.path.join(os.path.dirname(__file__), "retrieval_benchmark.json")

def load_benchmark_data():
    with open(BENCHMARK_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def evaluate_set(retriever, items):
    hits = 0
    details = []
    for item in items:
        retrieved = retriever.retrieve(item["query"], top_k=3)
        retrieved_ids = [d["id"] for d in retrieved]
        expected = item["expected_chunk_ids"]
        is_hit = any(exp in retrieved_ids for exp in expected)
        if is_hit:
            hits += 1
        details.append({
            "id": item["id"],
            "query": item["query"],
            "expected": expected,
            "retrieved": retrieved_ids,
            "hit": is_hit
        })
    hit_at_3 = hits / len(items) if items else 0.0
    return hit_at_3, details

def test_tune_retrieval_baseline():
    data = load_benchmark_data()
    retriever = RagKnowledgeRetriever()
    hit_at_3, details = evaluate_set(retriever, data["tune"])
    print(f"\n[BASELINE] Tune Set hit@3: {hit_at_3 * 100:.2f}% ({sum(1 for d in details if d['hit'])}/{len(data['tune'])})")
    for d in details:
        if not d["hit"]:
            print(f"  MISS: {d['id']} - {d['query']} -> Got: {d['retrieved']}, Expected: {d['expected']}")
    assert hit_at_3 >= 0.85, f"Tune hit@3 too low: {hit_at_3}"

def test_holdout_retrieval_baseline():
    data = load_benchmark_data()
    retriever = RagKnowledgeRetriever()
    hit_at_3, details = evaluate_set(retriever, data["holdout"])
    print(f"\n[BASELINE] Holdout Set hit@3: {hit_at_3 * 100:.2f}% ({sum(1 for d in details if d['hit'])}/{len(data['holdout'])})")
    for d in details:
        if not d["hit"]:
            print(f"  MISS: {d['id']} - {d['query']} -> Got: {d['retrieved']}, Expected: {d['expected']}")
    assert hit_at_3 >= 0.85, f"Holdout hit@3 too low: {hit_at_3}"

if __name__ == "__main__":
    retriever = RagKnowledgeRetriever()
    data = load_benchmark_data()
    tune_score, _ = evaluate_set(retriever, data["tune"])
    holdout_score, _ = evaluate_set(retriever, data["holdout"])
    print(f"Tune hit@3: {tune_score * 100:.2f}%")
    print(f"Holdout hit@3: {holdout_score * 100:.2f}%")

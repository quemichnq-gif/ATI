# -*- coding: utf-8 -*-
import os
import sys
import pytest

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "AI_App_BE"))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from storage_db import (
    save_match_request,
    get_match_request_by_id,
    find_pending_match_request,
    cancel_previous_requests,
    update_match_request_status,
    get_user_match_requests,
    get_latest_match_request_between,
    create_notification,
    get_user_notifications,
    mark_notifications_read,
    delete_notification,
    get_user_relationship,
    set_user_relationship,
    break_relationship
)

def test_match_request_crud():
    req_id = "test_req_999"
    u1 = "test_user_a"
    u2 = "test_user_b"

    cancel_previous_requests(u1, u2)

    req = {
        "requestId": req_id,
        "senderId": u1,
        "receiverId": u2,
        "senderName": "User A",
        "senderAvatar": "avatarA.png",
        "receiverName": "User B",
        "message": "Let's connect!",
        "status": "pending",
        "createdAt": "2026-11-10T12:00:00"
    }
    save_match_request(req)

    fetched = get_match_request_by_id(req_id)
    assert fetched is not None
    assert fetched["requestId"] == req_id
    assert fetched["senderId"] == u1
    assert fetched["status"] == "pending"

    # Pending search
    pending = find_pending_match_request(u1, u2)
    assert pending is not None
    assert pending["requestId"] == req_id

    # Update status to accepted
    ok = update_match_request_status(req_id, "accepted", "Happy to connect!")
    assert ok is True

    updated = get_match_request_by_id(req_id)
    assert updated["status"] == "accepted"
    assert updated["responseMessage"] == "Happy to connect!"

    # User match requests listing
    received = get_user_match_requests(u2, "received")
    assert any(r["requestId"] == req_id for r in received)

    sent = get_user_match_requests(u1, "sent")
    assert any(r["requestId"] == req_id for r in sent)

def test_notifications_crud():
    user_id = "notif_user_123"
    nid = "notif_id_abc"

    notif = {
        "id": nid,
        "userId": user_id,
        "type": "match_request",
        "title": "New match",
        "message": "Hello!",
        "senderId": "sender_99",
        "senderName": "Sender 99",
        "senderAvatar": "",
        "requestId": "req_123",
        "read": False,
        "createdAt": "2026-11-10T12:00:00"
    }
    create_notification(notif)

    notifs = get_user_notifications(user_id)
    assert any(n["id"] == nid for n in notifs)

    # Mark as read
    mark_notifications_read(user_id, [nid])
    updated_notifs = get_user_notifications(user_id)
    found = next(n for n in updated_notifs if n["id"] == nid)
    assert found["read"] is True

    # Delete notification
    delete_notification(user_id, nid)
    after_del = get_user_notifications(user_id)
    assert not any(n["id"] == nid for n in after_del)

def test_user_relationships_crud():
    u1 = "rel_user_1"
    u2 = "rel_user_2"

    initial = get_user_relationship(u1)
    assert initial["relationshipStatus"] == "Độc thân"

    set_user_relationship(u1, "Đã có đôi", partner_id=u2, match_id="match_777")
    set_user_relationship(u2, "Đã có đôi", partner_id=u1, match_id="match_777")

    r1 = get_user_relationship(u1)
    assert r1["relationshipStatus"] == "Đã có đôi"
    assert r1["partnerId"] == u2
    assert r1["matchId"] == "match_777"

    break_relationship(u1, u2)
    r1_broken = get_user_relationship(u1)
    r2_broken = get_user_relationship(u2)
    assert r1_broken["relationshipStatus"] == "Độc thân"
    assert r1_broken["partnerId"] is None
    assert r2_broken["relationshipStatus"] == "Độc thân"

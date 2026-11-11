# -*- coding: utf-8 -*-
"""
Database Persistence Service for Resonancia
Stores match_requests, notifications, and user_relationships in SQLite.
Ensures data persistence across server restarts and eliminates non-durable In-Memory storage.
"""

import os
import sqlite3
import json
from datetime import datetime
from typing import Optional, List, Dict, Any

# Cố định đường dẫn tuyệt đối tới file chat_database.db chuẩn của AI_App_BE
BE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DB_PATH = os.getenv("CHAT_DB_PATH", os.path.join(BE_DIR, "chat_database.db"))


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init_storage_db():
    """Tạo các bảng lưu trữ nếu chưa tồn tại"""
    conn = get_db_connection()
    try:
        with conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS match_requests (
                    request_id TEXT PRIMARY KEY,
                    sender_id TEXT NOT NULL,
                    receiver_id TEXT NOT NULL,
                    sender_name TEXT,
                    sender_avatar TEXT,
                    receiver_name TEXT,
                    message TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at TEXT,
                    response_message TEXT,
                    accepted_at TEXT,
                    rejected_at TEXT
                )
            ''')
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_match_requests_users 
                ON match_requests (sender_id, receiver_id, status)
            ''')
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_match_requests_created 
                ON match_requests (created_at DESC)
            ''')

            conn.execute('''
                CREATE TABLE IF NOT EXISTS notifications (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    type TEXT DEFAULT 'match_request',
                    title TEXT,
                    message TEXT,
                    sender_id TEXT,
                    sender_name TEXT,
                    sender_avatar TEXT,
                    request_id TEXT,
                    read INTEGER DEFAULT 0,
                    created_at TEXT
                )
            ''')
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_notifications_user 
                ON notifications (user_id, created_at DESC)
            ''')

            conn.execute('''
                CREATE TABLE IF NOT EXISTS user_relationships (
                    user_id TEXT PRIMARY KEY,
                    partner_id TEXT,
                    match_id TEXT,
                    relationship_status TEXT DEFAULT 'Độc thân',
                    updated_at TEXT
                )
            ''')
    finally:
        conn.close()


# Khởi tạo bảng ngay khi import module
init_storage_db()


# ==============================================================================
# MATCH REQUESTS REPOSITORY
# ==============================================================================

def save_match_request(data: Dict[str, Any]) -> None:
    conn = get_db_connection()
    try:
        with conn:
            conn.execute('''
                INSERT INTO match_requests 
                (request_id, sender_id, receiver_id, sender_name, sender_avatar, receiver_name, message, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(request_id) DO UPDATE SET
                    status=excluded.status,
                    response_message=excluded.response_message
            ''', (
                data.get("requestId"),
                data.get("senderId"),
                data.get("receiverId"),
                data.get("senderName"),
                data.get("senderAvatar"),
                data.get("receiverName"),
                data.get("message"),
                data.get("status", "pending"),
                data.get("createdAt", datetime.now().isoformat())
            ))
    finally:
        conn.close()


def cancel_previous_requests(sender_id: str, receiver_id: str) -> None:
    """Hủy các yêu cầu kết bạn cũ giữa 2 user khi gửi lời mời mới"""
    conn = get_db_connection()
    try:
        with conn:
            conn.execute('''
                UPDATE match_requests 
                SET status = 'canceled'
                WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
                  AND status = 'pending'
            ''', (sender_id, receiver_id, receiver_id, sender_id))
    finally:
        conn.close()


def get_match_request_by_id(request_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM match_requests WHERE request_id = ?', (request_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return _format_match_request_row(row)
    finally:
        conn.close()


def find_pending_match_request(uid1: str, uid2: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM match_requests
            WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
              AND status = 'pending'
            ORDER BY created_at DESC LIMIT 1
        ''', (uid1, uid2, uid2, uid1))
        row = cursor.fetchone()
        if not row:
            return None
        return _format_match_request_row(row)
    finally:
        conn.close()


def update_match_request_status(request_id: str, status: str, response_message: str = "") -> bool:
    conn = get_db_connection()
    try:
        with conn:
            now_iso = datetime.now().isoformat()
            if status == "accepted":
                cursor = conn.execute('''
                    UPDATE match_requests 
                    SET status = ?, response_message = ?, accepted_at = ?
                    WHERE request_id = ?
                ''', (status, response_message, now_iso, request_id))
            elif status == "rejected":
                cursor = conn.execute('''
                    UPDATE match_requests 
                    SET status = ?, rejected_at = ?
                    WHERE request_id = ?
                ''', (status, now_iso, request_id))
            else:
                cursor = conn.execute('''
                    UPDATE match_requests 
                    SET status = ?
                    WHERE request_id = ?
                ''', (status, request_id))
            return cursor.rowcount > 0
    finally:
        conn.close()


def end_match_requests_between(uid1: str, uid2: str) -> None:
    """Đánh dấu tất cả request giữa 2 user thành ended khi chia tay"""
    conn = get_db_connection()
    try:
        with conn:
            conn.execute('''
                UPDATE match_requests 
                SET status = 'ended'
                WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            ''', (uid1, uid2, uid2, uid1))
    finally:
        conn.close()


def get_user_match_requests(user_id: str, request_type: str = "received") -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if request_type == "received":
            cursor.execute('SELECT * FROM match_requests WHERE receiver_id = ? ORDER BY created_at DESC', (user_id,))
        elif request_type == "sent":
            cursor.execute('SELECT * FROM match_requests WHERE sender_id = ? ORDER BY created_at DESC', (user_id,))
        else:  # all
            cursor.execute('''
                SELECT * FROM match_requests 
                WHERE sender_id = ? OR receiver_id = ? 
                ORDER BY created_at DESC
            ''', (user_id, user_id))
        rows = cursor.fetchall()
        result = []
        for r in rows:
            req = _format_match_request_row(r)
            req["direction"] = "sent" if req["senderId"] == user_id else "received"
            result.append(req)
        return result
    finally:
        conn.close()


def get_latest_match_request_between(user_id: str, target_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM match_requests
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at DESC LIMIT 1
        ''', (user_id, target_id, target_id, user_id))
        row = cursor.fetchone()
        if not row:
            return None
        return _format_match_request_row(row)
    finally:
        conn.close()


def _format_match_request_row(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "requestId": row["request_id"],
        "senderId": row["sender_id"],
        "receiverId": row["receiver_id"],
        "senderName": row["sender_name"] or "Người dùng",
        "senderAvatar": row["sender_avatar"] or "",
        "receiverName": row["receiver_name"] or "Người dùng",
        "message": row["message"] or "",
        "status": row["status"] or "pending",
        "createdAt": row["created_at"] or "",
        "responseMessage": row["response_message"] or "",
        "acceptedAt": row["accepted_at"] or "",
        "rejectedAt": row["rejected_at"] or "",
    }


# ==============================================================================
# NOTIFICATIONS REPOSITORY
# ==============================================================================

UID_GROUPS = [
    {
        'cand_2_hamy',
        '61kO1itQCOV3Nw9acgWUmQLduNT2',
        'C6U7eytPpdQyw2YufISm4mNh6N72',
    },
    {
        'cand_1_dainghia',
        'cand_1_nghia',
        'YykBl98StbXVCKgqave6VMVC5Bx1',
        'PAKzF0JCu3Zh11N59MzxUlCG3pq2',
    },
    {
        'user_main_tuan',
        'user_tuan',
        'yEQyrTCQJwWedUyffYTqt5O01ih1',
        'Rietkt4hguXJeAyjKv6Fqo5E7OK2',
        '37ttDQ1n6LbeJpNuieiYdSBtnal1',
        'x5cEmtlghVYlrpyITC1FSaonIzt1',
    },
]

def uid_aliases(uid: str) -> List[str]:
    if not uid:
        return []
    aliases = {uid}
    for group in UID_GROUPS:
        if uid in group:
            aliases.update(group)
    return list(aliases)

def create_notification(notif: Dict[str, Any]) -> None:
    conn = get_db_connection()
    try:
        with conn:
            conn.execute('''
                INSERT INTO notifications 
                (id, user_id, type, title, message, sender_id, sender_name, sender_avatar, request_id, read, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                notif.get("id"),
                notif.get("userId"),
                notif.get("type", "match_request"),
                notif.get("title", ""),
                notif.get("message", "") or notif.get("body", ""),
                notif.get("senderId", ""),
                notif.get("senderName", ""),
                notif.get("senderAvatar", ""),
                notif.get("requestId", ""),
                1 if notif.get("read") else 0,
                notif.get("createdAt", datetime.now().isoformat())
            ))
    finally:
        conn.close()


def get_user_notifications(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    if not user_id:
        return []
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        aliases = uid_aliases(user_id)
        if not aliases:
            aliases = [user_id]
        placeholders = ','.join(['?'] * len(aliases))
        cursor.execute(f'''
            SELECT * FROM notifications 
            WHERE user_id IN ({placeholders}) 
            ORDER BY created_at DESC LIMIT ?
        ''', (*aliases, limit))
        rows = cursor.fetchall()
        result = []
        for r in rows:
            msg_text = r["message"] or ""
            notif_type = r["type"] or "message"
            req_id = r["request_id"] or ""
            result.append({
                "id": r["id"],
                "userId": r["user_id"],
                "type": notif_type,
                "title": r["title"] or "",
                "message": msg_text,
                "body": msg_text,
                "senderId": r["sender_id"] or "",
                "senderName": r["sender_name"] or "",
                "senderAvatar": r["sender_avatar"] or "",
                "requestId": req_id,
                "chatId": req_id if notif_type == "message" else "",
                "read": bool(r["read"]),
                "createdAt": r["created_at"] or ""
            })
        return result
    finally:
        conn.close()


def mark_notifications_read(user_id: str, notification_ids: List[str]) -> int:
    if not notification_ids:
        return 0
    conn = get_db_connection()
    try:
        aliases = uid_aliases(user_id) if user_id else []
        if not aliases:
            aliases = [user_id]
        u_placeholders = ','.join(['?'] * len(aliases))
        id_placeholders = ','.join(['?'] * len(notification_ids))
        with conn:
            cursor = conn.execute(f'''
                UPDATE notifications 
                SET read = 1 
                WHERE user_id IN ({u_placeholders}) AND id IN ({id_placeholders})
            ''', (*aliases, *notification_ids))
            return cursor.rowcount
    finally:
        conn.close()


def delete_notification(user_id: str, notification_id: str) -> bool:
    conn = get_db_connection()
    try:
        aliases = uid_aliases(user_id) if user_id else []
        if not aliases:
            aliases = [user_id]
        u_placeholders = ','.join(['?'] * len(aliases))
        with conn:
            cursor = conn.execute(f'''
                DELETE FROM notifications 
                WHERE user_id IN ({u_placeholders}) AND id = ?
            ''', (*aliases, notification_id))
            return cursor.rowcount > 0
    finally:
        conn.close()


# ==============================================================================
# USER RELATIONSHIPS REPOSITORY
# ==============================================================================

def get_user_relationship(user_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM user_relationships WHERE user_id = ?', (user_id,))
        row = cursor.fetchone()
        if not row:
            return {
                "relationshipStatus": "Độc thân",
                "partnerId": None,
                "matchId": None
            }
        return {
            "relationshipStatus": row["relationship_status"] or "Độc thân",
            "partnerId": row["partner_id"],
            "matchId": row["match_id"]
        }
    finally:
        conn.close()


def set_user_relationship(user_id: str, relationship_status: str, partner_id: Optional[str] = None, match_id: Optional[str] = None) -> None:
    conn = get_db_connection()
    try:
        with conn:
            conn.execute('''
                INSERT INTO user_relationships (user_id, partner_id, match_id, relationship_status, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    partner_id=excluded.partner_id,
                    match_id=excluded.match_id,
                    relationship_status=excluded.relationship_status,
                    updated_at=excluded.updated_at
            ''', (
                user_id,
                partner_id,
                match_id,
                relationship_status,
                datetime.now().isoformat()
            ))
    finally:
        conn.close()


def break_relationship(uid1: str, uid2: Optional[str] = None) -> None:
    conn = get_db_connection()
    try:
        with conn:
            now_iso = datetime.now().isoformat()
            conn.execute('''
                UPDATE user_relationships 
                SET relationship_status = 'Độc thân', partner_id = NULL, match_id = NULL, updated_at = ?
                WHERE user_id = ?
            ''', (now_iso, uid1))
            if uid2:
                conn.execute('''
                    UPDATE user_relationships 
                    SET relationship_status = 'Độc thân', partner_id = NULL, match_id = NULL, updated_at = ?
                    WHERE user_id = ?
                ''', (now_iso, uid2))
    finally:
        conn.close()

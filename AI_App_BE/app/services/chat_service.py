# -*- coding: utf-8 -*-
import sqlite3
import json
import time
import os
import threading
import random
from datetime import datetime

# Cố định đường dẫn tuyệt đối tới file chat_database.db chuẩn của AI_App_BE
BE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DB_PATH = os.getenv("CHAT_DB_PATH", os.path.join(BE_DIR, "chat_database.db"))

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

CANONICAL_UID_MAP = {
    # Hà My
    'cand_2_hamy': 'C6U7eytPpdQyw2YufISm4mNh6N72',
    '61kO1itQCOV3Nw9acgWUmQLduNT2': 'C6U7eytPpdQyw2YufISm4mNh6N72',
    'C6U7eytPpdQyw2YufISm4mNh6N72': 'C6U7eytPpdQyw2YufISm4mNh6N72',
    # Tuấn
    'user_main_tuan': 'x5cEmtlghVYlrpyITC1FSaonIzt1',
    'user_tuan': 'x5cEmtlghVYlrpyITC1FSaonIzt1',
    'yEQyrTCQJwWedUyffYTqt5O01ih1': 'x5cEmtlghVYlrpyITC1FSaonIzt1',
    'Rietkt4hguXJeAyjKv6Fqo5E7OK2': 'x5cEmtlghVYlrpyITC1FSaonIzt1',
    '37ttDQ1n6LbeJpNuieiYdSBtnal1': 'x5cEmtlghVYlrpyITC1FSaonIzt1',
    'x5cEmtlghVYlrpyITC1FSaonIzt1': 'x5cEmtlghVYlrpyITC1FSaonIzt1',
    # Đại Nghĩa
    'cand_1_dainghia': 'PAKzF0JCu3Zh11N59MzxUlCG3pq2',
    'cand_1_nghia': 'PAKzF0JCu3Zh11N59MzxUlCG3pq2',
    'YykBl98StbXVCKgqave6VMVC5Bx1': 'PAKzF0JCu3Zh11N59MzxUlCG3pq2',
    'PAKzF0JCu3Zh11N59MzxUlCG3pq2': 'PAKzF0JCu3Zh11N59MzxUlCG3pq2',
}

KNOWN_USER_INFO = {
    'C6U7eytPpdQyw2YufISm4mNh6N72': {
        'name': 'Hà My',
        'avatar': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80'
    },
    'cand_2_hamy': {
        'name': 'Hà My',
        'avatar': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80'
    },
    'x5cEmtlghVYlrpyITC1FSaonIzt1': {
        'name': 'Tuấn Nguyễn Chí',
        'avatar': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
    },
    'user_tuan': {
        'name': 'Tuấn Nguyễn Chí',
        'avatar': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
    },
    'PAKzF0JCu3Zh11N59MzxUlCG3pq2': {
        'name': 'Trần Đại Nghĩa',
        'avatar': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80'
    },
    'cand_1_dainghia': {
        'name': 'Trần Đại Nghĩa',
        'avatar': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80'
    },
}

def canonical_uid(uid):
    if not uid:
        return ""
    return CANONICAL_UID_MAP.get(uid, uid)

def uid_aliases(uid):
    if not uid:
        return []
    aliases = {uid}
    for group in UID_GROUPS:
        if uid in group:
            aliases.update(group)
    return list(aliases)

def get_possible_chat_ids(chat_id):
    if not chat_id:
        return []
    result = {chat_id}
    parts = chat_id.split('_')
    if len(parts) == 2:
        u1, u2 = parts[0], parts[1]
        aliases1 = uid_aliases(u1) or [u1]
        aliases2 = uid_aliases(u2) or [u2]
        for a1 in aliases1:
            for a2 in aliases2:
                result.add(f"{a1}_{a2}")
                result.add(f"{a2}_{a1}")
        c1, c2 = canonical_uid(u1), canonical_uid(u2)
        sorted_c = sorted([c1, c2])
        result.add(f"{sorted_c[0]}_{sorted_c[1]}")
    return list(result)

def chat_contains_user(participants, uid):
    if not uid:
        return True
    allowed_ids = set(uid_aliases(uid))
    return any(participant in allowed_ids for participant in participants)

def load_chat_for_user(cursor, chat_id, uid):
    possible_chat_ids = get_possible_chat_ids(chat_id)
    placeholders = ','.join(['?'] * len(possible_chat_ids))
    cursor.execute(f'SELECT * FROM chats WHERE chat_id IN ({placeholders}) ORDER BY last_timestamp DESC', possible_chat_ids)
    rows = cursor.fetchall()
    for row in rows:
        try:
            participants = json.loads(row['participants'] or '[]')
        except (TypeError, ValueError):
            continue
        if not uid or chat_contains_user(participants, uid):
            return row
    return None

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_chat_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chats (
            chat_id TEXT PRIMARY KEY,
            participants TEXT,
            participant_names TEXT,
            participant_avatars TEXT,
            last_message TEXT,
            last_timestamp INTEGER,
            last_sender_id TEXT,
            created_at INTEGER
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            chat_id TEXT,
            sender_id TEXT,
            sender_name TEXT,
            sender_avatar TEXT,
            text TEXT,
            timestamp INTEGER,
            read INTEGER DEFAULT 0,
            type TEXT DEFAULT 'text',
            file_url TEXT,
            file_name TEXT,
            file_size TEXT
        )
    ''')
    for col, defn in [
        ('type', "TEXT DEFAULT 'text'"),
        ('file_url', "TEXT"),
        ('file_name', "TEXT"),
        ('file_size', "TEXT")
    ]:
        try:
            cursor.execute(f"ALTER TABLE messages ADD COLUMN {col} {defn}")
        except Exception:
            pass
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages (chat_id, timestamp)')
    conn.commit()
    conn.close()

init_chat_db()

def create_or_update_chat(chat_id, participants, names, avatars, last_msg, uid):
    if not chat_id or not participants:
        return {"error": "Missing chatId or participants", "status": 400}

    if not uid or not chat_contains_user(participants, uid):
        return {"error": "Authenticated user must be a chat participant", "status": 403}

    now = int(time.time() * 1000)
    conn = get_db()
    cursor = conn.cursor()
    row = load_chat_for_user(cursor, chat_id, uid)
    actual_chat_id = row['chat_id'] if row else chat_id

    # Đảm bảo có đủ tên và avatar từ KNOWN_USER_INFO nếu thiếu
    full_names = dict(names or {})
    full_avatars = dict(avatars or {})
    for p in participants:
        if p not in full_names and p in KNOWN_USER_INFO:
            full_names[p] = KNOWN_USER_INFO[p]['name']
        if p not in full_avatars and p in KNOWN_USER_INFO:
            full_avatars[p] = KNOWN_USER_INFO[p]['avatar']

    if not row:
        cursor.execute('''
            INSERT INTO chats (chat_id, participants, participant_names, participant_avatars, last_message, last_timestamp, last_sender_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            actual_chat_id,
            json.dumps(participants),
            json.dumps(full_names),
            json.dumps(full_avatars),
            last_msg,
            now,
            participants[0] if participants else '',
            now
        ))
    else:
        existing_names = json.loads(row['participant_names'] or '{}')
        existing_avatars = json.loads(row['participant_avatars'] or '{}')
        existing_names.update(full_names)
        existing_avatars.update(full_avatars)
        cursor.execute('''
            UPDATE chats SET participant_names = ?, participant_avatars = ?, last_message = ?, last_timestamp = ? WHERE chat_id = ?
        ''', (json.dumps(existing_names), json.dumps(existing_avatars), last_msg, now, actual_chat_id))

    conn.commit()
    conn.close()
    return {"success": True, "chatId": actual_chat_id, "status": 200}

def send_chat_message(chat_id, sender_id, sender_name, sender_avatar, text, msg_type, file_url, file_name, file_size, uid):
    if not chat_id or not sender_id or not text:
        return {"error": "Missing chatId, senderId or text", "status": 400}

    if uid and sender_id != uid and sender_id not in uid_aliases(uid):
        return {"error": "Sender does not match authenticated user", "status": 403}

    now = int(time.time() * 1000)
    msg_id = f"msg_{now}_{os.urandom(4).hex()}"

    conn = get_db()
    cursor = conn.cursor()

    row = load_chat_for_user(cursor, chat_id, uid or sender_id)
    actual_chat_id = row['chat_id'] if row else chat_id

    cursor.execute('''
        INSERT INTO messages (id, chat_id, sender_id, sender_name, sender_avatar, text, timestamp, read, type, file_url, file_name, file_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
    ''', (msg_id, actual_chat_id, sender_id, sender_name, sender_avatar, text, now, msg_type, file_url, file_name, file_size))

    last_msg_preview = '[Hình ảnh]' if msg_type == 'image' else (f'[Tệp: {file_name}]' if msg_type == 'file' else text)
    if row:
        existing_names = json.loads(row['participant_names'] or '{}')
        existing_avatars = json.loads(row['participant_avatars'] or '{}')
        existing_names[sender_id] = sender_name
        if sender_avatar:
            existing_avatars[sender_id] = sender_avatar
        # Bổ sung tên người nhận nếu chưa có
        for p in json.loads(row['participants'] or '[]'):
            if p not in existing_names and p in KNOWN_USER_INFO:
                existing_names[p] = KNOWN_USER_INFO[p]['name']
            if p not in existing_avatars and p in KNOWN_USER_INFO:
                existing_avatars[p] = KNOWN_USER_INFO[p]['avatar']

        cursor.execute('''
            UPDATE chats SET last_message = ?, last_timestamp = ?, last_sender_id = ?,
                             participant_names = ?, participant_avatars = ?
            WHERE chat_id = ?
        ''', (last_msg_preview, now, sender_id, json.dumps(existing_names), json.dumps(existing_avatars), actual_chat_id))
    else:
        parts = chat_id.split('_')
        participants = parts if len(parts) >= 2 else [sender_id]
        names_dict = {sender_id: sender_name}
        avatars_dict = {sender_id: sender_avatar}
        for p in participants:
            if p != sender_id and p not in names_dict and p in KNOWN_USER_INFO:
                names_dict[p] = KNOWN_USER_INFO[p]['name']
                avatars_dict[p] = KNOWN_USER_INFO[p]['avatar']

        cursor.execute('''
            INSERT INTO chats (chat_id, participants, participant_names, participant_avatars, last_message, last_timestamp, last_sender_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            actual_chat_id,
            json.dumps(participants),
            json.dumps(names_dict),
            json.dumps(avatars_dict),
            last_msg_preview,
            now,
            sender_id,
            now
        ))

    conn.commit()

    # Tìm người nhận tin nhắn để tự động tạo thông báo đến trang /notifications
    receiver_id = None
    if row and row['participants']:
        try:
            participants = json.loads(row['participants'] or '[]')
            sender_aliases = set(uid_aliases(sender_id)) | set(uid_aliases(uid))
            for p in participants:
                if p not in sender_aliases:
                    receiver_id = p
                    break
        except Exception:
            pass

    if not receiver_id:
        sender_aliases = set(uid_aliases(sender_id)) | set(uid_aliases(uid))
        for alias in sender_aliases:
            if actual_chat_id.startswith(alias + '_'):
                receiver_id = actual_chat_id[len(alias) + 1:]
                break
            elif actual_chat_id.endswith('_' + alias):
                receiver_id = actual_chat_id[:len(actual_chat_id) - len(alias) - 1]
                break

    if receiver_id:
        canonical_receiver = canonical_uid(receiver_id)
        notif_id = f"notif_{now}_{os.urandom(4).hex()}"
        preview_text = text if msg_type == 'text' else ('[Hình ảnh]' if msg_type == 'image' else f'[Tệp: {file_name or "tài liệu"}]')
        if len(preview_text) > 80:
            preview_text = preview_text[:77] + '...'
        notif = {
            "id": notif_id,
            "userId": canonical_receiver,
            "type": "message",
            "title": f"Tin nhắn mới từ {sender_name} 💬",
            "message": preview_text,
            "body": preview_text,
            "senderId": sender_id,
            "senderName": sender_name,
            "senderAvatar": sender_avatar or "",
            "requestId": actual_chat_id,
            "read": False,
            "createdAt": datetime.now().isoformat(),
        }
        try:
            from app.repositories.storage_db import create_notification as db_create_notification
            db_create_notification(notif)
        except Exception as e:
            print("Lỗi tạo thông báo tin nhắn đến:", e)

    conn.close()

    return {
        "success": True,
        "message": {
            'id': msg_id,
            'chatId': actual_chat_id,
            'senderId': sender_id,
            'senderName': sender_name,
            'senderAvatar': sender_avatar,
            'text': text,
            'timestamp': now,
            'read': False,
            'type': msg_type,
            'fileUrl': file_url,
            'fileName': file_name,
            'fileSize': file_size
        },
        "status": 200
    }

def get_chat_messages(chat_id, since, uid):
    possible_chat_ids = get_possible_chat_ids(chat_id)
    conn = get_db()
    cursor = conn.cursor()

    chat_row = load_chat_for_user(cursor, chat_id, uid)
    if not chat_row:
        allowed_ids = set(uid_aliases(uid))
        parts = chat_id.split('_')
        if any(p in allowed_ids for p in parts) or not uid:
            conn.close()
            return {"success": True, "messages": [], "status": 200}
        conn.close()
        return {"error": "Chat not found or access denied", "status": 404}

    placeholders = ','.join(['?'] * len(possible_chat_ids))
    cursor.execute(f'''
        SELECT * FROM messages
        WHERE chat_id IN ({placeholders}) AND timestamp > ?
        ORDER BY timestamp ASC
    ''', (*possible_chat_ids, since))

    rows = cursor.fetchall()
    messages = []
    for r in rows:
        messages.append({
            'id': r['id'],
            'chatId': r['chat_id'],
            'senderId': r['sender_id'],
            'senderName': r['sender_name'],
            'senderAvatar': r['sender_avatar'],
            'text': r['text'],
            'timestamp': r['timestamp'],
            'read': bool(r['read']),
            'type': r['type'] if 'type' in r.keys() and r['type'] else 'text',
            'fileUrl': r['file_url'] if 'file_url' in r.keys() else None,
            'fileName': r['file_name'] if 'file_name' in r.keys() else None,
            'fileSize': r['file_size'] if 'file_size' in r.keys() else None
        })

    conn.close()
    return {"success": True, "messages": messages, "status": 200}

def get_canonical_group_key(uid):
    if not uid:
        return ""
    for idx, group in enumerate(UID_GROUPS):
        if uid in group:
            return f"group_{idx}"
    return uid


def get_chat_list(user_id):
    if not user_id:
        return {"success": True, "chats": [], "status": 200}

    aliases = set(uid_aliases(user_id))
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM chats ORDER BY last_timestamp DESC')
    rows = cursor.fetchall()

    user_chats = []
    seen_partners = set()

    for r in rows:
        try:
            parts = json.loads(r['participants'] or '[]')
            if not parts and '_' in r['chat_id']:
                parts = r['chat_id'].split('_')

            is_participant = any(u in aliases for u in parts) or any(u in r['chat_id'] for u in aliases)
            if not is_participant:
                continue

            # Tìm đối phương không nằm trong aliases của user_id
            other_uids = [p for p in parts if p not in aliases]
            if not other_uids:
                # Toàn bộ participants là alias của chính mình -> bỏ qua
                continue

            other_uid = other_uids[0]
            partner_key = get_canonical_group_key(other_uid)
            if partner_key in seen_partners:
                # Cùng một người đối thoại -> chỉ giữ lại cuộc trò chuyện mới nhất
                continue
            seen_partners.add(partner_key)

            user_chats.append({
                'id': r['chat_id'],
                'participants': parts,
                'participantNames': json.loads(r['participant_names'] or '{}'),
                'participantAvatars': json.loads(r['participant_avatars'] or '{}'),
                'lastMessage': r['last_message'],
                'lastTimestamp': r['last_timestamp'],
                'lastSenderId': r['last_sender_id']
            })
        except Exception:
            continue

    conn.close()
    return {"success": True, "chats": user_chats, "status": 200}


def delete_chat(chat_id, uid):
    if not chat_id:
        return {"error": "Missing chatId", "status": 400}

    conn = get_db()
    cursor = conn.cursor()

    possible_chat_ids = get_possible_chat_ids(chat_id)

    if uid:
        aliases = set(uid_aliases(uid))
        row = load_chat_for_user(cursor, chat_id, uid)
        if not row and not any(a in chat_id for a in aliases):
            conn.close()
            return {"error": "Chat not found or access denied", "status": 403}

    placeholders = ','.join(['?'] * len(possible_chat_ids))
    cursor.execute(f'DELETE FROM messages WHERE chat_id IN ({placeholders})', possible_chat_ids)
    cursor.execute(f'DELETE FROM chats WHERE chat_id IN ({placeholders})', possible_chat_ids)

    conn.commit()
    conn.close()
    return {"success": True, "chatId": chat_id, "status": 200}



# -*- coding: utf-8 -*-
import sqlite3
import json
import time
import os

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

def uid_aliases(uid):
    if not uid:
        return []
    aliases = {uid}
    for group in UID_GROUPS:
        if uid in group:
            aliases.update(group)
    return list(aliases)

def chat_contains_user(participants, uid):
    allowed_ids = set(uid_aliases(uid))
    return any(participant in allowed_ids for participant in participants)

def load_chat_for_user(cursor, chat_id, uid):
    possible_chat_ids = [chat_id]
    parts = chat_id.split('_')
    if len(parts) == 2:
        possible_chat_ids.append(f"{parts[1]}_{parts[0]}")

    placeholders = ','.join(['?'] * len(possible_chat_ids))
    cursor.execute(f'SELECT * FROM chats WHERE chat_id IN ({placeholders})', possible_chat_ids)
    rows = cursor.fetchall()
    for row in rows:
        try:
            participants = json.loads(row['participants'] or '[]')
        except (TypeError, ValueError):
            continue
        if chat_contains_user(participants, uid):
            return row
    return None
    try:
        participants = json.loads(row['participants'] or '[]')
    except (TypeError, ValueError):
        return None
    return row if chat_contains_user(participants, uid) else None

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

    if not row:
        cursor.execute('''
            INSERT INTO chats (chat_id, participants, participant_names, participant_avatars, last_message, last_timestamp, last_sender_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            chat_id,
            json.dumps(participants),
            json.dumps(names),
            json.dumps(avatars),
            last_msg,
            now,
            participants[0] if participants else '',
            now
        ))
    else:
        existing_names = json.loads(row['participant_names'] or '{}')
        existing_avatars = json.loads(row['participant_avatars'] or '{}')
        existing_names.update(names)
        existing_avatars.update(avatars)
        cursor.execute('''
            UPDATE chats SET participant_names = ?, participant_avatars = ? WHERE chat_id = ?
        ''', (json.dumps(existing_names), json.dumps(existing_avatars), chat_id))

    conn.commit()
    conn.close()
    return {"success": True, "chatId": chat_id, "status": 200}

def send_chat_message(chat_id, sender_id, sender_name, sender_avatar, text, msg_type, file_url, file_name, file_size, uid):
    if not chat_id or not sender_id or not text:
        return {"error": "Missing chatId, senderId or text", "status": 400}

    if sender_id != uid:
        return {"error": "Sender does not match authenticated user", "status": 403}

    now = int(time.time() * 1000)
    msg_id = f"msg_{now}_{os.urandom(4).hex()}"

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO messages (id, chat_id, sender_id, sender_name, sender_avatar, text, timestamp, read, type, file_url, file_name, file_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
    ''', (msg_id, chat_id, sender_id, sender_name, sender_avatar, text, now, msg_type, file_url, file_name, file_size))

    last_msg_preview = '[Hình ảnh]' if msg_type == 'image' else (f'[Tệp: {file_name}]' if msg_type == 'file' else text)
    row = load_chat_for_user(cursor, chat_id, uid)
    if row:
        cursor.execute('''
            UPDATE chats SET last_message = ?, last_timestamp = ?, last_sender_id = ?
            WHERE chat_id = ?
        ''', (last_msg_preview, now, sender_id, chat_id))
    else:
        parts = chat_id.split('_')
        participants = parts if len(parts) >= 2 else [sender_id]
        cursor.execute('''
            INSERT INTO chats (chat_id, participants, participant_names, participant_avatars, last_message, last_timestamp, last_sender_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            chat_id,
            json.dumps(participants),
            json.dumps({sender_id: sender_name}),
            json.dumps({sender_id: sender_avatar}),
            last_msg_preview,
            now,
            sender_id,
            now
        ))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": {
            'id': msg_id,
            'chatId': chat_id,
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
    possible_chat_ids = [chat_id]
    parts = chat_id.split('_')
    if len(parts) == 2:
        reversed_id = f"{parts[1]}_{parts[0]}"
        possible_chat_ids.append(reversed_id)

    conn = get_db()
    cursor = conn.cursor()

    chat_row = load_chat_for_user(cursor, chat_id, uid)
    if not chat_row:
        allowed_ids = set(uid_aliases(uid))
        if any(p in allowed_ids for p in parts):
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

    possible_chat_ids = [chat_id]
    parts = chat_id.split('_')
    if len(parts) == 2:
        possible_chat_ids.append(f"{parts[1]}_{parts[0]}")

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



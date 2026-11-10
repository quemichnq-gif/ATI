import sqlite3
import json
import time
import os
from flask import Blueprint, request, jsonify, g

chat_bp = Blueprint('chat_bp', __name__)

DB_PATH = os.path.join(os.path.dirname(__file__), 'chat_database.db')

# Ánh xạ giữa UID và alias ứng viên
UID_ALIASES = {
    'cand_2_hamy': '61kO1itQCOV3Nw9acgWUmQLduNT2',
    '61kO1itQCOV3Nw9acgWUmQLduNT2': 'cand_2_hamy',
    'cand_1_dainghia': 'YykBl98StbXVCKgqave6VMVC5Bx1',
    'YykBl98StbXVCKgqave6VMVC5Bx1': 'cand_1_dainghia',
    'user_main_tuan': 'yEQyrTCQJwWedUyffYTqt5O01ih1',
    'yEQyrTCQJwWedUyffYTqt5O01ih1': 'user_main_tuan',
}

def authenticated_uid():
    user = getattr(g, 'firebase_user', None) or {}
    return user.get('uid', '')

def uid_aliases(uid):
    aliases = [uid]
    alias = UID_ALIASES.get(uid)
    if alias:
        aliases.append(alias)
    return aliases

def chat_contains_user(participants, uid):
    allowed_ids = set(uid_aliases(uid))
    return any(participant in allowed_ids for participant in participants)

def load_chat_for_user(cursor, chat_id, uid):
    cursor.execute('SELECT * FROM chats WHERE chat_id = ?', (chat_id,))
    row = cursor.fetchone()
    if not row:
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
    try:
        cursor.execute("ALTER TABLE messages ADD COLUMN type TEXT DEFAULT 'text'")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE messages ADD COLUMN file_url TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE messages ADD COLUMN file_name TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE messages ADD COLUMN file_size TEXT")
    except Exception:
        pass
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages (chat_id, timestamp)')
    conn.commit()
    conn.close()

# Khởi tạo DB khi load module
init_chat_db()

def normalize_chat_id(chat_id: str) -> str:
    """Chuẩn hóa chat_id để hai user có cùng chat_id bất kể thứ tự"""
    if not chat_id:
        return ""
    # Nếu chat_id có dạng uid1_uid2
    parts = chat_id.split('_')
    if len(parts) == 2:
        return '_'.join(sorted(parts))
    # Trường hợp uid có dấu gạch dưới như cand_2_hamy
    return chat_id

@chat_bp.route('/api/chat/init', methods=['POST'])
def init_chat():
    data = request.json or {}
    chat_id = data.get('chatId')
    participants = data.get('participants', [])
    names = data.get('participantNames', {})
    avatars = data.get('participantAvatars', {})
    last_msg = data.get('lastMessage', 'Đã bắt đầu cuộc trò chuyện ✨')
    now = int(time.time() * 1000)

    if not chat_id or not participants:
        return jsonify({'error': 'Missing chatId or participants'}), 400

    uid = authenticated_uid()
    if not uid or not chat_contains_user(participants, uid):
        return jsonify({'error': 'Authenticated user must be a chat participant'}), 403

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
        # Cập nhật thông tin nếu cần
        existing_names = json.loads(row['participant_names'] or '{}')
        existing_avatars = json.loads(row['participant_avatars'] or '{}')
        existing_names.update(names)
        existing_avatars.update(avatars)
        cursor.execute('''
            UPDATE chats SET participant_names = ?, participant_avatars = ? WHERE chat_id = ?
        ''', (json.dumps(existing_names), json.dumps(existing_avatars), chat_id))

    conn.commit()
    conn.close()
    return jsonify({'success': True, 'chatId': chat_id})

@chat_bp.route('/api/chat/send', methods=['POST'])
def send_message():
    data = request.json or {}
    chat_id = data.get('chatId')
    sender_id = data.get('senderId')
    sender_name = data.get('senderName', 'Người dùng')
    sender_avatar = data.get('senderAvatar', '')
    text = (data.get('text') or '').strip()

    if not chat_id or not sender_id or not text:
        return jsonify({'error': 'Missing chatId, senderId or text'}), 400

    uid = authenticated_uid()
    if sender_id != uid:
        return jsonify({'error': 'Sender does not match authenticated user'}), 403

    msg_type = data.get('type', 'text')
    file_url = data.get('fileUrl')
    file_name = data.get('fileName')
    file_size = data.get('fileSize')

    msg_id = f"msg_{int(time.time() * 1000)}_{os.urandom(4).hex()}"
    now = int(time.time() * 1000)

    conn = get_db()
    cursor = conn.cursor()

    # 1. Lưu tin nhắn
    cursor.execute('''
        INSERT INTO messages (id, chat_id, sender_id, sender_name, sender_avatar, text, timestamp, read, type, file_url, file_name, file_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
    ''', (msg_id, chat_id, sender_id, sender_name, sender_avatar, text, now, msg_type, file_url, file_name, file_size))

    # 2. Cập nhật hoặc tạo cuộc trò chuyện
    last_msg_preview = '[Hình ảnh]' if msg_type == 'image' else (f'[Tệp: {file_name}]' if msg_type == 'file' else text)
    row = load_chat_for_user(cursor, chat_id, uid)
    if row:
        cursor.execute('''
            UPDATE chats SET last_message = ?, last_timestamp = ?, last_sender_id = ?
            WHERE chat_id = ?
        ''', (last_msg_preview, now, sender_id, chat_id))
    else:
        # Nếu phòng chat chưa có trong DB, kiểm tra xem uid có phải là người tham gia hợp lệ trong chat_id
        valid_participant = any(u in chat_id for u in uid_aliases(uid))
        if not valid_participant:
            conn.close()
            return jsonify({'error': 'Chat not found or access denied'}), 404

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

    return jsonify({
        'success': True,
        'message': {
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
        }
    })

@chat_bp.route('/api/chat/messages/<path:chat_id>', methods=['GET'])
def get_chat_messages(chat_id):
    since = request.args.get('since', 0, type=int)

    # Tìm cả dạng đảo ngược hoặc alias nếu có
    possible_chat_ids = [chat_id]
    parts = chat_id.split('_')
    if len(parts) == 2:
        reversed_id = f"{parts[1]}_{parts[0]}"
        possible_chat_ids.append(reversed_id)

    conn = get_db()
    cursor = conn.cursor()

    if not load_chat_for_user(cursor, chat_id, authenticated_uid()):
        conn.close()
        return jsonify({'error': 'Chat not found or access denied'}), 404

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
    return jsonify({'success': True, 'messages': messages})

@chat_bp.route('/api/chat/list', methods=['GET'])
def get_chat_list():
    user_id = request.args.get('userId', '')
    if not user_id:
        return jsonify({'success': True, 'chats': []})

    # Alias nếu có (ví dụ '61kO1itQCOV3Nw9acgWUmQLduNT2' <-> 'cand_2_hamy')
    aliases = uid_aliases(user_id)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM chats ORDER BY last_timestamp DESC')
    rows = cursor.fetchall()

    user_chats = []
    for r in rows:
        try:
            parts = json.loads(r['participants'] or '[]')
            # Kiểm tra xem user hoặc alias có trong participants không hoặc chat_id có chứa không
            is_participant = any(u in parts for u in aliases) or any(u in r['chat_id'] for u in aliases)
            if is_participant:
                user_chats.append({
                    'id': r['chat_id'],
                    'participants': parts,
                    'participantNames': json.loads(r['participant_names'] or '{}'),
                    'participantAvatars': json.loads(r['participant_avatars'] or '{}'),
                    'lastMessage': r['last_message'],
                    'lastTimestamp': r['last_timestamp'],
                    'lastSenderId': r['last_sender_id']
                })
        except Exception as e:
            continue

    conn.close()
    return jsonify({'success': True, 'chats': user_chats})

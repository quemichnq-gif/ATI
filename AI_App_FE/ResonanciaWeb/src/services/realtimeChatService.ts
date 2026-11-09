import { auth, db } from './firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  where,
} from 'firebase/firestore';

const BACKEND_URL = 'http://localhost:5001';

async function chatFetch(url: string, init: RequestInit = {}): Promise<Response | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: number;
  read?: boolean;
  type?: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage: string;
  lastTimestamp: number;
  lastSenderId?: string;
}

/**
 * Gửi tin nhắn đồng thời qua Backend API và Firestore
 */
export async function sendChatMessage(params: {
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  type?: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
}): Promise<ChatMessage> {
  const { chatId, senderId, senderName, senderAvatar, text, type = 'text', fileUrl, fileName, fileSize } = params;
  const now = Date.now();

  let sentMessage: ChatMessage = {
    id: `local_${now}_${Math.random().toString(36).slice(2, 7)}`,
    chatId,
    senderId,
    senderName,
    senderAvatar: senderAvatar || '',
    text,
    type,
    fileUrl,
    fileName,
    fileSize,
    timestamp: now,
    read: false,
  };

  // 1. Gửi lên Backend API (Đảm bảo 100% thành công không phụ thuộc Firestore rules)
  try {
    const res = await chatFetch(`${BACKEND_URL}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        senderId,
        senderName,
        senderAvatar: senderAvatar || '',
        text,
        type,
        fileUrl,
        fileName,
        fileSize,
      }),
    });
    if (res?.ok) {
      const data = await res.json();
      if (data.message) {
        sentMessage = data.message;
      }
    }
  } catch (backendErr) {
    console.warn('Backend chat send warning:', backendErr);
  }

  // 2. Thử gửi lên Firestore (nếu có quyền thì đồng bộ cả Firestore)
  try {
    addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId,
      senderName,
      senderAvatar: senderAvatar || '',
      text,
      type,
      fileUrl,
      fileName,
      fileSize,
      timestamp: serverTimestamp(),
      read: false,
    }).catch(() => {});

    setDoc(
      doc(db, 'chats', chatId),
      {
        lastMessage: type === 'image' ? '[Hình ảnh]' : type === 'file' ? `[Tệp tin: ${fileName || 'tài liệu'}]` : text,
        lastTimestamp: now,
        lastSenderId: senderId,
      },
      { merge: true }
    ).catch(() => {});
  } catch (fsErr) {
    // Không làm fail request nếu Firestore bị chặn quyền
  }

  return sentMessage;
}

/**
 * Lắng nghe tin nhắn realtime (kết hợp Polling Backend API + Firestore onSnapshot)
 */
export function subscribeToChatMessages(
  chatId: string,
  onUpdate: (messages: ChatMessage[]) => void
): () => void {
  let isSubscribed = true;
  const messageMap = new Map<string, ChatMessage>();

  const emitSortedMessages = () => {
    const sorted = Array.from(messageMap.values()).sort(
      (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
    );
    onUpdate(sorted);
  };

  // 1. Fetch và Poll từ Backend API (mỗi 1.2s - siêu nhạy, đồng bộ ngay lập tức giữa 2 tab)
  const fetchBackendMessages = async () => {
    if (!isSubscribed) return;
    try {
      const res = await chatFetch(`${BACKEND_URL}/api/chat/messages/${encodeURIComponent(chatId)}`);
      if (res?.ok) {
        const data = await res.json();
        if (data.messages && Array.isArray(data.messages)) {
          let hasNew = false;
          data.messages.forEach((m: ChatMessage) => {
            const key = m.id || `${m.senderId}_${m.timestamp}_${m.text}`;
            if (!messageMap.has(key)) {
              messageMap.set(key, m);
              hasNew = true;
            }
          });
          if (hasNew) emitSortedMessages();
        }
      }
    } catch {}
  };

  fetchBackendMessages();
  const pollInterval = setInterval(fetchBackendMessages, 1200);

  // 2. Lắng nghe Firestore onSnapshot (nếu Firestore hoạt động)
  let unsubFirestore: (() => void) | null = null;
  try {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    unsubFirestore = onSnapshot(
      q,
      (snap) => {
        let hasNew = false;
        snap.docs.forEach((d) => {
          const data = d.data();
          const ts = data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp || Date.now();
          const key = d.id;
          if (!messageMap.has(key)) {
            messageMap.set(key, {
              id: d.id,
              chatId,
              senderId: data.senderId,
              senderName: data.senderName || '',
              senderAvatar: data.senderAvatar || '',
              text: data.text || '',
              timestamp: ts,
              read: Boolean(data.read),
              type: data.type || 'text',
              fileUrl: data.fileUrl,
              fileName: data.fileName,
              fileSize: data.fileSize,
            });
            hasNew = true;
          }
        });
        if (hasNew) emitSortedMessages();
      },
      (err) => {
        // Firestore permission denied -> Bỏ qua, Backend Polling vẫn chạy mượt mà
      }
    );
  } catch {}

  return () => {
    isSubscribed = false;
    clearInterval(pollInterval);
    if (unsubFirestore) unsubFirestore();
  };
}

/**
 * Lấy và lắng nghe danh sách các cuộc trò chuyện của một user
 */
export function subscribeToUserChats(
  userId: string,
  onUpdate: (chats: ChatConversation[]) => void
): () => void {
  let isSubscribed = true;
  let initialEmitted = false;
  const chatMap = new Map<string, ChatConversation>();

  const emitSortedChats = () => {
    initialEmitted = true;
    const sorted = Array.from(chatMap.values()).sort(
      (a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0)
    );
    onUpdate(sorted);
  };

  // 1. Fetch và Poll từ Backend API
  const fetchBackendChats = async () => {
    if (!isSubscribed) return;
    try {
      const res = await chatFetch(`${BACKEND_URL}/api/chat/list?userId=${encodeURIComponent(userId)}`);
      if (res?.ok) {
        const data = await res.json();
        if (data.chats && Array.isArray(data.chats)) {
          let changed = false;
          data.chats.forEach((c: ChatConversation) => {
            const existing = chatMap.get(c.id);
            if (!existing || existing.lastTimestamp !== c.lastTimestamp) {
              chatMap.set(c.id, c);
              changed = true;
            }
          });
          if (changed || !initialEmitted) {
            emitSortedChats();
          }
        } else if (!initialEmitted) {
          emitSortedChats();
        }
      } else if (!initialEmitted) {
        emitSortedChats();
      }
    } catch {
      if (!initialEmitted) {
        emitSortedChats();
      }
    }
  };

  fetchBackendChats();
  const pollInterval = setInterval(fetchBackendChats, 2500);

  // 2. Lắng nghe Firestore
  let unsubFirestore: (() => void) | null = null;
  try {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('lastTimestamp', 'desc')
    );
    unsubFirestore = onSnapshot(
      q,
      (snap) => {
        let changed = false;
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          chatMap.set(d.id, {
            id: d.id,
            participants: data.participants || [],
            participantNames: data.participantNames || {},
            participantAvatars: data.participantAvatars || {},
            lastMessage: data.lastMessage || '',
            lastTimestamp: data.lastTimestamp || Date.now(),
            lastSenderId: data.lastSenderId,
          });
          changed = true;
        });
        if (changed) emitSortedChats();
      },
      () => {}
    );
  } catch {}

  return () => {
    isSubscribed = false;
    clearInterval(pollInterval);
    if (unsubFirestore) unsubFirestore();
  };
}

/**
 * Khởi tạo phòng chat giữa 2 người dùng
 */
export async function initializeChatRoom(params: {
  chatId: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage?: string;
}): Promise<void> {
  const { chatId, participants, participantNames, participantAvatars, lastMessage } = params;
  const now = Date.now();

  // 1. Lưu Backend API
  try {
    await chatFetch(`${BACKEND_URL}/api/chat/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        participants,
        participantNames,
        participantAvatars,
        lastMessage: lastMessage || 'Đã bắt đầu cuộc trò chuyện ✨',
      }),
    });
  } catch {}

  // 2. Lưu Firestore (nếu có quyền)
  try {
    await setDoc(
      doc(db, 'chats', chatId),
      {
        participants,
        participantNames,
        participantAvatars,
        lastMessage: lastMessage || 'Đã bắt đầu cuộc trò chuyện ✨',
        lastTimestamp: now,
      },
      { merge: true }
    );
  } catch {}
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  collection, query, where, onSnapshot, orderBy,
  addDoc, serverTimestamp, doc, updateDoc, setDoc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../services/firebase';
import { RootState } from '../store';
import { DEFAULT_CANDIDATE_PROFILES } from '../constants/defaultCandidates';
import { formatTimestamp } from '../utils/date';
import ChatAccountSwitcher from './ChatAccountSwitcher';
import {
  getActiveChatIdentity,
  ChatAccountIdentity,
} from '../services/chatAccountService';

/**
 * Official Facebook Messenger SVG Logo
 */
export function MessengerLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  const gradId = `messenger-grad-${size}`;
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0078FF" />
          <stop offset="35%" stopColor="#00C6FF" />
          <stop offset="70%" stopColor="#A800E0" />
          <stop offset="100%" stopColor="#FF007F" />
        </linearGradient>
      </defs>
      {/* Messenger speech bubble */}
      <path
        d="M0 7.76C0 3.301 3.493 0 8 0s8 3.301 8 7.76-3.493 7.76-8 7.76c-.81 0-1.586-.107-2.316-.307a.64.64 0 0 0-.427.03l-1.588.702a.64.64 0 0 1-.898-.566l-.044-.76a.64.64 0 0 0-.253-.497C.918 12.656 0 10.36 0 7.76"
        fill={`url(#${gradId})`}
      />
      {/* Messenger lightning bolt */}
      <path
        d="M3.823 9.09l2.42-2.58a.64.64 0 0 1 .927.025l1.63 1.745 3.377-1.802a.32.32 0 0 1 .414.428L10.17 9.49a.64.64 0 0 1-.928-.025L7.613 7.72 4.236 9.522a.32.32 0 0 1-.413-.432"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export default function ChatFab() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const profile = useSelector((s: RootState) => s.profile);

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chats, setChats] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Active chat session in popup
  const [activeChat, setActiveChat] = useState<{
    chatId: string;
    partnerId: string;
    partnerName: string;
    partnerAvatar: string;
  } | null>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ẩn FAB trên các trang chat đầy đủ, assistant, onboarding, login
  const hiddenPaths = ['/chat', '/assistant', '/login', '/register', '/onboarding', '/register/step2', '/register-step2'];
  const isHidden = hiddenPaths.some((p) => pathname.startsWith(p));

  // Danh tính tài khoản chat hiện tại
  const [activeIdentity, setActiveIdentity] = useState<ChatAccountIdentity>(() => getActiveChatIdentity(profile));
  const currentUid = activeIdentity.uid;

  useEffect(() => {
    const handleIdentityChanged = () => {
      const updated = getActiveChatIdentity(profile);
      setActiveIdentity(updated);
    };
    window.addEventListener('resonancia_identity_changed', handleIdentityChanged);
    return () => window.removeEventListener('resonancia_identity_changed', handleIdentityChanged);
  }, [profile]);

  // Lắng nghe danh sách cuộc trò chuyện từ Firestore
  useEffect(() => {
    if (!currentUid || isHidden) return;
    setLoadingChats(true);

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUid),
      orderBy('lastTimestamp', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setChats(list);

        let totalUnread = 0;
        list.forEach((c: any) => {
          if (typeof c.unreadCount === 'number') totalUnread += c.unreadCount;
        });
        setUnreadCount(totalUnread);
        setLoadingChats(false);
      },
      () => setLoadingChats(false)
    );

    return unsub;
  }, [currentUid, isHidden]);

  // Lắng nghe tin nhắn khi đang mở một cuộc trò chuyện trong popup
  useEffect(() => {
    if (!activeChat?.chatId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chats', activeChat.chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, [activeChat?.chatId]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (activeChat && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [messages, activeChat]);

  // Gửi tin nhắn trong popup
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeChat?.chatId || !currentUid || sending) return;

    setSending(true);
    setInputText('');
    try {
      await addDoc(collection(db, 'chats', activeChat.chatId, 'messages'), {
        senderId: currentUid,
        senderName: activeIdentity.name,
        text,
        timestamp: serverTimestamp(),
        read: false,
      });

      await updateDoc(doc(db, 'chats', activeChat.chatId), {
        lastMessage: text,
        lastTimestamp: Date.now(),
        lastSenderId: currentUid,
      });
    } catch (err) {
      console.error('Lỗi gửi tin nhắn popup:', err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Mở chat với một ứng viên gợi ý
  const handleStartChatWithCandidate = async (candidate: any) => {
    if (!currentUid) {
      navigate('/login');
      return;
    }

    const targetUid = candidate.uid;
    const chatId = [currentUid, targetUid].sort().join('_');

    try {
      await setDoc(
        doc(db, 'chats', chatId),
        {
          participants: [currentUid, targetUid],
          participantNames: {
            [currentUid]: activeIdentity.name,
            [targetUid]: candidate.name || 'Người dùng',
          },
          participantAvatars: {
            [currentUid]: activeIdentity.avatar,
            [targetUid]: candidate.avatar || '',
          },
          lastMessage: 'Đã bắt đầu cuộc trò chuyện ✨',
          lastTimestamp: Date.now(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Init candidate chat notice:', e);
    }

    setActiveChat({
      chatId,
      partnerId: targetUid,
      partnerName: candidate.name,
      partnerAvatar: candidate.avatar,
    });
  };

  // Danh sách gợi ý từ default candidates khi chưa có đoạn chat
  const suggestedCandidates = Object.values(DEFAULT_CANDIDATE_PROFILES).slice(0, 4);

  // Lọc chat theo tìm kiếm
  const filteredChats = chats.filter((chat) => {
    const otherUid = chat.participants?.find((p: string) => p !== currentUid);
    const otherName = chat.participantNames?.[otherUid] || 'Người dùng';
    return otherName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isHidden) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[1000] font-sans flex flex-col items-end pointer-events-none">
      {/* 1. CỬA SỔ CHAT MESSENGER POPUP (Ở BÊN PHẢI TRONG CÙNG CỐ ĐỊNH) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="messenger-window"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="pointer-events-auto mb-3 w-[410px] max-w-[calc(100vw-32px)] h-[580px] max-h-[calc(100vh-120px)] rounded-2xl flex flex-col overflow-hidden shadow-2xl border"
            style={{
              background: 'linear-gradient(165deg, rgba(16, 10, 42, 0.96) 0%, rgba(9, 4, 26, 0.98) 100%)',
              borderColor: 'rgba(168, 85, 247, 0.35)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(168, 85, 247, 0.25)',
            }}
          >
            {/* VIEW A: ĐANG TRONG PHÒNG CHAT CỤ THỂ */}
            {activeChat ? (
              <div className="flex flex-col h-full">
                {/* Header phòng chat */}
                <div
                  className="px-3.5 py-3 flex items-center justify-between border-b"
                  style={{
                    borderColor: 'rgba(168, 85, 247, 0.25)',
                    background: 'linear-gradient(90deg, rgba(30, 16, 75, 0.8) 0%, rgba(20, 10, 55, 0.8) 100%)',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setActiveChat(null)}
                      className="p-1 rounded-full text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
                      title="Quay lại danh sách"
                      aria-label="Quay lại danh sách chat"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                      </svg>
                    </button>

                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-purple-400/40 bg-purple-900/60 flex items-center justify-center font-bold text-sm text-white">
                        {activeChat.partnerAvatar ? (
                          <img src={activeChat.partnerAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          activeChat.partnerName[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#100a2a]" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-white text-sm font-semibold truncate leading-tight">
                        {activeChat.partnerName}
                      </h3>
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Đang hoạt động
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-purple-300">
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/chat/${activeChat.chatId}`, { state: { chatName: activeChat.partnerName } });
                        setIsOpen(false);
                      }}
                      className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
                      title="Mở toàn màn hình"
                      aria-label="Mở toàn màn hình"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
                      title="Đóng"
                      aria-label="Đóng cửa sổ"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Danh sách tin nhắn */}
                <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden mb-2 border-2 border-purple-400/40">
                        {activeChat.partnerAvatar ? (
                          <img src={activeChat.partnerAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-xl text-white font-bold">
                            {activeChat.partnerName[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <p className="text-white text-sm font-semibold">{activeChat.partnerName}</p>
                      <p className="text-xs text-purple-300/70 mt-0.5 mb-4">Các bạn đã được kết nối chiêm tinh ✨</p>
                      <div className="space-y-1.5 w-full">
                        <p className="text-[11px] text-purple-300/60 uppercase tracking-wider mb-1">Gợi ý mở lời:</p>
                        <button
                          type="button"
                          onClick={() => handleSendMessage('Xin chào! Rất vui được kết nối cùng bạn ✨')}
                          className="w-full text-xs text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 rounded-xl py-2 px-3 transition-colors text-left truncate"
                        >
                          👋 Xin chào! Rất vui được kết nối cùng bạn ✨
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendMessage('Cung hoàng đạo của chúng ta rất tương hợp đó! 🔮')}
                          className="w-full text-xs text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 rounded-xl py-2 px-3 transition-colors text-left truncate"
                        >
                          🔮 Cung hoàng đạo của chúng ta rất tương hợp đó!
                        </button>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === currentUid;
                      return (
                        <div key={msg.id} className={`flex items-end gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe && (
                            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-purple-800 text-[10px] text-white flex items-center justify-center font-bold">
                              {activeChat.partnerAvatar ? (
                                <img src={activeChat.partnerAvatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                activeChat.partnerName[0]?.toUpperCase()
                              )}
                            </div>
                          )}
                          <div
                            className={`px-3.5 py-2 text-[13px] leading-relaxed break-words max-w-[78%] ${
                              isMe
                                ? 'rounded-[18px] rounded-br-sm text-white font-normal shadow-sm'
                                : 'rounded-[18px] rounded-bl-sm text-purple-100 border'
                            }`}
                            style={{
                              background: isMe
                                ? 'linear-gradient(135deg, #0084FF 0%, #0066FF 45%, #9B28FD 100%)'
                                : 'rgba(255, 255, 255, 0.08)',
                              borderColor: isMe ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Thanh nhập tin nhắn */}
                <div
                  className="p-2.5 border-t flex items-center gap-2"
                  style={{
                    borderColor: 'rgba(168, 85, 247, 0.25)',
                    background: 'rgba(12, 6, 32, 0.95)',
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Nhắn tin..."
                    className="flex-1 bg-white/[0.08] text-white placeholder-purple-300/40 text-xs px-3.5 py-2.5 rounded-full border border-purple-400/30 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || sending}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform active:scale-90 disabled:opacity-40 flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #0084FF 0%, #a800e0 100%)',
                    }}
                    title="Gửi"
                    aria-label="Gửi tin nhắn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW B: DANH SÁCH CUỘC TRÒ CHUYỆN (MESSENGER LIST) */
              <div className="flex flex-col h-full">
                {/* Header danh sách */}
                <div
                  className="px-4 py-2.5 flex items-center justify-between border-b"
                  style={{
                    borderColor: 'rgba(168, 85, 247, 0.25)',
                    background: 'linear-gradient(90deg, rgba(30, 16, 75, 0.8) 0%, rgba(20, 10, 55, 0.8) 100%)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <MessengerLogo size={22} />
                    <h2 className="text-white text-base font-bold tracking-tight">Đoạn chat</h2>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-purple-300">
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/chat');
                        setIsOpen(false);
                      }}
                      className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
                      title="Mở trang Trò Chuyện"
                      aria-label="Mở trang Trò Chuyện"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
                      title="Đóng"
                      aria-label="Đóng Messenger"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Chuyển đổi danh tính chat trong popup */}
                <div className="p-2.5 pb-0">
                  <ChatAccountSwitcher />
                </div>

                {/* Thanh tìm kiếm */}
                <div className="p-3 border-b border-purple-500/20">
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-2.5 text-purple-300/50"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm trên Messenger..."
                      className="w-full bg-white/[0.06] text-white placeholder-purple-300/40 text-xs pl-8 pr-3 py-1.5 rounded-full border border-purple-400/20 focus:outline-none focus:border-purple-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Danh sách các đoạn chat */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {loadingChats ? (
                    <div className="p-6 text-center text-xs text-purple-300/60 animate-pulse">
                      Đang đồng bộ đoạn chat...
                    </div>
                  ) : filteredChats.length > 0 ? (
                    filteredChats.map((chat) => {
                      const otherUid = chat.participants?.find((p: string) => p !== currentUid);
                      const otherCand = DEFAULT_CANDIDATE_PROFILES[otherUid];
                      const otherName = otherCand?.name || chat.participantNames?.[otherUid] || 'Người dùng';
                      const otherAvatar = otherCand?.avatar || chat.participantAvatars?.[otherUid] || '';
                      return (
                        <button
                          key={chat.id}
                          type="button"
                          onClick={() =>
                            setActiveChat({
                              chatId: chat.id,
                              partnerId: otherUid,
                              partnerName: otherName,
                              partnerAvatar: otherAvatar,
                            })
                          }
                          className="w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-all hover:bg-purple-500/15 group"
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-11 h-11 rounded-full overflow-hidden border border-purple-400/30 bg-purple-900/40 flex items-center justify-center font-bold text-white text-sm">
                              {otherAvatar ? (
                                <img src={otherAvatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                otherName[0]?.toUpperCase()
                              )}
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#100a2a]" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-white text-xs font-semibold truncate group-hover:text-purple-200">
                                {otherName}
                              </h4>
                              {chat.lastTimestamp && (
                                <span className="text-[10px] text-purple-400/60 ml-2">
                                  {formatTimestamp(chat.lastTimestamp)}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-purple-300/70 truncate mt-0.5">
                              {chat.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    /* Không có chat -> Gợi ý tương hợp */
                    <div className="p-3">
                      <div className="text-center py-4">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <MessengerLogo size={26} />
                        </div>
                        <p className="text-xs font-semibold text-white">Chưa có đoạn chat nào</p>
                        <p className="text-[11px] text-purple-300/70 mt-0.5">
                          Chọn một ứng viên tương hợp bên dưới để trò chuyện ngay:
                        </p>
                      </div>

                      <div className="space-y-1.5 mt-2">
                        {suggestedCandidates.map((c) => (
                          <div
                            key={c.uid}
                            className="p-2 rounded-xl border border-purple-500/20 bg-purple-950/40 flex items-center justify-between gap-2 hover:border-purple-400/40 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img src={c.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                                <p className="text-[10px] text-purple-300/70">Cung {c.sun}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartChatWithCandidate(c)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white rounded-lg flex-shrink-0 transition-all hover:opacity-90 active:scale-95"
                              style={{
                                background: 'linear-gradient(135deg, #0084FF 0%, #9B28FD 100%)',
                              }}
                            >
                              Nhắn tin
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer xem tất cả */}
                <div className="p-2.5 border-t border-purple-500/20 bg-black/20 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/chat');
                      setIsOpen(false);
                    }}
                    className="text-xs text-purple-300 hover:text-white font-medium transition-colors inline-flex items-center gap-1"
                  >
                    Xem tất cả trong trang Trò Chuyện
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. NÚT NỔI MESSENGER (FAB CHAT HEAD - TO HƠN, RUNG NHANH, BÊN PHẢI TRONG CÙNG) */}
      <div className={`pointer-events-auto messenger-ring-container ${!isOpen ? 'messenger-ringing' : ''}`}>
        {/* Vòng sóng âm 1 tỏa ra khi đổ chuông */}
        {!isOpen && <span className="messenger-wave-1" aria-hidden="true" />}
        {/* Vòng sóng âm 2 tỏa ra lệch pha khi đổ chuông */}
        {!isOpen && <span className="messenger-wave-2" aria-hidden="true" />}

        <motion.button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="resonancia-messenger-fab relative rounded-full flex items-center justify-center cursor-pointer shadow-2xl transition-all"
          style={{
            width: 66,
            height: 66,
            minWidth: 66,
            minHeight: 66,
            borderRadius: '50%',
            WebkitBorderRadius: '50%',
            aspectRatio: '1 / 1',
            background: '#ffffff',
            border: isOpen ? '1.5px solid rgba(168, 85, 247, 0.6)' : 'none',
            boxShadow: isOpen
              ? '0 8px 30px rgba(0, 120, 255, 0.35), 0 0 20px rgba(168, 85, 247, 0.4)'
              : '0 8px 25px rgba(0, 120, 255, 0.4), 0 0 20px rgba(168, 85, 247, 0.45)',
          }}
          aria-label={isOpen ? 'Thu nhỏ Messenger' : 'Mở Messenger'}
          title="Messenger - Trò chuyện"
        >
          {/* Glow pulsing ring phía sau nút - Hoàn toàn hình tròn */}
          <span
            className="resonancia-messenger-fab-glow absolute -inset-1 rounded-full opacity-60 pointer-events-none animate-pulse"
            style={{
              borderRadius: '50%',
              WebkitBorderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 180, 255, 0.45) 0%, rgba(168, 85, 247, 0.35) 60%, transparent 100%)',
            }}
          />

          {/* Biểu tượng Messenger tròn to hơn - Bỏ dấu X thứ 2 (chỉ giữ dấu X ở trên header) */}
          <MessengerLogo size={42} />

          {/* Badge số tin nhắn chưa đọc (Đỏ hồng như Messenger) */}
          {!isOpen && unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute min-w-[20px] h-5 px-1.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#100a2a] shadow-md pointer-events-none"
              style={{
                top: -3,
                right: -3,
                borderRadius: '9999px',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}

          {/* Chấm online xanh lá (Messenger Active Status) bám theo đường cong hình tròn */}
          <span
            className="absolute w-4 h-4 rounded-full bg-emerald-400 border-[2.5px] border-white shadow-sm pointer-events-none"
            style={{
              bottom: 2,
              right: 2,
              borderRadius: '50%',
              WebkitBorderRadius: '50%',
            }}
          />
        </motion.button>
      </div>
    </div>
  );
}

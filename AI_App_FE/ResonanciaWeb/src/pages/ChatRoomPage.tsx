import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  collection, query, orderBy, onSnapshot, addDoc,
  serverTimestamp, doc, updateDoc, setDoc, where
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../services/firebase';
import { RootState } from '../store';
import { formatTimestamp } from '../utils/date';
import { DEFAULT_CANDIDATE_PROFILES } from '../constants/defaultCandidates';
import { MessengerLogo } from '../components/ChatFab';
import ChatAccountSwitcher from '../components/ChatAccountSwitcher';
import {
  getActiveChatIdentity,
  setActiveChatIdentity,
  ChatAccountIdentity,
} from '../services/chatAccountService';

export default function ChatRoomPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useSelector((s: RootState) => s.profile);

  // Danh tính tài khoản đang chat (Hỗ trợ đổi nick để chat 2 chiều thật)
  const [activeIdentity, setActiveIdentity] = useState<ChatAccountIdentity>(() => getActiveChatIdentity(profile));
  const currentUid = activeIdentity.uid;

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [chats, setChats] = useState<any[]>([]);
  const [currentChatDoc, setCurrentChatDoc] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lắng nghe sự kiện chuyển đổi danh tính
  useEffect(() => {
    const handleIdentityChanged = () => {
      const updated = getActiveChatIdentity(profile);
      setActiveIdentity(updated);
      setToastMsg(`Đã chuyển sang chat với tư cách: ${updated.name} ✨`);
      setTimeout(() => setToastMsg(''), 3000);
    };
    window.addEventListener('resonancia_identity_changed', handleIdentityChanged);
    return () => window.removeEventListener('resonancia_identity_changed', handleIdentityChanged);
  }, [profile]);

  // ============================================================
  // XÁC ĐỊNH ĐỐI PHƯƠNG CHÍNH XÁC (KHẮC PHỤC BUG SPLIT DẤU GẠCH DƯỚI)
  // ============================================================
  let otherUid = '';
  if (chatId && currentUid) {
    if (chatId.startsWith(currentUid + '_')) {
      otherUid = chatId.slice(currentUid.length + 1);
    } else if (chatId.endsWith('_' + currentUid)) {
      otherUid = chatId.slice(0, chatId.length - currentUid.length - 1);
    } else {
      const matched = Object.keys(DEFAULT_CANDIDATE_PROFILES).find(
        (k) => chatId.includes(k) && k !== currentUid
      );
      if (matched) otherUid = matched;
    }
  }

  if (!otherUid && currentChatDoc?.participants) {
    otherUid = currentChatDoc.participants.find((p: string) => p !== currentUid) || '';
  }

  const defaultCand = DEFAULT_CANDIDATE_PROFILES[otherUid];

  const partnerName =
    defaultCand?.name ||
    currentChatDoc?.participantNames?.[otherUid] ||
    (location.state as any)?.chatName ||
    'Người dùng';

  const partnerAvatar =
    defaultCand?.avatar ||
    currentChatDoc?.participantAvatars?.[otherUid] ||
    (otherUid === (profile.uid || auth.currentUser?.uid)
      ? profile.avatar || auth.currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
      : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80');

  const partnerZodiac = defaultCand?.zodiac || defaultCand?.sun || 'Song Ngư';
  const partnerElement = defaultCand?.element || 'Nước';
  const partnerJob = defaultCand?.job || 'Thành viên Resonancia';
  const partnerBio = defaultCand?.bio || 'Tâm hồn chiêm tinh đồng điệu, cùng bạn khám phá vũ trụ nội tâm ✨';

  // 1. Tải thông tin chat hiện tại
  useEffect(() => {
    if (!currentUid || !chatId) return;

    const unsubChat = onSnapshot(doc(db, 'chats', chatId), (snap) => {
      if (snap.exists()) {
        setCurrentChatDoc(snap.data());
      }
    });
    return () => unsubChat();
  }, [chatId, currentUid]);

  // 2. Lắng nghe danh sách đoạn chat bên cột trái (Messenger Sidebar)
  useEffect(() => {
    if (!currentUid) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUid),
      orderBy('lastTimestamp', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, [currentUid]);

  // 3. Lắng nghe luồng tin nhắn real-time
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, [chatId]);

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Hàm gửi tin nhắn văn bản
  const handleSendText = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || !chatId || !currentUid || sending) return;

    setSending(true);
    setInput('');
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: currentUid,
        senderName: activeIdentity.name,
        text,
        timestamp: serverTimestamp(),
        read: false,
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastTimestamp: Date.now(),
        lastSenderId: currentUid,
        participantNames: {
          ...(currentChatDoc?.participantNames || {}),
          [currentUid]: activeIdentity.name,
          [otherUid]: partnerName,
        },
        participantAvatars: {
          ...(currentChatDoc?.participantAvatars || {}),
          [currentUid]: activeIdentity.avatar,
          [otherUid]: partnerAvatar,
        },
      });
    } catch (e) {
      console.error('Lỗi gửi tin nhắn:', e);
      setToastMsg('Không gửi được tin nhắn. Vui lòng thử lại!');
      setTimeout(() => setToastMsg(''), 3000);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendText();
    }
  };

  // Mở chat nhanh với ứng viên từ danh sách gợi ý
  const handleStartChatWith = async (candidate: any) => {
    if (!currentUid) return;
    const targetUid = candidate.uid;
    const newChatId = [currentUid, targetUid].sort().join('_');

    try {
      await setDoc(
        doc(db, 'chats', newChatId),
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
      console.warn('Init chat warning:', e);
    }

    navigate(`/chat/${newChatId}`, { state: { chatName: candidate.name } });
  };

  // Nút chuyển vai nhanh sang đối phương để test nhắn tin 2 chiều thật
  const handleSwitchToPartner = () => {
    if (!otherUid) return;
    setActiveChatIdentity(otherUid);
  };

  const showCallFeatureNotice = (type: 'thoại' | 'video') => {
    setToastMsg(`Tính năng gọi ${type} vũ trụ đang chuẩn bị ra mắt ✨`);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Lọc chat tìm kiếm
  const filteredChats = chats.filter((c) => {
    const oUid = c.participants?.find((p: string) => p !== currentUid);
    const name = c.participantNames?.[oUid] || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const topCandidates = Object.values(DEFAULT_CANDIDATE_PROFILES).slice(0, 6);

  return (
    <div className="w-full h-[calc(100vh-7.5rem)] min-h-[580px] max-h-[920px] rounded-3xl overflow-hidden flex flex-col md:flex-row relative shadow-2xl border border-purple-500/25"
      style={{
        background: 'linear-gradient(155deg, rgba(22, 14, 75, 0.94) 0%, rgba(14, 8, 50, 0.96) 50%, rgba(8, 4, 32, 0.98) 100%)',
        backdropFilter: 'blur(30px)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 40px rgba(120, 80, 255, 0.18)',
      }}
    >
      {/* ============================================================ */}
      {/* CỘT TRÁI: DANH SÁCH ĐOẠN CHAT (MESSENGER SIDEBAR KÍNH MỜ) */}
      {/* ============================================================ */}
      <div
        className="hidden md:flex w-[320px] lg:w-[350px] flex-shrink-0 flex-col h-full relative z-10"
        style={{
          background: 'linear-gradient(180deg, rgba(16, 10, 48, 0.85) 0%, rgba(10, 6, 36, 0.9) 100%)',
          boxShadow: '8px 0 25px -5px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Header Đoạn chat & Bộ chuyển đổi danh tính */}
        <div className="p-3.5 pb-2.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessengerLogo size={28} />
              <h1 className="text-white font-bold text-lg tracking-tight">Đoạn chat</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate('/match')}
              className="p-1.5 rounded-full hover:bg-white/10 text-purple-200 hover:text-white transition-colors cursor-pointer"
              title="Khám phá người tương hợp mới"
              aria-label="Khám phá người tương hợp mới"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          {/* CHAT IDENTITY SWITCHER (ĐỔI NICK NHẮN TIN 2 CHIỀU THẬT) */}
          <ChatAccountSwitcher />
        </div>

        {/* Thanh tìm kiếm kính mờ */}
        <div className="px-3.5 py-2">
          <div className="relative">
            <svg
              className="absolute left-3 top-2.5 text-purple-200/50"
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
              className="w-full bg-white/[0.06] text-white placeholder-purple-200/40 text-xs pl-8 pr-3 py-2 rounded-full border border-purple-400/25 focus:outline-none focus:border-purple-300 focus:bg-white/[0.09] transition-all"
            />
          </div>
        </div>

        {/* Hàng ngang: Bạn bè đang hoạt động */}
        <div className="px-3 py-2 overflow-x-auto no-scrollbar flex items-center gap-3">
          {topCandidates.map((c) => {
            const isCurrent = c.uid === otherUid;
            return (
              <button
                key={c.uid}
                type="button"
                onClick={() => handleStartChatWith(c)}
                className="flex flex-col items-center flex-shrink-0 group focus:outline-none cursor-pointer"
                title={`Nhắn tin với ${c.name}`}
              >
                <div className="relative">
                  <div
                    className={`w-11 h-11 rounded-full p-[2px] transition-transform group-hover:scale-105 shadow-md ${
                      isCurrent
                        ? 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-500 shadow-blue-500/40'
                        : 'bg-gradient-to-tr from-purple-400/30 to-pink-500/30 group-hover:from-purple-400 group-hover:to-cyan-400'
                    }`}
                  >
                    <img src={c.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#100a2a]" />
                </div>
                <span className={`text-[11px] truncate w-12 text-center mt-1 font-medium transition-colors ${
                  isCurrent ? 'text-cyan-300 font-bold' : 'text-purple-200/80 group-hover:text-white'
                }`}>
                  {c.name.split(' ').slice(-1)[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Danh sách các đoạn chat */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1.5 resonancia-scrollbar">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const oUid = chat.participants?.find((p: string) => p !== currentUid);
              const oCand = DEFAULT_CANDIDATE_PROFILES[oUid];
              const oName = oCand?.name || chat.participantNames?.[oUid] || 'Người dùng';
              const oAvatar = oCand?.avatar || chat.participantAvatars?.[oUid];
              const isSelected = chat.id === chatId;

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => navigate(`/chat/${chat.id}`, { state: { chatName: oName } })}
                  className={`w-full p-2.5 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.12] border border-purple-400/40 shadow-lg'
                      : 'hover:bg-white/[0.06] border border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/25 bg-purple-900/60 shadow-md">
                      {oAvatar ? (
                        <img src={oAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white text-base">
                          {oName[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#100a2a]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-purple-100'}`}>
                        {oName}
                      </h3>
                      {chat.lastTimestamp && (
                        <span className="text-[10px] text-purple-300/60 ml-2">
                          {formatTimestamp(chat.lastTimestamp)}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-purple-200 font-medium' : 'text-purple-200/60'}`}>
                      {chat.lastSenderId === currentUid ? 'Bạn: ' : ''}
                      {chat.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 my-3 text-center text-xs text-purple-200/70 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
              <p className="font-semibold text-white mb-1">Chưa có đoạn chat nào</p>
              <p>Chọn một người bạn ở trên để bắt đầu trò chuyện định mệnh ✨</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* CỘT PHẢI: KHUNG CHAT CHÍNH (MESSENGER MAIN CHAT WINDOW) */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col h-full relative"
        style={{
          background: 'radial-gradient(ellipse at 80% 20%, rgba(70, 35, 140, 0.25) 0%, transparent 60%)',
        }}
      >
        {/* Header Khung Chat Sang Trọng (Loại bỏ đường kẻ khô cứng) */}
        <div
          className="px-5 py-3.5 flex items-center justify-between flex-shrink-0 relative z-20 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(180deg, rgba(35, 20, 85, 0.75) 0%, rgba(20, 12, 60, 0.6) 100%)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25), inset 0 -1px 0 rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Thông tin đối phương */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="md:hidden p-1.5 rounded-full hover:bg-white/10 text-purple-200 hover:text-white transition-colors cursor-pointer"
              title="Quay lại danh sách"
              aria-label="Quay lại danh sách"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>

            <div
              className="relative flex-shrink-0 cursor-pointer group"
              onClick={() => otherUid && navigate(`/user/${otherUid}`)}
              title="Xem trang cá nhân"
            >
              <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 shadow-md group-hover:scale-105 transition-transform">
                <img src={partnerAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#100a2a]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  onClick={() => otherUid && navigate(`/user/${otherUid}`)}
                  className="text-white font-bold text-base truncate hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {partnerName}
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/25 border border-purple-400/35 text-purple-100 font-semibold shadow-sm">
                  Cung {partnerZodiac} · {partnerElement}
                </span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  ✨ 100% Green Flag
                </span>
              </div>
              <p className="text-[11.5px] text-emerald-400 flex items-center gap-1.5 leading-tight mt-0.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Đang trực tuyến trên Resonancia
              </p>
            </div>
          </div>

          {/* Các nút tương tác & Nút Chuyển Vai Nhanh */}
          <div className="flex items-center gap-2 text-purple-200">
            {/* NÚT THẦN KỲ: ĐÓNG VAI ĐỐI PHƯƠNG ĐỂ TRẢ LỜI NGAY */}
            <button
              type="button"
              onClick={handleSwitchToPartner}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.8) 0%, rgba(168, 85, 247, 0.8) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
              title={`Đổi sang nick ${partnerName} để tự gõ tin nhắn trả lời lại`}
            >
              <span>Đổi sang nick {partnerName}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => showCallFeatureNotice('thoại')}
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Cuộc gọi thoại"
              aria-label="Cuộc gọi thoại"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => showCallFeatureNotice('video')}
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Cuộc gọi video"
              aria-label="Cuộc gọi video"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => otherUid && navigate(`/user/${otherUid}`)}
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Xem thông tin chiêm tinh chi tiết"
              aria-label="Xem thông tin chi tiết"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Vùng hiển thị tin nhắn (Message Thread) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3.5 resonancia-scrollbar">
          {/* Card giới thiệu đầu cuộc trò chuyện (Cosmic Destiny Card - XÓA BỎ CHỮ H ĐƠN ĐIỆU) */}
          <div className="py-6 px-6 mx-auto max-w-lg flex flex-col items-center justify-center text-center rounded-3xl mb-4"
            style={{
              background: 'linear-gradient(145deg, rgba(40, 24, 100, 0.45) 0%, rgba(20, 12, 60, 0.5) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div className="relative mb-3.5">
              <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 shadow-2xl">
                <img src={partnerAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#100a2a]" />
            </div>

            <h3 className="text-white font-extrabold text-xl tracking-tight">{partnerName}</h3>
            <p className="text-purple-200/90 text-xs mt-1 font-medium">{partnerJob}</p>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] px-3 py-0.5 rounded-full bg-purple-500/25 border border-purple-400/30 text-purple-200">
                Cung {partnerZodiac} · {partnerElement}
              </span>
              <span className="text-[11px] px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-semibold">
                Tương hợp 100% 💚
              </span>
            </div>

            <p className="text-purple-200/80 text-xs mt-3 italic leading-relaxed max-w-sm px-2">
              "{partnerBio}"
            </p>

            <p className="text-[11.5px] text-purple-200/90 mt-4 bg-white/[0.08] px-4 py-1.5 rounded-full border border-purple-400/30 shadow-sm">
              Các bạn đã kết nối định mệnh trên Resonancia ✨ Hãy gửi lời chào đầu tiên!
            </p>
          </div>

          {/* Luồng tin nhắn thực tế 2 chiều */}
          <AnimatePresence>
            {messages.map((msg) => {
              const isMine = msg.senderId === currentUid;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18 }}
                  className={`flex items-end gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/20 shadow-sm bg-purple-900/60">
                      <img src={partnerAvatar} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[72%]`}>
                    <div
                      className={`px-4 py-2.5 text-[14px] leading-relaxed break-words shadow-md transition-all ${
                        isMine
                          ? 'rounded-2xl rounded-br-xs text-white font-normal'
                          : 'rounded-2xl rounded-bl-xs text-slate-100 border'
                      }`}
                      style={{
                        background: isMine
                          ? 'linear-gradient(135deg, #0084FF 0%, #0066FF 45%, #9B28FD 100%)'
                          : 'rgba(255, 255, 255, 0.08)',
                        borderColor: isMine ? 'transparent' : 'rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: isMine
                          ? '0 6px 18px rgba(0, 132, 255, 0.35)'
                          : '0 4px 12px rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      {msg.text}
                    </div>

                    <span className="text-[10px] text-purple-300/60 mt-1 px-1 font-medium">
                      {msg.timestamp?.seconds
                        ? formatTimestamp(msg.timestamp.seconds * 1000)
                        : 'Vừa xong'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Thanh gợi ý mở lời phong cách chiêm tinh */}
        {messages.length <= 1 && (
          <div className="px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-purple-200/70 whitespace-nowrap font-medium">Gợi ý mở lời:</span>
            <button
              type="button"
              onClick={() => handleSendText(`Xin chào ${partnerName}! Rất vui được kết nối cùng bạn ✨`)}
              className="text-xs text-purple-100 bg-white/[0.08] hover:bg-white/[0.16] border border-purple-400/30 rounded-full py-1.5 px-3.5 whitespace-nowrap transition-all shadow-sm cursor-pointer"
            >
              👋 Chào bạn, rất vui được kết nối!
            </button>
            <button
              type="button"
              onClick={() => handleSendText(`Cung ${partnerZodiac} và cung của mình rất tương hợp đó! 🔮`)}
              className="text-xs text-purple-100 bg-white/[0.08] hover:bg-white/[0.16] border border-purple-400/30 rounded-full py-1.5 px-3.5 whitespace-nowrap transition-all shadow-sm cursor-pointer"
            >
              🔮 Cung {partnerZodiac} và cung của mình rất hợp nhau!
            </button>
            <button
              type="button"
              onClick={() => handleSendText('Bạn có tin vào định mệnh chiêm tinh học không? ✨')}
              className="text-xs text-purple-100 bg-white/[0.08] hover:bg-white/[0.16] border border-purple-400/30 rounded-full py-1.5 px-3.5 whitespace-nowrap transition-all shadow-sm cursor-pointer"
            >
              ✨ Bạn có tin vào định mệnh chiêm tinh học không?
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* THANH NHẬP TIN NHẮN (FLOATING GLASS CAPSULE INPUT) */}
        {/* ============================================================ */}
        <div className="p-4 pt-2 flex items-center gap-2.5 flex-shrink-0">
          {/* Nút gửi ảnh */}
          <button
            type="button"
            onClick={() => setToastMsg('Tính năng gửi ảnh chiêm tinh đang được hoàn thiện!')}
            className="p-2.5 rounded-full hover:bg-white/10 text-purple-200 hover:text-white transition-colors flex-shrink-0 cursor-pointer"
            title="Đính kèm hình ảnh"
            aria-label="Đính kèm hình ảnh"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Nút biểu tượng cảm xúc / Sticker */}
          <button
            type="button"
            onClick={() => setToastMsg('Biểu tượng cảm xúc vũ trụ đang tải ✨')}
            className="p-2.5 rounded-full hover:bg-white/10 text-purple-200 hover:text-white transition-colors flex-shrink-0 cursor-pointer"
            title="Chọn biểu tượng cảm xúc"
            aria-label="Chọn biểu tượng cảm xúc"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>

          {/* Ô nhập tin nhắn dạng Glass Pill */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Nhắn tin với ${partnerName} bằng tư cách ${activeIdentity.name}...`}
              className="w-full bg-white/[0.08] text-white placeholder-purple-200/40 text-sm px-5 py-3 rounded-full border border-purple-400/35 focus:outline-none focus:border-cyan-400 focus:bg-white/[0.12] transition-all shadow-inner"
            />
          </div>

          {/* Nút Gửi / Thích */}
          {input.trim() ? (
            <button
              type="button"
              onClick={() => handleSendText()}
              disabled={sending}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white transition-all active:scale-90 hover:scale-105 flex-shrink-0 shadow-lg cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #0084FF 0%, #0066FF 45%, #9B28FD 100%)',
                boxShadow: '0 4px 18px rgba(0, 132, 255, 0.45)',
              }}
              title="Gửi tin nhắn"
              aria-label="Gửi tin nhắn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSendText('👍')}
              className="w-11 h-11 rounded-full flex items-center justify-center text-blue-400 hover:text-blue-300 hover:bg-white/10 transition-transform active:scale-90 flex-shrink-0 text-2xl cursor-pointer"
              title="Gửi nút thích"
              aria-label="Gửi nút thích"
            >
              👍
            </button>
          )}
        </div>
      </div>

      {/* Floating feedback toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-4 right-4 z-50 px-4 py-2.5 rounded-2xl text-xs text-white shadow-2xl flex items-center gap-2 border border-purple-400/40"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 16, 75, 0.96) 0%, rgba(18, 10, 50, 0.98) 100%)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(168, 85, 247, 0.3)',
            }}
          >
            <span>✨</span>
            <span className="font-medium">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

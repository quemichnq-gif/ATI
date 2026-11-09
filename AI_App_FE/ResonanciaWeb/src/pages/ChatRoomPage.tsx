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

export default function ChatRoomPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useSelector((s: RootState) => s.profile);

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [chats, setChats] = useState<any[]>([]);
  const [currentChatDoc, setCurrentChatDoc] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUid = profile.uid || auth.currentUser?.uid;

  // Xác định UID của đối phương từ chatId
  const otherUid = chatId?.split('_').find((u) => u !== currentUid) || '';
  const defaultCand = DEFAULT_CANDIDATE_PROFILES[otherUid];

  const partnerName =
    defaultCand?.name ||
    (location.state as any)?.chatName ||
    currentChatDoc?.participantNames?.[otherUid] ||
    'Người dùng';

  const partnerAvatar =
    defaultCand?.avatar ||
    currentChatDoc?.participantAvatars?.[otherUid] ||
    '';

  const partnerZodiac = defaultCand?.zodiac || defaultCand?.sun || '';
  const partnerJob = defaultCand?.job || 'Thành viên Resonancia';

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
        senderName: profile.name || auth.currentUser?.displayName || 'Bạn',
        text,
        timestamp: serverTimestamp(),
        read: false,
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastTimestamp: Date.now(),
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
            [currentUid]: profile.name || auth.currentUser?.displayName || 'Người dùng',
            [targetUid]: candidate.name || 'Người dùng',
          },
          participantAvatars: {
            [currentUid]: profile.avatar || auth.currentUser?.photoURL || '',
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
    <div className="w-full h-[calc(100vh-7.5rem)] min-h-[580px] max-h-[920px] resonancia-messenger-frame overflow-hidden flex flex-col md:flex-row relative">
      {/* ============================================================ */}
      {/* CỘT TRÁI: DANH SÁCH ĐOẠN CHAT (MESSENGER SIDEBAR) */}
      {/* ============================================================ */}
      <div className="hidden md:flex w-[320px] lg:w-[350px] flex-shrink-0 flex-col border-r border-purple-400/20 bg-black/15 h-full">
        {/* Header Đoạn chat */}
        <div className="p-4 border-b border-purple-400/20 flex items-center justify-between">
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

        {/* Thanh tìm kiếm */}
        <div className="p-3 border-b border-purple-400/15">
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
              className="w-full bg-black/25 text-white placeholder-purple-200/40 text-xs pl-8 pr-3 py-2 rounded-full border border-purple-400/30 focus:outline-none focus:border-purple-300 transition-colors"
            />
          </div>
        </div>

        {/* Hàng ngang: Bạn bè đang hoạt động (ĐÃ BỎ THANH CUỘN TÍM BỊ LỖI) */}
        <div className="px-3 py-3 border-b border-purple-400/15 overflow-x-auto no-scrollbar flex items-center gap-3">
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
                    className={`w-11 h-11 rounded-full p-[2px] transition-transform group-hover:scale-105 shadow-sm ${
                      isCurrent
                        ? 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-500 shadow-md shadow-blue-500/30'
                        : 'bg-purple-400/40 group-hover:bg-cyan-400/60'
                    }`}
                  >
                    <img src={c.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1c1560]" />
                </div>
                <span className="text-[11px] text-purple-200/90 truncate w-12 text-center mt-1 group-hover:text-white font-medium">
                  {c.name.split(' ').slice(-1)[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Danh sách các đoạn chat */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 resonancia-scrollbar">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const oUid = chat.participants?.find((p: string) => p !== currentUid);
              const oName = chat.participantNames?.[oUid] || 'Người dùng';
              const oAvatar = chat.participantAvatars?.[oUid];
              const isSelected = chat.id === chatId;

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => navigate(`/chat/${chat.id}`, { state: { chatName: oName } })}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-l-4 border-blue-400 shadow-sm'
                      : 'hover:bg-white/10 border-l-4 border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-purple-400/40 bg-purple-900/60 flex items-center justify-center font-bold text-white text-base">
                      {oAvatar ? (
                        <img src={oAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        oName[0]?.toUpperCase()
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1c1560]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-purple-100'}`}>
                        {oName}
                      </h3>
                      {chat.lastTimestamp && (
                        <span className="text-[10px] text-purple-300/70 ml-2">
                          {formatTimestamp(chat.lastTimestamp)}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-purple-200' : 'text-purple-200/70'}`}>
                      {chat.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 my-2 text-center text-xs text-purple-200/70 bg-white/[0.04] rounded-xl border border-purple-400/20">
              <p className="font-semibold text-white mb-1">Chưa có đoạn chat nào</p>
              <p>Hãy chọn người bạn tương hợp ở trên để bắt đầu trò chuyện ✨</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* CỘT PHẢI: KHUNG CHAT CHÍNH (MESSENGER MAIN CHAT WINDOW) */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col h-full bg-black/10">
        {/* Header Khung Chat */}
        <div
          className="px-4 py-3 border-b border-purple-400/20 flex items-center justify-between flex-shrink-0"
          style={{
            background: 'linear-gradient(180deg, rgba(80, 60, 180, 0.22) 0%, rgba(30, 20, 80, 0.3) 100%)',
          }}
        >
          {/* Thông tin đối phương */}
          <div className="flex items-center gap-3 min-w-0">
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

            <div className="relative flex-shrink-0 cursor-pointer" onClick={() => otherUid && navigate(`/user/${otherUid}`)}>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-300/40 bg-purple-900/60 flex items-center justify-center font-bold text-white text-base shadow-sm">
                {partnerAvatar ? (
                  <img src={partnerAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  partnerName[0]?.toUpperCase()
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#1c1560]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  onClick={() => otherUid && navigate(`/user/${otherUid}`)}
                  className="text-white font-bold text-sm truncate hover:underline cursor-pointer"
                >
                  {partnerName}
                </h2>
                {partnerZodiac && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/25 border border-purple-300/30 text-purple-100 font-medium">
                    {partnerZodiac}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 leading-tight mt-0.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Đang hoạt động trên Resonancia
              </p>
            </div>
          </div>

          {/* Các nút chức năng kiểu Messenger: Gọi thoại, Gọi video, Xem thông tin */}
          <div className="flex items-center gap-1 text-purple-200">
            <button
              type="button"
              onClick={() => showCallFeatureNotice('thoại')}
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Bắt đầu cuộc gọi thoại"
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
              title="Bắt đầu cuộc gọi video"
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
              title="Xem thông tin hồ sơ & Bản đồ sao"
              aria-label="Xem thông tin hồ sơ"
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3 resonancia-scrollbar">
          {/* Card giới thiệu đầu cuộc trò chuyện (Kiểu Messenger) */}
          <div className="py-6 flex flex-col items-center justify-center text-center border-b border-purple-400/20 mb-4">
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-300/50 shadow-2xl bg-purple-900/60 flex items-center justify-center font-bold text-2xl text-white">
                {partnerAvatar ? (
                  <img src={partnerAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  partnerName[0]?.toUpperCase()
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#1c1560]" />
            </div>

            <h3 className="text-white font-bold text-lg">{partnerName}</h3>
            <p className="text-purple-200/80 text-xs mt-0.5 max-w-sm">{partnerJob}</p>
            {partnerZodiac && (
              <p className="text-[11px] text-purple-300 mt-1 font-medium">Cung hoàng đạo: {partnerZodiac}</p>
            )}
            <p className="text-[12px] text-purple-200/80 mt-2.5 bg-white/[0.06] px-3.5 py-1 rounded-full border border-purple-400/30 shadow-sm">
              Các bạn đã kết nối trên Resonancia ✨ Hãy gửi lời chào đầu tiên!
            </p>
          </div>

          {/* Luồng tin nhắn */}
          <AnimatePresence>
            {messages.map((msg) => {
              const isMine = msg.senderId === currentUid;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-purple-900/60 text-white text-xs flex items-center justify-center font-bold border border-purple-300/40">
                      {partnerAvatar ? (
                        <img src={partnerAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        partnerName[0]?.toUpperCase()
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    <div
                      className={`px-4 py-2.5 text-[13.5px] leading-relaxed break-words shadow-sm ${
                        isMine
                          ? 'rounded-2xl rounded-br-sm text-white font-normal'
                          : 'rounded-2xl rounded-bl-sm text-slate-100 border'
                      }`}
                      style={{
                        background: isMine
                          ? 'linear-gradient(135deg, #0084FF 0%, #0066FF 45%, #9B28FD 100%)'
                          : 'rgba(255, 255, 255, 0.08)',
                        borderColor: isMine ? 'transparent' : 'rgba(255, 255, 255, 0.14)',
                      }}
                    >
                      {msg.text}
                    </div>

                    <span className="text-[10px] text-purple-300/60 mt-1 px-1">
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

        {/* Thanh gợi ý mở lời nếu chưa có tin */}
        {messages.length <= 1 && (
          <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-purple-400/15">
            <span className="text-[11px] text-purple-200/70 whitespace-nowrap font-medium">Gợi ý:</span>
            <button
              type="button"
              onClick={() => handleSendText(`Xin chào ${partnerName}! Rất vui được kết nối cùng bạn ✨`)}
              className="text-xs text-purple-100 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-full py-1 px-3 whitespace-nowrap transition-colors cursor-pointer"
            >
              👋 Chào bạn, rất vui được kết nối!
            </button>
            <button
              type="button"
              onClick={() => handleSendText('Cung hoàng đạo của chúng ta rất tương hợp đó! 🔮')}
              className="text-xs text-purple-100 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-full py-1 px-3 whitespace-nowrap transition-colors cursor-pointer"
            >
              🔮 Cung hoàng đạo của chúng ta rất hợp nhau!
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* THANH NHẬP TIN NHẮN (MESSENGER FOOTER INPUT) */}
        {/* ============================================================ */}
        <div
          className="p-3 border-t border-purple-400/20 flex items-center gap-2.5 flex-shrink-0"
          style={{
            background: 'linear-gradient(180deg, rgba(30, 20, 80, 0.5) 0%, rgba(20, 12, 60, 0.7) 100%)',
          }}
        >
          {/* Nút gửi ảnh */}
          <button
            type="button"
            onClick={() => setToastMsg('Tính năng gửi ảnh chiêm tinh đang được hoàn thiện!')}
            className="p-2 rounded-full hover:bg-white/10 text-purple-200 hover:text-white transition-colors flex-shrink-0 cursor-pointer"
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
            className="p-2 rounded-full hover:bg-white/10 text-purple-200 hover:text-white transition-colors flex-shrink-0 cursor-pointer"
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

          {/* Ô nhập tin nhắn */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              className="w-full bg-black/25 text-white placeholder-purple-200/40 text-sm px-4 py-2.5 rounded-full border border-purple-400/30 focus:outline-none focus:border-purple-300 transition-colors"
            />
          </div>

          {/* Nút Thích (Like 👍) khi trống hoặc Nút Gửi khi có nội dung */}
          {input.trim() ? (
            <button
              type="button"
              onClick={() => handleSendText()}
              disabled={sending}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform active:scale-90 flex-shrink-0 shadow-lg cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #0084FF 0%, #0066FF 50%, #9B28FD 100%)',
              }}
              title="Gửi tin nhắn"
              aria-label="Gửi tin nhắn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSendText('👍')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-blue-400 hover:text-blue-300 hover:bg-white/10 transition-transform active:scale-90 flex-shrink-0 text-xl cursor-pointer"
              title="Gửi biểu tượng thích"
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 right-4 z-50 px-4 py-2 rounded-xl text-xs text-white shadow-xl flex items-center gap-2 border border-purple-400/40"
            style={{ background: 'rgba(26, 10, 55, 0.95)' }}
          >
            <span>✨</span>
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../services/firebase';
import { RootState } from '../store';
import { formatTimestamp } from '../utils/date';
import { DEFAULT_CANDIDATE_PROFILES } from '../constants/defaultCandidates';
import { getTestProfileByEmailOrUid } from '../constants/testAccounts';
import { MessengerLogo } from '../components/ChatFab';
import {
  sendChatMessage,
  subscribeToChatMessages,
  subscribeToUserChats,
  initializeChatRoom,
  deleteChatConversation,
  ChatMessage,
  ChatConversation,
} from '../services/realtimeChatService';

export default function ChatRoomPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useSelector((s: RootState) => s.profile);

  // Danh tính tài khoản đang đăng nhập
  const currentUid = profile.uid || auth.currentUser?.uid || '';
  const currentUserName = profile.name || auth.currentUser?.displayName || 'Người dùng';
  const currentUserAvatar = profile.avatar || auth.currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [deletingChatName, setDeletingChatName] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // XÁC ĐỊNH DANH TÍNH CỦA MÌNH & ĐỐI PHƯƠNG CHÍNH XÁC (ALIAS-AWARE)
  // ============================================================
  const myTestAcc = getTestProfileByEmailOrUid(currentUid) || getTestProfileByEmailOrUid(profile.email || '') || getTestProfileByEmailOrUid(profile.uid || '');
  const myAliases = new Set([
    currentUid,
    profile.uid || '',
    auth.currentUser?.uid || '',
    ...(myTestAcc?.aliasUids || []),
  ].filter(Boolean));

  let otherUid = '';
  if (chatId) {
    const parts = chatId.split('_');
    if (parts.length === 2) {
      if (myAliases.has(parts[0])) {
        otherUid = parts[1];
      } else if (myAliases.has(parts[1])) {
        otherUid = parts[0];
      }
    }
    if (!otherUid && currentUid) {
      if (chatId.startsWith(currentUid + '_')) {
        otherUid = chatId.slice(currentUid.length + 1);
      } else if (chatId.endsWith('_' + currentUid)) {
        otherUid = chatId.slice(0, chatId.length - currentUid.length - 1);
      } else {
        const matched = Object.keys(DEFAULT_CANDIDATE_PROFILES).find(
          (k) => chatId.includes(k) && !myAliases.has(k)
        );
        if (matched) otherUid = matched;
      }
    }
  }

  // Thử tìm trong alias test accounts
  const testPartner = getTestProfileByEmailOrUid(otherUid);
  const defaultCand = DEFAULT_CANDIDATE_PROFILES[otherUid];

  const partnerName =
    testPartner?.name ||
    defaultCand?.name ||
    (location.state as any)?.chatName ||
    'Người dùng';

  const partnerAvatar =
    testPartner?.avatar ||
    defaultCand?.avatar ||
    (otherUid === (profile.uid || auth.currentUser?.uid)
      ? profile.avatar || auth.currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
      : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80');

  const partnerZodiac = testPartner?.zodiac || defaultCand?.zodiac || defaultCand?.sun || 'Song Ngư';
  const partnerElement = testPartner?.sun === 'Song Ngư' ? 'Nước' : defaultCand?.element || 'Nước';
  const partnerJob = testPartner?.job || defaultCand?.job || 'Thành viên Resonancia';
  const partnerBio = testPartner?.bio || defaultCand?.bio || 'Tâm hồn chiêm tinh đồng điệu, cùng bạn khám phá vũ trụ nội tâm ✨';

  // 1. Lắng nghe danh sách đoạn chat bên cột trái (Realtime Hybrid)
  useEffect(() => {
    if (!currentUid) return;
    const unsub = subscribeToUserChats(currentUid, (updatedChats) => {
      setChats(updatedChats);
    });
    return unsub;
  }, [currentUid]);

  // 2. Lắng nghe luồng tin nhắn real-time (Polling 1.2s + Firestore onSnapshot song song)
  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeToChatMessages(chatId, (updatedMsgs) => {
      setMessages(updatedMsgs);
    });
    return unsub;
  }, [chatId]);

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới (giữ trong khung hội thoại, không cuộn cả trang window)
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages]);

  // Hàm gửi tin nhắn văn bản, ảnh hoặc file
  const handleSendText = async (
    textToSend?: string,
    extra?: { type?: 'text' | 'image' | 'file'; fileUrl?: string; fileName?: string; fileSize?: string }
  ) => {
    const text = (textToSend !== undefined ? textToSend : input).trim();
    const msgType = extra?.type || 'text';
    if (!text && !extra?.fileUrl) return;
    if (!chatId || !currentUid || sending) return;

    setSending(true);
    setInput('');
    setShowEmojiPicker(false);

    // 1. Optimistic Update để UI mượt mà ngay lập tức
    const tempMsg: ChatMessage = {
      id: `opt_${Date.now()}`,
      chatId,
      senderId: currentUid,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      text: text || (msgType === 'image' ? '[Hình ảnh]' : `[Tệp: ${extra?.fileName || 'tài liệu'}]`),
      type: msgType,
      fileUrl: extra?.fileUrl,
      fileName: extra?.fileName,
      fileSize: extra?.fileSize,
      timestamp: Date.now(),
      read: false,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await sendChatMessage({
        chatId,
        senderId: currentUid,
        senderName: currentUserName,
        senderAvatar: currentUserAvatar,
        text: tempMsg.text,
        type: msgType,
        fileUrl: extra?.fileUrl,
        fileName: extra?.fileName,
        fileSize: extra?.fileSize,
      });
    } catch (e) {
      console.error('Lỗi gửi tin nhắn:', e);
      setToastMsg('Tin nhắn đang được đồng bộ...');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Xử lý gửi ảnh (Convert Base64 data URL)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToastMsg('Vui lòng chọn file hình ảnh hợp lệ');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToastMsg('Kích thước ảnh tối đa là 5MB');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleSendText('', {
        type: 'image',
        fileUrl: base64,
        fileName: file.name,
      });
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    };
    reader.onerror = () => {
      setToastMsg('Không thể đọc ảnh');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Xử lý gửi file tài liệu
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setToastMsg('Kích thước tệp tối đa là 10MB');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    reader.onload = () => {
      const base64 = reader.result as string;
      handleSendText(file.name, {
        type: 'file',
        fileUrl: base64,
        fileName: file.name,
        fileSize: sizeStr,
      });
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      setToastMsg('Không thể đọc file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Chọn emoji
  const handleSelectEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
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
    const targetTest = getTestProfileByEmailOrUid(targetUid) || getTestProfileByEmailOrUid(candidate.name);
    const targetAliases = new Set([
      targetUid,
      ...(targetTest?.aliasUids || []),
    ]);

    // Kiểm tra xem đã có cuộc trò chuyện nào giữa mình và đối phương chưa
    const existingChat = chats.find((c) => {
      const oUid = c.participants?.find((p) => !myAliases.has(p));
      return oUid && (targetAliases.has(oUid) || oUid === targetUid);
    });

    if (existingChat) {
      navigate(`/chat/${existingChat.id}`, { state: { chatName: candidate.name } });
      return;
    }

    // Nếu chưa có, dùng canonical target UID
    const canonicalTargetUid = targetTest?.uid || targetUid;
    const newChatId = [currentUid, canonicalTargetUid].sort().join('_');

    await initializeChatRoom({
      chatId: newChatId,
      participants: [currentUid, canonicalTargetUid],
      participantNames: {
        [currentUid]: currentUserName,
        [canonicalTargetUid]: candidate.name || 'Người dùng',
      },
      participantAvatars: {
        [currentUid]: currentUserAvatar,
        [canonicalTargetUid]: candidate.avatar || '',
      },
      lastMessage: 'Đã bắt đầu cuộc trò chuyện ✨',
    });

    navigate(`/chat/${newChatId}`, { state: { chatName: candidate.name } });
  };

  const handleConfirmDeleteChat = async () => {
    if (!deletingChatId) return;
    const idToDelete = deletingChatId;
    setDeletingChatId(null);
    setDeletingChatName(null);

    setChats((prev) => prev.filter((c) => c.id !== idToDelete));
    await deleteChatConversation(idToDelete);

    if (chatId === idToDelete) {
      navigate('/chat');
    } else {
      setToastMsg('Đã xóa đoạn chat thành công ✨');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  // Lọc và gộp các cuộc trò chuyện cùng một người (deduplicate)
  const seenPartners = new Set<string>();
  const filteredChats = chats.filter((c) => {
    const oUid = c.participants?.find((p: string) => !myAliases.has(p)) || '';
    if (!oUid) {
      // Tự chat với chính mình -> Không hiển thị
      return false;
    }

    const testAcc = getTestProfileByEmailOrUid(oUid);
    const cand = DEFAULT_CANDIDATE_PROFILES[oUid];
    const name = testAcc?.name || cand?.name || c.participantNames?.[oUid] || '';

    const partnerKey = testAcc?.email || testAcc?.name || cand?.name || oUid;
    if (seenPartners.has(partnerKey)) {
      // Đã có cuộc trò chuyện mới hơn với người này -> bỏ qua bản sao cũ
      return false;
    }
    seenPartners.add(partnerKey);

    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Hàng ngang bạn bè gợi ý: Tuyệt đối không hiển thị chính mình
  const topCandidates = Object.values(DEFAULT_CANDIDATE_PROFILES).filter(
    (c) => !myAliases.has(c.uid) && c.name !== profile.name
  ).slice(0, 6);

  return (
    <div
      className="w-full h-[calc(100vh-7.5rem)] min-h-[580px] max-h-[920px] rounded-3xl overflow-hidden flex flex-col md:flex-row relative shadow-2xl border border-purple-500/25"
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
        {/* Header Đoạn chat */}
        <div className="p-3.5 pb-2.5 flex items-center justify-between">
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
                <span
                  className={`text-[11px] truncate w-12 text-center mt-1 font-medium transition-colors ${
                    isCurrent ? 'text-cyan-300 font-bold' : 'text-purple-200/80 group-hover:text-white'
                  }`}
                >
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
              const oUid = chat.participants?.find((p: string) => !myAliases.has(p)) || chat.participants?.find((p: string) => p !== currentUid) || '';
              const oCand = oUid ? DEFAULT_CANDIDATE_PROFILES[oUid] : undefined;
              const testAcc = oUid ? getTestProfileByEmailOrUid(oUid) : null;
              const oName = testAcc?.name || oCand?.name || (oUid ? chat.participantNames?.[oUid] : '') || 'Người dùng';
              const oAvatar = testAcc?.avatar || oCand?.avatar || (oUid ? chat.participantAvatars?.[oUid] : '');
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
                      {chat.lastSenderId === currentUid || myAliases.has(chat.lastSenderId || '') ? 'Bạn: ' : ''}
                      {chat.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                    </p>
                  </div>

                  {/* Nút Xóa đoạn chat trong sidebar */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingChatId(chat.id);
                      setDeletingChatName(oName);
                    }}
                    className="p-1.5 rounded-lg text-purple-300/40 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer flex-shrink-0 group-hover:opacity-100 opacity-60 sm:opacity-0"
                    title={`Xóa đoạn chat với ${oName}`}
                    aria-label={`Xóa đoạn chat với ${oName}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
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
      <div
        className="flex-1 flex flex-col h-full relative"
        style={{
          background: 'radial-gradient(ellipse at 80% 20%, rgba(70, 35, 140, 0.25) 0%, transparent 60%)',
        }}
      >
        {/* Header Khung Chat Sang Trọng */}
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

          {/* Các nút tương tác */}
          <div className="flex items-center gap-2 text-purple-200">
            <button
              type="button"
              onClick={() => otherUid && navigate(`/user/${otherUid}`)}
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Xem thông tin chi tiết"
              aria-label="Xem thông tin chi tiết"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => {
                if (chatId) {
                  setDeletingChatId(chatId);
                  setDeletingChatName(partnerName);
                }
              }}
              className="p-2 rounded-full hover:bg-rose-500/15 hover:text-rose-400 text-purple-200/60 transition-colors cursor-pointer"
              title="Xóa đoạn chat này"
              aria-label="Xóa đoạn chat này"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        </div>

        {/* Vùng hiển thị tin nhắn (Message Thread) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3.5 resonancia-scrollbar">
          {/* Card giới thiệu đầu cuộc trò chuyện */}
          <div
            className="py-6 px-6 mx-auto max-w-lg flex flex-col items-center justify-center text-center rounded-3xl mb-4"
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
              const isMine = msg.senderId === currentUid || myAliases.has(msg.senderId);
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
                    {/* Render theo loại tin nhắn: Text / Image / File */}
                    {msg.type === 'image' && msg.fileUrl ? (
                      <div className="rounded-2xl overflow-hidden border border-white/20 shadow-lg max-w-[280px] sm:max-w-[340px] bg-black/40 group relative">
                        <img
                          src={msg.fileUrl}
                          alt="Đính kèm"
                          className="w-full max-h-[300px] object-cover hover:scale-[1.02] transition-transform cursor-zoom-in"
                          onClick={() => setZoomedImage(msg.fileUrl || null)}
                        />
                        <button
                          type="button"
                          onClick={() => setZoomedImage(msg.fileUrl || null)}
                          className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                          title="Phóng to ảnh"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="15 3 21 3 21 9" />
                            <polyline points="9 21 3 21 3 15" />
                            <line x1="21" y1="3" x2="14" y2="10" />
                            <line x1="3" y1="21" x2="10" y2="14" />
                          </svg>
                        </button>
                      </div>
                    ) : msg.type === 'file' && msg.fileUrl ? (
                      <a
                        href={msg.fileUrl}
                        download={msg.fileName || 'file_tai_lieu'}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-md transition-all hover:scale-[1.02] border ${
                          isMine
                            ? 'bg-purple-600/90 text-white border-purple-400/40'
                            : 'bg-white/10 text-purple-100 border-white/15'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="18" x2="12" y2="12" />
                            <polyline points="9 15 12 18 15 15" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate max-w-[180px] sm:max-w-[240px]">
                            {msg.fileName || msg.text || 'Tệp đính kèm'}
                          </p>
                          <span className="text-[10px] opacity-75">{msg.fileSize || 'Tải xuống'}</span>
                        </div>
                      </a>
                    ) : (
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
                    )}

                    <span className="text-[10px] text-purple-300/60 mt-1 px-1 font-medium">
                      {msg.timestamp ? formatTimestamp(msg.timestamp) : 'Vừa xong'}
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
        <div className="p-4 pt-2 flex flex-col gap-2 flex-shrink-0 relative">
          {/* Emoji Picker Popup */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-20 left-4 z-50 p-3 rounded-2xl border border-purple-500/30 shadow-2xl backdrop-blur-2xl"
                style={{
                  background: 'rgba(20, 10, 50, 0.95)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(168, 85, 247, 0.3)',
                }}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-purple-200">
                  <span className="font-semibold">Biểu tượng chiêm tinh & cảm xúc</span>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-white/60 hover:text-white px-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-1.5 max-w-[280px]">
                  {[
                    '✨', '🔮', '⭐', '🌙', '☀️', '🪐', '💫', '🌌',
                    '❤️', '💖', '🥰', '😍', '😊', '🥺', '🔥', '🎉',
                    '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏',
                    '♐', '♑', '♒', '♓', '💌', '🌸', '🕊️', '💎',
                  ].map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectEmoji(emoji)}
                      className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center text-base transition-transform active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden inputs cho File & Ảnh */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.zip,.rar"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="flex items-center gap-2">
            {/* Nút gửi ảnh */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="p-2.5 rounded-full hover:bg-white/10 text-purple-200 hover:text-white transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
              title="Gửi hình ảnh"
              aria-label="Gửi hình ảnh"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>

            {/* Nút gửi File tài liệu */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2.5 rounded-full hover:bg-white/10 text-purple-200 hover:text-white transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
              title="Đính kèm tệp tin tài liệu"
              aria-label="Đính kèm tệp tin tài liệu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            {/* Nút biểu tượng cảm xúc */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2.5 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                showEmojiPicker ? 'bg-purple-600/40 text-cyan-300' : 'hover:bg-white/10 text-purple-200 hover:text-white'
              }`}
              title="Chọn biểu tượng cảm xúc & icon chiêm tinh"
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
                placeholder={`Nhắn tin với ${partnerName}... (Enter để gửi)`}
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
      {/* Modal Phóng To Ảnh (Lightbox Xem Ảnh Tại Chỗ) */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-md cursor-zoom-out"
          >
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer shadow-lg"
              title="Đóng xem ảnh"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              src={zoomedImage}
              alt="Ảnh phóng to"
              onClick={(e) => e.stopPropagation()}
              className="max-w-[92vw] max-h-[88vh] rounded-2xl object-contain shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/20 cursor-default"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Xác Nhận Xóa Đoạn Chat */}
      {deletingChatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-2xl p-5 border border-purple-500/30 shadow-2xl text-center"
            style={{
              background: 'linear-gradient(155deg, rgba(28, 16, 68, 0.96) 0%, rgba(16, 9, 44, 0.98) 100%)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(168, 85, 247, 0.15)',
            }}
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3.5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Xóa đoạn chat?</h3>
            <p className="text-xs text-purple-200/70 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ cuộc trò chuyện với <strong className="text-white">{deletingChatName}</strong>? Toàn bộ tin nhắn sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => { setDeletingChatId(null); setDeletingChatName(null); }}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-purple-200 bg-white/10 hover:bg-white/15 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteChat}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 transition-all cursor-pointer shadow-md"
              >
                Xóa đoạn chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

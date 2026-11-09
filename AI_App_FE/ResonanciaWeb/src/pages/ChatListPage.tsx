import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { collection, query, where, onSnapshot, orderBy, setDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { RootState } from '../store';
import { formatTimestamp } from '../utils/date';
import { DEFAULT_CANDIDATE_PROFILES } from '../constants/defaultCandidates';
import { MessengerLogo } from '../components/ChatFab';
import ChatAccountSwitcher from '../components/ChatAccountSwitcher';
import {
  getActiveChatIdentity,
  ChatAccountIdentity,
} from '../services/chatAccountService';

export default function ChatListPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();

  // Danh tính chat hiện tại
  const [activeIdentity, setActiveIdentity] = useState<ChatAccountIdentity>(() => getActiveChatIdentity(profile));
  const currentUid = activeIdentity.uid;

  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Lắng nghe sự kiện chuyển đổi danh tính
  useEffect(() => {
    const handleIdentityChanged = () => {
      const updated = getActiveChatIdentity(profile);
      setActiveIdentity(updated);
    };
    window.addEventListener('resonancia_identity_changed', handleIdentityChanged);
    return () => window.removeEventListener('resonancia_identity_changed', handleIdentityChanged);
  }, [profile]);

  useEffect(() => {
    if (!currentUid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUid),
      orderBy('lastTimestamp', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsub;
  }, [currentUid]);

  const handleStartChatWith = async (candidate: any) => {
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
      console.warn('Init chat warning:', e);
    }

    navigate(`/chat/${chatId}`, { state: { chatName: candidate.name } });
  };

  const filteredChats = chats.filter((c) => {
    const oUid = c.participants?.find((p: string) => p !== currentUid);
    const oCand = DEFAULT_CANDIDATE_PROFILES[oUid];
    const name = oCand?.name || c.participantNames?.[oUid] || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const candidates = Object.values(DEFAULT_CANDIDATE_PROFILES).slice(0, 6);

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
        className="w-full md:w-[340px] lg:w-[370px] flex-shrink-0 flex flex-col h-full relative z-10"
        style={{
          background: 'linear-gradient(180deg, rgba(16, 10, 48, 0.85) 0%, rgba(10, 6, 36, 0.9) 100%)',
          boxShadow: '8px 0 25px -5px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Header Đoạn chat & Bộ chuyển đổi danh tính */}
        <div className="p-4 pb-2.5 flex flex-col gap-2.5">
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
        <div className="px-4 py-2">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-2.5 text-purple-200/50"
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
              className="w-full bg-white/[0.06] text-white placeholder-purple-200/40 text-xs pl-9 pr-3.5 py-2.5 rounded-full border border-purple-400/25 focus:outline-none focus:border-purple-300 focus:bg-white/[0.09] transition-all"
            />
          </div>
        </div>

        {/* Hàng ngang: Bạn bè đang hoạt động */}
        <div className="px-4 py-2 overflow-x-auto no-scrollbar flex items-center gap-3.5">
          {candidates.map((c) => (
            <button
              key={c.uid}
              type="button"
              onClick={() => handleStartChatWith(c)}
              className="flex flex-col items-center flex-shrink-0 group focus:outline-none cursor-pointer"
              title={`Nhắn tin với ${c.name}`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full p-[2px] transition-transform group-hover:scale-105 bg-gradient-to-tr from-purple-400/30 to-pink-500/30 group-hover:from-purple-400 group-hover:to-cyan-400 shadow-md">
                  <img src={c.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#100a2a]" />
              </div>
              <span className="text-[11px] text-purple-200/80 truncate w-14 text-center mt-1 group-hover:text-white font-medium">
                {c.name.split(' ').slice(-1)[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Danh sách các đoạn chat */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 resonancia-scrollbar">
          {loading ? (
            <div className="p-6 text-center text-xs text-purple-200/60 animate-pulse">
              Đang tải danh sách đoạn chat...
            </div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const oUid = chat.participants?.find((p: string) => p !== currentUid);
              const oCand = DEFAULT_CANDIDATE_PROFILES[oUid];
              const oName = oCand?.name || chat.participantNames?.[oUid] || 'Người dùng';
              const oAvatar = oCand?.avatar || chat.participantAvatars?.[oUid];

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => navigate(`/chat/${chat.id}`, { state: { chatName: oName } })}
                  className="w-full p-3 rounded-2xl flex items-center gap-3 text-left transition-all hover:bg-white/[0.08] border border-transparent hover:border-purple-400/25 cursor-pointer shadow-sm"
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
                      <h3 className="text-xs font-semibold truncate text-white">
                        {oName}
                      </h3>
                      {chat.lastTimestamp && (
                        <span className="text-[10px] text-purple-300/60 ml-2">
                          {formatTimestamp(chat.lastTimestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] truncate mt-0.5 text-purple-200/70">
                      {chat.lastSenderId === currentUid ? 'Bạn: ' : ''}
                      {chat.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-5 my-3 text-center text-xs text-purple-200/70 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
              <p className="font-semibold text-white mb-1">Chưa có đoạn chat nào</p>
              <p>Hãy chọn người bạn tương hợp ở trên hoặc bên phải để bắt đầu trò chuyện ✨</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* CỘT PHẢI: MÀN HÌNH CHỜ MESSENGER (DESKTOP PLACEHOLDER) */}
      {/* ============================================================ */}
      <div
        className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 70% 30%, rgba(70, 35, 140, 0.28) 0%, transparent 65%)',
        }}
      >
        <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 shadow-2xl mb-4 flex items-center justify-center flex-shrink-0">
          <div className="w-full h-full rounded-full bg-[#181048] flex items-center justify-center">
            <MessengerLogo size={46} />
          </div>
        </div>

        <h2 className="text-white font-extrabold text-2xl mb-2 tracking-tight">Messenger Resonancia</h2>
        <p className="text-purple-200/80 text-sm max-w-md mb-8 leading-relaxed font-normal">
          Bạn đang tham gia với tư cách <span className="text-cyan-300 font-bold">{activeIdentity.name}</span>. Chọn một đoạn chat bên trái hoặc kết nối với ứng viên định mệnh bên dưới:
        </p>

        {/* Gợi ý tương hợp nhanh - Card sang trọng phong cách Resonancia */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full max-w-2xl">
          {candidates.slice(0, 4).map((c) => (
            <div
              key={c.uid}
              className="p-4 rounded-3xl border border-white/[0.08] bg-white/[0.05] hover:bg-white/[0.09] hover:border-purple-400/40 transition-all flex items-center justify-between gap-3 text-left shadow-xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-full p-[2px] bg-gradient-to-tr from-purple-400 to-pink-500 flex-shrink-0 shadow-md overflow-hidden">
                  <img src={c.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold truncate">{c.name}</p>
                  <p className="text-purple-200/70 text-xs mt-0.5">Cung {c.sun} · {c.age} tuổi</p>
                  <p className="text-emerald-400 text-[10.5px] mt-0.5 font-medium">✨ 100% Green Flag</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleStartChatWith(c)}
                className="px-4 py-2 text-xs font-semibold text-white rounded-xl transition-all hover:opacity-95 hover:scale-105 active:scale-95 flex-shrink-0 shadow-md cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #0084FF 0%, #0066FF 45%, #9B28FD 100%)',
                  boxShadow: '0 4px 14px rgba(0, 132, 255, 0.4)',
                }}
              >
                Nhắn tin
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { collection, query, where, onSnapshot, orderBy, setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { RootState } from '../store';
import { formatTimestamp } from '../utils/date';
import { DEFAULT_CANDIDATE_PROFILES } from '../constants/defaultCandidates';
import { MessengerLogo } from '../components/ChatFab';

export default function ChatListPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const currentUid = profile.uid || auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUid) {
      setLoading(false);
      return;
    }

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

    navigate(`/chat/${chatId}`, { state: { chatName: candidate.name } });
  };

  const filteredChats = chats.filter((c) => {
    const oUid = c.participants?.find((p: string) => p !== currentUid);
    const name = c.participantNames?.[oUid] || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const candidates = Object.values(DEFAULT_CANDIDATE_PROFILES).slice(0, 6);

  return (
    <div className="w-full h-[calc(100vh-7.5rem)] min-h-[580px] max-h-[920px] resonancia-messenger-frame overflow-hidden flex flex-col md:flex-row">
      {/* ============================================================ */}
      {/* CỘT TRÁI: DANH SÁCH ĐOẠN CHAT (MESSENGER SIDEBAR) */}
      {/* ============================================================ */}
      <div className="w-full md:w-[320px] lg:w-[350px] flex-shrink-0 flex flex-col border-r border-purple-400/20 bg-black/15 h-full">
        {/* Header Đoạn chat */}
        <div className="p-4 border-b border-purple-400/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessengerLogo size={28} />
            <h1 className="text-white font-bold text-lg tracking-tight">Đoạn chat</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/match')}
            className="p-1.5 rounded-full hover:bg-white/10 text-purple-200 hover:text-white transition-colors"
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

        {/* Hàng ngang: Bạn bè đang hoạt động (ĐÃ XỬ LÝ NO-SCROLLBAR KHÔNG BỊ THANH TÍM LỖI) */}
        <div className="px-3 py-3 border-b border-purple-400/15 overflow-x-auto no-scrollbar flex items-center gap-3">
          {candidates.map((c) => (
            <button
              key={c.uid}
              type="button"
              onClick={() => handleStartChatWith(c)}
              className="flex flex-col items-center flex-shrink-0 group focus:outline-none cursor-pointer"
              title={`Nhắn tin với ${c.name}`}
            >
              <div className="relative">
                <div className="w-11 h-11 rounded-full p-[2px] transition-transform group-hover:scale-105 bg-purple-400/40 group-hover:bg-cyan-400/60 shadow-sm">
                  <img src={c.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1c1560]" />
              </div>
              <span className="text-[11px] text-purple-200/90 truncate w-12 text-center mt-1 group-hover:text-white font-medium">
                {c.name.split(' ').slice(-1)[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Danh sách các đoạn chat */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 resonancia-scrollbar">
          {loading ? (
            <div className="p-6 text-center text-xs text-purple-200/60 animate-pulse">
              Đang tải danh sách đoạn chat...
            </div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const oUid = chat.participants?.find((p: string) => p !== currentUid);
              const oName = chat.participantNames?.[oUid] || 'Người dùng';
              const oAvatar = chat.participantAvatars?.[oUid];

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => navigate(`/chat/${chat.id}`, { state: { chatName: oName } })}
                  className="w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-all hover:bg-white/10 border border-transparent hover:border-purple-400/25 cursor-pointer"
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
                      <h3 className="text-xs font-semibold truncate text-white">
                        {oName}
                      </h3>
                      {chat.lastTimestamp && (
                        <span className="text-[10px] text-purple-300/70 ml-2">
                          {formatTimestamp(chat.lastTimestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] truncate mt-0.5 text-purple-200/70">
                      {chat.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 my-2 text-center text-xs text-purple-200/70 bg-white/[0.04] rounded-xl border border-purple-400/20">
              <p className="font-semibold text-white mb-1">Chưa có đoạn chat nào</p>
              <p>Hãy chọn người bạn tương hợp ở trên hoặc bên phải để bắt đầu trò chuyện ✨</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* CỘT PHẢI: MÀN HÌNH CHỜ MESSENGER (DESKTOP PLACEHOLDER) */}
      {/* ============================================================ */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-black/10">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-purple-500/20 border border-purple-400/30 shadow-2xl">
          <MessengerLogo size={46} />
        </div>

        <h2 className="text-white font-bold text-2xl mb-1.5 tracking-tight">Messenger Resonancia</h2>
        <p className="text-purple-200/80 text-sm max-w-md mb-8 leading-relaxed">
          Chọn một đoạn chat từ danh sách bên trái hoặc bắt đầu cuộc trò chuyện với các ứng viên tương hợp nhất dưới đây ✨
        </p>

        {/* Gợi ý tương hợp nhanh - Card sang trọng phong cách Resonancia */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5 w-full max-w-xl">
          {candidates.slice(0, 4).map((c) => (
            <div
              key={c.uid}
              className="p-3.5 rounded-2xl border border-purple-400/25 bg-white/[0.05] hover:bg-white/[0.09] hover:border-purple-400/50 transition-all flex items-center justify-between gap-3 text-left shadow-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img src={c.avatar} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-purple-300/40 shadow-sm" />
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold truncate">{c.name}</p>
                  <p className="text-purple-200/70 text-xs mt-0.5">Cung {c.sun} · {c.age} tuổi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleStartChatWith(c)}
                className="px-4 py-1.5 text-xs font-semibold text-white rounded-xl transition-all hover:opacity-95 active:scale-95 flex-shrink-0 shadow-md cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #0084FF 0%, #0066FF 45%, #9B28FD 100%)',
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

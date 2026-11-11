import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { auth } from '../services/firebase';
import { RootState } from '../store';
import { formatTimestamp } from '../utils/date';
import { DEFAULT_CANDIDATE_PROFILES } from '../constants/defaultCandidates';
import { TEST_ACCOUNTS, getTestProfileByEmailOrUid } from '../constants/testAccounts';
import { MessengerLogo } from '../components/ChatFab';
import {
  subscribeToUserChats,
  initializeChatRoom,
  deleteChatConversation,
  ChatConversation,
} from '../services/realtimeChatService';

export default function ChatListPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();

  const currentUid = profile.uid || auth.currentUser?.uid || '';
  const currentUserName = profile.name || auth.currentUser?.displayName || 'Người dùng';
  const currentUserAvatar = profile.avatar || auth.currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [deletingChatName, setDeletingChatName] = useState<string | null>(null);

  const myTestAcc = getTestProfileByEmailOrUid(currentUid) || getTestProfileByEmailOrUid(profile.email || '') || getTestProfileByEmailOrUid(profile.uid || '');
  const myAliases = new Set([
    currentUid,
    profile.uid || '',
    auth.currentUser?.uid || '',
    ...(myTestAcc?.aliasUids || []),
  ].filter(Boolean));

  useEffect(() => {
    if (!currentUid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 600);

    const unsub = subscribeToUserChats(currentUid, (updatedChats) => {
      clearTimeout(safetyTimer);
      setChats(updatedChats);
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsub();
    };
  }, [currentUid]);

  const handleStartChatWith = async (candidate: any) => {
    if (!currentUid) {
      navigate('/login');
      return;
    }

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

    // Nếu chưa có, dùng canonical target UID để tránh sinh ra nhiều UID rác
    const canonicalTargetUid = targetTest?.uid || targetUid;
    const chatId = [currentUid, canonicalTargetUid].sort().join('_');

    await initializeChatRoom({
      chatId,
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

    navigate(`/chat/${chatId}`, { state: { chatName: candidate.name } });
  };

  const handleConfirmDeleteChat = async () => {
    if (!deletingChatId) return;
    const idToDelete = deletingChatId;
    setDeletingChatId(null);
    setDeletingChatName(null);

    // Xóa ngay lập tức khỏi state để UI phản hồi tức thì
    setChats((prev) => prev.filter((c) => c.id !== idToDelete));
    await deleteChatConversation(idToDelete);
  };

  // Lọc và gộp các cuộc trò chuyện cùng một người (deduplicate)
  const seenPartners = new Set<string>();
  const filteredChats = chats.filter((c) => {
    const oUid = c.participants?.find((p: string) => !myAliases.has(p)) || '';
    if (!oUid) {
      // Tự chat với chính mình -> Không hiển thị
      return false;
    }

    const oCand = DEFAULT_CANDIDATE_PROFILES[oUid];
    const testAcc = getTestProfileByEmailOrUid(oUid);
    const name = testAcc?.name || oCand?.name || c.participantNames?.[oUid] || '';

    // Khóa định danh duy nhất của đối phương: email > tên chuẩn hóa > oUid
    const partnerKey = testAcc?.email || testAcc?.name || oCand?.name || oUid;
    if (seenPartners.has(partnerKey)) {
      // Đã có cuộc trò chuyện mới hơn với người này -> bỏ qua bản sao cũ
      return false;
    }
    seenPartners.add(partnerKey);

    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Hàng ngang bạn bè gợi ý: Tuyệt đối không hiển thị chính mình
  const candidates = Object.values(DEFAULT_CANDIDATE_PROFILES).filter(
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
        className="w-full md:w-[340px] lg:w-[370px] flex-shrink-0 flex flex-col h-full relative z-10"
        style={{
          background: 'linear-gradient(180deg, rgba(16, 10, 48, 0.85) 0%, rgba(10, 6, 36, 0.9) 100%)',
          boxShadow: '8px 0 25px -5px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Header Đoạn chat */}
        <div className="p-4 pb-2.5 flex items-center justify-between">
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
        <div className="px-4 py-2">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-2.5 text-purple-200/50"
              width="16"
              height="16"
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
              className="w-full bg-white/[0.06] text-white placeholder-purple-200/40 text-xs pl-9 pr-4 py-2 rounded-full border border-purple-400/25 focus:outline-none focus:border-purple-300 focus:bg-white/[0.09] transition-all"
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
                <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-purple-400/30 to-pink-500/30 group-hover:from-cyan-400 group-hover:to-purple-500 transition-all shadow-md">
                  <img src={c.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#100a2a]" />
              </div>
              <span className="text-[11px] text-purple-200/80 group-hover:text-white truncate w-14 text-center mt-1 font-medium transition-colors">
                {c.name.split(' ').slice(-1)[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Danh sách các cuộc trò chuyện */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 resonancia-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="w-7 h-7 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
              <p className="text-xs text-purple-300/60">Đang đồng bộ đoạn chat...</p>
            </div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const oUid = chat.participants?.find((p: string) => !myAliases.has(p)) || chat.participants?.find((p: string) => p !== currentUid) || '';
              const oCand = oUid ? DEFAULT_CANDIDATE_PROFILES[oUid] : undefined;
              const testAcc = oUid ? getTestProfileByEmailOrUid(oUid) : null;
              const oName = testAcc?.name || oCand?.name || (oUid ? chat.participantNames?.[oUid] : '') || 'Người dùng';
              const oAvatar = testAcc?.avatar || oCand?.avatar || (oUid ? chat.participantAvatars?.[oUid] : '');

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => navigate(`/chat/${chat.id}`, { state: { chatName: oName } })}
                  className="w-full p-3 rounded-2xl flex items-center gap-3.5 hover:bg-white/[0.08] transition-all text-left group border border-transparent hover:border-purple-400/20 cursor-pointer shadow-sm"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 bg-purple-900/60 shadow-md">
                      {oAvatar ? (
                        <img src={oAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white text-base">
                          {oName[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#100a2a]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                        {oName}
                      </h3>
                      {chat.lastTimestamp && (
                        <span className="text-[11px] text-purple-300/60 ml-2">
                          {formatTimestamp(chat.lastTimestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-purple-200/60 truncate mt-0.5 group-hover:text-purple-200/90 transition-colors">
                      {chat.lastSenderId === currentUid || myAliases.has(chat.lastSenderId || '') ? 'Bạn: ' : ''}
                      {chat.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                    </p>
                  </div>

                  {/* Nút Xóa đoạn chat */}
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
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <div className="p-6 my-4 text-center text-xs text-purple-200/70 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
              <p className="font-semibold text-white mb-1.5 text-sm">Chưa có đoạn chat nào</p>
              <p className="leading-relaxed">Hãy chọn một người bạn ở trên để bắt đầu trò chuyện định mệnh ✨</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* CỘT PHẢI: KHUNG CHÀO ĐÓN MESSENGER */}
      {/* ============================================================ */}
      <div
        className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center relative"
        style={{
          background: 'radial-gradient(circle at center, rgba(120, 60, 220, 0.15) 0%, transparent 70%)',
        }}
      >
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-2xl p-[3px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 animate-pulse-slow">
          <div className="w-full h-full rounded-full bg-[#140b3b] flex items-center justify-center">
            <MessengerLogo size={42} />
          </div>
        </div>

        <h2 className="text-2xl font-bold font-display text-white tracking-tight mb-2">
          Messenger Resonancia
        </h2>
        <p className="text-sm text-purple-200/70 max-w-md leading-relaxed mb-6">
          Chọn một đoạn chat từ danh sách bên trái hoặc bắt đầu cuộc trò chuyện với các ứng viên tương hợp nhất dưới đây ✨
        </p>

        {/* Khung ứng viên tương hợp nhanh */}
        <div className="grid grid-cols-2 gap-3.5 w-full max-w-lg">
          {candidates.slice(0, 4).map((c) => (
            <div
              key={c.uid}
              className="p-3.5 rounded-2xl flex items-center justify-between gap-3 text-left border border-purple-500/25 hover:border-purple-400/50 transition-all shadow-md group"
              style={{
                background: 'linear-gradient(145deg, rgba(30, 16, 75, 0.6) 0%, rgba(18, 10, 50, 0.7) 100%)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                  <img src={c.avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                    {c.name}
                  </p>
                  <p className="text-[11px] text-purple-300/70 truncate">
                    Cung {c.zodiac || c.sun}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStartChatWith(c)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all shadow-sm flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #0084FF 0%, #0066FF 50%, #A033FF 100%)',
                }}
              >
                Nhắn tin
              </button>
            </div>
          ))}
        </div>
      </div>

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
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Xóa đoạn chat?</h3>
            <p className="text-xs text-purple-200/70 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ cuộc trò chuyện với <strong className="text-white">{deletingChatName}</strong>? Hành động này sẽ xóa các tin nhắn và không thể hoàn tác.
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

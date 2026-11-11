import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { RootState } from '../store';
import { MATCH_TAGS, ZODIAC_SIGNS } from '../constants/astrologyMap';
import { apiLoveMatching, apiSendMatchRequest, apiGetMatchRequests } from '../services/api';
import { MatchTagType } from '../types';
import UiIcon from '../components/UiIcon';
import ZodiacIcon from '../components/ZodiacIcon';
import { getTestProfileByEmailOrUid } from '../constants/testAccounts';
import { initializeChatRoom } from '../services/realtimeChatService';

const TAG_ICONS: Record<MatchTagType, 'heart' | 'flame' | 'sparkles' | 'star'> = {
  greenflag: 'heart', redflag: 'flame', karmic: 'sparkles', destiny: 'star', twinflame: 'flame',
};

const ZODIAC_SIGNS_ORDER = [
  'Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải',
  'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp',
  'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'
];

function getZodiacConnectionType(sign1?: string, sign2?: string): MatchTagType {
  if (!sign1 || !sign2) return 'greenflag';
  const i1 = ZODIAC_SIGNS_ORDER.indexOf(sign1);
  const i2 = ZODIAC_SIGNS_ORDER.indexOf(sign2);
  if (i1 === -1 || i2 === -1) return 'greenflag';
  const diff = Math.abs(i1 - i2);
  const dist = Math.min(diff, 12 - diff);
  if (dist === 4 || dist === 2) return 'greenflag';
  if (dist === 6) return 'destiny';
  if (dist === 0) return 'twinflame';
  if (dist === 3) return 'redflag';
  return 'karmic';
}

export default function MatchPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState<MatchTagType>('greenflag');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [acceptedPartners, setAcceptedPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedTag, setLoadedTag] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [requestLoading, setRequestLoading] = useState<Record<string, boolean>>({});
  const [sentStatusMap, setSentStatusMap] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'challenge'>('all');

  const applyAcceptedPartnerPriority = (rawList: any[], tag: MatchTagType, acceptedList: any[]) => {
    if (!acceptedList || acceptedList.length === 0) return rawList;
    const mySign = profile.sun || '';
    let result = [...rawList];

    acceptedList.forEach(partner => {
      const test = getTestProfileByEmailOrUid(partner.uid) || getTestProfileByEmailOrUid(partner.name);
      const testAny = test as any;
      const candSign = testAny?.sun || testAny?.zodiac || 'Bọ Cạp';
      const connType = getZodiacConnectionType(mySign, candSign);

      // Nếu partner này thuộc nhóm phân loại của tab đang xem -> Đẩy lên hàng đầu (vị trí đầu tiên #1)
      if (connType === tag) {
        result = result.filter(c => c.uid !== partner.uid && (!test || c.uid !== test.uid) && c.name !== partner.name);
        const partnerCandidate = {
          uid: partner.uid,
          name: partner.name || testAny?.name || 'Người dùng',
          zodiac: candSign,
          sun: candSign,
          avatar: partner.avatar || testAny?.avatar || '',
          age: testAny?.age || 24,
          gender: testAny?.gender || 'Nam',
          element: testAny?.element || 'Nước',
          job: testAny?.job || 'Thành viên Resonancia',
          personality: testAny?.bio || 'Chân thành, ấm áp, sâu sắc',
          reason: `Đã kết bạn & ghép đôi thành công! Hai bạn có sự liên kết ${MATCH_TAGS[tag]?.label || tag} tự nhiên và đồng điệu.`,
          compatibility_score: 100,
          score: 100,
          match_level: 'high',
          match_level_text: 'Tương hợp cao',
          isRealUser: true,
          isMatched: true,
          isFriend: true,
        };
        result.unshift(partnerCandidate);
      }
    });

    return result;
  };

  useEffect(() => {
    const myUid = profile.uid || auth.currentUser?.uid;
    if (!myUid) return;
    // Lấy toàn bộ match requests (cả gửi đi và nhận về) để xác định các bạn bè đã đồng ý kết bạn
    apiGetMatchRequests(myUid)
      .then(res => {
        const list = res.data?.requests || [];
        const map: Record<string, boolean> = {};
        const accepted: any[] = [];
        list.forEach((r: any) => {
          if (r.receiverId && (r.status === 'pending' || r.status === 'accepted')) {
            map[r.receiverId] = true;
          }
          if (r.status === 'accepted') {
            const isMeSender = r.senderId === myUid || (profile.name && r.senderName === profile.name);
            const pUid = isMeSender ? r.receiverId : r.senderId;
            const pName = isMeSender ? r.receiverName : r.senderName;
            const pAvatar = isMeSender ? (r.receiverAvatar || '') : (r.senderAvatar || '');
            if (pUid && pUid !== myUid) {
              accepted.push({
                uid: pUid,
                name: pName,
                avatar: pAvatar,
                requestId: r.requestId,
                status: r.status,
              });
            }
          }
        });
        setSentStatusMap(prev => ({ ...prev, ...map }));
        setAcceptedPartners(accepted);
      })
      .catch(() => {});
  }, [profile.uid]);

  useEffect(() => {
    if (acceptedPartners.length > 0 && candidates.length > 0) {
      setCandidates(prev => applyAcceptedPartnerPriority(prev, selectedTag, acceptedPartners));
    }
  }, [acceptedPartners, selectedTag]);

  const handleQuickMatch = async (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const myUid = profile.uid || auth.currentUser?.uid;
    if (!myUid) {
      setToastMsg('Vui lòng đăng nhập để gửi lời mời ghép đôi!');
      setTimeout(() => setToastMsg(''), 3500);
      return;
    }
    if (!c.uid) return;

    setRequestLoading(prev => ({ ...prev, [c.uid]: true }));
    try {
      const res = await apiSendMatchRequest({
        senderId: myUid,
        receiverId: c.uid,
        senderName: profile.name || auth.currentUser?.displayName || 'Người dùng',
        senderAvatar: profile.avatar || auth.currentUser?.photoURL || '',
        receiverName: c.name || '',
        message: `Xin chào ${c.name}! Mình thấy cung hoàng đạo của chúng ta rất tương hợp, hãy cùng kết bạn nhé ✨`,
      });

      // Đồng bộ vào Firestore Web SDK qua long-polling để sync trạng thái
      try {
        const requestId = res.data?.requestId || `${myUid}_${c.uid}`;
        await setDoc(doc(db, 'match_requests', requestId), {
          requestId,
          senderId: myUid,
          receiverId: c.uid,
          senderName: profile.name || auth.currentUser?.displayName || 'Người dùng',
          senderAvatar: profile.avatar || auth.currentUser?.photoURL || '',
          receiverName: c.name || '',
          receiverAvatar: c.avatar || '',
          message: `Xin chào ${c.name}! Mình thấy cung hoàng đạo của chúng ta rất tương hợp, hãy cùng kết bạn nhé ✨`,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Frontend direct Firestore sync notice:', fsErr);
      }

      const alreadySent = !!sentStatusMap[c.uid];
      setSentStatusMap(prev => ({ ...prev, [c.uid]: true }));
      setToastMsg(alreadySent ? `Đã gửi lại lời mời kết bạn tới ${c.name}! ✨` : `Đã gửi lời mời kết bạn tới ${c.name}! ✨`);
      setTimeout(() => setToastMsg(''), 3500);
    } catch (err: any) {
      console.error('Lỗi gửi kết bạn:', err);
      const errMsg = err?.response?.data?.error || err?.message || 'Không thể gửi lời mời kết bạn. Vui lòng thử lại!';
      setToastMsg(errMsg);
      setTimeout(() => setToastMsg(''), 3500);
    } finally {
      setRequestLoading(prev => ({ ...prev, [c.uid]: false }));
    }
  };

  const handleStartChat = async (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile.uid || !c.uid) return;

    const targetUid = c.uid;
    const targetTest = getTestProfileByEmailOrUid(targetUid) || getTestProfileByEmailOrUid(c.name);
    const canonicalTargetUid = targetTest?.uid || targetUid;
    const chatId = [profile.uid, canonicalTargetUid].sort().join('_');

    try {
      await initializeChatRoom({
        chatId,
        participants: [profile.uid, canonicalTargetUid],
        participantNames: {
          [profile.uid]: profile.name || 'Người dùng',
          [canonicalTargetUid]: c.name || 'Người dùng',
        },
        participantAvatars: {
          [profile.uid]: profile.avatar || '',
          [canonicalTargetUid]: c.avatar || '',
        },
        lastMessage: 'Đã bắt đầu cuộc trò chuyện ✨',
      });

      await setDoc(doc(db, 'chats', chatId), {
        participants: [profile.uid, canonicalTargetUid],
        participantNames: {
          [profile.uid]: profile.name || 'Người dùng',
          [canonicalTargetUid]: c.name || 'Người dùng',
        },
        participantAvatars: {
          [profile.uid]: profile.avatar || '',
          [canonicalTargetUid]: c.avatar || '',
        },
        lastMessage: 'Đã bắt đầu cuộc trò chuyện ✨',
        lastTimestamp: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.error('Error starting chat:', err);
    }
    navigate(`/chat/${chatId}`, { state: { chatName: c.name } });
  };

  const loadCandidates = async (tag: MatchTagType, forceRefresh = false) => {
    if (!profile.uid) return;
    setLoading(true);
    setError('');
    try {
      // 1. Kiểm tra cache từ Client Firestore nếu không yêu cầu forceRefresh và chưa có accepted partners
      if (!forceRefresh && acceptedPartners.length === 0) {
        try {
          const cacheSnap = await getDoc(doc(db, 'love_matching_results', profile.uid, 'types', tag));
          if (cacheSnap.exists()) {
            const data = cacheSnap.data();
            if (data?.users && Array.isArray(data.users) && data.users.length > 0) {
              setCandidates(data.users);
              setLoadedTag(tag);
              setLoading(false);
              return;
            }
          }
        } catch (cacheErr) {
          console.warn('Client cache read error:', cacheErr);
        }
      }

      // 2. Gọi backend AI phân tích
      const res = await apiLoveMatching(tag, {
        uid: profile.uid,
        userData: {
          uid: profile.uid,
          name: profile.name,
          gender: profile.gender || '',
          sun: profile.sun || '',
          moon: profile.moon || '',
          ascendant: profile.ascendant || '',
          zodiac: profile.sun || '',
          fireRatio: profile.fireRatio || 0,
          earthRatio: profile.earthRatio || 0,
          airRatio: profile.airRatio || 0,
          waterRatio: profile.waterRatio || 0,
        },
      });

      const rawUsers = res.data?.users || [];
      const users = applyAcceptedPartnerPriority(rawUsers, tag, acceptedPartners);
      setCandidates(users);
      setLoadedTag(tag);

      // 3. Lưu cache vào Client Firestore để lần sau hiển thị tức thì
      if (users.length > 0) {
        try {
          await setDoc(doc(db, 'love_matching_results', profile.uid, 'types', tag), {
            type: tag,
            uid: profile.uid,
            users: rawUsers,  // lưu cache dữ liệu gốc (không có override priority)
            updatedAt: Date.now(),
          }, { merge: true });
        } catch (saveErr) {
          console.warn('Client cache save error:', saveErr);
        }
      }
    } catch {
      setError('Không thể tải danh sách. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Tự động load ứng viên khi vào trang lần đầu hoặc khi đổi profile
  useEffect(() => {
    if (profile.uid) {
      loadCandidates(selectedTag);
    }
  }, [profile.uid]);

  const handleSelectTag = (tag: MatchTagType) => {
    setSelectedTag(tag);
    if (loadedTag !== tag) {
      loadCandidates(tag);
    }
  };

  const tagInfo = MATCH_TAGS[selectedTag];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display"><UiIcon name="sparkles" label="Khám phá tình duyên" className="mr-2 inline" />Khám Phá Tình Duyên</h1>
        <p className="text-purple-300 opacity-70 mt-1">AI phân tích vũ trụ tìm người tương hợp với bạn</p>
      </motion.div>

      {/* Tag Selection */}
      <div className="glass-card p-5">
        <h2 className="text-white font-semibold mb-4">Chọn loại kết nối</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(MATCH_TAGS).map(([tag, info]) => (
            <motion.button
              key={tag}
              aria-pressed={selectedTag === tag}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelectTag(tag as MatchTagType)}
              className={`p-4 rounded-xl text-center transition-all ${
                selectedTag === tag ? 'text-white' : 'glass text-purple-300 hover:text-white'
              }`}
              style={selectedTag === tag ? {
                background: `linear-gradient(135deg, ${info.color}33, ${info.color}22)`,
                border: `1px solid ${info.color}66`,
                /* Layered glow: tight + mid + outer ambient */
                boxShadow: `0 0 4px ${info.color}44, 0 0 14px ${info.color}33, 0 0 28px ${info.color}11`,
                transition: 'box-shadow 200ms ease',
              } : { transition: 'box-shadow 200ms ease' }}
            >
              <div className="text-2xl mb-1"><UiIcon name={TAG_ICONS[tag as MatchTagType]} label={info.label} /></div>
              <p className="text-sm font-semibold">{info.label}</p>
              <p className="text-xs opacity-60 mt-0.5 leading-tight">{info.desc}</p>
            </motion.button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <button onClick={() => loadCandidates(selectedTag, true)} disabled={loading}
            className="btn-cosmic px-8 py-3 flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${tagInfo.color}, ${tagInfo.color}99)` }}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <><UiIcon name={TAG_ICONS[selectedTag]} label={tagInfo.label} className="inline" /> Tìm {tagInfo.label}</>
            )}
          </button>
          <button onClick={() => loadCandidates(selectedTag, true)} disabled={loading}
            className="glass px-4 py-3 rounded-xl text-xs text-purple-300 hover:text-white transition-all flex items-center gap-1.5"
            title="Đổi nhóm ứng viên khác">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Đổi người khác</span>
          </button>
          {loadedTag && loadedTag !== selectedTag && (
            <p className="text-purple-400 text-sm">Nhấn để tải kết quả cho {tagInfo.label}</p>
          )}
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Results */}
      <AnimatePresence>
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="glass-card p-8 text-center">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="cosmic-spinner" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl"><UiIcon name={TAG_ICONS[selectedTag]} label={tagInfo.label} /></div>
            </div>
            <p className="text-white font-semibold mb-1">AI đang phân tích vũ trụ...</p>
            <p className="text-purple-300 text-sm opacity-70">Đang tìm {tagInfo.label} cho bạn</p>
          </motion.div>
        )}

        {!loading && candidates.length > 0 && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Banner: User đang sử dụng cũng hiển thị trên màn hình của người khác */}
            <div className="glass p-3.5 rounded-2xl border border-purple-500/20 flex flex-wrap items-center justify-between gap-3 bg-purple-950/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    profile.name?.[0]?.toUpperCase() || 'B'
                  )}
                </div>
                <div>
                  <p className="text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                    <span>Hồ sơ của bạn: <strong className="text-purple-300">{profile.name}</strong> ({profile.sun})</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Đang trực tuyến" />
                  </p>
                  <p className="text-purple-300/70 text-xs mt-0.5">
                    Hồ sơ chiêm tinh của bạn đang hoạt động và hiển thị trong danh sách ghép đôi của các thành viên khác ✨
                  </p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-medium border border-purple-400/30 text-purple-200 glass">
                Kết nối 2 chiều đồng bộ
              </span>
            </div>

            {/* Header + Bộ lọc theo mức độ tương hợp */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
              <h2 className="text-white font-semibold text-base sm:text-lg">
                <UiIcon name={TAG_ICONS[selectedTag]} label={tagInfo.label} className="mr-1 inline" />
                {tagInfo.label} – {candidates.length} ứng viên
              </h2>

              {/* Filter chips: Rất hợp -> Hợp vừa -> Thử thách */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {[
                  { id: 'all', label: `Tất cả (${candidates.length})` },
                  { id: 'high', label: 'Rất hợp (≥85%)', color: '#34d399' },
                  { id: 'medium', label: 'Hợp vừa (70-84%)', color: '#fbbf24' },
                  { id: 'challenge', label: 'Thử thách (<70%)', color: '#f87171' },
                ].map(f => {
                  const isActive = filterLevel === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterLevel(f.id as any)}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer border ${
                        isActive
                          ? 'text-white font-semibold border-purple-400/50 bg-purple-500/25 shadow-sm'
                          : 'text-purple-300/80 border-transparent hover:text-white glass'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates
                .filter(c => {
                  const s = c.compatibility_score ?? c.score ?? 75;
                  if (filterLevel === 'high') return s >= 85;
                  if (filterLevel === 'medium') return s >= 70 && s < 85;
                  if (filterLevel === 'challenge') return s < 70;
                  return true;
                })
                .map((c, i) => {
                const matchScore = c.compatibility_score ?? c.score;
                return (
                  <motion.div key={c.uid || i}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -4 }}
                    role="link" tabIndex={0} aria-label={`Xem hồ sơ ${c.name}`}
                    onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) navigate(`/user/${c.uid}`, { state: { candidate: c } }); }}
                    className="glass-card p-5 cursor-pointer card-hover"
                    onClick={() => navigate(`/user/${c.uid}`, { state: { candidate: c } })}
                    style={{
                      border: c.isMatched
                        ? `1px solid ${tagInfo.color}88`
                        : `1px solid ${tagInfo.color}33`,
                      boxShadow: c.isMatched ? `0 0 16px ${tagInfo.color}22` : undefined,
                    }}
                  >
                    {/* Badge Đã Kết Đôi */}
                    {c.isMatched && (
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
                          style={{
                            background: `linear-gradient(135deg, ${tagInfo.color}33, ${tagInfo.color}18)`,
                            border: `1px solid ${tagInfo.color}66`,
                            color: tagInfo.color,
                          }}
                        >
                          <svg viewBox="0 0 24 24" className="w-3 h-3 inline" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          Đã Kết Đôi &amp; Bạn Bè
                        </span>
                      </div>
                    )}
                    {/* Avatar */}
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 relative"
                        style={{ border: `2px solid ${c.isMatched ? tagInfo.color : tagInfo.color + '66'}` }}>
                        {c.avatar ? (
                          <img
                            src={c.avatar}
                            alt={c.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center text-2xl -z-10 absolute inset-0"
                          style={{ background: `linear-gradient(135deg, ${tagInfo.color}66, ${tagInfo.color}33)` }}>
                          {ZODIAC_SIGNS[c.sun || c.zodiac || '']
                            ? <ZodiacIcon sign={c.sun || c.zodiac} label={`Cung ${c.sun || c.zodiac}`} />
                            : c.name?.[0]}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-base truncate">{c.name}</h3>
                        <p className="text-purple-300 text-sm">{ZODIAC_SIGNS[c.sun || c.zodiac || ''] && <ZodiacIcon sign={c.sun || c.zodiac} label={`Cung ${c.sun || c.zodiac}`} className="mr-1 inline" />}{c.zodiac || c.sun}</p>
                        {matchScore != null && (
                          <div className="space-y-1.5 mt-1.5">
                            <div className="flex items-center gap-2">
                              <div className="cosmic-progress flex-1 h-1.5">
                                <div className="h-full rounded" style={{ width: `${matchScore}%`, background: tagInfo.color }} />
                              </div>
                              <span className="text-xs font-bold" style={{ color: tagInfo.color }}>{matchScore}%</span>
                            </div>
                            <div>
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block"
                                style={{
                                  background: matchScore >= 85
                                    ? 'rgba(52, 211, 153, 0.15)'
                                    : matchScore >= 70
                                      ? 'rgba(251, 191, 36, 0.15)'
                                      : 'rgba(248, 113, 113, 0.15)',
                                  border: matchScore >= 85
                                    ? '1px solid rgba(52, 211, 153, 0.35)'
                                    : matchScore >= 70
                                      ? '1px solid rgba(251, 191, 36, 0.35)'
                                      : '1px solid rgba(248, 113, 113, 0.35)',
                                  color: matchScore >= 85 ? '#34d399' : matchScore >= 70 ? '#fbbf24' : '#f87171',
                                }}
                              >
                                {matchScore >= 85 ? 'Tương hợp cao' : matchScore >= 70 ? 'Tương hợp vừa' : 'Thử thách / Khác biệt'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  {c.reason && (
                    <p className="text-purple-200 text-xs leading-relaxed opacity-80 italic">"{c.reason}"</p>
                  )}
                  <div className="space-y-2 mt-3">
                    {c.isMatched ? (
                      <>
                        {/* Trạng thái đã kết đôi — thay nút gửi lời mời */}
                        <div
                          className="w-full py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                          style={{
                            background: `linear-gradient(135deg, ${tagInfo.color}33, ${tagInfo.color}18)`,
                            border: `1px solid ${tagInfo.color}55`,
                          }}
                        >
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 inline" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          <span>Đã kết đôi cùng bạn ✨</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleStartChat(c, e)}
                            className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:bg-white/15 flex items-center justify-center gap-1"
                            style={{
                              background: `linear-gradient(135deg, ${tagInfo.color}55, ${tagInfo.color}33)`,
                              border: `1px solid ${tagInfo.color}44`,
                            }}>
                            <UiIcon name="message" label="Nhắn tin" className="inline" />Nhắn Tin
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/user/${c.uid}`, { state: { candidate: c } });
                            }}
                            className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white glass transition-all hover:bg-white/15 flex items-center justify-center gap-1">
                            <UiIcon name="user" label="Xem hồ sơ" className="inline" />Xem Hồ Sơ
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleQuickMatch(c, e)}
                          disabled={requestLoading[c.uid]}
                          className="w-full py-2 rounded-xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 active:scale-95"
                          style={{
                            background: sentStatusMap[c.uid]
                              ? 'linear-gradient(135deg, rgba(76, 201, 240, 0.4), rgba(76, 201, 240, 0.2))'
                              : `linear-gradient(135deg, ${tagInfo.color}, ${tagInfo.color}cc)`,
                            border: `1px solid ${sentStatusMap[c.uid] ? 'rgba(76, 201, 240, 0.5)' : tagInfo.color + '66'}`,
                          }}>
                          {requestLoading[c.uid] ? (
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : sentStatusMap[c.uid] ? (
                            <>
                              <UiIcon name="check" label="Đã gửi" className="inline text-green-300" />
                              <span>Đã gửi (Bấm để gửi lại)</span>
                            </>
                          ) : (
                            <>
                              <UiIcon name="heart" label="Kết bạn" className="inline" />
                              <span>Kết Bạn &amp; Ghép Đôi</span>
                            </>
                          )}
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleStartChat(c, e)}
                            className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white glass transition-all hover:bg-white/15 flex items-center justify-center gap-1">
                            <UiIcon name="message" label="Nhắn tin" className="inline" />Nhắn Tin
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/user/${c.uid}`, { state: { candidate: c } });
                            }}
                            className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white glass transition-all hover:bg-white/15 flex items-center justify-center gap-1">
                            <UiIcon name="user" label="Xem hồ sơ" className="inline" />Xem Hồ Sơ
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
            </div>
          </motion.div>
        )}

        {!loading && candidates.length === 0 && loadedTag && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card p-10 text-center">
            <div className="text-5xl mb-4"><UiIcon name="compass" label="Chưa có kết quả phù hợp" /></div>
            <p className="text-white font-semibold mb-2">Chưa tìm thấy ai</p>
            <p className="text-purple-300 text-sm opacity-70">Vũ trụ đang chuẩn bị... Hãy thử lại sau!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast Feedback */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 glass-card px-4 py-3 border border-purple-500/40 shadow-2xl flex items-center gap-2 text-sm text-white"
            style={{ background: 'rgba(26, 0, 48, 0.95)' }}
          >
            <UiIcon name="sparkles" label="Thông báo" className="text-yellow-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

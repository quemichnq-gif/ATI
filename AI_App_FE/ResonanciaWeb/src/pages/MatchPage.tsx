import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { RootState } from '../store';
import { MATCH_TAGS, ZODIAC_SIGNS, ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import { apiLoveMatching, apiSendMatchRequest, apiGetMatchRequests, apiAcceptMatch, apiRejectMatch } from '../services/api';
import { MatchTagType } from '../types';
import UiIcon from '../components/UiIcon';
import ZodiacIcon from '../components/ZodiacIcon';
import { getTestProfileByEmailOrUid } from '../constants/testAccounts';
import { initializeChatRoom } from '../services/realtimeChatService';
import { getRankedCandidates, EnrichedCandidate } from '../services/matchSynastryService';
import { DEFAULT_CANDIDATE_PROFILES } from '../constants/defaultCandidates';
import rawMockUsers from '../mocks/usersMockData.json';

const TAG_ICONS: Record<MatchTagType, 'heart' | 'flame' | 'sparkles' | 'star'> = {
  greenflag: 'heart', redflag: 'flame', karmic: 'sparkles', destiny: 'star', twinflame: 'flame',
};

export default function MatchPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTag, setSelectedTag] = useState<MatchTagType>('greenflag');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedTag, setLoadedTag] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [requestLoading, setRequestLoading] = useState<Record<string, boolean>>({});
  const [sentStatusMap, setSentStatusMap] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'challenge'>('all');

  // State cho Modal xem người gửi lời mời kết đôi từ /notifications
  const [modalSender, setModalSender] = useState<any>(null);
  const [modalIncomingMsg, setModalIncomingMsg] = useState<string>('');
  const [modalRequestId, setModalRequestId] = useState<string>('');
  const [modalMatchStatus, setModalMatchStatus] = useState<'pending' | 'matched'>('pending');
  const [acceptingMatch, setAcceptingMatch] = useState(false);

  useEffect(() => {
    const myUid = profile.uid || auth.currentUser?.uid;
    if (!myUid) return;
    apiGetMatchRequests(myUid, 'sent')
      .then(res => {
        const list = res.data?.requests || [];
        const map: Record<string, boolean> = {};
        list.forEach((r: any) => {
          if (r.receiverId && (r.status === 'pending' || r.status === 'accepted')) {
            map[r.receiverId] = true;
          }
        });
        setSentStatusMap(prev => ({ ...prev, ...map }));
      })
      .catch(() => {});
  }, [profile.uid, candidates]);

  // Tự động mở modal hồ sơ của người gửi lời mời khi được điều hướng từ /notifications
  useEffect(() => {
    const routeState = location.state as any;
    if (routeState?.highlightedSenderId || routeState?.openSenderProfile) {
      const senderUid = routeState.highlightedSenderId;
      const notif = routeState.matchRequestNotification;
      const incomingMsg = notif?.message || notif?.body || 'Xin chào! Tôi muốn kết nối với bạn ✨';
      const reqId = notif?.requestId || `${senderUid}_${profile.uid || auth.currentUser?.uid}`;

      setModalIncomingMsg(incomingMsg);
      setModalRequestId(reqId);
      setModalMatchStatus('pending');

      // 1. Tìm thông tin trong DEFAULT_CANDIDATE_PROFILES hoặc candidates
      let foundSender = DEFAULT_CANDIDATE_PROFILES[senderUid] ||
        candidates.find(c => c.uid === senderUid) ||
        (rawMockUsers as any[]).find(m => m.id === senderUid || m.uid === senderUid);

      if (foundSender) {
        const senderObj = foundSender as any;
        const zSign = senderObj.sun || senderObj.zodiac || senderObj.zodiacSign || 'Bảo Bình';
        setModalSender({
          ...senderObj,
          uid: senderUid,
          name: senderObj.name || senderObj.fullName || notif?.senderName || 'Người gửi lời mời',
          avatar: senderObj.avatar || notif?.senderAvatar || '',
          sun: zSign,
          moon: senderObj.moon || 'Nhân Mã',
          ascendant: senderObj.ascendant || 'Song Tử',
          age: senderObj.age || 23,
          job: senderObj.job || senderObj.occupation || 'Thành viên Resonancia',
          bio: senderObj.bio || senderObj.personality || 'Đang kết nối năng lượng và tìm kiếm linh hồn đồng điệu ✨',
          element: senderObj.element || ELEMENT_MAP[zSign] || 'Khí',
          coverImage: senderObj.coverImage,
        });
      } else {
        // 2. Tải trực tiếp từ Firestore nếu là người dùng mới
        getDoc(doc(db, 'users', senderUid))
          .then(snap => {
            if (snap.exists()) {
              const d = snap.data();
              const zSign = d.sun || d.zodiac || d.zodiacSign || 'Bảo Bình';
              setModalSender({
                uid: senderUid,
                name: d.name || d.fullName || notif?.senderName || 'Người gửi lời mời',
                avatar: d.avatar || notif?.senderAvatar || '',
                sun: zSign,
                moon: d.moon || 'Nhân Mã',
                ascendant: d.ascendant || 'Song Tử',
                age: d.age || 23,
                job: d.job || d.occupation || 'Thành viên Resonancia',
                bio: d.bio || 'Đang kết nối năng lượng và tìm kiếm linh hồn đồng điệu ✨',
                element: d.element || ELEMENT_MAP[zSign] || 'Khí',
                ...d,
              });
            } else {
              setModalSender({
                uid: senderUid,
                name: notif?.senderName || 'Người gửi lời mời',
                avatar: notif?.senderAvatar || '',
                sun: 'Bảo Bình',
                moon: 'Nhân Mã',
                ascendant: 'Song Tử',
                age: 23,
                job: 'Thành viên Resonancia',
                bio: 'Đang kết nối năng lượng và tìm kiếm linh hồn đồng điệu ✨',
                element: 'Khí',
              });
            }
          })
          .catch(() => {
            setModalSender({
              uid: senderUid,
              name: notif?.senderName || 'Người gửi lời mời',
              avatar: notif?.senderAvatar || '',
              sun: 'Bảo Bình',
              moon: 'Nhân Mã',
              age: 23,
              bio: 'Đang kết nối năng lượng và tìm kiếm linh hồn đồng điệu ✨',
              element: 'Khí',
            });
          });
      }
    }
  }, [location.state, profile.uid, candidates]);

  const handleConfirmAcceptMatch = async () => {
    const myUid = profile.uid || auth.currentUser?.uid;
    const senderUid = modalSender?.uid;
    if (!myUid || !senderUid) return;

    setAcceptingMatch(true);
    try {
      const reqId = modalRequestId || `${senderUid}_${myUid}`;
      await apiAcceptMatch({
        receiverId: myUid,
        senderId: senderUid,
        uid: myUid,
        targetUid: senderUid,
        requestId: reqId,
        responseMessage: 'Đã đồng ý kết nối cùng bạn!',
      });
      setModalMatchStatus('matched');
      setToastMsg(`Đã kết đôi thành công với ${modalSender.name}! ✨`);
      setTimeout(() => setToastMsg(''), 4000);

      // Ghi thông báo kết đôi thành công lên Firestore để sync với /notifications
      try {
        const notifId1 = `notif_match_${myUid}_${senderUid}_${Date.now()}`;
        const notifId2 = `notif_match_${senderUid}_${myUid}_${Date.now()}`;
        await Promise.all([
          setDoc(doc(db, 'notifications', notifId1), {
            id: notifId1,
            userId: myUid,
            type: 'match_accepted',
            title: 'Kết đôi thành công! ✨',
            message: `Bạn và ${modalSender.name || 'đối phương'} đã kết đôi thành công! Hãy gửi tin nhắn đầu tiên để cùng kết nối vũ trụ.`,
            senderId: senderUid,
            senderName: modalSender.name || 'Người dùng',
            senderAvatar: modalSender.avatar || '',
            requestId: reqId,
            read: false,
            createdAt: new Date().toISOString(),
          }, { merge: true }),
          setDoc(doc(db, 'notifications', notifId2), {
            id: notifId2,
            userId: senderUid,
            type: 'match_accepted',
            title: 'Kết đôi thành công! ✨',
            message: `${profile.name || 'Người ấy'} đã chấp nhận lời mời kết đôi của bạn! Hai bạn đã chính thức kết đôi thành công.`,
            senderId: myUid,
            senderName: profile.name || 'Người dùng',
            senderAvatar: profile.avatar || auth.currentUser?.photoURL || '',
            requestId: reqId,
            read: false,
            createdAt: new Date().toISOString(),
          }, { merge: true }),
          setDoc(doc(db, 'match_requests', reqId), {
            status: 'accepted',
            acceptedAt: new Date().toISOString(),
          }, { merge: true }),
        ]);
      } catch (e) {
        console.warn('Sync firestore accept match error:', e);
      }
    } catch (err: any) {
      console.error('Lỗi chấp nhận kết đôi:', err);
      setToastMsg('Lỗi khi chấp nhận kết đôi. Vui lòng thử lại!');
      setTimeout(() => setToastMsg(''), 3000);
    } finally {
      setAcceptingMatch(false);
    }
  };

  const handleRejectFromModal = async () => {
    const myUid = profile.uid || auth.currentUser?.uid;
    const senderUid = modalSender?.uid;
    if (!myUid || !senderUid) return;

    setAcceptingMatch(true);
    try {
      const reqId = modalRequestId || `${senderUid}_${myUid}`;
      await apiRejectMatch({
        receiverId: myUid,
        senderId: senderUid,
        uid: myUid,
        targetUid: senderUid,
        requestId: reqId,
      });
      setToastMsg(`Đã từ chối lời mời từ ${modalSender.name}`);
      setTimeout(() => setToastMsg(''), 3000);
      setModalSender(null);
    } catch (err) {
      console.error('Lỗi từ chối kết đôi:', err);
    } finally {
      setAcceptingMatch(false);
    }
  };

  const handleStartChatFromModal = async (sender: any) => {
    if (!profile.uid || !sender?.uid) return;
    const targetUid = sender.uid;
    const targetTest = getTestProfileByEmailOrUid(targetUid) || getTestProfileByEmailOrUid(sender.name);
    const canonicalTargetUid = targetTest?.uid || targetUid;
    const chatId = [profile.uid, canonicalTargetUid].sort().join('_');

    try {
      await initializeChatRoom({
        chatId,
        participants: [profile.uid, canonicalTargetUid],
        participantNames: {
          [profile.uid]: profile.name || 'Người dùng',
          [canonicalTargetUid]: sender.name || 'Người dùng',
        },
        participantAvatars: {
          [profile.uid]: profile.avatar || '',
          [canonicalTargetUid]: sender.avatar || '',
        },
        lastMessage: 'Đã kết đôi thành công ✨',
      });
    } catch (e) {
      console.error(e);
    }
    setModalSender(null);
    navigate(`/chat/${chatId}`, { state: { chatName: sender.name } });
  };

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
    setLoading(true);
    setError('');
    const myUid = profile.uid || auth.currentUser?.uid;

    try {
      // 1. Kiểm tra cache từ Client Firestore nếu không yêu cầu forceRefresh
      if (!forceRefresh && myUid) {
        try {
          const cacheSnap = await getDoc(doc(db, 'love_matching_results', myUid, 'types', tag));
          if (cacheSnap.exists()) {
            const data = cacheSnap.data();
            if (data?.users && Array.isArray(data.users) && data.users.length > 0 && data.users[0]?.aspect_name) {
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

      // 2. Thử gọi backend AI phân tích
      let users: any[] = [];
      if (myUid) {
        try {
          const res = await apiLoveMatching(tag, {
            uid: myUid,
            userData: {
              uid: myUid,
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
          users = res.data?.users || [];
        } catch (apiErr) {
          console.warn('API love-matching fallback to calculated mock:', apiErr);
        }
      }

      // 3. Nếu backend không có hoặc chưa có dữ liệu chiêm tinh đầy đủ, tính toán chính xác từ mock candidates
      if (!users || users.length === 0 || !users[0]?.aspect_name) {
        users = getRankedCandidates(profile, tag);
      } else {
        // Làm giàu thêm các thông tin chi tiết từ mock nếu thiếu
        users = users.map((u: any) => {
          const mockMatch = (DEFAULT_CANDIDATE_PROFILES as any)[u.uid];
          return {
            ...u,
            avatar: u.avatar || mockMatch?.avatar || '',
            coverImage: u.coverImage || mockMatch?.coverImage || '',
            bio: u.bio || mockMatch?.bio || '',
            personality: u.personality || mockMatch?.personality || '',
            job: u.job || mockMatch?.job || 'Thành viên Resonancia',
          };
        });
      }

      setCandidates(users);
      setLoadedTag(tag);

      // 4. Lưu cache vào Client Firestore để lần sau hiển thị tức thì
      if (users.length > 0 && myUid) {
        try {
          await setDoc(doc(db, 'love_matching_results', myUid, 'types', tag), {
            type: tag,
            uid: myUid,
            users,
            updatedAt: Date.now(),
          }, { merge: true });
        } catch (saveErr) {
          console.warn('Client cache save error:', saveErr);
        }
      }
    } catch {
      // Hoàn toàn dự phòng bằng mock tính toán chuẩn xác
      const fallbackUsers = getRankedCandidates(profile, tag);
      setCandidates(fallbackUsers);
      setLoadedTag(tag);
    } finally {
      setLoading(false);
    }
  };

  // Tự động load ứng viên khi vào trang lần đầu hoặc khi đổi profile/cung hoàng đạo
  useEffect(() => {
    loadCandidates(selectedTag);
  }, [profile.uid, profile.sun, profile.moon, profile.gender]);

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
                const matchScore = c.compatibility_score ?? c.score ?? 75;
                const bdown = c.breakdown || {
                  love: c.love || 85,
                  trust: c.trust || 85,
                  communication: c.communication || 85,
                  commitment: c.marriage || c.commitment || 85,
                };

                const isHighlightedSender = (c.uid === (location.state as any)?.highlightedSenderId) || (c.uid === modalSender?.uid);

                return (
                  <motion.div key={c.uid || i}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    whileHover={{ y: -4 }}
                    role="link" tabIndex={0} aria-label={`Xem hồ sơ ${c.name}`}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.target === e.currentTarget) {
                        if (isHighlightedSender) {
                          setModalSender(c);
                        } else {
                          navigate(`/user/${c.uid}`, { state: { candidate: c } });
                        }
                      }
                    }}
                    className="glass-card p-5 cursor-pointer card-hover flex flex-col justify-between"
                    onClick={() => {
                      if (isHighlightedSender) {
                        setModalSender(c);
                      } else {
                        navigate(`/user/${c.uid}`, { state: { candidate: c } });
                      }
                    }}
                    style={{
                      border: isHighlightedSender ? '2px solid #ec4899' : `1px solid ${tagInfo.color}33`,
                      boxShadow: isHighlightedSender ? '0 0 25px rgba(236, 72, 153, 0.45)' : '0 8px 30px rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    <div>
                      {isHighlightedSender && (
                        <div className="mb-2.5 flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/25 text-pink-300 border border-pink-400/40 animate-pulse">
                            ★ Đã gửi lời mời cho bạn
                          </span>
                          <span className="text-[11px] text-pink-300 underline font-medium">Bấm mở xác nhận</span>
                        </div>
                      )}

                      {/* Avatar & Info */}
                      <div className="flex items-start gap-3.5 mb-3">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 relative shadow-md"
                          style={{ border: `2px solid ${tagInfo.color}66` }}>
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
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="text-white font-bold text-base truncate" title={c.name}>{c.name}</h3>
                            <span className="text-xs text-purple-300/80 font-medium whitespace-nowrap">
                              {c.age ? `${c.age} tuổi` : ''}
                            </span>
                          </div>
                          <p className="text-purple-300 text-xs flex items-center gap-1 mt-0.5">
                            {ZODIAC_SIGNS[c.sun || c.zodiac || ''] && (
                              <ZodiacIcon sign={c.sun || c.zodiac} label="" className="inline text-xs" />
                            )}
                            <span className="font-semibold">{c.sun || c.zodiac}</span>
                            {c.moon && <span className="opacity-70">· Moon {c.moon}</span>}
                          </p>
                          {c.job && (
                            <p className="text-purple-300/60 text-[11px] truncate mt-0.5" title={c.job}>
                              {c.job}
                            </p>
                          )}

                          {/* Điểm Tương Hợp Tổng Hợp */}
                          {matchScore != null && (
                            <div className="space-y-1 mt-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="cosmic-progress flex-1 h-2">
                                  <div className="h-full rounded" style={{ width: `${matchScore}%`, background: tagInfo.color }} />
                                </div>
                                <span className="text-xs font-bold whitespace-nowrap" style={{ color: tagInfo.color }}>{matchScore}%</span>
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
                                  {c.match_level_text || (matchScore >= 85 ? 'Tương hợp cao' : matchScore >= 70 ? 'Tương hợp vừa' : 'Thử thách / Khác biệt')}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Đánh giá tương hợp / không xứng như nào */}
                      {c.reason && (
                        <p className="text-purple-200/90 text-xs leading-relaxed my-3">
                          {c.reason}
                        </p>
                      )}

                      {/* Lời khuyên ngắn ở dưới */}
                      {c.advice && (
                        <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-[11px] text-purple-200/90 mb-3">
                          <span className="text-amber-300 font-bold flex-shrink-0">💡 Lời khuyên:</span>
                          <span className="leading-snug">{c.advice}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 mt-2 pt-2 border-t border-purple-500/20">
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
                            <span>Kết Bạn & Ghép Đôi</span>
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

      {/* Modal Mở giao diện người dùng gửi lời mời kết đôi với nút xác nhận ở Hành Động Kết Nối */}
      <AnimatePresence>
        {modalSender && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card max-w-2xl w-full rounded-3xl border border-purple-500/35 shadow-2xl overflow-hidden relative"
              style={{ background: 'rgba(15, 8, 38, 0.97)' }}
            >
              {/* Nút đóng modal */}
              <button
                type="button"
                onClick={() => setModalSender(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
                title="Đóng giao diện"
                aria-label="Đóng giao diện"
              >
                ✕
              </button>

              {/* Cover & Avatar */}
              <div className="relative">
                <div
                  className="h-36 sm:h-44 rounded-t-3xl overflow-hidden relative"
                  style={{
                    background: modalSender.coverImage
                      ? `url(${modalSender.coverImage}) center/cover no-repeat`
                      : `linear-gradient(135deg, rgba(168,85,247,0.4), rgba(236,72,153,0.3), #1a0030)`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0728] via-transparent to-black/30" />
                  <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-15">
                    <ZodiacIcon sign={modalSender.sun || modalSender.zodiac} label="" />
                  </div>
                </div>

                <div className="absolute -bottom-8 left-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl relative bg-purple-950 border-2 border-purple-400">
                    {modalSender.avatar ? (
                      <img src={modalSender.avatar} alt={modalSender.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-tr from-purple-600 to-pink-500">
                        {modalSender.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#100a2a]" title="Trực tuyến" />
                  </div>
                </div>
              </div>

              {/* Chi tiết thông tin người gửi */}
              <div className="pt-11 p-6 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">{modalSender.name}</h2>
                    {modalSender.age && (
                      <span className="text-sm font-semibold text-purple-300 px-2.5 py-0.5 rounded-full glass border border-purple-400/30">
                        {modalSender.age} tuổi
                      </span>
                    )}
                  </div>
                  {modalSender.job && (
                    <p className="text-purple-300 text-sm mt-1 flex items-center gap-1.5 opacity-80">
                      <UiIcon name="briefcase" label="Nghề nghiệp" className="inline text-xs" />
                      <span>{modalSender.job}</span>
                    </p>
                  )}
                </div>

                {/* Chips chiêm tinh */}
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <span className="glass px-3 py-1 rounded-full text-xs font-semibold text-white border border-purple-400/30 flex items-center gap-1.5">
                    <ZodiacIcon sign={modalSender.sun || modalSender.zodiac} label="" className="inline text-xs" />
                    <span>Sun {modalSender.sun || modalSender.zodiac}</span>
                  </span>
                  <span className="glass px-3 py-1 rounded-full text-xs font-semibold text-white border border-purple-400/30 flex items-center gap-1.5">
                    <UiIcon name="moon" label="Mặt Trăng" className="inline text-xs text-yellow-200" />
                    <span>Moon {modalSender.moon || 'Nhân Mã'}</span>
                  </span>
                  {modalSender.ascendant && (
                    <span className="glass px-3 py-1 rounded-full text-xs font-semibold text-white border border-purple-400/30 flex items-center gap-1.5">
                      <UiIcon name="arrow-up" label="Cung Mọc" className="inline text-xs text-cyan-300" />
                      <span>Mọc {modalSender.ascendant}</span>
                    </span>
                  )}
                  {modalSender.element && (
                    <span className="glass px-3 py-1 rounded-full text-xs font-semibold text-purple-200 border border-purple-400/30">
                      Hệ {modalSender.element}
                    </span>
                  )}
                </div>

                {/* Tiểu sử */}
                {modalSender.bio && (
                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs text-purple-200/90 leading-relaxed">
                    <p className="font-semibold text-white mb-1">Giới thiệu bản thân:</p>
                    <p className="italic">"{modalSender.bio}"</p>
                  </div>
                )}

                {/* ========================================================= */}
                {/* HÀNH ĐỘNG KẾT NỐI (CÓ NÚT XÁC NHẬN KẾT ĐÔI)                */}
                {/* ========================================================= */}
                <div className="glass-card p-4 sm:p-5 space-y-3 rounded-2xl border border-purple-500/30 bg-purple-950/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                      <UiIcon name="heart" label="Kết nối" className="text-pink-400" />
                      <span>Hành Động Kết Nối</span>
                    </h3>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold animate-pulse">
                      Đã gửi lời mời ghép đôi ✨
                    </span>
                  </div>

                  {/* Lời nhắn từ người gửi */}
                  <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-400/20 text-xs text-purple-200">
                    <p className="font-semibold text-purple-300 mb-0.5">Lời nhắn kết nối từ {modalSender.name}:</p>
                    <p className="italic text-white">"{modalIncomingMsg || 'Xin chào! Tôi muốn kết nối với bạn ✨'}"</p>
                  </div>

                  {modalMatchStatus === 'matched' ? (
                    <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-emerald-300 text-sm font-semibold flex items-center gap-1.5">
                        <UiIcon name="check" label="Đã kết đôi" className="inline text-emerald-400" />
                        Đã kết đôi thành công với {modalSender.name}! ✨
                      </p>
                      <button
                        type="button"
                        onClick={() => handleStartChatFromModal(modalSender)}
                        className="btn-cosmic px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <UiIcon name="message" label="Nhắn tin" className="inline" /> Nhắn Tin Ngay
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={handleConfirmAcceptMatch}
                        disabled={acceptingMatch}
                        className="btn-cosmic px-5 py-2.5 text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all font-semibold"
                      >
                        {acceptingMatch ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Đang xác nhận...</span>
                          </>
                        ) : (
                          <>
                            <UiIcon name="check" label="Xác nhận kết đôi" className="inline" />
                            <span>Xác Nhận Kết Đôi</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleRejectFromModal}
                        disabled={acceptingMatch}
                        className="glass px-4 py-2.5 text-xs sm:text-sm text-purple-300 hover:text-red-400 rounded-xl cursor-pointer transition-all"
                      >
                        Từ Chối
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartChatFromModal(modalSender)}
                        className="glass px-3.5 py-2.5 text-xs sm:text-sm text-cyan-300 hover:text-white rounded-xl flex items-center gap-1.5 cursor-pointer ml-auto transition-all"
                      >
                        <UiIcon name="message" label="Nhắn tin" className="inline" />
                        <span>Nhắn Tin</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
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

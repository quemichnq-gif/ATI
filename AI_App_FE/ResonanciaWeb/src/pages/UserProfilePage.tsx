import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { auth, db } from '../services/firebase';
import { RootState } from '../store';
import { apiCompatibility, apiSendMatchRequest, apiCheckMatchStatus, apiBreakup, apiAcceptMatch, apiRejectMatch } from '../services/api';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import { DEFAULT_CANDIDATE_PROFILES } from '../constants/defaultCandidates';
import rawMockUsers from '../mocks/usersMockData.json';
import { calculateSynastryDetails } from '../services/matchSynastryService';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import UiIcon from '../components/UiIcon';
import ZodiacIcon from '../components/ZodiacIcon';
import { getTestProfileByEmailOrUid } from '../constants/testAccounts';
import { initializeChatRoom } from '../services/realtimeChatService';

export default function UserProfilePage() {
  const params = useParams<{ userId?: string; uid?: string }>();
  const targetUid = params.userId || params.uid;
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useSelector((s: RootState) => s.profile);
  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [compatibility, setCompatibility] = useState<any>(null);
  const [loadingCompat, setLoadingCompat] = useState(false);
  const [matchStatus, setMatchStatus] = useState<string>('none');
  const [sending, setSending] = useState(false);
  const [matchMsg, setMatchMsg] = useState('');

  const element = ELEMENT_MAP[targetProfile?.sun || ''] || 'Không xác định';
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];

  useEffect(() => {
    if (!targetUid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // 1. Nếu xem chính mình
    if (profile.uid && targetUid === profile.uid) {
      setTargetProfile(profile);
      setLoading(false);
      return;
    }

    // 2. Nếu có dữ liệu truyền qua router state (từ MatchPage hoặc HomePage)
    const stateCandidate = (location.state as any)?.candidate || (location.state as any)?.user;
    if (stateCandidate && (stateCandidate.uid === targetUid || stateCandidate.id === targetUid)) {
      setTargetProfile({
        uid: targetUid,
        name: stateCandidate.name || stateCandidate.fullName || 'Người dùng Resonancia',
        avatar: stateCandidate.avatar || '',
        sun: stateCandidate.sun || stateCandidate.zodiac || stateCandidate.zodiacSign || 'Bảo Bình',
        moon: stateCandidate.moon || 'Nhân Mã',
        ascendant: stateCandidate.ascendant || 'Song Tử',
        age: stateCandidate.age || 24,
        job: stateCandidate.job || stateCandidate.occupation || 'Thành viên Resonancia',
        bio: stateCandidate.bio || stateCandidate.personality || 'Đang kết nối năng lượng và tìm kiếm linh hồn đồng điệu trên Resonancia ✨',
        personality: stateCandidate.personality || stateCandidate.bio || 'Chân thành, ấm áp',
        ...stateCandidate,
      });
      setLoading(false);
      return;
    }

    // 3. Kiểm tra xem đây có phải là ứng viên mẫu trong DEFAULT_CANDIDATE_PROFILES không
    const defaultCandidate = DEFAULT_CANDIDATE_PROFILES[targetUid];
    if (defaultCandidate) {
      setTargetProfile(defaultCandidate);
      setLoading(false);
      // Đồng bộ profile vào Firestore để các tính năng khác (chat, request) hoạt động
      setDoc(doc(db, 'users', targetUid), defaultCandidate, { merge: true }).catch(() => {});
      return;
    }

    // 4. Tìm kiếm trong kho 100 mock users đa dạng
    const mockFound = (rawMockUsers as any[]).find(m => m.id === targetUid || m.uid === targetUid);
    if (mockFound) {
      const zSign = mockFound.zodiacSign || mockFound.zodiac || 'Bảo Bình';
      const candidateData = {
        uid: targetUid,
        name: mockFound.fullName || mockFound.name || 'Người dùng Resonancia',
        avatar: mockFound.avatar || '',
        sun: zSign,
        moon: mockFound.moon || (zSign === 'Xử Nữ' ? 'Kim Ngưu' : 'Xử Nữ'),
        ascendant: mockFound.ascendant || 'Thiên Bình',
        age: mockFound.dateOfBirth ? (2026 - parseInt(mockFound.dateOfBirth.slice(0, 4), 10)) : (mockFound.age || 24),
        job: mockFound.occupation || mockFound.job || 'Product Designer & Sáng tạo nội dung',
        bio: mockFound.bio || 'Yêu thích chiêm tinh học, nghệ thuật và những cuộc trò chuyện sâu sắc dưới bầu trời sao.',
        gender: mockFound.gender || '',
        element: ELEMENT_MAP[zSign] || 'Đất',
        personality: mockFound.bio || 'Chân thành, ấm áp và luôn hướng tới sự đồng điệu.',
        planets: { sun: zSign, moon: 'Xử Nữ', mercury: zSign, venus: 'Kim Ngưu', mars: 'Bạch Dương' },
      };
      setTargetProfile(candidateData);
      setLoading(false);
      setDoc(doc(db, 'users', targetUid), candidateData, { merge: true }).catch(() => {});
      return;
    }

    // 5. Thử nạp từ Firestore
    getDoc(doc(db, 'users', targetUid))
      .then(snap => {
        if (snap.exists()) {
          setTargetProfile({ uid: targetUid, ...snap.data() });
        } else {
          // 6. Fallback thông minh: Tạo profile hợp lệ từ targetUid thay vì báo lỗi
          setTargetProfile({
            uid: targetUid,
            name: 'Thành Viên Resonancia',
            sun: 'Bảo Bình',
            moon: 'Nhân Mã',
            ascendant: 'Song Tử',
            age: 23,
            job: 'Thành viên cộng đồng Resonancia',
            bio: 'Đang kết nối năng lượng và tìm kiếm linh hồn đồng điệu trên Resonancia ✨',
            element: 'Khí',
          });
        }
      })
      .catch(err => {
        console.error('Lỗi tải profile user:', err);
        setTargetProfile({
          uid: targetUid,
          name: 'Thành Viên Resonancia',
          sun: 'Bảo Bình',
          moon: 'Nhân Mã',
          age: 23,
          bio: 'Đang kết nối năng lượng và tìm kiếm linh hồn đồng điệu trên Resonancia ✨',
        });
      })
      .finally(() => {
        setLoading(false);
      });

    if (profile.uid && targetUid !== profile.uid) {
      apiCheckMatchStatus(profile.uid, targetUid)
        .then(res => setMatchStatus(res.data?.status || 'none'))
        .catch(() => {});
    }
  }, [targetUid, profile.uid, location.state]);

  const handleStartChat = async () => {
    if (!profile.uid || !targetUid || !targetProfile) return;

    const targetTest = getTestProfileByEmailOrUid(targetUid) || getTestProfileByEmailOrUid(targetProfile.name);
    const canonicalTargetUid = targetTest?.uid || targetUid;
    const chatId = [profile.uid, canonicalTargetUid].sort().join('_');

    try {
      await initializeChatRoom({
        chatId,
        participants: [profile.uid, canonicalTargetUid],
        participantNames: {
          [profile.uid]: profile.name || 'Người dùng',
          [canonicalTargetUid]: targetProfile.name || 'Người dùng',
        },
        participantAvatars: {
          [profile.uid]: profile.avatar || '',
          [canonicalTargetUid]: targetProfile.avatar || '',
        },
        lastMessage: 'Đã bắt đầu cuộc trò chuyện ✨',
      });

      await setDoc(doc(db, 'chats', chatId), {
        participants: [profile.uid, canonicalTargetUid],
        participantNames: {
          [profile.uid]: profile.name || 'Người dùng',
          [canonicalTargetUid]: targetProfile.name || 'Người dùng',
        },
        participantAvatars: {
          [profile.uid]: profile.avatar || '',
          [canonicalTargetUid]: targetProfile.avatar || '',
        },
        lastMessage: 'Đã bắt đầu cuộc trò chuyện ✨',
        lastTimestamp: Date.now(),
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
    navigate(`/chat/${chatId}`, { state: { chatName: targetProfile.name } });
  };

  const runCompatibilityAnalysis = async (candidateObj?: any) => {
    const target = candidateObj || targetProfile;
    const currentUid = profile.uid || auth.currentUser?.uid;
    if (!target || !targetUid || (currentUid && targetUid === currentUid)) return;

    setLoadingCompat(true);

    const targetSun = target.sun || target.zodiac || target.zodiacSign || 'Bảo Bình';
    const targetMoon = target.moon || 'Nhân Mã';
    const mySun = profile.sun || profile.zodiac || 'Bạch Dương';
    const myMoon = profile.moon || 'Song Ngư';
    const myElem = ELEMENT_MAP[mySun] || 'Hoả';
    const targetElem = ELEMENT_MAP[targetSun] || 'Khí';

    // Tính toán tức thì bằng Synastry Engine để người dùng có kết quả ngay không cần chờ
    const fallbackSynastry = calculateSynastryDetails(
      mySun,
      myMoon,
      myElem,
      targetSun,
      targetMoon,
      targetElem,
      'greenflag'
    );

    const initialCompatData = {
      analysis: `${fallbackSynastry.reason} ${fallbackSynastry.advice}`,
      compatibility_score: fallbackSynastry.score,
      love_score: fallbackSynastry.breakdown.love,
      trust_score: fallbackSynastry.breakdown.trust,
      communication_score: fallbackSynastry.breakdown.communication,
      marriage_score: fallbackSynastry.breakdown.commitment,
      scores: {
        overall: fallbackSynastry.score,
        love: fallbackSynastry.breakdown.love,
        trust: fallbackSynastry.breakdown.trust,
        communication: fallbackSynastry.breakdown.communication,
        marriage: fallbackSynastry.breakdown.commitment,
      },
    };

    setCompatibility((prev: any) => prev || initialCompatData);

    try {
      const myId = currentUid || 'my_account';
      const res = await apiCompatibility({
        myUid: myId,
        partnerUid: targetUid,
        uid1: myId,
        uid2: targetUid,
        user1Data: { name: profile.name || 'Bạn', sun: mySun, moon: myMoon, ascendant: profile.ascendant },
        user2Data: { name: target.name, sun: targetSun, moon: targetMoon, ascendant: target.ascendant },
      });
      if (res?.data && (res.data.scores || res.data.compatibility_score)) {
        setCompatibility(res.data);
      }
    } catch (e) {
      console.warn('API compatibility analysis fallback to synastry engine:', e);
    } finally {
      setLoadingCompat(false);
    }
  };

  // Tự động chạy phân tích tương hợp ngay khi mở trang hồ sơ người dùng khác
  useEffect(() => {
    const currentUid = profile.uid || auth.currentUser?.uid;
    if (targetProfile && targetUid && targetUid !== currentUid) {
      runCompatibilityAnalysis(targetProfile);
    }
  }, [profile.uid, auth.currentUser?.uid, targetProfile?.uid, targetProfile?.name, targetUid]);

  const handleMatchRequest = async () => {
    const myUid = profile.uid || auth.currentUser?.uid;
    if (!myUid || !targetUid) return;
    setSending(true);
    try {
      await apiSendMatchRequest({
        senderId: myUid,
        receiverId: targetUid,
        senderName: profile.name || auth.currentUser?.displayName || 'Người dùng',
        message: matchMsg || 'Xin chào! Tôi muốn kết nối với bạn ✨'
      });
      try {
        const requestId = `${myUid}_${targetUid}`;
        await setDoc(doc(db, 'match_requests', requestId), {
          requestId,
          senderId: myUid,
          receiverId: targetUid,
          senderName: profile.name || auth.currentUser?.displayName || 'Người dùng',
          senderAvatar: profile.avatar || auth.currentUser?.photoURL || '',
          message: matchMsg || 'Xin chào! Tôi muốn kết nối với bạn ✨',
          status: 'pending',
          createdAt: new Date().toISOString(),
        }, { merge: true });
      } catch {}
      setMatchStatus('pending_sent');
    } catch (err: any) {
      console.error('Lỗi khi gửi kết bạn:', err);
    } finally {
      setSending(false);
    }
  };

  const handleBreakup = async () => {
    if (!profile.uid || !targetUid) return;
    setSending(true);
    try {
      await apiBreakup({ userId: profile.uid, partnerId: targetUid });
      setMatchStatus('none');
      setMatchMsg('');
    } catch (e) {
      console.error('Lỗi khi hủy kết đôi:', e);
    } finally {
      setSending(false);
    }
  };

  const handleAcceptMatch = async () => {
    const myUid = profile.uid || auth.currentUser?.uid;
    if (!myUid || !targetUid) return;
    setSending(true);
    try {
      await apiAcceptMatch({
        receiverId: myUid,
        senderId: targetUid,
        uid: myUid,
        targetUid: targetUid,
        requestId: `${targetUid}_${myUid}`,
        responseMessage: 'Đã đồng ý kết nối cùng bạn!',
      });
      setMatchStatus('matched');

      // Ghi nhận thông báo kết đôi thành công lên Firestore để đảm bảo hiển thị tức thì ở /notifications
      try {
        const notifId1 = `notif_match_${myUid}_${targetUid}_${Date.now()}`;
        const notifId2 = `notif_match_${targetUid}_${myUid}_${Date.now()}`;
        const targetName = targetProfile?.name || 'Người dùng';
        const myName = profile.name || auth.currentUser?.displayName || 'Bạn';

        await Promise.all([
          setDoc(doc(db, 'notifications', notifId1), {
            id: notifId1,
            userId: myUid,
            type: 'match_accepted',
            title: 'Kết đôi thành công! ✨',
            message: `Bạn và ${targetName} đã kết đôi thành công! Hãy gửi tin nhắn đầu tiên để cùng kết nối vũ trụ.`,
            senderId: targetUid,
            senderName: targetName,
            senderAvatar: targetProfile?.avatar || '',
            requestId: `${targetUid}_${myUid}`,
            read: false,
            createdAt: new Date().toISOString(),
          }, { merge: true }),
          setDoc(doc(db, 'notifications', notifId2), {
            id: notifId2,
            userId: targetUid,
            type: 'match_accepted',
            title: 'Kết đôi thành công! ✨',
            message: `${myName} đã chấp nhận lời mời kết đôi của bạn! Hai bạn đã chính thức kết đôi thành công.`,
            senderId: myUid,
            senderName: myName,
            senderAvatar: profile.avatar || auth.currentUser?.photoURL || '',
            requestId: `${targetUid}_${myUid}`,
            read: false,
            createdAt: new Date().toISOString(),
          }, { merge: true }),
          setDoc(doc(db, 'match_requests', `${targetUid}_${myUid}`), {
            status: 'accepted',
            acceptedAt: new Date().toISOString(),
          }, { merge: true }),
        ]);
      } catch (err) {
        console.warn('Firestore notification sync error:', err);
      }
    } catch (e) {
      console.error('Lỗi chấp nhận kết đôi:', e);
    } finally {
      setSending(false);
    }
  };

  const handleRejectMatch = async () => {
    if (!profile.uid || !targetUid) return;
    setSending(true);
    try {
      await apiRejectMatch({ uid: profile.uid, targetUid });
      setMatchStatus('none');
    } catch (e) {
      console.error('Lỗi từ chối kết đôi:', e);
    } finally {
      setSending(false);
    }
  };

  const compatScores = compatibility?.scores || (compatibility?.compatibility_score != null ? {
    overall: compatibility.compatibility_score,
    love: compatibility.love_score ?? compatibility.compatibility_score,
    trust: compatibility.trust_score ?? compatibility.compatibility_score,
    communication: compatibility.communication_score ?? compatibility.compatibility_score,
    marriage: compatibility.marriage_score ?? compatibility.compatibility_score,
  } : null);
  const radarData = compatScores ? [
    { subject: 'Tổng thể', value: compatScores.overall },
    { subject: 'Tình Yêu', value: compatScores.love },
    { subject: 'Tin Tưởng', value: compatScores.trust },
    { subject: 'Giao Tiếp', value: compatScores.communication },
    { subject: 'Hôn Nhân', value: compatScores.marriage },
  ] : [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="cosmic-spinner" />
    </div>
  );

  if (!targetProfile) return (
    <div className="text-center py-12">
      <p className="text-white">Không tìm thấy người dùng này</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-purple-400 hover:text-white">← Quay lại</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-purple-300 hover:text-white text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>← Quay lại</span>
        </button>
        <span className="text-xs text-purple-300/70 hidden sm:inline">
          Hồ sơ chiêm tinh &amp; Phân tích tương hợp
        </span>
      </div>

      {/* Grid 2 Columns cân xứng trên desktop/tablet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ========================================================= */}
        {/* CỘT TRÁI: THÔNG TIN HỒ SƠ & HÀNH ĐỘNG KẾT NỐI             */}
        {/* ========================================================= */}
        <div className="space-y-6">
          {/* Card Hồ Sơ Chính */}
          <div className="glass-card overflow-hidden rounded-3xl border border-purple-500/25 shadow-xl">
            {/* Cover & Avatar */}
            <div className="relative">
              <div
                className="h-40 rounded-t-3xl overflow-hidden relative"
                style={{
                  background: targetProfile.coverImage
                    ? `url(${targetProfile.coverImage}) center/cover no-repeat`
                    : `linear-gradient(135deg, ${colors[0]}44, ${colors[1]}33, #1a0030)`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0728] via-transparent to-black/20" />
                <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-15">
                  <ZodiacIcon sign={targetProfile.sun} label={`Cung ${targetProfile.sun}`} />
                </div>
              </div>

              <div className="absolute -bottom-8 left-6">
                <div
                  className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl relative bg-purple-950"
                  style={{ border: `3px solid ${colors[0]}` }}
                >
                  {targetProfile.avatar ? (
                    <img src={targetProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
                    >
                      {targetProfile.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#100a2a]" title="Trực tuyến" />
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="pt-11 p-6 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-2xl font-bold text-white tracking-tight">{targetProfile.name}</h1>
                  {targetProfile.age && (
                    <span className="text-sm font-semibold text-purple-300 px-2.5 py-0.5 rounded-full glass border border-purple-400/30">
                      {targetProfile.age} tuổi
                    </span>
                  )}
                </div>
                {targetProfile.job && (
                  <p className="text-purple-300 text-sm mt-1 flex items-center gap-1.5 opacity-80">
                    <UiIcon name="briefcase" label="Nghề nghiệp" className="inline text-xs" />
                    <span>{targetProfile.job}</span>
                  </p>
                )}
                {targetProfile.address && (
                  <p className="text-purple-300/70 text-xs mt-0.5 flex items-center gap-1.5">
                    <span>📍 {targetProfile.address}</span>
                  </p>
                )}
              </div>

              {/* Chiêm tinh chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="glass px-3 py-1 rounded-full text-xs font-semibold text-white border border-purple-400/30 flex items-center gap-1.5">
                  <ZodiacIcon sign={targetProfile.sun} label="" className="inline text-xs" />
                  <span>Sun {targetProfile.sun}</span>
                </span>
                <span className="glass px-3 py-1 rounded-full text-xs font-semibold text-white border border-purple-400/30 flex items-center gap-1.5">
                  <UiIcon name="moon" label="Mặt Trăng" className="inline text-xs text-yellow-200" />
                  <span>Moon {targetProfile.moon}</span>
                </span>
                {targetProfile.ascendant && (
                  <span className="glass px-3 py-1 rounded-full text-xs font-semibold text-white border border-purple-400/30 flex items-center gap-1.5">
                    <UiIcon name="arrow-up" label="Cung Mọc" className="inline text-xs text-cyan-300" />
                    <span>Mọc {targetProfile.ascendant}</span>
                  </span>
                )}
                {targetProfile.element && (
                  <span className="glass px-3 py-1 rounded-full text-xs font-semibold text-purple-200 border border-purple-400/30">
                    Hệ {targetProfile.element}
                  </span>
                )}
                {targetProfile.relationshipStatus && (
                  <span className="glass px-3 py-1 rounded-full text-xs text-purple-300/90 border border-purple-400/20">
                    {targetProfile.relationshipStatus}
                  </span>
                )}
              </div>

              {/* Bio */}
              {targetProfile.bio && (
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs text-purple-200/90 leading-relaxed">
                  <p className="font-semibold text-white mb-1">Giới thiệu bản thân:</p>
                  <p className="italic">"{targetProfile.bio}"</p>
                </div>
              )}

              {/* Hobbies (Sở thích) nếu có */}
              {Array.isArray(targetProfile.hobbies) && targetProfile.hobbies.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-purple-300">Sở thích &amp; Phong cách sống:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {targetProfile.hobbies.map((h: string, idx: number) => (
                      <span key={idx} className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-900/30 text-purple-200 border border-purple-500/20">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: Kết Nối & Ghép Đôi */}
          {targetUid !== profile.uid && (
            <div className="glass-card p-5 space-y-3 rounded-3xl border border-purple-500/25 shadow-xl">
              <h3 className="text-white font-semibold text-base flex items-center gap-2">
                <UiIcon name="heart" label="Kết nối" />
                <span>Hành Động Kết Nối</span>
              </h3>

              <div className="flex gap-3 flex-wrap items-center">
                {matchStatus === 'none' && (
                  <>
                    <input
                      aria-label="Lời nhắn kết nối (tuỳ chọn)"
                      className="cosmic-input text-sm flex-1 min-w-[200px]"
                      placeholder="Lời nhắn kết nối (tuỳ chọn)..."
                      value={matchMsg}
                      onChange={(e) => setMatchMsg(e.target.value)}
                    />
                    <button
                      onClick={handleMatchRequest}
                      disabled={sending}
                      className="btn-cosmic px-5 py-2.5 text-sm flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all"
                    >
                      {sending ? (
                        <>
                          <UiIcon name="hourglass" label="Đang gửi" className="inline" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <UiIcon name="mail" label="Gửi yêu cầu kết đôi" className="inline" />
                          Gửi Lời Mời Kết Đôi
                        </>
                      )}
                    </button>
                  </>
                )}

                {(matchStatus === 'pending' || matchStatus === 'pending_sent') && (
                  <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-yellow-400 text-sm flex items-center gap-1.5">
                      <UiIcon name="hourglass" label="Đang chờ phản hồi" className="inline" />
                      Đã gửi yêu cầu kết đôi, đang chờ phản hồi
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleMatchRequest}
                        disabled={sending}
                        className="btn-cosmic px-3 py-1.5 text-xs flex items-center gap-1"
                      >
                        ↻ Gửi Lại Lời Mời
                      </button>
                      <button
                        onClick={handleBreakup}
                        disabled={sending}
                        className="glass px-3 py-1.5 text-xs text-purple-300 hover:text-red-400 rounded-xl transition-all"
                      >
                        Hủy Yêu Cầu
                      </button>
                    </div>
                  </div>
                )}

                {matchStatus === 'pending_received' && (
                  <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-purple-300 text-sm flex items-center gap-1.5">
                      <UiIcon name="sparkles" label="Lời mời mới" className="inline text-yellow-400" />
                      Người này đã gửi lời mời kết đôi cho bạn!
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAcceptMatch}
                        disabled={sending}
                        className="btn-cosmic px-4 py-1.5 text-xs flex items-center gap-1"
                      >
                        <UiIcon name="check" label="Đồng ý" className="inline" /> Đồng Ý Kết Bạn
                      </button>
                      <button
                        onClick={handleRejectMatch}
                        disabled={sending}
                        className="glass px-3 py-1.5 text-xs text-purple-300 hover:text-red-400 rounded-xl transition-all"
                      >
                        Từ Chối
                      </button>
                    </div>
                  </div>
                )}

                {matchStatus === 'matched' && (
                  <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-green-400 text-sm flex items-center gap-1.5">
                      <UiIcon name="check" label="Đã kết đôi" className="inline" />
                      Đã kết đôi thành công! ✨
                    </p>
                    <button
                      onClick={handleBreakup}
                      disabled={sending}
                      className="glass px-3 py-1.5 text-xs text-purple-300 hover:text-red-400 rounded-xl transition-all"
                    >
                      Hủy Kết Đôi / Kết Bạn Lại
                    </button>
                  </div>
                )}

                <button
                  className="btn-cosmic px-5 py-2.5 text-sm flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all"
                  style={{ background: 'rgba(76,201,240,0.3)', border: '1px solid rgba(76,201,240,0.4)' }}
                  onClick={handleStartChat}
                >
                  <UiIcon name="message" label="Nhắn tin" className="inline" />
                  Nhắn Tin Trực Tiếp
                </button>
              </div>
            </div>
          )}

          {/* Góc nhìn của đối phương: Hiện diện 2 chiều tương hỗ */}
          {targetUid !== profile.uid && (
            <div className="glass-card p-4 rounded-3xl border border-purple-500/25 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                  <UiIcon name="sparkles" label="Kết nối 2 chiều" />
                  <span>Góc nhìn của {targetProfile.name} về bạn</span>
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Hiển thị tương hỗ
                </span>
              </div>

              <div className="glass p-3 rounded-2xl flex items-center justify-between gap-3 flex-wrap bg-purple-950/20 text-xs">
                {/* Bạn */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-bold text-white shadow-md flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
                  >
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      profile.name?.[0]?.toUpperCase() || 'B'
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{profile.name || 'Bạn'} (Bạn)</p>
                    <p className="text-purple-300/70 text-[11px]">{profile.sun || 'Chiêm tinh'} · {profile.age || 22}t</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-purple-300 text-[11px] font-medium glass px-2.5 py-1 rounded-full border border-purple-400/25">
                  <span>⇄ {targetProfile.name} cũng thấy bạn ⇄</span>
                </div>

                {/* Đối phương */}
                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <p className="text-white font-semibold">{targetProfile.name}</p>
                    <p className="text-purple-300/70 text-[11px]">{targetProfile.sun} · {targetProfile.age || 23}t</p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-bold text-white shadow-md flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
                  >
                    {targetProfile.avatar ? (
                      <img src={targetProfile.avatar} alt={targetProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      targetProfile.name?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI: PHÂN TÍCH TƯƠNG HỢP CHIÊM TINH (TỰ ĐỘNG CHẠY)   */}
        {/* ========================================================= */}
        <div className="space-y-6">
          {targetUid !== profile.uid && (
            <div className="glass-card p-6 rounded-3xl border border-purple-500/30 shadow-2xl relative overflow-hidden">
              {/* Header Phân Tích */}
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-purple-500/20">
                <div>
                  <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    <UiIcon name="sparkles" label="Phân tích tương hợp" className="text-purple-300" />
                    <span>Phân Tích Tương Hợp Chiêm Tinh</span>
                  </h2>
                  <p className="text-xs text-purple-300/70 mt-0.5">
                    Độ hòa hợp vũ trụ giữa {profile.name || 'Bạn'} &amp; {targetProfile.name}
                  </p>
                </div>

                <button
                  onClick={() => runCompatibilityAnalysis(targetProfile)}
                  disabled={loadingCompat}
                  className="glass px-3 py-1.5 rounded-xl text-xs text-purple-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer border border-purple-400/30 hover:border-purple-300 shadow-sm"
                  title="Phân tích lại tương hợp"
                >
                  {loadingCompat ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang phân tích...</span>
                    </>
                  ) : (
                    <>
                      <span>↻</span>
                      <span>Phân Tích Lại</span>
                    </>
                  )}
                </button>
              </div>

              {/* Loading Indicator */}
              {loadingCompat && !compatScores && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="cosmic-spinner w-10 h-10" />
                  <p className="text-white font-semibold text-sm">AI đang đồng bộ dữ liệu bản đồ sao đôi...</p>
                  <p className="text-purple-300/70 text-xs">Phân tích năng lượng {profile.sun} × {targetProfile.sun}</p>
                </div>
              )}

              {/* Kết Quả Phân Tích (Radar + Điểm Số + Nội Dung Chi Tiết) */}
              {compatScores && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {/* Banner Điểm Số Tổng Quan */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-pink-950/30 to-purple-950/40 border border-purple-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-purple-300 font-semibold uppercase tracking-wider block">
                        Độ tương hợp tổng quan
                      </span>
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full inline-block mt-1"
                        style={{
                          background: compatScores.overall >= 85
                            ? 'rgba(52, 211, 153, 0.2)'
                            : compatScores.overall >= 70
                              ? 'rgba(251, 191, 36, 0.2)'
                              : 'rgba(248, 113, 113, 0.2)',
                          color: compatScores.overall >= 85 ? '#34d399' : compatScores.overall >= 70 ? '#fbbf24' : '#f87171',
                          border: `1px solid ${compatScores.overall >= 85 ? '#34d399' : compatScores.overall >= 70 ? '#fbbf24' : '#f87171'}44`
                        }}
                      >
                        {compatScores.overall >= 85 ? 'Tương hợp cao' : compatScores.overall >= 70 ? 'Tương hợp vừa' : 'Khác biệt / Thử thách'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-300">
                        {compatScores.overall}%
                      </span>
                    </div>
                  </div>

                  {/* Biểu đồ Radar 5 Chiều */}
                  <div className="p-3 rounded-2xl bg-black/25 border border-purple-500/20">
                    <ResponsiveContainer width="100%" height={240}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(157,78,221,0.3)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#d8b4fe', fontSize: 11, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#7c3aed', fontSize: 9 }} />
                        <Radar
                          name="Tương hợp"
                          dataKey="value"
                          stroke="#c084fc"
                          fill="#a855f7"
                          fillOpacity={0.35}
                          strokeWidth={2.5}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Các thanh điểm số chi tiết */}
                  <div className="space-y-2.5">
                    {radarData.map((d) => (
                      <div key={d.subject} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-purple-200">{d.subject}</span>
                          <span className="text-white font-bold">{d.value}%</span>
                        </div>
                        <div className="cosmic-progress h-2 bg-purple-950/60 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${d.value}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{
                              height: '100%',
                              borderRadius: '9999px',
                              background: 'linear-gradient(90deg, #9d4edd 0%, #ff6eb4 100%)',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Nội dung phân tích chiêm tinh chi tiết từ AI */}
                  {compatibility?.analysis && (
                    <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/25 space-y-2">
                      <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <UiIcon name="sparkles" label="" className="text-yellow-300" />
                        <span>Lời giải đoán chiêm tinh:</span>
                      </p>
                      <p className="text-purple-200/90 text-xs leading-relaxed">
                        {compatibility.analysis}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

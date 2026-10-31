import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../services/firebase';
import { RootState } from '../store';
import { apiCompatibility, apiSendMatchRequest, apiCheckMatchStatus, apiBreakup, apiAcceptMatch, apiRejectMatch } from '../services/api';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import { DEFAULT_CANDIDATE_PROFILES } from '../constants/defaultCandidates';
import rawMockUsers from '../mocks/usersMockData.json';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import UiIcon from '../components/UiIcon';
import ZodiacIcon from '../components/ZodiacIcon';

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
    const chatId = [profile.uid, targetUid].sort().join('_');
    try {
      await setDoc(doc(db, 'chats', chatId), {
        participants: [profile.uid, targetUid],
        participantNames: {
          [profile.uid]: profile.name || 'Người dùng',
          [targetUid]: targetProfile.name || 'Người dùng',
        },
        participantAvatars: {
          [profile.uid]: profile.avatar || '',
          [targetUid]: targetProfile.avatar || '',
        },
        lastMessage: 'Đã bắt đầu cuộc trò chuyện ✨',
        lastTimestamp: Date.now(),
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
    navigate(`/chat/${chatId}`, { state: { chatName: targetProfile.name } });
  };

  const handleCompatibility = async () => {
    if (!profile.uid || !targetProfile) return;
    setLoadingCompat(true);
    try {
      const res = await apiCompatibility({
        myUid: profile.uid,
        partnerUid: targetUid,
        uid1: profile.uid,
        uid2: targetUid,
        user1Data: { name: profile.name, sun: profile.sun, moon: profile.moon, ascendant: profile.ascendant },
        user2Data: { name: targetProfile.name, sun: targetProfile.sun, moon: targetProfile.moon, ascendant: targetProfile.ascendant },
      });
      setCompatibility(res.data);
    } catch { }
    finally { setLoadingCompat(false); }
  };

  const handleMatchRequest = async () => {
    if (!profile.uid || !targetUid) return;
    setSending(true);
    try {
      await apiSendMatchRequest({ senderId: profile.uid, receiverId: targetUid, message: matchMsg || 'Xin chào! Tôi muốn kết nối với bạn ✨' });
      setMatchStatus('pending_sent');
    } catch { }
    finally { setSending(false); }
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
    if (!profile.uid || !targetUid) return;
    setSending(true);
    try {
      await apiAcceptMatch({ uid: profile.uid, targetUid });
      setMatchStatus('matched');
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
    <div className="space-y-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-purple-300 hover:text-white text-sm">← Quay lại</button>

      {/* Cover & Avatar */}
      <div className="relative">
        <div className="h-36 rounded-2xl" style={{ background: `linear-gradient(135deg, ${colors[0]}44, ${colors[1]}33, #1a0030)` }}>
          <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-15"><ZodiacIcon sign={targetProfile.sun} label={`Cung ${targetProfile.sun}`} /></div>
        </div>
        <div className="absolute -bottom-8 left-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden" style={{ border: `3px solid ${colors[0]}` }}>
            {targetProfile.avatar
              ? <img src={targetProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-3xl"
                  style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
                  {targetProfile.name?.[0]?.toUpperCase()}
                </div>
            }
          </div>
        </div>
      </div>

      {/* Basic info */}
      <div className="pt-10">
        <h1 className="text-2xl font-bold text-white">{targetProfile.name}</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="glass px-3 py-1 rounded-full text-sm text-white"><ZodiacIcon sign={targetProfile.sun} label={`Cung ${targetProfile.sun}`} className="mr-1 inline" />{targetProfile.sun}</span>
          <span className="glass px-3 py-1 rounded-full text-sm text-white"><UiIcon name="moon" label="Mặt Trăng" className="mr-1 inline" />{targetProfile.moon}</span>
          {targetProfile.ascendant && <span className="glass px-3 py-1 rounded-full text-sm text-white"><UiIcon name="arrow-up" label="Cung Mọc" className="mr-1 inline" />{targetProfile.ascendant}</span>}
          {targetProfile.age && <span className="glass px-3 py-1 rounded-full text-sm text-white"><UiIcon name="star" label="Tuổi" className="mr-1 inline" />{targetProfile.age} tuổi</span>}
        </div>
        {targetProfile.job && <p className="text-purple-300 text-sm mt-2 opacity-70"><UiIcon name="briefcase" label="Nghề nghiệp" className="mr-1 inline" />{targetProfile.job}</p>}
      </div>

      {/* Action Buttons */}
      {targetUid !== profile.uid && (
        <div className="glass-card p-5 space-y-3">
          <h3 className="text-white font-semibold">Kết Nối & Ghép Đôi</h3>
          <div className="flex gap-3 flex-wrap items-center">
            {matchStatus === 'none' && (
              <>
                <input aria-label="Lời nhắn kết nối (tuỳ chọn)" className="cosmic-input text-sm flex-1 min-w-[200px]" placeholder="Lời nhắn kết nối (tuỳ chọn)..."
                  value={matchMsg} onChange={e => setMatchMsg(e.target.value)} />
                <button onClick={handleMatchRequest} disabled={sending}
                  className="btn-cosmic px-5 py-2 text-sm flex items-center gap-1.5">
                  {sending ? <><UiIcon name="hourglass" label="Đang gửi" className="inline" />Đang gửi...</> : <><UiIcon name="mail" label="Gửi yêu cầu kết đôi" className="inline" />Gửi Lời Mời Kết Đôi</>}
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
                  <button onClick={handleMatchRequest} disabled={sending}
                    className="btn-cosmic px-3 py-1.5 text-xs flex items-center gap-1">
                    ↻ Gửi Lại Lời Mời
                  </button>
                  <button onClick={handleBreakup} disabled={sending}
                    className="glass px-3 py-1.5 text-xs text-purple-300 hover:text-red-400 rounded-xl transition-all">
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
                  <button onClick={handleAcceptMatch} disabled={sending}
                    className="btn-cosmic px-4 py-1.5 text-xs flex items-center gap-1">
                    <UiIcon name="check" label="Đồng ý" className="inline" /> Đồng Ý Kết Bạn
                  </button>
                  <button onClick={handleRejectMatch} disabled={sending}
                    className="glass px-3 py-1.5 text-xs text-purple-300 hover:text-red-400 rounded-xl transition-all">
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
                <button onClick={handleBreakup} disabled={sending}
                  className="glass px-3 py-1.5 text-xs text-purple-300 hover:text-red-400 rounded-xl transition-all"
                  title="Hủy kết đôi để có thể kết bạn lại từ đầu">
                  Hủy Kết Đôi / Kết Bạn Lại
                </button>
              </div>
            )}

            <button className="btn-cosmic px-5 py-2 text-sm flex items-center gap-1.5"
              style={{ background: 'rgba(76,201,240,0.3)', border: '1px solid rgba(76,201,240,0.4)' }}
              onClick={handleStartChat}>
              <UiIcon name="message" label="Nhắn tin" className="inline" />Nhắn Tin
            </button>
          </div>
        </div>
      )}

      {/* Compatibility */}
      {targetUid !== profile.uid && (
        <div className="glass-card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold"><UiIcon name="sparkles" label="Phân tích tương hợp" className="mr-1 inline" />Phân Tích Tương Hợp</h3>
            <button onClick={handleCompatibility} disabled={loadingCompat}
              className="btn-cosmic px-4 py-2 text-sm">
              {loadingCompat ? <UiIcon name="hourglass" label="Đang phân tích" /> : <><UiIcon name="chart" label="Phân tích" className="mr-1 inline" />Phân Tích</>}
            </button>
          </div>

          {compatScores && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Radar Chart */}
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(157,78,221,0.3)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#d8b4fe', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#7c3aed', fontSize: 10 }} />
                  <Radar name="Tương hợp" dataKey="value" stroke="#9d4edd" fill="#9d4edd" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>

              {/* Scores */}
              <div className="space-y-2">
                {radarData.map(d => (
                  <div key={d.subject}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-purple-300">{d.subject}</span>
                      <span className="text-white font-bold">{d.value}%</span>
                    </div>
                    <div className="cosmic-progress">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${d.value}%` }}
                        transition={{ duration: 1 }}
                        style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #9d4edd, #ff6eb4)' }} />
                    </div>
                  </div>
                ))}
              </div>

              {compatibility?.analysis && (
                <div className="glass p-4 rounded-xl mt-3">
                  <p className="text-purple-200 text-xs leading-relaxed opacity-90">{compatibility.analysis}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

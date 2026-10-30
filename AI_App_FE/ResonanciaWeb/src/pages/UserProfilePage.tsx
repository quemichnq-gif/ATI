import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../services/firebase';
import { RootState } from '../store';
import { apiCompatibility, apiSendMatchRequest, apiCheckMatchStatus } from '../services/api';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import UiIcon from '../components/UiIcon';
import ZodiacIcon from '../components/ZodiacIcon';

export default function UserProfilePage() {
  const params = useParams<{ userId?: string; uid?: string }>();
  const targetUid = params.userId || params.uid;
  const navigate = useNavigate();
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
    getDoc(doc(db, 'users', targetUid))
      .then(snap => {
        if (snap.exists()) {
          setTargetProfile({ uid: targetUid, ...snap.data() });
        } else {
          setTargetProfile(null);
        }
      })
      .catch(err => {
        console.error('Lỗi tải profile user:', err);
        setTargetProfile(null);
      })
      .finally(() => {
        setLoading(false);
      });

    if (profile.uid && targetUid !== profile.uid) {
      apiCheckMatchStatus(profile.uid, targetUid)
        .then(res => setMatchStatus(res.data?.status || 'none'))
        .catch(() => {});
    }
  }, [targetUid, profile.uid]);

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
      setMatchStatus('pending');
    } catch { }
    finally { setSending(false); }
  };

  const compatScores = compatibility?.scores;
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
          <h3 className="text-white font-semibold">Kết Nối</h3>
          <div className="flex gap-3 flex-wrap">
            {matchStatus === 'none' && (
              <>
                <input aria-label="Lời nhắn kết nối (tuỳ chọn)" className="cosmic-input text-sm" placeholder="Lời nhắn kết nối (tuỳ chọn)..."
                  value={matchMsg} onChange={e => setMatchMsg(e.target.value)} />
                <button onClick={handleMatchRequest} disabled={sending}
                  className="btn-cosmic px-5 py-2 text-sm">
                  {sending ? <><UiIcon name="hourglass" label="Đang gửi" className="mr-1 inline" />Đang gửi...</> : <><UiIcon name="mail" label="Gửi yêu cầu kết đôi" className="mr-1 inline" />Gửi Yêu Cầu Kết Đôi</>}
                </button>
              </>
            )}
            {matchStatus === 'pending' && <p className="text-yellow-400 text-sm"><UiIcon name="hourglass" label="Đang chờ phản hồi" className="mr-1 inline" />Đã gửi yêu cầu, đang chờ phản hồi</p>}
            {matchStatus === 'matched' && <p className="text-green-400 text-sm"><UiIcon name="check" label="Đã kết đôi" className="mr-1 inline" />Đã kết đôi!</p>}
            <button className="btn-cosmic px-5 py-2 text-sm"
              style={{ background: 'rgba(76,201,240,0.3)', border: '1px solid rgba(76,201,240,0.4)' }}
              onClick={handleStartChat}>
              <UiIcon name="message" label="Nhắn tin" className="mr-1 inline" />Nhắn Tin
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

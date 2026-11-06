import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { updateProfile } from '../store/profileSlice';
import { fetchAstrologyData, calculateAstrologyFallback } from '../services/astrologyService';
import { apiUpdateProfile } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import { apiAstrologyChat, apiGenerate, apiLoveMatchingHistory } from '../services/api';
import { getVietnameseDate } from '../utils/date';
import UiIcon, { type IconName } from '../components/UiIcon';
import ZodiacIcon from '../components/ZodiacIcon';

const ELEMENT_ICONS: Record<string, IconName> = {
  'Hoả': 'flame',
  'Thuỷ': 'water',
  'Lửa': 'flame',
  'Nước': 'water',
  'Khí': 'wind',
  'Đất': 'earth',
  'Thổ': 'earth',
};

const BEST_MATCH_MAP: Record<string, { best_match: string; love_luck: number; compatibility: number; quote: string }> = {
  'Ma Kết': { best_match: 'Kim Ngưu', love_luck: 88, compatibility: 94, quote: 'Sự kiên định và chân thành sẽ mở ra cánh cửa định mệnh mà bạn tìm kiếm bấy lâu.' },
  'Kim Ngưu': { best_match: 'Xử Nữ', love_luck: 90, compatibility: 96, quote: 'Tình yêu bền chặt nảy mầm từ những thấu hiểu bình dị và lòng chung thủy sâu sắc.' },
  'Xử Nữ': { best_match: 'Ma Kết', love_luck: 86, compatibility: 93, quote: 'Khi hai tâm hồn đồng điệu cùng sẻ chia, mọi chi tiết nhỏ đều hóa thành hạnh phúc.' },
  'Cự Giải': { best_match: 'Song Ngư', love_luck: 92, compatibility: 97, quote: 'Sóng biển đại dương luôn tìm về bến đỗ ấm êm và chở che trong tim người thương.' },
  'Bọ Cạp': { best_match: 'Cự Giải', love_luck: 89, compatibility: 95, quote: 'Ngọn lửa cảm xúc sâu lắng sẽ thấu suốt mọi rào cản khi gặp đúng người đồng điệu.' },
  'Song Ngư': { best_match: 'Bọ Cạp', love_luck: 91, compatibility: 96, quote: 'Trực giác mách bảo rằng những giấc mơ lãng mạn nhất sắp trở thành hiện thực.' },
  'Bạch Dương': { best_match: 'Sư Tử', love_luck: 87, compatibility: 92, quote: 'Nhiệt huyết đam mê sẽ bùng cháy rực rỡ bên người cùng chí hướng và niềm kiêu hãnh.' },
  'Sư Tử': { best_match: 'Nhân Mã', love_luck: 93, compatibility: 95, quote: 'Tỏa sáng rực rỡ nhất khi được đồng hành cùng người tôn trọng và thấu hiểu ánh hào quang của bạn.' },
  'Nhân Mã': { best_match: 'Bạch Dương', love_luck: 88, compatibility: 91, quote: 'Hành trình khám phá chân trời mới sẽ thêm phần ý nghĩa khi có một trái tim tự do cùng sải bước.' },
  'Song Tử': { best_match: 'Thiên Bình', love_luck: 85, compatibility: 90, quote: 'Những cuộc trò chuyện bất tận chính là chiếc cầu nối trái tim kỳ diệu nhất.' },
  'Thiên Bình': { best_match: 'Bảo Bình', love_luck: 89, compatibility: 93, quote: 'Sự cân bằng hoàn hảo đạt được khi tình yêu hòa quyện cùng sự tôn trọng và bình đẳng.' },
  'Bảo Bình': { best_match: 'Song Tử', love_luck: 86, compatibility: 92, quote: 'Tâm hồn độc bản luôn tìm thấy tiếng vọng chân thành từ người có tư duy cởi mở.' },
};

function getDefaultLoveMetrics(sun?: string) {
  if (sun && BEST_MATCH_MAP[sun]) {
    return BEST_MATCH_MAP[sun];
  }
  return {
    love_luck: 88,
    best_match: 'Kim Ngưu',
    compatibility: 92,
    quote: 'Tình yêu đích thực không phải là tìm kiếm một người hoàn hảo, mà là học cách nhìn nhận sự hoàn hảo trong một linh hồn đồng điệu.'
  };
}

export default function HomePage() {
  const profile = useSelector((s: RootState) => s.profile);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [recalculating, setRecalculating] = useState(false);
  const [recalculateSuccess, setRecalculateSuccess] = useState('');
  const isStale = Boolean(profile.is_stale || profile.needs_recalculation);
  const [tab, setTab] = useState<'astro' | 'love'>('astro');
  const [loveMetrics, setLoveMetrics] = useState<any>(() => getDefaultLoveMetrics(profile.sun));
  const [loadingPred, setLoadingPred] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [currentDate] = useState(getVietnameseDate('today'));
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const hasAstro = Boolean(profile.sun && profile.moon);
  const element = ELEMENT_MAP[profile.sun || ''] || (hasAstro ? 'Đất' : 'Chưa định hình');
  const colors = ELEMENT_COLORS[element] || ['#9333ea', '#db2777'];
  const elementIcon = ELEMENT_ICONS[element] || 'star';

  const displayName = profile.name?.trim() || (profile.email ? profile.email.split('@')[0] : 'Bạn');

  // Load green flag matches
  useEffect(() => {
    if (!profile.uid) return;
    setLoadingMatches(true);
    apiLoveMatchingHistory(profile.uid, 'greenflag')
      .then(res => setMatches(res.data?.users || []))
      .catch(() => setMatches([]))
      .finally(() => setLoadingMatches(false));
  }, [profile.uid]);

  // Load love metrics
  useEffect(() => {
    if (!profile.uid || !hasAstro) {
      if (profile.sun) {
        setLoveMetrics(getDefaultLoveMetrics(profile.sun));
      }
      return;
    }
    setLoadingMetrics(true);
    apiGenerate({
      userData: { uid: profile.uid, name: profile.name, sun: profile.sun, moon: profile.moon, birthDate: profile.birthDate },
      category: 'love_metrics',
      day: new Date().toISOString().split('T')[0],
    }).then(res => {
      const data = res.data?.prediction || res.data;
      if (data && (data.love_luck != null || data.best_match)) {
        setLoveMetrics(data);
      } else {
        setLoveMetrics(getDefaultLoveMetrics(profile.sun));
      }
    })
      .catch(() => {
        setLoveMetrics(getDefaultLoveMetrics(profile.sun));
      })
      .finally(() => setLoadingMetrics(false));
  }, [profile.uid, hasAstro, profile.sun, profile.moon, profile.birthDate, profile.name]);

  const handleRecalculateNatal = async () => {
    if (!profile.uid) return;
    setRecalculating(true);
    setRecalculateSuccess('');
    try {
      const bDate = profile.birthDate || '';
      const bTime = profile.birthTime || '06:00';
      const bPlace = profile.birthPlace || 'Hà Nội, Việt Nam';

      let astro: Record<string, any> = {};
      try {
        astro = await fetchAstrologyData(bDate, bTime, bPlace);
      } catch (err) {
        console.warn('Astrology fetch error on home regeneration, using fallback:', err);
      }

      if (!astro || !astro.sun || !astro.ascendant) {
        const fallbackAstro = calculateAstrologyFallback(bDate, bTime);
        astro = { ...fallbackAstro, ...(astro || {}) };
      }

      const updatedNatalFields: Record<string, any> = {
        sun: astro.sun || '',
        moon: astro.moon || '',
        mercury: astro.mercury || '',
        venus: astro.venus || '',
        mars: astro.mars || '',
        jupiter: astro.jupiter || '',
        saturn: astro.saturn || '',
        uranus: astro.uranus || '',
        neptune: astro.neptune || '',
        pluto: astro.pluto || '',
        ascendant: astro.ascendant || '',
        descendant: astro.descendant || '',
        mc: astro.mc || '',
        ic: astro.ic || '',
        house1: astro.house1 || '',
        house2: astro.house2 || '',
        house3: astro.house3 || '',
        house4: astro.house4 || '',
        house5: astro.house5 || '',
        house6: astro.house6 || '',
        house7: astro.house7 || '',
        house8: astro.house8 || '',
        house9: astro.house9 || '',
        house10: astro.house10 || '',
        house11: astro.house11 || '',
        house12: astro.house12 || '',
        conjunctionAspect: astro.conjunctionAspect || '',
        oppositionAspect: astro.oppositionAspect || '',
        trineAspect: astro.trineAspect || '',
        squareAspect: astro.squareAspect || '',
        sextileAspect: astro.sextileAspect || '',
        natalChartImage: astro.natalChartImage || '',
        fireRatio: astro.fireRatio || 0,
        earthRatio: astro.earthRatio || 0,
        airRatio: astro.airRatio || 0,
        waterRatio: astro.waterRatio || 0,
        age: astro.age || profile.age || 0,
        is_stale: false,
        needs_recalculation: false,
      };

      // 1. Cập nhật Redux ngay lập tức
      dispatch(updateProfile(updatedNatalFields));

      // 2. Lưu vào Firestore
      try {
        await setDoc(doc(db, 'users', profile.uid), {
          ...updatedNatalFields,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (fErr) {
        console.warn('Lưu Firestore khi tái tạo bản đồ sao:', fErr);
      }

      // 3. Đồng bộ Backend API
      try {
        await apiUpdateProfile({ uid: profile.uid, fields: updatedNatalFields });
      } catch (bErr) {
        console.warn('Đồng bộ backend khi tái tạo bản đồ sao:', bErr);
      }

      setRecalculateSuccess('Đã tái tạo Bản đồ sao thành công theo dữ liệu ngày giờ sinh mới!');
      setTimeout(() => setRecalculateSuccess(''), 6000);
    } catch (e: any) {
      console.error('Lỗi khi tái tạo bản đồ sao:', e);
      alert('Không thể tính toán lại bản đồ sao: ' + (e.message || 'Lỗi mạng'));
    } finally {
      setRecalculating(false);
    }
  };

  const handlePredict = async () => {
    if (!profile.uid) return;
    if (!hasAstro) {
      navigate('/register/step2');
      return;
    }
    setLoadingPred(true);
    try {
      const res = await apiGenerate({
        userData: { uid: profile.uid, name: profile.name, sun: profile.sun, moon: profile.moon, birthDate: profile.birthDate },
        category: 'astro',
        day: new Date().toISOString().split('T')[0],
      });
      navigate('/prediction', { state: { prediction: res.data?.prediction, category: 'astro' } });
    } catch {
      navigate('/prediction', { state: { prediction: 'Hôm nay các vì sao khuyên bạn hãy tin vào trực giác và dành thời gian nuôi dưỡng sự an yên nội tại.', category: 'astro' } });
    } finally {
      setLoadingPred(false);
    }
  };

  const handleChatSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = chatInput.trim();
    if (!content || chatLoading) return;
    const nextMessages = [...chatMessages, { role: 'user' as const, content }];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatError('');
    setChatLoading(true);
    try {
      const response = await apiAstrologyChat({
        messages: nextMessages,
        userData: { name: profile.name, sun: profile.sun, moon: profile.moon, ascendant: profile.ascendant },
      });
      setChatMessages([...nextMessages, { role: 'assistant', content: response.data.answer }]);
    } catch (error: any) {
      setChatError(error?.response?.data?.error || 'Chưa gửi được câu hỏi. Bạn thử lại nhé.');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-7 max-w-4xl mx-auto pb-12">
      {/* Editorial Header */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-2">
        <p className="text-xs uppercase tracking-wider text-purple-300/70 font-medium mb-2">
          {currentDate}
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          Chào mừng, <span className="bg-gradient-to-r from-purple-200 via-pink-200 to-indigo-200 bg-clip-text text-transparent">{displayName}</span>
        </h1>
        <p className="text-purple-200/60 text-xs sm:text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
          Năng lượng chiêm tinh hôm nay mở ra những cơ hội sâu sắc cho sự đồng điệu và thấu hiểu.
        </p>
      </motion.div>

      {/* Banner Tái Tạo Bản Đồ Sao khi dữ liệu sinh bị thay đổi (is_stale) */}
      <AnimatePresence>
        {isStale && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            className="p-5 sm:p-6 rounded-2xl glass border border-amber-500/40 relative overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(219, 39, 119, 0.1) 100%)',
            }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-amber-400/50 bg-amber-500/20 text-amber-300 shadow-md">
                  <UiIcon name="sparkles" label="Cần tái tạo" className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-base sm:text-lg">
                      Dữ liệu sinh đã thay đổi
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40 font-semibold tracking-wider">
                      Cần cập nhật
                    </span>
                  </div>
                  <p className="text-purple-200/90 text-xs sm:text-sm mt-1 leading-relaxed max-w-2xl">
                    Ngày, giờ hoặc nơi sinh của bạn vừa được cập nhật tại trang Hồ Sơ. Bản đồ sao cá nhân gốc và các luận giải chiêm tinh hiện tại cần được tính toán lại để đảm bảo độ chính xác.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRecalculateNatal}
                disabled={recalculating}
                className="btn-cosmic px-6 py-3 text-xs sm:text-sm font-semibold tracking-wide shrink-0 inline-flex items-center gap-2 cursor-pointer shadow-lg"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #db2777 100%)' }}
              >
                {recalculating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang tái tạo...</span>
                  </>
                ) : (
                  <>
                    <UiIcon name="chart" label="Tạo lại Bản đồ sao" />
                    <span>Tạo lại Bản đồ sao</span>
                  </>
                )}
              </button>
            </div>

            {recalculateSuccess && (
              <p className="text-emerald-300 text-xs sm:text-sm mt-3 pt-3 border-t border-amber-500/20 flex items-center gap-1.5 font-medium">
                <UiIcon name="check" label="Thành công" />
                <span>{recalculateSuccess}</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Segmented Control Tabs */}
      <div className="flex justify-center">
        <div className="p-1 rounded-2xl flex gap-1.5 border"
          style={{ background: 'rgba(15, 10, 28, 0.7)', borderColor: 'rgba(168, 85, 247, 0.18)', backdropFilter: 'blur(20px)' }}>
          <button
            aria-pressed={tab === 'astro'}
            onClick={() => setTab('astro')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
              tab === 'astro'
                ? 'text-white bg-gradient-to-r from-purple-600/50 to-pink-600/40 border border-purple-400/40 shadow-sm'
                : 'text-purple-300/70 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24" />
            </svg>
            <span>Bản Đồ Sao</span>
          </button>

          <button
            aria-pressed={tab === 'love'}
            onClick={() => setTab('love')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
              tab === 'love'
                ? 'text-white bg-gradient-to-r from-purple-600/50 to-pink-600/40 border border-purple-400/40 shadow-sm'
                : 'text-purple-300/70 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <span>Năng Lượng Tương Hợp</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'astro' ? (
          <motion.div key="astro" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }} className="space-y-5">

            {/* Main Astrological Card */}
            <div className="glass-card p-6 sm:p-9 relative overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(22, 13, 43, 0.7) 0%, rgba(13, 8, 26, 0.85) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.18)'
              }}>
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-15"
                style={{ background: 'radial-gradient(circle, #c084fc, transparent)' }} />

              {!hasAstro ? (
                /* Empty state when profile has no astrology data yet */
                <div className="py-8 text-center max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center border"
                    style={{ background: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.3)' }}>
                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2v20M2 12h20" strokeDasharray="2 2" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  </div>
                  <h3 className="text-white text-lg font-semibold mb-2">Lá số chiêm tinh chưa được đồng bộ</h3>
                  <p className="text-purple-300/70 text-xs sm:text-sm leading-relaxed mb-6">
                    Hãy cung cấp ngày, giờ và nơi sinh chính xác để AI Resonancia định vị bản đồ 12 cung hoàng đạo và 12 nhà của bạn.
                  </p>
                  <button
                    onClick={() => navigate('/register/step2')}
                    className="btn-cosmic px-8 py-3 text-sm font-semibold tracking-wide inline-flex items-center gap-2"
                  >
                    <span><UiIcon name="star" label="Thiết lập lá số cá nhân" className="inline mr-1" />Thiết Lập Lá Số Cá Nhân</span>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ) : (
                /* Populated Astrology Dashboard */
                <>
                  <div className="grid grid-cols-2 gap-6 sm:gap-10 mb-8 relative z-10">
                    <div className="p-3.5 rounded-2xl border text-center"
                      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(168, 85, 247, 0.12)' }}>
                      <p className="text-[11px] text-purple-300/70 uppercase tracking-wider font-medium mb-1.5">
                        Mặt Trời · Sun Sign
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <ZodiacIcon sign={profile.sun} label={`Cung Mặt Trời ${profile.sun}`} className="text-xl text-amber-300" />
                        <p className="text-white text-xl sm:text-2xl font-bold tracking-tight">{profile.sun}</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border text-center"
                      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(168, 85, 247, 0.12)' }}>
                      <p className="text-[11px] text-purple-300/70 uppercase tracking-wider font-medium mb-1.5">
                        Mặt Trăng · Moon Sign
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <ZodiacIcon sign={profile.moon} label={`Cung Mặt Trăng ${profile.moon}`} className="text-xl text-blue-200" />
                        <p className="text-white text-xl sm:text-2xl font-bold tracking-tight">{profile.moon}</p>
                      </div>
                    </div>
                  </div>

                  {/* Celestial Core Sphere */}
                  <div className="relative my-6 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
                      className="w-32 h-32 sm:w-36 sm:h-36 relative flex items-center justify-center"
                    >
                      <div className="absolute inset-0 rounded-full border border-purple-500/20 border-dashed" />
                      <div className="absolute inset-3 rounded-full border border-pink-500/25" />
                      <div className="absolute inset-6 rounded-full border border-indigo-400/20" />
                    </motion.div>
                    <div className="absolute w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg"
                      style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.35) 0%, rgba(30,15,55,0.9) 80%)', border: '1px solid rgba(168,85,247,0.4)' }}>
                      {/* Alpha-shaped glow follows the existing icon color. Source: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/filter-function/drop-shadow */}
                      <ZodiacIcon sign={profile.sun} label={`Cung Mặt Trời ${profile.sun}`} className="text-3xl text-purple-200" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
                      <span className="text-[9px] text-purple-300/80 uppercase font-mono mt-0.5 tracking-wider">Soul</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 sm:gap-10 mb-8 relative z-10">
                    <div className="p-3.5 rounded-2xl border text-center"
                      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(168, 85, 247, 0.12)' }}>
                      <p className="text-[11px] text-purple-300/70 uppercase tracking-wider font-medium mb-1.5">
                        Điểm Mọc · Ascendant
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <ZodiacIcon sign={profile.ascendant || profile.sun} label={`Điểm Mọc ${profile.ascendant || profile.sun}`} className="text-lg text-emerald-300" />
                        <p className="text-white text-lg sm:text-xl font-bold">{profile.ascendant || profile.sun}</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border text-center"
                      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(168, 85, 247, 0.12)' }}>
                      <p className="text-[11px] text-purple-300/70 uppercase tracking-wider font-medium mb-1.5">
                        Nguyên Tố · Element
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <UiIcon name={elementIcon} label={`Nguyên tố ${element}`} className="text-lg text-pink-300" />
                        <p className="text-lg sm:text-xl font-bold text-transparent bg-clip-text"
                          style={{ backgroundImage: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
                          {element}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="text-center">
                    <button
                      onClick={handlePredict}
                      disabled={loadingPred}
                      className="btn-cosmic px-9 py-3.5 text-sm font-semibold tracking-wide shadow-lg inline-flex items-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)' }}
                    >
                      {loadingPred ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Đang kết nối năng lượng...</span>
                        </>
                      ) : (
                        <>
                          <span><UiIcon name="sparkles" label="Xem dự đoán vũ trụ hôm nay" className="inline mr-1" />Xem Dự Đoán Vũ Trụ Hôm Nay</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div
                role="link"
                tabIndex={0}
                aria-label="Mở Bản Đồ Chi Tiết (Natal Chart)"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/natal'); } }}
                whileHover={{ y: -3 }}
                onClick={() => navigate('/natal')}
                className="glass-card p-5 cursor-pointer flex items-center gap-4 transition-all"
                style={{ borderColor: 'rgba(168, 85, 247, 0.15)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0"
                  style={{ background: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.3)' }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white text-sm font-semibold mb-1.5">Bản Đồ Chi Tiết (Natal Chart)</h3>
                  <p className="text-purple-300/70 text-xs leading-relaxed">Khám phá biểu đồ SVG tròn 10 hành tinh và 12 cung</p>
                </div>
              </motion.div>

              <motion.div
                role="link"
                tabIndex={0}
                aria-label="Mở Tìm Kiếm Tri Kỷ"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/match'); } }}
                whileHover={{ y: -3 }}
                onClick={() => navigate('/match')}
                className="glass-card p-5 cursor-pointer flex items-center gap-4 transition-all"
                style={{ borderColor: 'rgba(168, 85, 247, 0.15)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0"
                  style={{ background: 'rgba(236,72,153,0.1)', borderColor: 'rgba(236,72,153,0.3)' }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-pink-300" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    <circle cx="18" cy="6" r="3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white text-sm font-semibold mb-1.5">Tìm Kiếm Tri Kỷ (Matchmaking)</h3>
                  <p className="text-purple-300/70 text-xs leading-relaxed">Kết nối dựa trên độ hòa hợp cung hoàng đạo</p>
                </div>
              </motion.div>
            </div>

            {/* Advanced Cosmic Tools Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-mono tracking-widest text-purple-300/60">Công Cụ Khám Phá Nâng Cao</h3>
                <span className="text-[11px] text-pink-400 font-mono">5 tính năng mới</span>
              </div>
              <div className="flex flex-col gap-2.5">
                <motion.div
                  role="link"
                  tabIndex={0}
                  aria-label="Mở Bản Đồ Đôi (Synastry)"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/synastry'); } }}
                  whileHover={{ x: 3 }}
                  onClick={() => navigate('/synastry')}
                  className="glass-card px-4 py-3 cursor-pointer hover:border-purple-400/40 transition-all flex items-center gap-3.5"
                  style={{ borderColor: 'rgba(168, 85, 247, 0.12)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0"
                    style={{ background: 'rgba(147, 51, 234, 0.12)', borderColor: 'rgba(168,85,247,0.3)' }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <h4 className="text-white text-sm font-semibold sm:w-52 shrink-0">Bản Đồ Đôi (Synastry)</h4>
                    <p className="text-purple-300/70 text-xs leading-relaxed flex-1">So khớp góc chiếu & độ tương hợp sâu giữa 2 người</p>
                  </div>
                </motion.div>

                <motion.div
                  role="link"
                  tabIndex={0}
                  aria-label="Mở Vận Hạn (Transit)"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/transit'); } }}
                  whileHover={{ x: 3 }}
                  onClick={() => navigate('/transit')}
                  className="glass-card px-4 py-3 cursor-pointer hover:border-purple-400/40 transition-all flex items-center gap-3.5"
                  style={{ borderColor: 'rgba(168, 85, 247, 0.12)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0"
                    style={{ background: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-30 12 12)"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <h4 className="text-white text-sm font-semibold sm:w-52 shrink-0">Vận Hạn (Transit)</h4>
                    <p className="text-purple-300/70 text-xs leading-relaxed flex-1">Dự báo năng lượng vũ trụ hiện tại tác động lên bạn</p>
                  </div>
                </motion.div>

                <motion.div
                  role="link"
                  tabIndex={0}
                  aria-label="Mở Trải Bài Tarot"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/tarot'); } }}
                  whileHover={{ x: 3 }}
                  onClick={() => navigate('/tarot')}
                  className="glass-card px-4 py-3 cursor-pointer hover:border-purple-400/40 transition-all flex items-center gap-3.5"
                  style={{ borderColor: 'rgba(168, 85, 247, 0.12)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0"
                    style={{ background: 'rgba(236, 72, 153, 0.12)', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-pink-300" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <rect x="5" y="3" width="14" height="18" rx="2"/><path d="m12 8 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <h4 className="text-white text-sm font-semibold sm:w-52 shrink-0">Trải Bài Tarot</h4>
                    <p className="text-purple-300/70 text-xs leading-relaxed flex-1">Rút 1 lá bài trực quan & nhận thông điệp ngày mới</p>
                  </div>
                </motion.div>

                <motion.div
                  role="link"
                  tabIndex={0}
                  aria-label="Mở Nhật Ký Vũ Trụ"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/journal'); } }}
                  whileHover={{ x: 3 }}
                  onClick={() => navigate('/journal')}
                  className="glass-card px-4 py-3 cursor-pointer hover:border-purple-400/40 transition-all flex items-center gap-3.5"
                  style={{ borderColor: 'rgba(168, 85, 247, 0.12)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0"
                    style={{ background: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h8M8 11h8M8 15h5"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <h4 className="text-white text-sm font-semibold sm:w-52 shrink-0">Nhật Ký Vũ Trụ</h4>
                    <p className="text-purple-300/70 text-xs leading-relaxed flex-1">Lưu giữ cảm xúc đồng hành cùng các chu kỳ trăng</p>
                  </div>
                </motion.div>

                <motion.div
                  role="link"
                  tabIndex={0}
                  aria-label="Mở Từ Điển Chiêm Tinh Học"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/glossary'); } }}
                  whileHover={{ x: 3 }}
                  onClick={() => navigate('/glossary')}
                  className="glass-card px-4 py-3 cursor-pointer hover:border-purple-400/40 transition-all flex items-center gap-3.5"
                  style={{ borderColor: 'rgba(168, 85, 247, 0.12)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0"
                    style={{ background: 'rgba(250, 204, 21, 0.12)', borderColor: 'rgba(250, 204, 21, 0.3)' }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <h4 className="text-white text-sm font-semibold sm:w-52 shrink-0">Từ Điển Chiêm Tinh Học</h4>
                    <p className="text-purple-300/70 text-xs leading-relaxed flex-1">Tra cứu ý nghĩa 12 cung hoàng đạo, 12 nhà (houses) và các góc chiếu chi tiết</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="love" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }} className="space-y-5">

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass-card p-5 border" style={{ borderColor: 'rgba(168, 85, 247, 0.15)' }}>
                <p className="text-xs text-purple-300/60 uppercase tracking-widest font-mono mb-2">Chỉ Số Duyên Khí Hôm Nay</p>
                {loadingMetrics ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-2 bg-purple-800/40 rounded" />
                    <div className="h-5 bg-purple-800/20 rounded w-1/3" />
                  </div>
                ) : (
                  <>
                    <div className="cosmic-progress mb-3 h-2">
                      <div className="cosmic-progress-fill rounded-full" style={{ width: `${loveMetrics?.love_luck ?? 0}%`, background: 'linear-gradient(90deg, #a855f7, #ec4899)' }} />
                    </div>
                    <p className="text-white font-bold text-2xl">
                      {loveMetrics?.love_luck ?? '—'}{loveMetrics?.love_luck != null ? '%' : ''}
                    </p>
                  </>
                )}
              </div>

              <div className="glass-card p-5 border" style={{ borderColor: 'rgba(168, 85, 247, 0.15)' }}>
                <p className="text-xs text-purple-300/60 uppercase tracking-widest font-mono mb-2">Cung Tương Hợp Nhất</p>
                {loadingMetrics ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-5 bg-purple-800/40 rounded w-1/2" />
                    <div className="h-3 bg-purple-800/20 rounded w-1/3" />
                  </div>
                ) : (
                  <>
                    <p className="text-white text-2xl font-bold tracking-tight">
                      {loveMetrics?.best_match ? <><ZodiacIcon sign={loveMetrics.best_match} label={`Cung ${loveMetrics.best_match}`} className="mr-1 inline" />{loveMetrics.best_match}</> : '—'}
                    </p>
                    <p className="text-pink-300/80 text-xs mt-1">
                      {loveMetrics?.compatibility ?? '—'}{loveMetrics?.compatibility != null ? '% mức độ hài hòa' : ''}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Daily Cosmic Message */}
            <div className="glass-card p-5 border" style={{ borderColor: 'rgba(236,72,153,0.2)', background: 'rgba(255,255,255,0.015)' }}>
              <p className="text-[11px] text-pink-300/80 uppercase tracking-widest font-mono mb-2"><UiIcon name="sparkles" label="Thông điệp vũ trụ" className="inline mr-1" />Thông Điệp Vũ Trụ</p>
              <p className="text-white text-sm italic leading-relaxed opacity-90 font-serif">
                "{loveMetrics?.quote || 'Tình yêu đích thực không phải là tìm kiếm một người hoàn hảo, mà là học cách nhìn nhận sự hoàn hảo trong một linh hồn đồng điệu.'}"
              </p>
            </div>

            {/* Compatible Matches Section */}
            <div className="glass-card p-5 border" style={{ borderColor: 'rgba(168, 85, 247, 0.15)' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-sm font-semibold tracking-wide">Người Tương Hợp Gợi Ý</h3>
                <button onClick={() => navigate('/match')}
                  className="text-pink-400 text-xs hover:text-pink-300 font-medium">
                  Xem tất cả →
                </button>
              </div>

              {loadingMatches ? (
                <div className="flex gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-20 h-20 rounded-xl animate-pulse bg-purple-800/20" />
                  ))}
                </div>
              ) : matches.length > 0 ? (
                <div className="flex gap-3.5 overflow-x-auto pb-2">
                  {matches.slice(0, 5).map((m, i) => (
                    <motion.div key={i} role="link" tabIndex={0} aria-label={`Xem hồ sơ ${m.name}`}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/user/${m.uid}`, { state: { candidate: m } }); } }}
                      whileHover={{ y: -3 }}
                      className="flex-shrink-0 w-24 cursor-pointer"
                      onClick={() => navigate(`/user/${m.uid}`, { state: { candidate: m } })}>
                      <div className="w-24 h-24 rounded-2xl overflow-hidden mb-2 border border-purple-500/30"
                        style={{ background: 'rgba(255,255,255,0.03)' }}>
                        {m.avatar ? (
                          <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.3), rgba(219,39,119,0.2))' }}>
                            <span className="text-2xl font-serif text-purple-200">
                              {m.zodiac || m.sun
                                ? <ZodiacIcon sign={m.zodiac || m.sun} label={`Cung ${m.zodiac || m.sun}`} className="text-2xl text-purple-200" />
                                : m.name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-white text-xs text-center truncate font-medium">{m.name}</p>
                      <p className="text-purple-300/70 text-[11px] text-center truncate">{m.zodiac || m.sun}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-purple-300/60 text-xs">Chưa có dữ liệu ghép đôi sẵn sàng. Khám phá ngay để kết nối!</p>
                  <button onClick={() => navigate('/match')}
                    className="mt-3 btn-cosmic px-6 py-2 text-xs font-semibold">
                    Khám Phá Ghép Đôi
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="glass-card p-5 sm:p-6 border" style={{ borderColor: 'rgba(168, 85, 247, 0.18)' }} aria-labelledby="astrology-chat-title">
        <div className="mb-4">
          <h2 id="astrology-chat-title" className="text-white text-lg font-semibold">Hỏi đáp cùng Resonancia</h2>
          <p className="text-purple-300/70 text-sm mt-1">Đặt câu hỏi về chiêm tinh, tình cảm hoặc những điều bạn đang băn khoăn.</p>
        </div>
        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto" aria-live="polite" aria-relevant="additions text">
          {chatMessages.length === 0 ? (
            <p className="text-purple-200/70 text-sm rounded-xl border border-purple-400/15 bg-white/[0.02] p-4">Bạn có thể bắt đầu bằng một câu hỏi bất kỳ.</p>
          ) : chatMessages.map((message, index) => (
            <div key={`${index}-${message.role}`} className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${message.role === 'user' ? 'ml-auto message-sent text-white' : 'message-received text-purple-50'}`}>
              <p className="text-[11px] opacity-70 mb-1">{message.role === 'user' ? 'Bạn' : 'Resonancia'}</p>
              {message.content}
            </div>
          ))}
          {chatLoading && <p role="status" className="text-purple-300/70 text-sm">Resonancia đang soạn câu trả lời…</p>}
        </div>
        {chatError && <p role="alert" className="text-pink-300 text-sm mb-3">{chatError}</p>}
        <form onSubmit={handleChatSubmit} className="flex items-end gap-2">
          <label className="sr-only" htmlFor="astrology-chat-input">Câu hỏi của bạn</label>
          <textarea id="astrology-chat-input" rows={2} maxLength={2000} value={chatInput}
            onChange={event => setChatInput(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}
            placeholder="Viết câu hỏi của bạn…" className="cosmic-input min-h-11 flex-1 resize-y rounded-xl px-4 py-3 text-sm"
            disabled={chatLoading} />
          <button type="submit" disabled={chatLoading || !chatInput.trim()} aria-label="Gửi câu hỏi"
            className="btn-cosmic min-h-11 min-w-11 px-4 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-label="Gửi">
              <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
            </svg>
          </button>
        </form>
        <p className="text-purple-300/50 text-xs mt-2">Chiêm tinh là góc nhìn tham khảo; câu trả lời không thay thế tư vấn chuyên môn.</p>
      </section>
    </div>
  );
}

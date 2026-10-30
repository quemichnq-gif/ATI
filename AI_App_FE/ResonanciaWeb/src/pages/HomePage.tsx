import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import { apiGenerate, apiLoveMatchingHistory } from '../services/api';
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

export default function HomePage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();
  const [tab, setTab] = useState<'astro' | 'love'>('astro');
  const [loveMetrics, setLoveMetrics] = useState<any>(null);
  const [loadingPred, setLoadingPred] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [currentDate] = useState(getVietnameseDate('today'));

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
    if (!profile.uid || !hasAstro) return;
    setLoadingMetrics(true);
    apiGenerate({
      userData: { uid: profile.uid, name: profile.name, sun: profile.sun, moon: profile.moon, birthDate: profile.birthDate },
      category: 'love_metrics',
      day: new Date().toISOString().split('T')[0],
    }).then(res => setLoveMetrics(res.data?.prediction))
      .catch(() => {})
      .finally(() => setLoadingMetrics(false));
  }, [profile.uid, hasAstro, profile.sun, profile.moon, profile.birthDate, profile.name]);

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

  return (
    <div className="space-y-7 max-w-4xl mx-auto pb-12">
      {/* Editorial Header */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-2">
        <p className="text-xs uppercase tracking-widest text-purple-300/70 font-mono mb-2">
          {currentDate}
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          Chào mừng, <span className="bg-gradient-to-r from-purple-200 via-pink-200 to-indigo-200 bg-clip-text text-transparent">{displayName}</span>
        </h1>
        <p className="text-purple-200/60 text-xs sm:text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
          Năng lượng chiêm tinh hôm nay mở ra những cơ hội sâu sắc cho sự đồng điệu và thấu hiểu.
        </p>
      </motion.div>

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
                      <p className="text-[11px] text-purple-300/60 uppercase tracking-widest font-mono mb-1.5">
                        Mặt Trời · Sun Sign
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <ZodiacIcon sign={profile.sun} label={`Cung Mặt Trời ${profile.sun}`} className="text-xl text-amber-300" />
                        <p className="text-white text-xl sm:text-2xl font-bold tracking-tight">{profile.sun}</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border text-center"
                      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(168, 85, 247, 0.12)' }}>
                      <p className="text-[11px] text-purple-300/60 uppercase tracking-widest font-mono mb-1.5">
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
                      <p className="text-[11px] text-purple-300/60 uppercase tracking-widest font-mono mb-1.5">
                        Điểm Mọc · Ascendant
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <ZodiacIcon sign={profile.ascendant || profile.sun} label={`Điểm Mọc ${profile.ascendant || profile.sun}`} className="text-lg text-emerald-300" />
                        <p className="text-white text-lg sm:text-xl font-bold">{profile.ascendant || profile.sun}</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border text-center"
                      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(168, 85, 247, 0.12)' }}>
                      <p className="text-[11px] text-purple-300/60 uppercase tracking-widest font-mono mb-1.5">
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
                  <h3 className="text-white text-sm font-semibold mb-0.5">Bản Đồ Chi Tiết (Natal Chart)</h3>
                  <p className="text-purple-300/60 text-xs">Khám phá biểu đồ SVG tròn 10 hành tinh và 12 cung</p>
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
                  <h3 className="text-white text-sm font-semibold mb-0.5">Tìm Kiếm Tri Kỷ (Matchmaking)</h3>
                  <p className="text-purple-300/60 text-xs">Kết nối dựa trên độ hòa hợp cung hoàng đạo</p>
                </div>
              </motion.div>
            </div>

            {/* Advanced Cosmic Tools Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-mono tracking-widest text-purple-300/60">Công Cụ Khám Phá Nâng Cao</h3>
                <span className="text-[11px] text-pink-400 font-mono">5 tính năng mới</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() => navigate('/synastry')}
                  className="glass-card p-4 cursor-pointer hover:border-purple-400/40 transition-all"
                  style={{ borderColor: 'rgba(168, 85, 247, 0.12)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border mb-3"
                    style={{ background: 'rgba(147, 51, 234, 0.12)', borderColor: 'rgba(168,85,247,0.3)' }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>
                    </svg>
                  </div>
                  <h4 className="text-white text-xs font-semibold mb-1">Bản Đồ Đôi (Synastry)</h4>
                  <p className="text-purple-300/60 text-[11px] leading-relaxed">So khớp góc chiếu & độ tương hợp sâu giữa 2 người</p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() => navigate('/transit')}
                  className="glass-card p-4 cursor-pointer hover:border-purple-400/40 transition-all"
                  style={{ borderColor: 'rgba(168, 85, 247, 0.12)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border mb-3"
                    style={{ background: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-30 12 12)"/>
                    </svg>
                  </div>
                  <h4 className="text-white text-xs font-semibold mb-1">Vận Hạn (Transit)</h4>
                  <p className="text-purple-300/60 text-[11px] leading-relaxed">Dự báo năng lượng vũ trụ hiện tại tác động lên bạn</p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() => navigate('/tarot')}
                  className="glass-card p-4 cursor-pointer hover:border-purple-400/40 transition-all"
                  style={{ borderColor: 'rgba(168, 85, 247, 0.12)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border mb-3"
                    style={{ background: 'rgba(236, 72, 153, 0.12)', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-pink-300" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="5" y="3" width="14" height="18" rx="2"/><path d="m12 8 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"/>
                    </svg>
                  </div>
                  <h4 className="text-white text-xs font-semibold mb-1">Trải Bài Tarot</h4>
                  <p className="text-purple-300/60 text-[11px] leading-relaxed">Rút 1 lá bài trực quan & nhận thông điệp ngày mới</p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() => navigate('/journal')}
                  className="glass-card p-4 cursor-pointer hover:border-purple-400/40 transition-all"
                  style={{ borderColor: 'rgba(168, 85, 247, 0.12)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border mb-3"
                    style={{ background: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h8M8 11h8M8 15h5"/>
                    </svg>
                  </div>
                  <h4 className="text-white text-xs font-semibold mb-1">Nhật Ký Vũ Trụ</h4>
                  <p className="text-purple-300/60 text-[11px] leading-relaxed">Lưu giữ cảm xúc đồng hành cùng các chu kỳ trăng</p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() => navigate('/glossary')}
                  className="glass-card p-4 cursor-pointer hover:border-purple-400/40 transition-all sm:col-span-2"
                  style={{ borderColor: 'rgba(168, 85, 247, 0.12)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0"
                      style={{ background: 'rgba(250, 204, 21, 0.12)', borderColor: 'rgba(250, 204, 21, 0.3)' }}>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white text-xs font-semibold mb-0.5">Từ Điển Chiêm Tinh Học</h4>
                      <p className="text-purple-300/60 text-[11px]">Tra cứu ý nghĩa 12 cung hoàng đạo, 12 nhà (houses) và các góc chiếu chi tiết</p>
                    </div>
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
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/user/${m.uid}`); } }}
                      whileHover={{ y: -3 }}
                      className="flex-shrink-0 w-24 cursor-pointer"
                      onClick={() => navigate(`/user/${m.uid}`)}>
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
    </div>
  );
}

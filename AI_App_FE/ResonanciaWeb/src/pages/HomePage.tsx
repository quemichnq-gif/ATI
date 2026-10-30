import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import { apiGenerate, apiLoveMatchingHistory } from '../services/api';
import { getVietnameseDate } from '../utils/date';
import UiIcon from '../components/UiIcon';
import ZodiacIcon from '../components/ZodiacIcon';

export default function HomePage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();
  const [tab, setTab] = useState<'astro' | 'love'>('astro');
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loveMetrics, setLoveMetrics] = useState<any>(null);
  const [loadingPred, setLoadingPred] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [currentDate] = useState(getVietnameseDate('today'));

  const element = ELEMENT_MAP[profile.sun || ''] || 'Không xác định';
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];

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
    if (!profile.uid || !profile.sun || !profile.moon) return;
    setLoadingMetrics(true);
    apiGenerate({
      userData: { uid: profile.uid, name: profile.name, sun: profile.sun, moon: profile.moon, birthDate: profile.birthDate },
      category: 'love_metrics',
      day: new Date().toISOString().split('T')[0],
    }).then(res => setLoveMetrics(res.data?.prediction))
      .catch(() => {})
      .finally(() => setLoadingMetrics(false));
  }, [profile.uid, profile.sun, profile.moon]);

  const handlePredict = async () => {
    if (!profile.uid) return;
    setLoadingPred(true);
    try {
      const res = await apiGenerate({
        userData: { uid: profile.uid, name: profile.name, sun: profile.sun, moon: profile.moon, birthDate: profile.birthDate },
        category: 'astro',
        day: new Date().toISOString().split('T')[0],
      });
      setPrediction(res.data?.prediction);
      navigate('/prediction', { state: { prediction: res.data?.prediction, category: 'astro' } });
    } catch { setPrediction('Không thể tải dự đoán. Vui lòng thử lại.'); }
    finally { setLoadingPred(false); }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-4">
        <p className="text-purple-300 text-sm opacity-70 mb-1">{currentDate}</p>
        <h1 className="text-4xl font-bold gradient-text font-display">
          Chào, {profile.name || 'bạn'} ✨
        </h1>
        <p className="text-purple-300 opacity-60 mt-1 text-sm">Vũ trụ có điều muốn nói với bạn hôm nay</p>
      </motion.div>

      {/* Tab */}
      <div className="flex justify-center">
        <div className="glass rounded-full p-1 flex gap-1">
          {(['astro', 'love'] as const).map(t => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}
              className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                tab === t ? 'text-white' : 'text-purple-300 hover:text-white'
              }`}
              style={tab === t ? { background: 'linear-gradient(135deg, rgba(157,78,221,0.5), rgba(255,110,180,0.4))', border: '1px solid rgba(157,78,221,0.4)' } : {}}>
              <UiIcon name={t === 'astro' ? 'chart' : 'heart'} label={t === 'astro' ? 'Chiêm tinh' : 'Tình duyên'} className="mr-1 inline" />{t === 'astro' ? 'Chiêm Tinh' : 'Tình Duyên'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'astro' ? (
          <motion.div key="astro" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>

            {/* Zodiac Circle Card */}
            <div className="glass-card p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10"
                style={{ background: `radial-gradient(circle at center, ${colors[0]}, transparent)` }} />

              <div className="grid grid-cols-2 gap-8 mb-8 relative">
                <div className="text-center">
                  <p className="text-purple-300 text-xs mb-1 uppercase tracking-widest">Mặt Trời</p>
                  <p className="text-white text-2xl font-bold"><ZodiacIcon sign={profile.sun} label={profile.sun ? `Cung ${profile.sun}` : 'Cung Mặt Trời'} className="mr-1 inline" />{profile.sun || '...'}</p>
                </div>
                <div className="text-center">
                  <p className="text-purple-300 text-xs mb-1 uppercase tracking-widest">Mặt Trăng</p>
                  <p className="text-white text-2xl font-bold"><UiIcon name="moon" label="Mặt Trăng" className="mr-1 inline" />{profile.moon || '...'}</p>
                </div>
              </div>

              {/* Center Symbol */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                className="mx-auto w-32 h-32 mb-8 relative"
              >
                <div className="orbit-ring orbit-ring-1 absolute inset-0" />
                <div className="orbit-ring orbit-ring-2 absolute inset-4" style={{ border: '1px solid rgba(255,110,180,0.25)' }} />
                <div className="absolute inset-0 flex items-center justify-center text-6xl">
                  <ZodiacIcon sign={profile.sun} label={profile.sun ? `Cung ${profile.sun}` : 'Cung Mặt Trời'} />
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="text-center">
                  <p className="text-purple-300 text-xs mb-1 uppercase tracking-widest">Điểm Mọc</p>
                  <p className="text-white text-xl font-bold"><UiIcon name="arrow-up" label="Điểm Mọc" className="mr-1 inline" />{profile.ascendant || '...'}</p>
                </div>
                <div className="text-center">
                  <p className="text-purple-300 text-xs mb-1 uppercase tracking-widest">Nguyên Tố</p>
                  <p className="text-xl font-bold" style={{ color: colors[0] }}><UiIcon name="sparkles" label="Nguyên tố" className="mr-1 inline" />{element}</p>
                </div>
              </div>

              <button onClick={handlePredict} disabled={loadingPred}
                className="btn-cosmic px-10 py-3 text-base"
                style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
                {loadingPred ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang đọc vũ trụ...
                  </span>
                ) : <><UiIcon name="sparkles" label="Xem dự đoán hôm nay" className="mr-1 inline" />Xem Dự Đoán Hôm Nay</>}
              </button>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div role="link" tabIndex={0} aria-label="Mở Natal Chart"
                onKeyDown={e => { if (e.key === 'Enter') navigate('/natal'); }}
                whileHover={{ scale: 1.02 }} className="glass-card p-5 cursor-pointer card-hover"
                onClick={() => navigate('/natal')}>
                <div className="text-3xl mb-2"><UiIcon name="chart" label="Natal Chart" /></div>
                <h3 className="text-white font-semibold mb-1">Natal Chart</h3>
                <p className="text-purple-300 text-xs opacity-70">Phân tích chiêm tinh sâu</p>
              </motion.div>
              <motion.div role="link" tabIndex={0} aria-label="Mở trang tìm kiếm người tương hợp"
                onKeyDown={e => { if (e.key === 'Enter') navigate('/match'); }}
                whileHover={{ scale: 1.02 }} className="glass-card p-5 cursor-pointer card-hover"
                onClick={() => navigate('/match')}>
                <div className="text-3xl mb-2"><UiIcon name="search" label="Tìm kiếm" /></div>
                <h3 className="text-white font-semibold mb-1">Tìm Kiếm</h3>
                <p className="text-purple-300 text-xs opacity-70">Khám phá người tương hợp</p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="love" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">

            {/* Love metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl"><UiIcon name="heart" label="Tình duyên" /></span>
                  <h3 className="text-white font-semibold">Tình Duyên</h3>
                </div>
                {loadingMetrics ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-2 bg-purple-800/50 rounded" />
                    <div className="h-4 bg-purple-800/30 rounded w-1/3" />
                  </div>
                ) : (
                  <>
                    <div className="cosmic-progress mb-2">
                      <div className="cosmic-progress-fill" style={{ width: `${loveMetrics?.love_luck || 0}%` }} />
                    </div>
                    <p className="text-white font-bold text-xl">{loveMetrics?.love_luck ?? '...'}%</p>
                  </>
                )}
              </div>

              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl"><UiIcon name="sparkles" label="Cung hợp" /></span>
                  <h3 className="text-white font-semibold">Cung Hợp</h3>
                </div>
                {loadingMetrics ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-purple-800/50 rounded" />
                    <div className="h-2 bg-purple-800/30 rounded" />
                  </div>
                ) : (
                  <>
                    <p className="text-white text-xl font-bold"><ZodiacIcon sign={loveMetrics?.best_match} label={loveMetrics?.best_match ? `Cung ${loveMetrics.best_match}` : 'Cung tương hợp'} className="mr-1 inline" />{loveMetrics?.best_match || '—'}</p>
                    <p className="text-pink-300 text-sm">{loveMetrics?.compatibility ?? '...'}% tương hợp</p>
                  </>
                )}
              </div>
            </div>

            {/* Quote */}
            {loveMetrics?.quote && (
              <div className="glass-card p-5" style={{ border: '1px solid rgba(255,110,180,0.2)' }}>
                <p className="text-purple-300 text-xs uppercase tracking-widest mb-2"><UiIcon name="message" label="Lời vũ trụ" className="mr-1 inline" />Lời Vũ Trụ</p>
                <p className="text-white text-base italic leading-relaxed opacity-90">"{loveMetrics.quote}"</p>
              </div>
            )}

            {/* Matches preview */}
            <div className="glass-card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold"><UiIcon name="heart" label="Người tương hợp" className="mr-1 inline" />Người Tương Hợp</h3>
                <button onClick={() => navigate('/match')}
                  className="text-pink-400 text-sm hover:text-pink-300">Xem tất cả →</button>
              </div>
              {loadingMatches ? (
                <div className="flex gap-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-20 h-20 rounded-xl animate-pulse bg-purple-800/30" />
                  ))}
                </div>
              ) : matches.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {matches.slice(0, 5).map((m, i) => (
                    <motion.div key={i} role="link" tabIndex={0} aria-label={`Xem hồ sơ ${m.name}`}
                      onKeyDown={e => { if (e.key === 'Enter') navigate(`/user/${m.uid}`); }}
                      whileHover={{ scale: 1.03 }}
                      className="flex-shrink-0 w-20 cursor-pointer"
                      onClick={() => navigate(`/user/${m.uid}`)}>
                      <div className="w-20 h-20 rounded-xl overflow-hidden mb-1"
                        style={{ border: '2px solid rgba(34,197,94,0.4)' }}>
                        {m.avatar
                          ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl"
                              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                              {m.name?.[0]?.toUpperCase()}
                            </div>
                        }
                      </div>
                      <p className="text-white text-xs text-center truncate font-medium">{m.name}</p>
                      <p className="text-purple-300 text-xs text-center opacity-70 truncate">{m.zodiac || m.sun}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-purple-300 opacity-60 text-sm">Chưa có dữ liệu. Hãy khám phá tình duyên!</p>
                  <button onClick={() => navigate('/match')}
                    className="mt-3 btn-cosmic px-6 py-2 text-sm">Khám Phá Ngay</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { apiGenerate } from '../services/api';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import UiIcon from '../components/UiIcon';
import { getRelevantTransits, isTransitActive } from '../utils/lunar';

const IMPACT_COLOR = { high: '#f87171', medium: '#fbbf24', low: '#4ade80' };
const IMPACT_LABEL = { high: 'Ảnh hưởng lớn', medium: 'Ảnh hưởng vừa', low: 'Nhẹ' };
const CATEGORY_ICONS: Record<string, string> = {
  communication: '💬', love: '💕', career: '💼', energy: '⚡', spiritual: '✨'
};

export default function TransitPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [aiText, setAiText] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const element = ELEMENT_MAP[profile.sun || ''] || 'Không xác định';
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];

  const transits = getRelevantTransits(profile.sun || 'Bạch Dương', 6);

  const handleGetAIAdvice = async (eventId: string, description: string) => {
    if (aiText[eventId]) return;
    setLoadingId(eventId);
    try {
      const res = await apiGenerate({
        userData: {
          uid: profile.uid,
          name: profile.name,
          sun: profile.sun,
          moon: profile.moon,
          birthDate: profile.birthDate,
        },
        category: `transit_${eventId}`,
        day: new Date().toISOString().split('T')[0],
        extra: { transit_event: description }
      } as any);
      setAiText(prev => ({ ...prev, [eventId]: res.data?.prediction || description }));
    } catch {
      setAiText(prev => ({ ...prev, [eventId]: `Sự kiện này ảnh hưởng trực tiếp đến ${profile.sun} của bạn. ${description}` }));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/home')} className="text-purple-300 hover:text-white text-sm">← Về Trang Chủ</button>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display">
          <UiIcon name="star" label="Transit" className="mr-2 inline" />
          Transit Alerts
        </h1>
        <p className="text-purple-300 opacity-70 mt-1">
          Các sự kiện thiên văn ảnh hưởng đến {profile.sun} của bạn
        </p>
      </motion.div>

      {/* Current active badge */}
      {transits.some(t => isTransitActive(t)) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-4 flex items-center gap-3"
          style={{ border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.05)' }}
        >
          <span className="text-2xl animate-pulse">⚡</span>
          <div>
            <p className="text-yellow-300 font-semibold text-sm">Có sự kiện đang hoạt động!</p>
            <p className="text-yellow-200/60 text-xs">Các hành tinh đang ảnh hưởng đến lá số của bạn ngay lúc này.</p>
          </div>
        </motion.div>
      )}

      {/* Transit list */}
      <div className="space-y-3">
        {transits.map((transit, i) => {
          const active = isTransitActive(transit);
          const affectsUser = transit.affectedSigns.includes(profile.sun || '');
          const isOpen = selected === transit.id;

          return (
            <motion.div key={transit.id}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}>
              <button
                className={`w-full glass-card p-4 text-left transition-all hover:border-purple-400/30 ${isOpen ? 'border-purple-400/40' : ''}`}
                style={active ? { border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.03)' } : {}}
                onClick={() => {
                  const newId = isOpen ? null : transit.id;
                  setSelected(newId);
                  if (newId) handleGetAIAdvice(transit.id, transit.description);
                }}
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{transit.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-white font-semibold text-sm">{transit.planet}</h3>
                      <span className="text-purple-300 text-xs opacity-80">— {transit.event}</span>
                      {active && (
                        <span className="text-xs px-2 py-0.5 rounded-full animate-pulse"
                          style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>
                          ● Đang diễn ra
                        </span>
                      )}
                      {affectsUser && !active && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${colors[0]}20`, color: colors[0] }}>
                          Ảnh hưởng {profile.sun}
                        </span>
                      )}
                    </div>
                    <p className="text-purple-400 text-xs opacity-70">📅 {transit.dateRange}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${IMPACT_COLOR[transit.impact]}20`, color: IMPACT_COLOR[transit.impact] }}>
                        {IMPACT_LABEL[transit.impact]}
                      </span>
                      <span className="text-xs text-purple-400 opacity-60">
                        {CATEGORY_ICONS[transit.category]} {transit.category === 'communication' ? 'Giao tiếp' : transit.category === 'love' ? 'Tình yêu' : transit.category === 'career' ? 'Sự nghiệp' : transit.category === 'energy' ? 'Năng lượng' : 'Tâm linh'}
                      </span>
                    </div>
                  </div>
                  <span className="text-purple-500 text-xs">{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Expanded */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-purple-500/20 space-y-3"
                    >
                      <p className="text-purple-200 text-xs leading-relaxed opacity-90">
                        {transit.description}
                      </p>

                      <div>
                        <p className="text-purple-400 text-xs mb-2 font-medium">🎯 Cung chịu ảnh hưởng:</p>
                        <div className="flex gap-2 flex-wrap">
                          {transit.affectedSigns.map(sign => (
                            <span key={sign} className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: sign === profile.sun ? `${colors[0]}30` : 'rgba(139,92,246,0.1)',
                                color: sign === profile.sun ? colors[0] : '#c4b5fd',
                                border: sign === profile.sun ? `1px solid ${colors[0]}40` : 'none',
                                fontWeight: sign === profile.sun ? 600 : 400,
                              }}>
                              {sign}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* AI advice */}
                      <div className="glass p-3 rounded-xl">
                        <p className="text-purple-400 text-xs mb-2 font-medium">✨ Lời khuyên cho {profile.sun}:</p>
                        {loadingId === transit.id ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border border-purple-400/40 border-t-purple-300 rounded-full animate-spin" />
                            <p className="text-purple-400 text-xs animate-pulse">Đang phân tích...</p>
                          </div>
                        ) : aiText[transit.id] ? (
                          <p className="text-purple-100 text-xs leading-relaxed opacity-90 italic">
                            {aiText[transit.id]}
                          </p>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          );
        })}
      </div>

      {transits.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">🌟</div>
          <p className="text-white font-semibold">Bầu trời đang yên bình</p>
          <p className="text-purple-300 text-sm opacity-60 mt-1">Không có sự kiện thiên văn lớn ảnh hưởng đến bạn lúc này.</p>
        </div>
      )}
    </div>
  );
}

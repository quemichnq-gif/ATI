import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RootState } from '../store';
import { apiGenerate } from '../services/api';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import { getVietnameseDate } from '../utils/date';
import { getLunarPhase, getLunarMeaningForSign } from '../utils/lunar';
import UiIcon from '../components/UiIcon';

export default function PredictionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useSelector((s: RootState) => s.profile);
  const [prediction, setPrediction] = useState<string>((location.state as any)?.prediction || '');
  const [category, setCategory] = useState<string>((location.state as any)?.category || 'astro');
  const [loading, setLoading] = useState(false);

  const element = ELEMENT_MAP[profile.sun || ''] || 'Không xác định';
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];
  const lunarPhase = getLunarPhase();

  const PERIOD_TABS = [
    { id: 'today', label: 'Hôm Nay' },
    { id: 'week', label: 'Tuần Nay' },
    { id: 'month', label: 'Tháng Nay' },
  ];

  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const CATEGORIES = [
    { id: 'astro', label: 'Chiêm Tinh', icon: 'chart', desc: 'Dự đoán tổng quan hôm nay' },
    { id: 'love', label: 'Tình Duyên', icon: 'heart', desc: 'Năng lượng tình cảm hôm nay' },
    { id: 'work', label: 'Công Việc', icon: 'briefcase', desc: 'Vận thế sự nghiệp' },
  ];

  const getCacheKey = (cat: string, p: string) => {
    const dateKey = p === 'today'
      ? new Date().toISOString().split('T')[0]
      : p === 'week'
      ? `week_${getWeekNumber()}`
      : `month_${new Date().toISOString().slice(0, 7)}`;
    return `pred_${profile.uid || 'guest'}_${cat}_${p}_${dateKey}`;
  };

  function getWeekNumber() {
    const d = new Date();
    const onejan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  }

  const handleGenerate = async (cat: string, p: string = period) => {
    setCategory(cat);
    setPeriod(p as any);
    const cacheKey = getCacheKey(cat, p);
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setPrediction(cached);
      return;
    }

    setLoading(true);
    try {
      const periodLabel = p === 'week' ? 'tuần này' : p === 'month' ? 'tháng này' : 'hôm nay';
      const categoryWithPeriod = p !== 'today' ? `${cat}_${p}` : cat;
      const res = await apiGenerate({
        userData: { uid: profile.uid, name: profile.name, sun: profile.sun, moon: profile.moon, birthDate: profile.birthDate },
        category: categoryWithPeriod,
        day: new Date().toISOString().split('T')[0],
      });
      const text = res.data?.prediction || '';
      setPrediction(text);
      if (text) {
        sessionStorage.setItem(cacheKey, text);
      }
    } catch {
      setPrediction('Không thể tải dự đoán. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Tự động tải dự đoán nếu chưa có
  useEffect(() => {
    if (!prediction && profile.sun) {
      handleGenerate(category, period);
    }
  }, [profile.sun]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/home')} className="text-purple-300 hover:text-white text-sm">← Về Trang Chủ</button>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display"><UiIcon name="chart" label="Dự đoán hôm nay" className="mr-2 inline" />Dự Đoán Hôm Nay</h1>
        <p className="text-purple-300 opacity-70 mt-1">{getVietnameseDate('today')}</p>
      </motion.div>

      {/* Lunar phase widget */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-4 flex items-center gap-4">
        <span className="text-4xl">{lunarPhase.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">{lunarPhase.name}</p>
          <p className="text-purple-300 text-xs opacity-70 truncate">{lunarPhase.energy}</p>
          <p className="text-purple-200 text-xs mt-1 opacity-60 italic line-clamp-2">
            {getLunarMeaningForSign(lunarPhase, profile.sun || '')}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-white font-bold text-sm">{lunarPhase.illumination}%</p>
          <p className="text-purple-400 text-xs opacity-60">sáng</p>
        </div>
      </motion.div>

      {/* Period tabs (Today / Week / Month) */}
      <div className="flex gap-2">
        {PERIOD_TABS.map(t => (
          <button key={t.id} onClick={() => handleGenerate(category, t.id)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              period === t.id ? 'text-white' : 'glass text-purple-300 hover:text-white'
            }`}
            style={period === t.id ? {
              background: `linear-gradient(135deg, ${colors[0]}44, ${colors[1]}33)`,
              border: `1px solid ${colors[0]}66`,
            } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-3">
        {CATEGORIES.map(c => (
          <button key={c.id} aria-pressed={category === c.id} onClick={() => handleGenerate(c.id, period)}
            className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
              category === c.id ? 'text-white' : 'glass text-purple-300 hover:text-white'
            }`}
            style={category === c.id ? {
              background: `linear-gradient(135deg, ${colors[0]}44, ${colors[1]}33)`,
              border: `1px solid ${colors[0]}66`,
            } : {}}>
            <div className="text-lg mb-0.5"><UiIcon name={c.icon as 'chart'} label={c.label} /></div>
            <div>{c.label}</div>
          </button>
        ))}
      </div>

      {/* Prediction content */}
      <div className="glass-card p-6">
        {loading ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="relative">
              <div className="cosmic-spinner" />
              <div className="absolute inset-0 flex items-center justify-center text-xl"><UiIcon name="chart" label="Đang tạo dự đoán" /></div>
            </div>
            <p className="text-purple-300 text-sm animate-pulse">Đang đọc năng lượng vũ trụ...</p>
          </div>
        ) : prediction ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl"><UiIcon name="sparkles" label="Dự đoán cá nhân" /></div>
              <div>
                <h2 className="text-white font-bold">
                  {CATEGORIES.find(c => c.id === category)?.label}
                  {period !== 'today' && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{background:`${colors[0]}20`,color:colors[0]}}>
                      {period === 'week' ? 'Tuần Này' : 'Tháng Này'}
                    </span>
                  )}
                </h2>
                <p className="text-purple-300 text-xs opacity-70">Dành riêng cho {profile.name}</p>
              </div>
            </div>
            <div className="text-purple-100 leading-relaxed whitespace-pre-wrap text-sm opacity-90 
              border-l-2 pl-4 italic" style={{ borderColor: colors[0] }}>
              {prediction}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-8">
            <div className="text-5xl mb-3"><UiIcon name="star" label="Chọn loại dự đoán" /></div>
            <p className="text-purple-300 opacity-70">Chọn loại dự đoán để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  );
}

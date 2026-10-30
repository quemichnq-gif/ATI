import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { RootState } from '../store';
import { apiGenerate } from '../services/api';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import { getVietnameseDate } from '../utils/date';
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

  const CATEGORIES = [
    { id: 'astro', label: 'Chiêm Tinh', icon: 'chart', desc: 'Dự đoán tổng quan hôm nay' },
    { id: 'love', label: 'Tình Duyên', icon: 'heart', desc: 'Năng lượng tình cảm hôm nay' },
    { id: 'work', label: 'Công Việc', icon: 'briefcase', desc: 'Vận thế sự nghiệp' },
  ];

  const handleGenerate = async (cat: string) => {
    setCategory(cat); setLoading(true);
    try {
      const res = await apiGenerate({
        userData: { uid: profile.uid, name: profile.name, sun: profile.sun, moon: profile.moon, birthDate: profile.birthDate },
        category: cat,
        day: new Date().toISOString().split('T')[0],
      });
      setPrediction(res.data?.prediction || '');
    } catch { setPrediction('Không thể tải dự đoán. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/home')} className="text-purple-300 hover:text-white text-sm">← Về Trang Chủ</button>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display"><UiIcon name="chart" label="Dự đoán hôm nay" className="mr-2 inline" />Dự Đoán Hôm Nay</h1>
        <p className="text-purple-300 opacity-70 mt-1">{getVietnameseDate('today')}</p>
      </motion.div>

      {/* Category tabs */}
      <div className="flex gap-3">
        {CATEGORIES.map(c => (
          <button key={c.id} aria-pressed={category === c.id} onClick={() => handleGenerate(c.id)}
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
                <h2 className="text-white font-bold">{CATEGORIES.find(c => c.id === category)?.label}</h2>
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

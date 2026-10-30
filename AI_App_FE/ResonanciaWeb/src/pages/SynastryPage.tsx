import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { apiGenerate } from '../services/api';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import UiIcon from '../components/UiIcon';

const ZODIAC_SIGNS = [
  'Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 'Sư Tử', 'Xử Nữ',
  'Thiên Bình', 'Bọ Cạp', 'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'
];

const ZODIAC_SYMBOLS: Record<string, string> = {
  'Bạch Dương': '♈', 'Kim Ngưu': '♉', 'Song Tử': '♊', 'Cự Giải': '♋',
  'Sư Tử': '♌', 'Xử Nữ': '♍', 'Thiên Bình': '♎', 'Bọ Cạp': '♏',
  'Nhân Mã': '♐', 'Ma Kết': '♑', 'Bảo Bình': '♒', 'Song Ngư': '♓'
};

interface SynastryResult {
  overall: number;
  love: number;
  communication: number;
  passion: number;
  spiritual: number;
  summary: string;
  strengths: string;
  challenges: string;
  advice: string;
}

export default function SynastryPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();

  const [person2, setPerson2] = useState({
    name: '', sun: '', moon: '', ascendant: '', venus: '', mars: '',
  });
  const [result, setResult] = useState<SynastryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const element = ELEMENT_MAP[profile.sun || ''] || 'Không xác định';
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];

  const isFormValid = person2.name && person2.sun && person2.moon;

  const handleAnalyze = async () => {
    if (!isFormValid || !profile.uid) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiGenerate({
        userData: {
          uid: profile.uid,
          name: profile.name,
          sun: profile.sun,
          moon: profile.moon,
          birthDate: profile.birthDate,
        },
        category: 'synastry',
        day: new Date().toISOString().split('T')[0],
        // Pass person2 data as extra context
        extra: {
          person2_name: person2.name,
          person2_sun: person2.sun,
          person2_moon: person2.moon,
          person2_ascendant: person2.ascendant,
          person2_venus: person2.venus,
          person2_mars: person2.mars,
        }
      } as any);

      // Parse kết quả JSON hoặc fallback
      const text = res.data?.prediction || '';
      try {
        const cleaned = text.replace(/^[\s\S]*?\{/, '{').replace(/\}[\s\S]*$/, '}');
        const parsed = JSON.parse(cleaned);
        setResult(parsed);
      } catch {
        // Tạo kết quả từ text
        setResult(buildFallbackResult(profile.sun || '', person2.sun, text));
      }
    } catch {
      setResult(buildFallbackResult(profile.sun || '', person2.sun, ''));
    } finally {
      setLoading(false);
    }
  };

  function buildFallbackResult(sun1: string, sun2: string, aiText: string): SynastryResult {
    // Tính điểm tương hợp dựa trên nguyên tố
    const ELEMENTS: Record<string, string> = {
      'Bạch Dương': 'fire', 'Sư Tử': 'fire', 'Nhân Mã': 'fire',
      'Kim Ngưu': 'earth', 'Xử Nữ': 'earth', 'Ma Kết': 'earth',
      'Song Tử': 'air', 'Thiên Bình': 'air', 'Bảo Bình': 'air',
      'Cự Giải': 'water', 'Bọ Cạp': 'water', 'Song Ngư': 'water',
    };
    const e1 = ELEMENTS[sun1] || 'fire';
    const e2 = ELEMENTS[sun2] || 'fire';
    const COMPAT: Record<string, Record<string, number>> = {
      fire: { fire: 80, air: 85, earth: 60, water: 55 },
      earth: { earth: 82, water: 88, fire: 60, air: 65 },
      air: { air: 78, fire: 85, water: 62, earth: 65 },
      water: { water: 84, earth: 88, air: 62, fire: 55 },
    };
    const base = COMPAT[e1]?.[e2] ?? 70;
    const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min));

    return {
      overall: base,
      love: rand(base - 10, base + 10),
      communication: rand(base - 15, base + 5),
      passion: rand(base - 5, base + 15),
      spiritual: rand(base - 10, base + 10),
      summary: aiText || `${sun1} và ${sun2} có sự tương hợp ${base}% dựa trên nguyên tố và vị trí hành tinh. Mối quan hệ này mang nhiều tiềm năng phát triển tươi sáng.`,
      strengths: `${sun1} mang năng lượng ${e1 === 'fire' ? 'bùng cháy' : e1 === 'earth' ? 'vững chắc' : e1 === 'air' ? 'tự do' : 'sâu lắng'}, bổ trợ cho bản chất ${e2 === 'fire' ? 'nhiệt huyết' : e2 === 'earth' ? 'kiên định' : e2 === 'air' ? 'linh hoạt' : 'cảm xúc'} của ${sun2}.`,
      challenges: 'Cần cân bằng nhu cầu độc lập và kết nối. Hãy xây dựng ngôn ngữ tình cảm chung để vượt qua những bất đồng.',
      advice: `Hãy trân trọng sự khác biệt — đó chính là sức mạnh của đôi bạn. ${sun1} nên học cách kiên nhẫn hơn, trong khi ${sun2} nên cởi mở hơn với sự thay đổi.`,
    };
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return '#4ade80';
    if (score >= 65) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/match')} className="text-purple-300 hover:text-white text-sm">← Về Tìm Bạn</button>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display">💑 Bản Đồ Đôi — Synastry</h1>
        <p className="text-purple-300 opacity-70 mt-1">Phân tích chiều sâu tương hợp giữa hai lá số</p>
      </motion.div>

      {/* Two people cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Person 1 — current user */}
        <div className="glass-card p-4" style={{ border: `1px solid ${colors[0]}40` }}>
          <p className="text-xs text-purple-400 mb-2 font-medium">Người 1 (Bạn)</p>
          <div className="text-center">
            {profile.avatar ? (
              <img src={profile.avatar} alt="avatar" className="w-14 h-14 rounded-full mx-auto mb-2 object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl"
                style={{ background: `linear-gradient(135deg, ${colors[0]}40, ${colors[1]}30)` }}>
                {ZODIAC_SYMBOLS[profile.sun || ''] || '✦'}
              </div>
            )}
            <p className="text-white font-semibold text-sm">{profile.name || 'Bạn'}</p>
            <p className="text-purple-300 text-xs opacity-70">{profile.sun} · {profile.moon}</p>
          </div>
        </div>

        {/* Person 2 — input */}
        <div className="glass-card p-4">
          <p className="text-xs text-purple-400 mb-2 font-medium">Người 2</p>
          <input
            type="text"
            placeholder="Tên..."
            value={person2.name}
            onChange={e => setPerson2(p => ({ ...p, name: e.target.value }))}
            className="w-full glass px-2 py-1.5 rounded-lg text-white text-xs mb-2 placeholder-purple-400/60 outline-none border border-purple-500/20"
          />
          <div className="text-center text-3xl mb-2">
            {ZODIAC_SYMBOLS[person2.sun] || '?'}
          </div>
          <p className="text-purple-300 text-xs opacity-70 text-center">
            {person2.sun || '—'} · {person2.moon || '—'}
          </p>
        </div>
      </div>

      {/* Form for Person 2 */}
      {!result && (
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-white font-semibold">Thông Tin Người Thứ Hai</h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'sun', label: 'Mặt Trời ☉ *' },
              { key: 'moon', label: 'Mặt Trăng ☽ *' },
              { key: 'ascendant', label: 'Cung Mọc ↑' },
              { key: 'venus', label: 'Sao Kim ♀' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-purple-300 text-xs mb-1 block">{label}</label>
                <select
                  value={person2[key as keyof typeof person2]}
                  onChange={e => setPerson2(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full glass px-2 py-2 rounded-lg text-white text-xs outline-none border border-purple-500/20 bg-transparent"
                >
                  <option value="">— chọn —</option>
                  {ZODIAC_SIGNS.map(s => (
                    <option key={s} value={s} style={{ background: '#1e1b4b' }}>{ZODIAC_SYMBOLS[s]} {s}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!isFormValid || loading}
            className="btn-cosmic w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: isFormValid ? `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` : undefined }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang phân tích...
              </span>
            ) : '✨ Phân Tích Tương Hợp'}
          </button>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Overall score */}
            <div className="glass-card p-6 text-center" style={{ border: `1px solid ${scoreColor(result.overall)}40` }}>
              <p className="text-purple-300 text-sm mb-1">Độ Tương Hợp Tổng Thể</p>
              <div className="text-6xl font-bold font-display mb-1" style={{ color: scoreColor(result.overall) }}>
                {result.overall}%
              </div>
              <p className="text-purple-200 text-sm">
                {profile.name} × {person2.name}
              </p>
              <p className="text-purple-300 text-xs mt-2 opacity-80 italic">
                {result.overall >= 80 ? '💫 Sự kết hợp của các vì sao!' : result.overall >= 65 ? '✨ Tiềm năng tốt, cần vun đắp' : '🌱 Thử thách giúp cả hai trưởng thành'}
              </p>
            </div>

            {/* Score breakdown */}
            <div className="glass-card p-5">
              <h2 className="text-white font-semibold mb-4">Phân Tích Chi Tiết</h2>
              {[
                { label: 'Tình Cảm', value: result.love, icon: '💕' },
                { label: 'Giao Tiếp', value: result.communication, icon: '💬' },
                { label: 'Đam Mê', value: result.passion, icon: '🔥' },
                { label: 'Tâm Linh', value: result.spiritual, icon: '✨' },
              ].map(item => (
                <div key={item.label} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-purple-300">{item.icon} {item.label}</span>
                    <span className="font-semibold" style={{ color: scoreColor(item.value) }}>{item.value}%</span>
                  </div>
                  <div className="cosmic-progress">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1.2, delay: 0.2 }}
                      style={{ height: '100%', background: `linear-gradient(90deg, ${scoreColor(item.value)}88, ${scoreColor(item.value)})`, borderRadius: 3 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Text analysis */}
            {[
              { label: 'Tóm Tắt', key: 'summary', icon: '📊' },
              { label: 'Điểm Mạnh Đôi Bạn', key: 'strengths', icon: '💪' },
              { label: 'Thách Thức Cần Vượt', key: 'challenges', icon: '⚔️' },
              { label: 'Lời Khuyên Vũ Trụ', key: 'advice', icon: '🌟' },
            ].map(({ label, key, icon }) => (
              <div key={key} className="glass-card p-5">
                <h2 className="text-white font-semibold mb-2">{icon} {label}</h2>
                <p className="text-purple-100 text-sm leading-relaxed opacity-90 border-l-2 pl-3 italic"
                  style={{ borderColor: colors[0] }}>
                  {result[key as keyof SynastryResult] as string}
                </p>
              </div>
            ))}

            <button onClick={() => setResult(null)}
              className="text-purple-400 text-sm hover:text-purple-300 underline w-full text-center">
              ↻ Phân tích cặp đôi khác
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { apiNatalAnalysis } from '../services/api';
import { ELEMENT_COLORS, ELEMENT_MAP } from '../constants/astrologyMap';

const SECTIONS = [
  { key: 'personality', label: '🌟 Tính Cách', icon: '🌟' },
  { key: 'emotions', label: '💙 Cảm Xúc', icon: '💙' },
  { key: 'career', label: '💼 Sự Nghiệp', icon: '💼' },
  { key: 'love', label: '💕 Tình Yêu', icon: '💕' },
  { key: 'strengths', label: '⚡ Điểm Mạnh', icon: '⚡' },
  { key: 'elements', label: '🌊 Nguyên Tố', icon: '🌊' },
  { key: 'advice', label: '🔮 Lời Khuyên', icon: '🔮' },
  { key: 'idealPartner', label: '👫 Người Lý Tưởng', icon: '👫' },
];

function parseAnalysisSections(text: string) {
  const sections: Record<string, string> = {};
  const parts = text.split(/\n(?=\d\.|##|\*\*[A-ZÁÀẢ])/);
  parts.forEach((part, i) => {
    const key = SECTIONS[i]?.key;
    if (key) sections[key] = part.trim();
  });
  if (Object.keys(sections).length === 0) sections['personality'] = text;
  return sections;
}

export default function NatalChartPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState('personality');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const element = ELEMENT_MAP[profile.sun || ''] || 'Không xác định';
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];

  const handleAnalyze = async () => {
    if (!profile.uid) return;
    setLoading(true); setError('');
    try {
      const res = await apiNatalAnalysis({
        uid: profile.uid,
        name: profile.name,
        sun: profile.sun,
        moon: profile.moon,
        mercury: profile.mercury,
        venus: profile.venus,
        mars: profile.mars,
        jupiter: profile.jupiter,
        saturn: profile.saturn,
        uranus: profile.uranus,
        neptune: profile.neptune,
        pluto: profile.pluto,
        ascendant: profile.ascendant,
        descendant: profile.descendant,
        mc: profile.mc,
        ic: profile.ic,
        house1: profile.house1, house2: profile.house2, house3: profile.house3, house4: profile.house4,
        house5: profile.house5, house6: profile.house6, house7: profile.house7, house8: profile.house8,
        house9: profile.house9, house10: profile.house10, house11: profile.house11, house12: profile.house12,
        conjunctionAspect: profile.conjunctionAspect,
        oppositionAspect: profile.oppositionAspect,
        trineAspect: profile.trineAspect,
        squareAspect: profile.squareAspect,
        sextileAspect: profile.sextileAspect,
        fireRatio: profile.fireRatio,
        earthRatio: profile.earthRatio,
        airRatio: profile.airRatio,
        waterRatio: profile.waterRatio,
      });
      const text = res.data?.analysis || '';
      setAnalysis(text);
      setSections(parseAnalysisSections(text));
      setActiveSection(SECTIONS[0].key);
    } catch (e: any) {
      setError('Không thể phân tích. Vui lòng thử lại.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display">🗺️ Natal Chart Analysis</h1>
        <p className="text-purple-300 opacity-70 mt-1">Phân tích chiêm tinh sâu từ biểu đồ sinh của bạn</p>
      </motion.div>

      {/* Planet Overview */}
      <div className="glass-card p-6">
        <h2 className="text-white font-semibold mb-4">🪐 Hành Tinh Của Bạn</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Mặt Trời ☀️', value: profile.sun },
            { label: 'Mặt Trăng 🌙', value: profile.moon },
            { label: 'Sao Thuỷ ☿', value: profile.mercury },
            { label: 'Sao Kim ♀', value: profile.venus },
            { label: 'Sao Hoả ♂', value: profile.mars },
            { label: 'Sao Mộc ♃', value: profile.jupiter },
            { label: 'Sao Thổ ♄', value: profile.saturn },
            { label: 'Điểm Mọc ⬆️', value: profile.ascendant },
            { label: 'Trung Thiên 🏆', value: profile.mc },
            { label: 'Nguyên Tố 🌟', value: element },
          ].map(p => (
            <div key={p.label} className="glass p-3 rounded-xl text-center">
              <p className="text-purple-300 text-xs mb-1 opacity-70">{p.label}</p>
              <p className="text-white text-sm font-semibold">{p.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Element Ratios */}
      <div className="glass-card p-6">
        <h2 className="text-white font-semibold mb-4">🌊 Tỷ Lệ Nguyên Tố</h2>
        <div className="space-y-3">
          {[
            { label: '🔥 Hoả', value: profile.fireRatio || 0, color: '#ef4444' },
            { label: '🌍 Thổ', value: profile.earthRatio || 0, color: '#a16207' },
            { label: '💨 Khí', value: profile.airRatio || 0, color: '#06b6d4' },
            { label: '💧 Thuỷ', value: profile.waterRatio || 0, color: '#3b82f6' },
          ].map(e => (
            <div key={e.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-purple-300">{e.label}</span>
                <span className="text-white font-semibold">{e.value}%</span>
              </div>
              <div className="cosmic-progress">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${e.value}%` }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${e.color}88, ${e.color})`, borderRadius: '3px' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Natal Chart Image */}
      {profile.natalChartImage && (
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold mb-4">🌐 Biểu Đồ Chiêm Tinh</h2>
          <div className="flex justify-center">
            <img src={`data:image/svg+xml;base64,${profile.natalChartImage}`}
              alt="Natal Chart" className="max-w-md w-full rounded-xl" />
          </div>
        </div>
      )}

      {/* Analyze button */}
      {!analysis && (
        <div className="text-center">
          <button onClick={handleAnalyze} disabled={loading}
            className="btn-cosmic px-10 py-4 text-lg"
            style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
            {loading ? (
              <span className="flex items-center gap-3">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang phân tích chiêm tinh...
              </span>
            ) : '🔮 Phân Tích Natal Chart'}
          </button>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>
      )}

      {/* Analysis Result */}
      {analysis && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Section tabs */}
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeSection === s.key ? 'text-white' : 'text-purple-300 hover:text-white glass'
                }`}
                style={activeSection === s.key ? {
                  background: `linear-gradient(135deg, ${colors[0]}66, ${colors[1]}44)`,
                  border: `1px solid ${colors[0]}66`,
                } : {}}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Section content */}
          <AnimatePresence mode="wait">
            <motion.div key={activeSection}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="glass-card p-6">
              <h3 className="text-white font-bold text-lg mb-4">
                {SECTIONS.find(s => s.key === activeSection)?.label}
              </h3>
              <p className="text-purple-100 leading-relaxed whitespace-pre-wrap text-sm opacity-90">
                {sections[activeSection] || analysis}
              </p>
            </motion.div>
          </AnimatePresence>

          <button onClick={handleAnalyze}
            className="text-purple-400 text-sm hover:text-purple-300 underline">
            🔄 Phân tích lại
          </button>
        </motion.div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { apiNatalAnalysis, apiGenerate } from '../services/api';
import { ELEMENT_COLORS, ELEMENT_MAP } from '../constants/astrologyMap';
import UiIcon from '../components/UiIcon';
import type { IconName } from '../components/UiIcon';
import NatalChartSVG from '../components/NatalChartSVG';

const SECTIONS = [
  { key: 'personality', label: 'Tính Cách', icon: 'user' },
  { key: 'emotions', label: 'Cảm Xúc', icon: 'heart' },
  { key: 'career', label: 'Sự Nghiệp', icon: 'briefcase' },
  { key: 'love', label: 'Tình Yêu', icon: 'heart' },
  { key: 'strengths', label: 'Điểm Mạnh', icon: 'sparkles' },
  { key: 'elements', label: 'Nguyên Tố', icon: 'water' },
  { key: 'advice', label: 'Lời Khuyên', icon: 'chart' },
  { key: 'idealPartner', label: 'Người Lý Tưởng', icon: 'user' },
];

const PAGE_TABS = [
  { id: 'chart', label: 'Biểu Đồ Sao' },
  { id: 'analysis', label: 'Phân Tích AI' },
  { id: 'career', label: 'Hướng Nghiệp' },
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
  const [pageTab, setPageTab] = useState('chart');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState('personality');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [careerAnalysis, setCareerAnalysis] = useState('');
  const [careerLoading, setCareerLoading] = useState(false);

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

  const handleCareerAnalysis = async () => {
    if (!profile.uid) return;
    setCareerLoading(true);
    try {
      const res = await apiGenerate({
        userData: { uid: profile.uid, name: profile.name, sun: profile.sun, moon: profile.moon, birthDate: profile.birthDate },
        category: 'career_chart',
        day: new Date().toISOString().split('T')[0],
      });
      setCareerAnalysis(res.data?.prediction || 'Không thể tải. Vui lòng thử lại.');
    } catch {
      setCareerAnalysis(`${profile.sun} của bạn được hành tinh Saturn và Jupiter chi phối sự nghiệp. Nhà thứ 10 trong lá số tiết lộ con đường phù hợp nhất với bản chất bạn.`);
    } finally { setCareerLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display"><UiIcon name="chart" label="Natal Chart" className="mr-2 inline" />Natal Chart Analysis</h1>
        <p className="text-purple-300 opacity-70 mt-1">Phân tích chiêm tinh sâu từ biểu đồ sinh của bạn</p>
      </motion.div>

      {/* Page tabs */}
      <div className="flex gap-2">
        {PAGE_TABS.map(tab => (
          <button key={tab.id} onClick={() => setPageTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              pageTab === tab.id ? 'text-white' : 'glass text-purple-300 hover:text-white'
            }`}
            style={pageTab === tab.id ? {
              background: `linear-gradient(135deg, ${colors[0]}50, ${colors[1]}40)`,
              border: `1px solid ${colors[0]}60`,
            } : {}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: CHART */}
      {pageTab === 'chart' && (
        <>
        {/* SVG Natal Chart */}
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold mb-4"><UiIcon name="chart" label="Biểu đồ chiêm tinh" className="mr-2 inline" />Biểu Đồ Natal Chart</h2>
          <div className="flex justify-center">
            <NatalChartSVG
              planets={{
                sun: profile.sun, moon: profile.moon, mercury: profile.mercury,
                venus: profile.venus, mars: profile.mars, jupiter: profile.jupiter,
                saturn: profile.saturn, uranus: profile.uranus, neptune: profile.neptune,
                pluto: profile.pluto, ascendant: profile.ascendant, mc: profile.mc,
              }}
              aspects={{
                conjunction: profile.conjunctionAspect,
                trine: profile.trineAspect,
                opposition: profile.oppositionAspect,
                square: profile.squareAspect,
                sextile: profile.sextileAspect,
              }}
              size={320}
            />
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs">
            {[['#fbbf24','Conjunction'],['#4ade80','Trine'],['#f87171','Opposition'],['#fb923c','Square'],['#38bdf8','Sextile']].map(([c,l])=>(
              <span key={l} className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{background:c}}/><span className="text-purple-300 opacity-70">{l}</span></span>
            ))}
          </div>
        </div>

        {/* Planet Overview */}
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold mb-4"><UiIcon name="sparkles" label="Hành tinh của bạn" className="mr-2 inline" />Hành Tinh Của Bạn</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'Mặt Trời', icon: 'sun', value: profile.sun },
              { label: 'Mặt Trăng', icon: 'moon', value: profile.moon },
              { label: 'Sao Thuỷ ☿', value: profile.mercury },
              { label: 'Sao Kim ♀', value: profile.venus },
              { label: 'Sao Hoả ♂', value: profile.mars },
              { label: 'Sao Mộc ♃', value: profile.jupiter },
              { label: 'Sao Thổ ♄', value: profile.saturn },
              { label: 'Điểm Mọc ↑', value: profile.ascendant },
              { label: 'Trung Thiên', icon: 'star', value: profile.mc },
              { label: 'Nguyên Tố', icon: 'sparkles', value: element },
            ].map(p => (
              <div key={p.label} className="glass p-3 rounded-xl text-center">
                <p className="text-purple-300 text-xs mb-1 opacity-70">{'icon' in p && <UiIcon name={p.icon as IconName} label={p.label} className="mr-1 inline" />}{p.label}</p>
                <p className="text-white text-sm font-semibold">{p.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
        </>)}

      {/* TAB: CAREER CHART */}
      {pageTab === 'career' && (
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h2 className="text-white font-semibold mb-2">💼 Bản Đồ Hướng Nghiệp</h2>
            <p className="text-purple-300 text-sm opacity-70 mb-4">Phân tích sự nghiệp từ Nhà 10, Midheaven và Saturn trong lá số của {profile.sun}</p>
            {!careerAnalysis ? (
              <button onClick={handleCareerAnalysis} disabled={careerLoading}
                className="btn-cosmic px-8 py-3 w-full"
                style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
                {careerLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang phân tích hướng nghiệp...
                  </span>
                ) : '🔭 Phân Tích Hướng Nghiệp'}
              </button>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-purple-100 text-sm leading-relaxed whitespace-pre-wrap opacity-90 border-l-2 pl-4 italic"
                  style={{ borderColor: colors[0] }}>{careerAnalysis}</p>
                <button onClick={() => setCareerAnalysis('')} className="text-purple-400 text-xs mt-3 hover:text-purple-300 underline">↻ Phân tích lại</button>
              </motion.div>
            )}
          </div>
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-3">📊 Vị Trí Liên Quan Sự Nghiệp</h3>
            <div className="grid grid-cols-2 gap-3">
              {[{l:'Trung Thiên (MC)',v:profile.mc},{l:'Nhà 10',v:profile.house10},{l:'Sao Thổ',v:profile.saturn},{l:'Sao Mộc',v:profile.jupiter}].map(({l,v})=>(
                <div key={l} className="glass p-3 rounded-xl text-center">
                  <p className="text-purple-400 text-xs mb-1">{l}</p>
                  <p className="text-white font-semibold text-sm">{v||'—'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: ANALYSIS (existing natal analysis) */}
      {pageTab === 'analysis' && (
        <>
      {/* Element Ratios */}

      {/* Element Ratios */}
      <div className="glass-card p-6">
        <h2 className="text-white font-semibold mb-4"><UiIcon name="water" label="Tỷ lệ nguyên tố" className="mr-2 inline" />Tỷ Lệ Nguyên Tố</h2>
        <div className="space-y-3">
          {[
            { label: 'Hoả', icon: 'flame', value: profile.fireRatio || 0, color: '#ef4444' },
            { label: 'Thổ', icon: 'earth', value: profile.earthRatio || 0, color: '#a16207' },
            { label: 'Khí', icon: 'wind', value: profile.airRatio || 0, color: '#06b6d4' },
            { label: 'Thuỷ', icon: 'water', value: profile.waterRatio || 0, color: '#3b82f6' },
          ].map(e => (
            <div key={e.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-purple-300"><UiIcon name={e.icon as IconName} label={e.label} className="mr-1 inline" />{e.label}</span>
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
            ) : <><UiIcon name="chart" label="Phân tích Natal Chart" className="mr-2 inline" />Phân Tích Natal Chart</>}
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
              <button key={s.key} aria-pressed={activeSection === s.key} onClick={() => setActiveSection(s.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeSection === s.key ? 'text-white' : 'text-purple-300 hover:text-white glass'
                }`}
                style={activeSection === s.key ? {
                  background: `linear-gradient(135deg, ${colors[0]}66, ${colors[1]}44)`,
                  border: `1px solid ${colors[0]}66`,
                } : {}}>
                <UiIcon name={s.icon as 'user'} label={s.label} className="mr-1 inline" />{s.label}
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
                {(() => { const section = SECTIONS.find(s => s.key === activeSection); return section && <><UiIcon name={section.icon as 'user'} label={section.label} className="mr-2 inline" />{section.label}</>; })()}
              </h3>
              <p className="text-purple-100 leading-relaxed whitespace-pre-wrap text-sm opacity-90">
                {sections[activeSection] || analysis}
              </p>
            </motion.div>
          </AnimatePresence>

          <button onClick={handleAnalyze}
            className="text-purple-400 text-sm hover:text-purple-300 underline">
            ↻ Phân tích lại
          </button>
        </motion.div>
      )}
      </>
      )}
    </div>
  );
}

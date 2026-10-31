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
  { key: 'overview', label: 'Tổng Quan', icon: 'sparkles', desc: 'Toàn cảnh tính cách, cảm xúc & sự nghiệp' },
  { key: 'personality', label: 'Tính Cách', icon: 'user', desc: 'Bản sắc, cái tôi và cách hành xử' },
  { key: 'emotions', label: 'Cảm Xúc', icon: 'heart', desc: 'Thế giới nội tâm, tâm lý & nhu cầu an toàn' },
  { key: 'career', label: 'Sự Nghiệp', icon: 'briefcase', desc: 'Định hướng công danh, sở trường & tài chính' },
  { key: 'love', label: 'Tình Yêu', icon: 'heart', desc: 'Ngôn ngữ tình cảm & cách xây dựng kết nối' },
  { key: 'strengths', label: 'Điểm Mạnh', icon: 'star', desc: 'Năng khiếu bẩm sinh & lợi thế vũ trụ' },
  { key: 'elements', label: 'Nguyên Tố', icon: 'water', desc: 'Tương quan 4 nguyên tố trong bản mệnh' },
  { key: 'advice', label: 'Lời Khuyên', icon: 'chart', desc: 'Kim chỉ nam phát triển bản thân' },
  { key: 'idealPartner', label: 'Người Lý Tưởng', icon: 'user', desc: 'Mẫu người đồng điệu về tần số' },
];

const DETAIL_SECTIONS = SECTIONS.filter(s => s.key !== 'overview');

const PAGE_TABS = [
  { id: 'chart', label: 'Biểu Đồ Sao' },
  { id: 'analysis', label: 'Phân Tích AI' },
  { id: 'career', label: 'Hướng Nghiệp' },
];

function cleanSectionText(text: string) {
  if (!text) return '';
  return text
    .replace(/^([#]{1,4}|\*\*|\d+\.|#)+\s*[\d.\s\w\p{L}–\-:]+(\n|\*\*)+/u, '')
    .trim();
}

function parseAnalysisSections(text: string) {
  const sections: Record<string, string> = {};
  if (!text) return sections;
  const parts = text.split(/\n(?=\d+\.|#{1,3}\s*\d*|\*\*[0-9A-ZÁÀẢ])/);
  const keys = ['personality', 'emotions', 'career', 'love', 'strengths', 'elements', 'advice', 'idealPartner'];
  
  parts.forEach((part, i) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (lower.includes('tính cách')) sections['personality'] = trimmed;
    else if (lower.includes('cảm xúc')) sections['emotions'] = trimmed;
    else if (lower.includes('sự nghiệp')) sections['career'] = trimmed;
    else if (lower.includes('tình yêu')) sections['love'] = trimmed;
    else if (lower.includes('điểm mạnh')) sections['strengths'] = trimmed;
    else if (lower.includes('nguyên tố')) sections['elements'] = trimmed;
    else if (lower.includes('lời khuyên')) sections['advice'] = trimmed;
    else if (lower.includes('người lý tưởng')) sections['idealPartner'] = trimmed;
    else if (keys[i]) {
      sections[keys[i]] = trimmed;
    }
  });
  if (Object.keys(sections).length === 0) sections['personality'] = text;
  return sections;
}

export default function NatalChartPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const [pageTab, setPageTab] = useState('chart');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState('overview');
  const [overviewMode, setOverviewMode] = useState<'cards' | 'full'>('cards');
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
                <UiIcon name={s.icon as any} label={s.label} className="mr-1.5 inline" />{s.label}
              </button>
            ))}
          </div>

          {/* Section content */}
          <AnimatePresence mode="wait">
            {activeSection === 'overview' ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Header Tổng Quan Năng Lượng */}
                <div className="glass-card p-6" style={{ background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(219, 39, 119, 0.1))', border: `1px solid ${colors[0]}55` }}>
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-white font-bold text-xl flex items-center gap-2">
                        <UiIcon name="sparkles" label="Tổng quan" className="text-yellow-400" />
                        Tổng Quan Vận Mệnh & Năng Lượng Bản Đồ Sao
                      </h3>
                      <p className="text-purple-300 text-xs mt-1 opacity-80">
                        Bức tranh tổng hợp đa chiều về Tính Cách, Cảm Xúc, Sự Nghiệp và Tình Yêu của bạn
                      </p>
                    </div>

                    {/* Chế độ xem */}
                    <div className="flex gap-1.5 p-1 rounded-xl glass bg-purple-950/40 text-xs">
                      <button
                        onClick={() => setOverviewMode('cards')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                          overviewMode === 'cards' ? 'bg-purple-600/60 text-white shadow' : 'text-purple-300 hover:text-white'
                        }`}
                      >
                        📊 Dạng Thẻ Tổng Hợp
                      </button>
                      <button
                        onClick={() => setOverviewMode('full')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                          overviewMode === 'full' ? 'bg-purple-600/60 text-white shadow' : 'text-purple-300 hover:text-white'
                        }`}
                      >
                        📄 Đọc Toàn Văn
                      </button>
                    </div>
                  </div>

                  {/* Highlights Tam Trụ Hoàng Đạo (Big 3) & Nguyên tố */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-purple-500/20">
                    <div className="glass p-3 rounded-xl text-center">
                      <span className="text-purple-300 text-[11px] block">Mặt Trời (Bản ngã)</span>
                      <span className="text-white font-bold text-sm mt-0.5 block">{profile.sun || 'Kim Ngưu'}</span>
                    </div>
                    <div className="glass p-3 rounded-xl text-center">
                      <span className="text-purple-300 text-[11px] block">Mặt Trăng (Cảm xúc)</span>
                      <span className="text-white font-bold text-sm mt-0.5 block">{profile.moon || 'Xử Nữ'}</span>
                    </div>
                    <div className="glass p-3 rounded-xl text-center">
                      <span className="text-purple-300 text-[11px] block">Cung Mọc (Diện mạo)</span>
                      <span className="text-white font-bold text-sm mt-0.5 block">{profile.ascendant || 'Ma Kết'}</span>
                    </div>
                    <div className="glass p-3 rounded-xl text-center">
                      <span className="text-purple-300 text-[11px] block">Nguyên Tố Trội</span>
                      <span className="text-white font-bold text-sm mt-0.5 block">
                        {profile.earthRatio && profile.earthRatio >= 30 ? 'Thổ' : profile.fireRatio && profile.fireRatio >= 30 ? 'Hoả' : profile.waterRatio && profile.waterRatio >= 30 ? 'Thuỷ' : 'Khí'} (Chủ đạo)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chế độ 1: Dạng Thẻ Lưới Tổng Hợp */}
                {overviewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DETAIL_SECTIONS.map((s, idx) => {
                      const content = sections[s.key];
                      const cleaned = cleanSectionText(content);
                      return (
                        <motion.div
                          key={s.key}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="glass-card p-5 flex flex-col justify-between hover:border-purple-400/40 transition-all card-hover"
                          style={{ border: '1px solid rgba(168, 85, 247, 0.2)' }}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                                  style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.2))' }}>
                                  <UiIcon name={s.icon as any} label={s.label} />
                                </div>
                                <h4 className="text-white font-bold text-base">{s.label}</h4>
                              </div>
                              <span className="text-[10px] text-purple-300/60 font-mono">0{idx + 1}</span>
                            </div>

                            <p className="text-[11px] text-purple-300/70 mb-2 italic">{s.desc}</p>
                            
                            <p className="text-purple-100 text-xs leading-relaxed opacity-90 line-clamp-4">
                              {cleaned || 'Đang cập nhật phân tích chiêm tinh học...'}
                            </p>
                          </div>

                          <div className="pt-3 mt-3 border-t border-purple-500/15 flex justify-end">
                            <button
                              onClick={() => setActiveSection(s.key)}
                              className="text-xs font-medium text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1"
                            >
                              <span>Xem chi tiết {s.label}</span>
                              <span>→</span>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Chế độ 2: Đọc Toàn Văn Báo Cáo Liền Mạch */}
                {overviewMode === 'full' && (
                  <div className="glass-card p-6 md:p-8 space-y-8">
                    {DETAIL_SECTIONS.map((s, idx) => {
                      const content = sections[s.key];
                      const cleaned = cleanSectionText(content);
                      return (
                        <div key={s.key} className={idx > 0 ? 'pt-6 border-t border-purple-500/20' : ''}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white font-bold text-lg flex items-center gap-2">
                              <UiIcon name={s.icon as any} label={s.label} className="text-purple-400" />
                              <span>{idx + 1}. {s.label}</span>
                            </h4>
                            <button
                              onClick={() => setActiveSection(s.key)}
                              className="text-xs text-purple-400 hover:text-white glass px-2.5 py-1 rounded-lg transition-all"
                            >
                              Tab riêng ↗
                            </button>
                          </div>
                          <p className="text-purple-100 text-sm leading-relaxed whitespace-pre-wrap opacity-90">
                            {cleaned || content || analysis}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              /* Chi Tiết Từng Mục */
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="glass-card p-6 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    {(() => {
                      const section = SECTIONS.find(s => s.key === activeSection);
                      return section && <><UiIcon name={section.icon as any} label={section.label} className="mr-1 inline text-purple-400" />{section.label}</>;
                    })()}
                  </h3>
                  <button
                    onClick={() => setActiveSection('overview')}
                    className="glass px-3 py-1.5 rounded-xl text-xs text-purple-300 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>← Về Tổng Quan</span>
                  </button>
                </div>

                <p className="text-purple-100 leading-relaxed whitespace-pre-wrap text-sm opacity-90">
                  {cleanSectionText(sections[activeSection]) || sections[activeSection] || analysis}
                </p>
              </motion.div>
            )}
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

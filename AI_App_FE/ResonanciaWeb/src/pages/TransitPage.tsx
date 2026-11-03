import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { apiGenerate } from '../services/api';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import { getRelevantTransits, isTransitActive } from '../utils/lunar';

const IMPACT_COLOR = { high: '#f87171', medium: '#fbbf24', low: '#4ade80' };
const IMPACT_LABEL = { high: 'Ảnh hưởng lớn', medium: 'Ảnh hưởng vừa', low: 'Nhẹ' };

const CATEGORY_MAP: Record<string, { label: string; path: string }> = {
  communication: {
    label: 'Giao tiếp',
    path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  love: {
    label: 'Tình yêu',
    path: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  },
  career: {
    label: 'Sự nghiệp',
    path: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  energy: {
    label: 'Năng lượng',
    path: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  spiritual: {
    label: 'Tâm linh',
    path: 'M12 2l2.4 7.4h7.6l-6.1 4.5 2.3 7.1-6.2-4.4-6.2 4.4 2.3-7.1-6.1-4.5h7.6z',
  },
};

export default function TransitPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [aiText, setAiText] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Overview advice state
  const [overviewAdvice, setOverviewAdvice] = useState<string>('');
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);

  const element = ELEMENT_MAP[profile.sun || ''] || 'Không xác định';
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];

  const transits = getRelevantTransits(profile.sun || 'Bạch Dương', 6);
  const activeEvents = transits.filter(t => isTransitActive(t));
  const hasActive = activeEvents.length > 0;

  // Tự động gọi AI sinh 1 câu định hướng tổng quan đa hành tinh dựa trên Natal Chart & góc chiếu Transits
  useEffect(() => {
    let isMounted = true;
    const fetchOverviewAdvice = async () => {
      setLoadingOverview(true);
      try {
        const eventsToSummarize = hasActive ? activeEvents : transits;
        const res = await apiGenerate({
          userData: {
            uid: profile.uid,
            name: profile.name,
            sun: profile.sun,
            moon: profile.moon,
            birthDate: profile.birthDate,
            ascendant: profile.ascendant,
          },
          category: 'transit_overview',
          day: new Date().toISOString().split('T')[0],
          extra: {
            active_events: eventsToSummarize.map(t => ({
              planet: t.planet,
              event: t.event,
              category: t.category,
              impact: t.impact,
              dateRange: t.dateRange,
              affected: t.affectedSigns,
            })),
            ascendant: profile.ascendant,
          },
        });
        if (isMounted) {
          if (res.data?.prediction && typeof res.data.prediction === 'string') {
            setOverviewAdvice(res.data.prediction);
          } else {
            // Smart fallback checking direct impact
            const direct = eventsToSummarize.filter(e => e.affectedSigns.includes(profile.sun || ''));
            if (direct.length > 0) {
              setOverviewAdvice(
                `Dưới góc chiếu kích hoạt từ ${direct[0].planet} (${direct[0].event}), ${profile.sun || 'bạn'} hãy kiên định với định hướng dài hạn, chủ động điều tiết năng lượng và duy trì sự bình tĩnh trước mọi biến động.`
              );
            } else {
              setOverviewAdvice(
                `Bầu trời vận hạn hiện tại không tạo góc chiếu xung khắc lớn lên ${profile.sun || 'bạn'}; hãy duy trì sự cân bằng nội tại, tập trung củng cố mục tiêu cá nhân và chủ động tích lũy năng lượng.`
              );
            }
          }
        }
      } catch {
        if (isMounted) {
          const direct = (hasActive ? activeEvents : transits).filter(e => e.affectedSigns.includes(profile.sun || ''));
          if (direct.length > 0) {
            setOverviewAdvice(
              `Dưới góc chiếu kích hoạt từ ${direct[0].planet} (${direct[0].event}), ${profile.sun || 'bạn'} hãy kiên định với định hướng dài hạn, chủ động điều tiết năng lượng và duy trì sự bình tĩnh trước mọi biến động.`
            );
          } else {
            setOverviewAdvice(
              `Bầu trời vận hạn hiện tại không tạo góc chiếu xung khắc lớn lên ${profile.sun || 'bạn'}; hãy duy trì sự cân bằng nội tại, tập trung củng cố mục tiêu cá nhân và chủ động tích lũy năng lượng.`
            );
          }
        }
      } finally {
        if (isMounted) setLoadingOverview(false);
      }
    };

    fetchOverviewAdvice();
    return () => {
      isMounted = false;
    };
  }, [profile.sun, profile.name, profile.moon, profile.ascendant]);

  // Lời khuyên động cho từng sự kiện khi click mở rộng
  const handleGetAIAdvice = async (
    eventId: string,
    description: string,
    planet: string,
    event: string,
    category: string,
    affectedSigns: string[]
  ) => {
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
          ascendant: profile.ascendant,
        },
        category: `transit_${eventId}`,
        day: new Date().toISOString().split('T')[0],
        extra: {
          transit_event: description,
          planet,
          event,
          category,
          affectedSigns,
          ascendant: profile.ascendant,
        },
      });
      setAiText(prev => ({
        ...prev,
        [eventId]: res.data?.prediction || description,
      }));
    } catch {
      const isDirect = affectedSigns.includes(profile.sun || '');
      setAiText(prev => ({
        ...prev,
        [eventId]: isDirect
          ? `Góc chiếu từ ${planet} tác động trực tiếp đến ${profile.sun} của bạn: hãy chủ động điều tiết nhịp điệu, phát huy tối đa sự tập trung và hạn chế các xung đột không cần thiết.`
          : `Hiện tượng thiên văn này tác động gián tiếp qua bối cảnh chung, không tạo hard aspect trực tiếp lên ${profile.sun}; hãy giữ tâm thế bình ổn và tiếp tục hoàn thiện các kế hoạch hiện tại.`,
      }));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7 pb-16 max-w-4xl mx-auto">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate('/home')}
        className="text-purple-300 hover:text-white text-sm inline-flex items-center gap-1.5 transition-colors"
      >
        <span>←</span>
        <span>Về Trang Chủ</span>
      </button>

      {/* Header chính */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-bold gradient-text font-display flex items-center gap-2.5">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 text-purple-300 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Transit Alerts
        </h1>
        <p className="text-purple-300 opacity-75 text-sm sm:text-base">
          Các sự kiện thiên văn ảnh hưởng đến {profile.sun || 'lá số'} của bạn
        </p>
      </motion.div>

      {/* 1. KHUNG CẢNH BÁO & LỜI KHUYÊN TỔNG QUAN (Top Alert Banner - Trải dài toàn bộ chiều rộng, luôn mở) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 sm:p-6 space-y-4 border w-full"
        style={{
          borderColor: hasActive ? 'rgba(251, 191, 36, 0.3)' : 'rgba(168, 85, 247, 0.22)',
          background: hasActive
            ? 'linear-gradient(180deg, rgba(251, 191, 36, 0.07) 0%, rgba(17, 10, 36, 0.6) 100%)'
            : 'rgba(255, 255, 255, 0.035)',
        }}
      >
        {/* Header thông báo sự kiện đang hoạt động */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0"
            style={{
              background: hasActive ? 'rgba(251, 191, 36, 0.16)' : 'rgba(168, 85, 247, 0.15)',
              borderColor: hasActive ? 'rgba(251, 191, 36, 0.45)' : 'rgba(168, 85, 247, 0.4)',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-6 h-6 ${hasActive ? 'text-amber-300' : 'text-purple-300'}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-base font-semibold ${hasActive ? 'text-amber-300' : 'text-purple-200'}`}>
              {hasActive ? 'Có sự kiện đang hoạt động!' : 'Tổng quan năng lượng vũ trụ'}
            </p>
            <p className="text-purple-300/80 text-sm mt-0.5">
              {hasActive
                ? `${activeEvents.length} hiện tượng thiên văn đang diễn ra và kích hoạt góc chiếu trong lá số của bạn.`
                : `Theo dõi dịch chuyển thiên văn tương tác với bản đồ sao của ${profile.sun}.`}
            </p>
          </div>
        </div>

        {/* Khối Lời khuyên định hướng tổng quan AI (Luôn mở, trích xuất chính xác theo chiêm tinh) */}
        <div className="p-4 rounded-xl border border-purple-500/25 bg-purple-900/25 space-y-2">
          <div className="flex items-center gap-2 text-sm text-purple-300 font-semibold">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-purple-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
            </svg>
            <span>Định hướng thời điểm ({profile.sun || 'Bạn'}):</span>
          </div>
          {loadingOverview ? (
            <div className="flex items-center gap-2 py-1">
              <div className="w-3.5 h-3.5 border border-purple-400/40 border-t-purple-300 rounded-full animate-spin" />
              <p className="text-purple-300/80 text-sm animate-pulse">
                AI đang đối chiếu góc chiếu Natal Chart & Transit...
              </p>
            </div>
          ) : (
            <blockquote className="text-purple-100 text-sm sm:text-base leading-relaxed italic pl-3 border-l-2 border-purple-400/60">
              "{overviewAdvice}"
            </blockquote>
          )}
        </div>
      </motion.div>

      {/* 2. DANH SÁCH SỰ KIỆN THIÊN VĂN PHÍA DƯỚI (Xếp chồng dọc toàn bộ chiều rộng) */}
      <div className="space-y-3.5 w-full">
        {transits.map((transit, i) => {
          const active = isTransitActive(transit);
          const affectsUser = transit.affectedSigns.includes(profile.sun || '');
          const isOpen = selected === transit.id;
          const categoryMeta = CATEGORY_MAP[transit.category] || CATEGORY_MAP['energy'];
          const [icon1, icon2] = Array.from(transit.emoji || '');

          return (
            <motion.div
              key={transit.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div
                className={`w-full glass-card p-4 sm:p-4.5 text-left transition-all hover:border-purple-400/40 cursor-pointer ${
                  isOpen ? '!border-purple-400/50 bg-purple-950/20 shadow-lg' : ''
                }`}
                style={
                  active
                    ? {
                        border: '1px solid rgba(251, 191, 36, 0.35)',
                        background: 'rgba(251, 191, 36, 0.025)',
                      }
                    : {}
                }
                onClick={() => {
                  const newId = isOpen ? null : transit.id;
                  setSelected(newId);
                  if (newId) handleGetAIAdvice(transit.id, transit.description, transit.planet, transit.event, transit.category, transit.affectedSigns);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const newId = isOpen ? null : transit.id;
                    setSelected(newId);
                    if (newId) handleGetAIAdvice(transit.id, transit.description, transit.planet, transit.event, transit.category, transit.affectedSigns);
                  }
                }}
              >
                {/* Header thẻ: Cố định khung icon để trục dọc thẳng hàng tuyệt đối */}
                <div className="flex items-start gap-3.5">
                  {/* Icon hành tinh: 2 biểu tượng trên 1 dòng, căn lề 2 cột bằng nhau */}
                  <div className="w-14 min-w-[56px] h-10 flex items-center justify-center gap-1 flex-shrink-0 whitespace-nowrap select-none">
                    <span className="w-6 h-6 flex items-center justify-center text-xl leading-none text-purple-200">
                      {icon1}
                    </span>
                    <span className="w-6 h-6 flex items-center justify-center text-xl leading-none text-purple-300">
                      {icon2}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* DÒNG 1: [Tên hành tinh & Sự kiện] + [● Đang diễn ra] đẩy lên sát cạnh tiêu đề + [Ảnh hưởng {sun}] */}
                    <div className="flex items-center justify-between gap-2.5 flex-wrap">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-white font-semibold text-sm sm:text-base leading-snug">
                          {transit.planet}{' '}
                          <span className="text-purple-300/80 font-normal text-xs sm:text-sm">
                            — {transit.event}
                          </span>
                        </h3>

                        {/* Đẩy tag [● Đang diễn ra] lên cùng Dòng 1 ngay cạnh tiêu đề (như thẻ Sao Thủy) */}
                        {active && (
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-md font-semibold border border-amber-400/50 text-amber-300 flex items-center gap-1.5 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.25)] flex-shrink-0"
                            style={{ background: 'rgba(251, 191, 36, 0.18)' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Đang diễn ra
                          </span>
                        )}
                      </div>

                      {/* Tag Ảnh hưởng {sun} đặt ở cuối Dòng 1 */}
                      {affectsUser && (
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-md font-medium border flex-shrink-0"
                          style={{
                            background: `${colors[0]}20`,
                            color: colors[0],
                            borderColor: `${colors[0]}40`,
                          }}
                        >
                          Ảnh hưởng {profile.sun}
                        </span>
                      )}
                    </div>

                    {/* DÒNG 2: [Icon Lịch + Ngày tháng] -> [Ảnh hưởng lớn/vừa] -> [Lĩnh vực: Giao tiếp/...] */}
                    <div className="flex items-center gap-2.5 flex-wrap text-xs text-purple-300/70 mt-2">
                      {/* 1. Icon Lịch + Ngày tháng */}
                      <span className="flex items-center gap-1.5 font-mono text-purple-300/85">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-3.5 h-3.5 text-purple-400/80 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden="true"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        {transit.dateRange}
                      </span>

                      {/* 2. Chip Mức độ ảnh hưởng */}
                      <span
                        className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: `${IMPACT_COLOR[transit.impact]}18`,
                          color: IMPACT_COLOR[transit.impact],
                          border: `1px solid ${IMPACT_COLOR[transit.impact]}30`,
                        }}
                      >
                        {IMPACT_LABEL[transit.impact]}
                      </span>

                      {/* 3. Chip Lĩnh vực (được kéo lên sát cạnh mức độ ảnh hưởng) */}
                      <span className="text-[11px] text-purple-300/90 px-2.5 py-0.5 rounded-full border border-purple-500/20 bg-purple-900/15 flex items-center gap-1">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-3 h-3 text-purple-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden="true"
                        >
                          <path d={categoryMeta.path} />
                        </svg>
                        {categoryMeta.label}
                      </span>
                    </div>
                  </div>

                  {/* Nút chỉ thị Accordion */}
                  <span className="text-purple-400 text-xs mt-1.5 flex-shrink-0 transition-transform">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>

                {/* Phần mở rộng khi click */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-purple-500/20 space-y-3.5"
                    >
                      {/* Chi tiết phân tích sự kiện */}
                      <p className="text-purple-200 text-xs sm:text-sm leading-relaxed opacity-95">
                        {transit.description}
                      </p>

                      {/* Danh sách các cung chịu ảnh hưởng */}
                      <div>
                        <p className="text-purple-300 text-xs mb-2 font-medium flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          Cung chịu ảnh hưởng:
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                          {transit.affectedSigns.map(sign => {
                            const isUserSign = sign === profile.sun;
                            return (
                              <span
                                key={sign}
                                className="text-xs px-2.5 py-0.5 rounded-full transition-all"
                                style={{
                                  background: isUserSign ? `${colors[0]}25` : 'rgba(139, 92, 246, 0.1)',
                                  color: isUserSign ? colors[0] : '#c4b5fd',
                                  border: isUserSign ? `1px solid ${colors[0]}50` : '1px solid rgba(139, 92, 246, 0.15)',
                                  fontWeight: isUserSign ? 600 : 400,
                                }}
                              >
                                {sign} {isUserSign ? '★' : ''}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Lời khuyên định hướng hành động cá nhân hóa do AI sinh */}
                      <div className="p-3.5 rounded-xl border border-purple-500/25 bg-purple-950/40 space-y-1.5">
                        <p className="text-purple-300 text-xs font-semibold flex items-center gap-1.5">
                          <svg
                            viewBox="0 0 24 24"
                            className="w-3.5 h-3.5 text-purple-300 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          Lời khuyên hành động cho {profile.sun || 'bạn'}:
                        </p>
                        {loadingId === transit.id ? (
                          <div className="flex items-center gap-2 py-1">
                            <div className="w-3 h-3 border border-purple-400/40 border-t-purple-300 rounded-full animate-spin" />
                            <p className="text-purple-400 text-xs animate-pulse">
                              AI đang đối chiếu góc chiếu Natal Chart và sinh lời khuyên...
                            </p>
                          </div>
                        ) : aiText[transit.id] ? (
                          <p className="text-purple-100 text-xs sm:text-sm leading-relaxed opacity-95 italic">
                            "{aiText[transit.id]}"
                          </p>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {transits.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">🌟</div>
          <p className="text-white font-semibold">Bầu trời đang yên bình</p>
          <p className="text-purple-300 text-sm opacity-60 mt-1">
            Không có sự kiện thiên văn lớn ảnh hưởng đến bạn lúc này.
          </p>
        </div>
      )}
    </div>
  );
}

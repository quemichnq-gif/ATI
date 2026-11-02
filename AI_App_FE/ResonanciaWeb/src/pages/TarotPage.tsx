import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { apiGenerate } from '../services/api';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import {
  TarotCard,
  TAROT_CARDS,
  MAJOR_ARCANA_CARDS,
  MINOR_ARCANA_CARDS,
  getDailyCard,
  drawRandomCards,
} from '../data/tarotCards';
import TarotCardView from '../components/TarotCardView';

interface DrawnCardState {
  card: TarotCard;
  isReversed: boolean;
  isRevealed: boolean;
  positionLabel?: string;
}

export default function TarotPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();

  // Mode: 'daily' | 'draw1' | 'draw3' | 'deck'
  const [spreadMode, setSpreadMode] = useState<'daily' | 'draw1' | 'draw3' | 'deck'>('daily');

  // Daily Card state
  const initialDaily = getDailyCard(profile.uid || 'guest');
  const [dailyCardState, setDailyCardState] = useState<DrawnCardState>({
    card: initialDaily.card,
    isReversed: initialDaily.isReversed,
    isRevealed: false,
    positionLabel: 'Lá Bài Ngày',
  });
  const [dailyFlipping, setDailyFlipping] = useState(false);

  // Multi-card draw state
  const [drawnCards, setDrawnCards] = useState<DrawnCardState[]>([]);
  const [flippingIndex, setFlippingIndex] = useState<number | null>(null);

  // Deck browser filter & modal
  const [deckFilter, setDeckFilter] = useState<'all' | 'major' | 'minor'>('all');
  const [selectedDeckCard, setSelectedDeckCard] = useState<TarotCard | null>(null);

  // AI interpretation
  const [interpretation, setInterpretation] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const element = ELEMENT_MAP[profile.sun || ''] || 'Không xác định';
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];

  // Bắt đầu rút bài cho chế độ 1 lá hoặc 3 lá
  const handleStartDraw = (count: 1 | 3) => {
    const rawCards = drawRandomCards(count);
    const labels = count === 1 ? ['Thông Điệp Vũ Trụ'] : ['Quá Khứ', 'Hiện Tại', 'Tương Lai'];
    const newCards: DrawnCardState[] = rawCards.map((rc, idx) => ({
      card: rc.card,
      isReversed: rc.isReversed,
      isRevealed: false,
      positionLabel: labels[idx],
    }));
    setDrawnCards(newCards);
    setInterpretation('');
  };

  // Lật lá bài Daily
  const handleRevealDaily = async () => {
    if (dailyCardState.isRevealed || dailyFlipping) return;
    setDailyFlipping(true);
    await new Promise(r => setTimeout(r, 300));
    setDailyFlipping(false);
    setDailyCardState(prev => ({ ...prev, isRevealed: true }));

    // AI Interpretation cho Daily
    fetchAIInterpretation([dailyCardState]);
  };

  // Lật một lá trong trải bài (1 lá hoặc 3 lá)
  const handleRevealCard = async (index: number) => {
    if (drawnCards[index].isRevealed || flippingIndex !== null) return;
    setFlippingIndex(index);
    await new Promise(r => setTimeout(r, 280));
    setFlippingIndex(null);

    const updated = [...drawnCards];
    updated[index] = { ...updated[index], isRevealed: true };
    setDrawnCards(updated);

    // Nếu tất cả lá bài đã lật thì gọi AI giải nghĩa
    const allRevealed = updated.every(c => c.isRevealed);
    if (allRevealed) {
      fetchAIInterpretation(updated);
    }
  };

  // Lật toàn bộ lá bài một lượt
  const handleRevealAll = async () => {
    const updated = drawnCards.map(c => ({ ...c, isRevealed: true }));
    setDrawnCards(updated);
    fetchAIInterpretation(updated);
  };

  // Rút lại lá mới
  const handleReshuffle = () => {
    if (spreadMode === 'daily') {
      const randomNew = drawRandomCards(1)[0];
      setDailyCardState({
        card: randomNew.card,
        isReversed: randomNew.isReversed,
        isRevealed: false,
        positionLabel: 'Lá Bài Ngày',
      });
      setInterpretation('');
    } else if (spreadMode === 'draw1') {
      handleStartDraw(1);
    } else if (spreadMode === 'draw3') {
      handleStartDraw(3);
    }
  };

  // Gọi backend AI hoặc fallback giải nghĩa chiêm tinh
  const fetchAIInterpretation = async (cards: DrawnCardState[]) => {
    setLoadingAI(true);
    const primary = cards[0];
    const categoryName = primary.card.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    try {
      const res = await apiGenerate({
        userData: {
          uid: profile.uid,
          name: profile.name,
          sun: profile.sun,
          moon: profile.moon,
          birthDate: profile.birthDate,
        },
        category: `tarot_${categoryName}`,
        day: new Date().toISOString().split('T')[0],
      });
      if (res.data?.prediction) {
        setInterpretation(res.data.prediction);
      } else {
        setInterpretation(getDefaultInterpretation(cards));
      }
    } catch {
      setInterpretation(getDefaultInterpretation(cards));
    } finally {
      setLoadingAI(false);
    }
  };

  const getDefaultInterpretation = (cards: DrawnCardState[]): string => {
    if (cards.length === 1) {
      const c = cards[0];
      const direct = c.isReversed ? 'ngược' : 'xuôi';
      const meaning = c.isReversed ? c.card.meaningReversed : c.card.meaningUpright;
      return `Lá bài ${c.card.vi} (${c.card.name}) xuất hiện ở vị trí ${direct} mang đến thông điệp vũ trụ dành riêng cho ${profile.sun || 'bạn'}: ${meaning}. Hãy giữ tâm thế tĩnh lặng và kết nối với trực giác của chính mình hôm nay.`;
    }

    return cards
      .map(
        c =>
          `【${c.positionLabel} - ${c.card.vi} (${c.isReversed ? 'Ngược' : 'Xuôi'})】: ${
            c.isReversed ? c.card.meaningReversed : c.card.meaningUpright
          }`
      )
      .join('\n\n');
  };

  // Lọc danh sách xem toàn bộ 78 lá bài
  const displayedDeckCards =
    deckFilter === 'major'
      ? MAJOR_ARCANA_CARDS
      : deckFilter === 'minor'
      ? MINOR_ARCANA_CARDS
      : TAROT_CARDS;

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 pb-16">
      {/* Header & Quay về */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/home')}
          className="text-purple-300 hover:text-white text-sm transition-colors flex items-center gap-1.5"
        >
          <span>←</span> Về Trang Chủ
        </button>
        <span className="text-xs text-purple-400/80 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/20">
          Rider-Waite-Smith 78 Lá Gốc
        </span>
      </div>

      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display">
          Trải Bài Tarot Rider-Waite
        </h1>
        <p className="text-purple-300 opacity-70 mt-1 text-sm">
          {new Date().toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </motion.div>

      {/* Chuyển đổi các chế độ Trải bài */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-purple-950/40 rounded-xl border border-purple-500/20 backdrop-blur-md">
        <button
          onClick={() => {
            setSpreadMode('daily');
            setInterpretation('');
          }}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            spreadMode === 'daily'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-purple-300/80 hover:text-white hover:bg-purple-900/40'
          }`}
        >
          Tarot Hôm Nay (1 Lá)
        </button>
        <button
          onClick={() => {
            setSpreadMode('draw1');
            handleStartDraw(1);
          }}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            spreadMode === 'draw1'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-purple-300/80 hover:text-white hover:bg-purple-900/40'
          }`}
        >
          Rút 1 Lá Tự Do
        </button>
        <button
          onClick={() => {
            setSpreadMode('draw3');
            handleStartDraw(3);
          }}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            spreadMode === 'draw3'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-purple-300/80 hover:text-white hover:bg-purple-900/40'
          }`}
        >
          Trải 3 Lá (Q.Khứ - H.Tại - T.Lai)
        </button>
        <button
          onClick={() => setSpreadMode('deck')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            spreadMode === 'deck'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-purple-300/80 hover:text-white hover:bg-purple-900/40'
          }`}
        >
          Bộ Sưu Tập 78 Lá
        </button>
      </div>

      {/* CHẾ ĐỘ 1: TAROT HÔM NAY (DAILY CARD) */}
      {spreadMode === 'daily' && (
        <div className="flex flex-col items-center gap-6 mt-4">
          <TarotCardView
            card={dailyCardState.card}
            isRevealed={dailyCardState.isRevealed}
            isReversed={dailyCardState.isReversed}
            isFlipping={dailyFlipping}
            onClick={handleRevealDaily}
            size="lg"
          />

          {/* Nút bấm thao tác */}
          <div className="flex items-center gap-3">
            {!dailyCardState.isRevealed ? (
              <button
                onClick={handleRevealDaily}
                className="px-6 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
              >
                Lật Lá Bài Hôm Nay
              </button>
            ) : (
              <button
                onClick={handleReshuffle}
                className="px-5 py-2 rounded-full text-xs font-medium text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 transition-all hover:text-white"
              >
                ↻ Rút Lá Khác
              </button>
            )}
          </div>

          {/* Thông điệp & Giải nghĩa */}
          <AnimatePresence>
            {dailyCardState.isRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl space-y-4"
              >
                {/* Ý nghĩa lá bài gốc Rider-Waite */}
                <div className="glass-card p-5">
                  <h2 className="text-white font-bold mb-2 flex items-center gap-2">
                    <span className="text-purple-400">✨</span> Thông Điệp Lá Bài (
                    {dailyCardState.isReversed ? 'Bài Ngược' : 'Bài Xuôi'})
                  </h2>
                  <p className="text-purple-200 text-sm leading-relaxed opacity-95">
                    {dailyCardState.isReversed
                      ? dailyCardState.card.meaningReversed
                      : dailyCardState.card.meaningUpright}
                  </p>
                  <div className="mt-3 pt-3 border-t border-purple-500/20 flex flex-wrap gap-1.5">
                    {(dailyCardState.isReversed
                      ? dailyCardState.card.keywordsReversed
                      : dailyCardState.card.keywordsUpright
                    ).map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full text-[11px] bg-purple-900/40 text-purple-300 border border-purple-500/30"
                      >
                        #{kw}
                      </span>
                    ))}
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-pink-950/50 text-pink-300 border border-pink-500/30 ml-auto">
                      Nguyên tố: {dailyCardState.card.element}
                    </span>
                  </div>
                </div>

                {/* AI Interpretation theo chiêm tinh */}
                <div className="glass-card p-5">
                  <h2 className="text-white font-bold mb-2 flex items-center gap-2">
                    <span className="text-pink-400">🔮</span> Giải Nghĩa Cho Cung {profile.sun || 'Bạn'}
                  </h2>
                  {loadingAI ? (
                    <div className="flex items-center gap-3 py-3">
                      <div className="cosmic-spinner" style={{ width: 22, height: 22 }} />
                      <p className="text-purple-300 text-sm animate-pulse">
                        Đang kết nối năng lượng các vì sao...
                      </p>
                    </div>
                  ) : (
                    <p
                      className="text-purple-100 text-sm leading-relaxed opacity-95 italic border-l-2 pl-3 whitespace-pre-line"
                      style={{ borderColor: colors[0] }}
                    >
                      {interpretation || getDefaultInterpretation([dailyCardState])}
                    </p>
                  )}
                </div>

                <p className="text-center text-purple-400/60 text-xs">
                  ✦ Hình ảnh scan gốc bộ bài Rider-Waite-Smith 1909 ✦
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* CHẾ ĐỘ 2 & 3: RÚT 1 LÁ HOẶC 3 LÁ TỰ DO */}
      {(spreadMode === 'draw1' || spreadMode === 'draw3') && (
        <div className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-purple-300">
              {spreadMode === 'draw1'
                ? 'Rút ngẫu nhiên 1 lá bài từ 78 lá Rider-Waite-Smith.'
                : 'Trải bài 3 lá: Quá Khứ — Hiện Tại — Tương Lai.'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRevealAll}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-purple-200 bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/30 transition-colors"
              >
                Lật Tất Cả
              </button>
              <button
                onClick={handleReshuffle}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-pink-300 bg-pink-950/50 hover:bg-pink-900/60 border border-pink-500/30 transition-colors"
              >
                ↻ Rút Bộ Mới
              </button>
            </div>
          </div>

          {/* Danh sách lá bài được rút */}
          <div
            className={`grid gap-6 justify-center ${
              spreadMode === 'draw1' ? 'grid-cols-1 justify-items-center' : 'grid-cols-1 sm:grid-cols-3'
            }`}
          >
            {drawnCards.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-xs uppercase tracking-wider text-purple-300/80 mb-2 font-medium">
                  {item.positionLabel}
                </span>
                <TarotCardView
                  card={item.card}
                  isRevealed={item.isRevealed}
                  isReversed={item.isReversed}
                  isFlipping={flippingIndex === idx}
                  onClick={() => handleRevealCard(idx)}
                  size={spreadMode === 'draw1' ? 'lg' : 'md'}
                />
              </div>
            ))}
          </div>

          {/* Giải nghĩa các lá bài đã lật */}
          {drawnCards.some(c => c.isRevealed) && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="glass-card p-5 space-y-4">
                <h3 className="text-white font-bold flex items-center gap-2 text-base">
                  <span>✨</span> Chi Tiết Các Lá Bài Đã Lật
                </h3>

                <div className="grid grid-cols-1 gap-3 divide-y divide-purple-500/20">
                  {drawnCards.map((c, i) => (
                    <div key={i} className={`pt-3 ${i === 0 ? 'pt-0' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-purple-300">
                          {c.positionLabel}: {c.isRevealed ? c.card.vi : 'Chưa lật'}
                        </span>
                        {c.isRevealed && (
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full ${
                              c.isReversed
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                                : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {c.isReversed ? 'Bài Ngược' : 'Bài Xuôi'} · {c.card.element}
                          </span>
                        )}
                      </div>
                      {c.isRevealed ? (
                        <p className="text-purple-200/90 text-xs sm:text-sm leading-relaxed">
                          {c.isReversed ? c.card.meaningReversed : c.card.meaningUpright}
                        </p>
                      ) : (
                        <p className="text-purple-400/50 text-xs italic">
                          Bấm vào lá bài để xem thông điệp
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Thông điệp AI tổng hợp */}
              <div className="glass-card p-5">
                <h3 className="text-white font-bold flex items-center gap-2 text-base mb-2">
                  <span>🔮</span> Thông Điệp Tổng Hợp Của Trải Bài
                </h3>
                {loadingAI ? (
                  <div className="flex items-center gap-3 py-2">
                    <div className="cosmic-spinner" style={{ width: 20, height: 20 }} />
                    <span className="text-purple-300 text-xs animate-pulse">
                      Đang liên kết các biểu tượng Tarot...
                    </span>
                  </div>
                ) : (
                  <p className="text-purple-100 text-xs sm:text-sm leading-relaxed whitespace-pre-line italic">
                    {interpretation || getDefaultInterpretation(drawnCards.filter(c => c.isRevealed))}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* CHẾ ĐỘ 4: BỘ SƯU TẬP 78 LÁ BÀI RIDER-WAITE-SMITH (NGHIỆM THU) */}
      {spreadMode === 'deck' && (
        <div className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-white font-bold text-lg">
                Thư Viện 78 Lá Bài Rider-Waite-Smith Gốc
              </h2>
              <p className="text-purple-300/70 text-xs">
                Toàn bộ ảnh scan minh họa thực tế 1909 từ kho lưu trữ sixseeds/tarot-api
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-1.5 p-1 bg-purple-950/60 rounded-lg border border-purple-500/20 text-xs">
              <button
                onClick={() => setDeckFilter('all')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  deckFilter === 'all' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white'
                }`}
              >
                Tất cả (78)
              </button>
              <button
                onClick={() => setDeckFilter('major')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  deckFilter === 'major' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white'
                }`}
              >
                Major Arcana (22)
              </button>
              <button
                onClick={() => setDeckFilter('minor')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  deckFilter === 'minor' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white'
                }`}
              >
                Minor Arcana (56)
              </button>
            </div>
          </div>

          {/* Grid hiển thị các lá bài */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {displayedDeckCards.map(card => (
              <motion.div
                key={card.id}
                whileHover={{ scale: 1.04, y: -4 }}
                onClick={() => setSelectedDeckCard(card)}
                className="cursor-pointer bg-purple-950/30 rounded-xl p-2 border border-purple-500/20 hover:border-purple-400/50 transition-all flex flex-col items-center"
              >
                <div className="w-full aspect-[480/805] rounded-lg overflow-hidden bg-black/40 relative shadow-md">
                  <img
                    src={card.localImage}
                    alt={card.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={e => {
                      (e.target as HTMLImageElement).src = card.fallbackUrl;
                    }}
                  />
                </div>
                <p className="text-white text-xs font-semibold mt-2 text-center truncate w-full">
                  {card.vi}
                </p>
                <p className="text-purple-300/70 text-[10px] text-center truncate w-full">
                  {card.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Modal chi tiết lá bài khi bấm vào thư viện 78 lá */}
      {selectedDeckCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setSelectedDeckCard(null)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className="bg-[#130728] border border-purple-500/40 rounded-2xl p-6 sm:p-7 max-w-2xl sm:max-w-3xl w-full shadow-2xl relative flex flex-col sm:flex-row gap-6 sm:gap-8 max-h-[90vh] overflow-y-auto"
            style={{
              boxShadow: '0 20px 50px -10px rgba(112, 26, 179, 0.5), 0 0 20px rgba(168, 85, 247, 0.25)',
            }}
          >
            {/* Nút đóng modal */}
            <button
              onClick={() => setSelectedDeckCard(null)}
              className="absolute top-4 right-4 text-purple-300 hover:text-white text-base w-8 h-8 rounded-full bg-purple-900/60 hover:bg-purple-800/80 flex items-center justify-center border border-purple-400/30 transition-all z-20"
              title="Đóng"
            >
              ✕
            </button>

            {/* Cột trái: Ảnh lá bài Rider-Waite scan gốc */}
            <div className="w-48 sm:w-56 mx-auto sm:mx-0 flex-shrink-0 flex flex-col items-center">
              <div
                className="w-full aspect-[480/805] rounded-xl overflow-hidden bg-black/50 relative border-2 border-purple-400/40 shadow-2xl"
                style={{
                  boxShadow: '0 10px 30px -5px rgba(147, 51, 234, 0.5), 0 0 15px rgba(236, 72, 153, 0.2)',
                }}
              >
                <img
                  src={selectedDeckCard.localImage}
                  alt={`${selectedDeckCard.vi} - ${selectedDeckCard.name}`}
                  className="w-full h-full object-cover select-none"
                  onError={e => {
                    const img = e.target as HTMLImageElement;
                    if (img.src !== selectedDeckCard.fallbackUrl) {
                      img.src = selectedDeckCard.fallbackUrl;
                    }
                  }}
                />
              </div>
              <p className="text-[11px] text-purple-400/70 text-center mt-2 font-mono">
                {selectedDeckCard.filename} · Tỷ lệ 1:1.68
              </p>
            </div>

            {/* Cột phải: Thông tin & Ý nghĩa chi tiết */}
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-pink-300 bg-pink-950/70 px-2.5 py-0.5 rounded-full border border-pink-500/30">
                    {selectedDeckCard.arcana === 'major'
                      ? 'Major Arcana (22 Lá)'
                      : `Minor Arcana · Bộ ${selectedDeckCard.suit}`}
                  </span>
                  <span className="text-[10px] uppercase font-medium tracking-wider text-purple-300 bg-purple-950/70 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                    Nguyên tố: {selectedDeckCard.element}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mt-2 font-display">
                  {selectedDeckCard.vi}
                </h3>
                <p className="text-purple-300/80 text-sm font-medium tracking-wide">
                  {selectedDeckCard.name}
                </p>
              </div>

              {/* Ý nghĩa xuôi */}
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/20">
                <h4 className="text-xs font-semibold text-purple-200 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <span className="text-purple-400">✨</span> Ý Nghĩa Xuôi (Upright)
                </h4>
                <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
                  {selectedDeckCard.meaningUpright}
                </p>
              </div>

              {/* Ý nghĩa ngược */}
              <div className="p-3.5 rounded-xl bg-pink-950/30 border border-pink-500/20">
                <h4 className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <span className="text-rose-400">↷</span> Ý Nghĩa Ngược (Reversed)
                </h4>
                <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
                  {selectedDeckCard.meaningReversed}
                </p>
              </div>

              {/* Từ khóa */}
              <div>
                <span className="text-[11px] text-purple-400/80 uppercase tracking-wider block mb-1.5">
                  Từ khóa biểu tượng:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDeckCard.keywordsUpright.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-full text-[11px] bg-purple-900/40 text-purple-300 border border-purple-500/30"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-purple-500/20 text-[11px] text-purple-400/60 flex items-center justify-between">
                <span>Rider-Waite-Smith 1909 Original Scan</span>
                <span className="font-mono">ID: {selectedDeckCard.id}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

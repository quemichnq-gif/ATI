import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TarotCard, TAROT_BACK_IMAGE, TAROT_BACK_FALLBACK } from '../data/tarotCards';

interface TarotCardViewProps {
  card?: TarotCard;
  isRevealed?: boolean;
  isReversed?: boolean;
  onClick?: () => void;
  isFlipping?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

export const TarotCardView: React.FC<TarotCardViewProps> = ({
  card,
  isRevealed = true,
  isReversed = false,
  onClick,
  isFlipping = false,
  size = 'md',
  showBadge = true,
  className = '',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [backLoaded, setBackLoaded] = useState(false);
  const [imageSrcIndex, setImageSrcIndex] = useState(0);
  const [backSrcIndex, setBackSrcIndex] = useState(0);

  // Kích thước chuẩn tỷ lệ Tarot Rider-Waite (1 : 1.68)
  const sizeMap = {
    sm: { width: 'w-28', height: 'h-48', label: 'text-[11px]' },
    md: { width: 'w-48 sm:w-52', height: 'h-[320px] sm:h-[350px]', label: 'text-xs' },
    lg: { width: 'w-60 sm:w-64', height: 'h-[400px] sm:h-[430px]', label: 'text-sm' },
  }[size];

  // Danh sách các URL fallback theo thứ tự ưu tiên
  const getImageSources = (c: TarotCard) => [
    c.localImage,
    c.fallbackUrl,
    c.cdnUrl,
    c.originalUrl,
  ];

  const getBackSources = () => [
    TAROT_BACK_IMAGE,
    TAROT_BACK_FALLBACK,
  ];

  const handleFrontError = () => {
    if (!card) return;
    const sources = getImageSources(card);
    if (imageSrcIndex < sources.length - 1) {
      setImageSrcIndex(prev => prev + 1);
    }
  };

  const handleBackError = () => {
    const sources = getBackSources();
    if (backSrcIndex < sources.length - 1) {
      setBackSrcIndex(prev => prev + 1);
    }
  };

  const currentFrontSrc = card ? getImageSources(card)[imageSrcIndex] : '';
  const currentBackSrc = getBackSources()[backSrcIndex];

  return (
    <div className={`relative select-none ${className}`}>
      <motion.div
        className={`relative ${sizeMap.width} ${sizeMap.height} rounded-2xl overflow-hidden cursor-pointer transition-shadow duration-300`}
        onClick={onClick}
        whileHover={!isRevealed ? { scale: 1.03, y: -4 } : { scale: 1.01 }}
        animate={isFlipping ? { rotateY: 90 } : { rotateY: 0 }}
        transition={{ duration: 0.28, ease: 'easeInOut' }}
        style={{
          perspective: 1000,
          boxShadow: isRevealed
            ? '0 12px 35px -5px rgba(157, 78, 221, 0.45), 0 0 15px rgba(236, 72, 153, 0.25)'
            : '0 8px 25px -5px rgba(139, 92, 246, 0.35)',
        }}
      >
        {/* Viền phát sáng huyền ảo */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none z-20 border"
          style={{
            borderColor: isRevealed
              ? isReversed
                ? 'rgba(239, 68, 68, 0.5)'
                : 'rgba(168, 85, 247, 0.6)'
              : 'rgba(139, 92, 246, 0.4)',
          }}
        />

        {/* MẶT SAU: LƯNG BÀI RIDER-WAITE */}
        {!isRevealed ? (
          <div className="relative w-full h-full bg-[#130722] flex items-center justify-center overflow-hidden">
            {!backLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-indigo-950/60 to-purple-950/80 animate-pulse flex items-center justify-center">
                <span className="text-purple-400 text-2xl animate-spin">✦</span>
              </div>
            )}
            <img
              src={currentBackSrc}
              alt="Mặt sau lá bài Tarot"
              className={`w-full h-full object-cover transition-opacity duration-300 ${backLoaded ? 'opacity-90' : 'opacity-0'}`}
              onLoad={() => setBackLoaded(true)}
              onError={handleBackError}
              loading="lazy"
            />
            {/* Lớp phủ hoa văn và hiệu ứng tương tác */}
            <div className="absolute inset-0 bg-gradient-to-t from-purple-950/80 via-transparent to-purple-950/40 pointer-events-none" />
            <div className="absolute inset-2 border border-purple-400/25 rounded-xl pointer-events-none" />
            <div className="absolute bottom-4 left-0 right-0 text-center z-10">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-medium tracking-wider uppercase text-purple-200 bg-purple-950/85 backdrop-blur-md border border-purple-400/30 shadow-lg">
                Bấm để lật bài
              </span>
            </div>
          </div>
        ) : (
          /* MẶT TRƯỚC: HÌNH ẢNH GỐC RIDER-WAITE-SMITH */
          <div className="relative w-full h-full bg-[#0d041a] flex items-center justify-center overflow-hidden">
            {/* Skeleton Loading trong khi ảnh tải */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-950/80 via-indigo-950/70 to-slate-900/90 animate-pulse flex flex-col items-center justify-center gap-2 z-10">
                <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                <span className="text-xs text-purple-300 font-medium">Đang tải lá bài gốc...</span>
              </div>
            )}

            {card && (
              <img
                src={currentFrontSrc}
                alt={`${card.vi} - ${card.name} (Rider-Waite-Smith)`}
                className={`w-full h-full object-cover select-none transition-transform duration-500 ${
                  isReversed ? 'rotate-180' : ''
                } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={handleFrontError}
              />
            )}

            {/* Lớp bóng nhẹ ở cạnh để hòa trộn với phong cách Cosmic */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-inner border border-white/10" />

            {/* Badge ngược bài nếu xoay 180 độ */}
            {isReversed && showBadge && (
              <div className="absolute top-2 right-2 z-30 pointer-events-none">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-950/90 text-rose-300 border border-rose-500/50 backdrop-blur-md shadow-md">
                  Bài Ngược ↷
                </span>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Tên lá bài phía dưới (khi đã lật) */}
      {isRevealed && card && showBadge && (
        <div className="mt-2.5 text-center">
          <p className="text-white font-semibold text-sm leading-snug drop-shadow">
            {card.vi}
            {isReversed && <span className="text-rose-400 text-xs ml-1">(Ngược)</span>}
          </p>
          <p className="text-purple-300/80 text-[11px] font-medium tracking-wide">
            {card.name}
          </p>
          <p className="text-purple-400/60 text-[10px] uppercase tracking-wider mt-0.5">
            {card.arcana === 'major' ? 'Major Arcana' : `Minor Arcana · ${card.suit}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default TarotCardView;


import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { ZODIAC_SIGNS } from '../constants/astrologyMap';
import UiIcon from './UiIcon';

type ZodiacGlyph = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

// Các đường nét cung hoàng đạo được tự vẽ trong dự án, không dùng SVG bên thứ ba.
// Draw-on animation: motion.dev/docs/react/animate#path-animations
const glyphPaths: Record<ZodiacGlyph, { d: string }[]> = {
  aries: [
    { d: "M12 20V11" },
    { d: "M12 12C12 7 9 4 5 4" },
    { d: "M12 12c0-5 3-8 7-8" },
  ],
  taurus: [
    { d: "M6 8a6 6 0 0 0 12 0" },   // arc top
    { d: "M6 14a6 6 0 0 0 12 0" },  // circle approx via arc
    { d: "M6 10C6 6 8 4 12 4s6 2 6 6" },
  ],
  gemini: [
    { d: "M6 5c4 2 8 2 12 0" },
    { d: "M6 19c4-2 8-2 12 0" },
    { d: "M8 6v12" },
    { d: "M16 6v12" },
  ],
  cancer: [
    { d: "M8 7c-3 0-4 4-1 5 2 1 5-1 7-3s5-3 6-1c1 2-1 4-4 4" },
    { d: "M16 17c3 0 4-4 1-5-2-1-5 1-7 3s-5 3-6 1c-1-2 1-4 4-4" },
  ],
  leo: [
    { d: "M5 9a4 4 0 1 0 8 0 4 4 0 0 0-8 0" },
    { d: "M12 12c3 2 4 4 3 6-1 2-4 1-3-1 1-2 4-2 7 0" },
  ],
  virgo: [
    { d: "M5 5v13c0 3 5 3 6-1V5m0 0v11c0 4 6 4 7 0V8c0-2-2-3-4-3m4 9 3 3-3 3" },
  ],
  libra: [
    { d: "M5 17h14" },
    { d: "M7 14a5 5 0 0 1 10 0" },
    { d: "M12 5v3" },
    { d: "M9 6.5h6" },
  ],
  scorpio: [
    { d: "M4 5v10c0 3 5 3 6-1V5" },
    { d: "M10 5v10c0 3 5 3 6-1V5" },
    { d: "M16 14l4 4m0-5v5h-5" },
  ],
  sagittarius: [
    { d: "M5 19 19 5" },
    { d: "M9 5h10v10" },
    { d: "m7 11 6 6" },
  ],
  capricorn: [
    { d: "M4 5v10c0 3 5 3 6-1V5" },
    { d: "M10 5v10c0 3 5 3 6-1V7c0-2 4-2 4 1v8c0 3-4 4-6 2" },
    { d: "m16 13 3 3m0-4v4h-4" },
  ],
  aquarius: [
    { d: "m3 9 3-2 3 2 3-2 3 2 3-2 3 2" },
    { d: "M3 16l3-2 3 2 3-2 3 2 3-2 3 2" },
  ],
  pisces: [
    { d: "M7 4c6 4 6 12 0 16" },
    { d: "M17 4c-6 4-6 12 0 16" },
    { d: "M5 12h14" },
  ],
};

// Stagger offset per path so strokes draw one after another
const PATH_DURATION = 0.7;
const PATH_STAGGER = 0.12;

export default function ZodiacIcon({
  sign, label, className = '', style, animate: doAnimate = true,
}: {
  sign?: string | null;
  label?: string;
  className?: string;
  style?: CSSProperties;
  animate?: boolean;
}) {
  const glyph = sign ? ZODIAC_SIGNS[sign] as ZodiacGlyph | undefined : undefined;
  if (!glyph) return <UiIcon name="star" label={label || 'Chưa có cung hoàng đạo'} className={className} style={style} />;

  const paths = glyphPaths[glyph];

  return (
    // motion.svg: fade in container as paths draw
    <motion.svg
      aria-label={label || sign || 'Cung hoàng đạo'}
      role="img"
      className={className}
      style={style}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={doAnimate ? { opacity: 0 } : false}
      animate={doAnimate ? { opacity: 1 } : undefined}
      transition={{ duration: 0.2 }}
    >
      {paths.map((p, i) => (
        <motion.path
          key={i}
          d={p.d}
          initial={doAnimate ? { pathLength: 0, opacity: 0 } : false}
          animate={doAnimate ? { pathLength: 1, opacity: 1 } : undefined}
          transition={doAnimate ? {
            pathLength: { delay: i * PATH_STAGGER, duration: PATH_DURATION, ease: 'easeInOut' },
            opacity:    { delay: i * PATH_STAGGER, duration: 0.15 },
          } : undefined}
        />
      ))}
    </motion.svg>
  );
}

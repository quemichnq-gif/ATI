import type { ReactNode } from 'react';
import { ZODIAC_SIGNS } from '../constants/astrologyMap';
import UiIcon from './UiIcon';

type ZodiacGlyph = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

// Các đường nét cung hoàng đạo được tự vẽ trong dự án, không dùng SVG bên thứ ba.
const glyphs: Record<ZodiacGlyph, ReactNode> = {
  aries: <path d="M12 20V11M12 12C12 7 9 4 5 4M12 12c0-5 3-8 7-8" />,
  taurus: <><circle cx="12" cy="14" r="6"/><path d="M6 10C6 6 8 4 12 4s6 2 6 6"/></>,
  gemini: <><path d="M6 5c4 2 8 2 12 0M6 19c4-2 8-2 12 0M8 6v12M16 6v12"/></>,
  cancer: <><path d="M8 7c-3 0-4 4-1 5 2 1 5-1 7-3s5-3 6-1c1 2-1 4-4 4M16 17c3 0 4-4 1-5-2-1-5 1-7 3s-5 3-6 1c-1-2 1-4 4-4"/></>,
  leo: <><circle cx="9" cy="9" r="4"/><path d="M12 12c3 2 4 4 3 6-1 2-4 1-3-1 1-2 4-2 7 0"/></>,
  virgo: <path d="M5 5v13c0 3 5 3 6-1V5m0 0v11c0 4 6 4 7 0V8c0-2-2-3-4-3m4 9 3 3-3 3"/>,
  libra: <><path d="M5 17h14M7 14a5 5 0 0 1 10 0M12 5v3M9 6.5h6"/></>,
  scorpio: <path d="M4 5v10c0 3 5 3 6-1V5m0 0v10c0 3 5 3 6-1V5m0 9 4 4m0-5v5h-5"/>,
  sagittarius: <><path d="M5 19 19 5M9 5h10v10"/><path d="m7 11 6 6"/></>,
  capricorn: <path d="M4 5v10c0 3 5 3 6-1V5m0 0v10c0 3 5 3 6-1V7c0-2 4-2 4 1v8c0 3-4 4-6 2m6-2 3 3m0-4v4h-4"/>,
  aquarius: <><path d="m3 9 3-2 3 2 3-2 3 2 3-2 3 2M3 16l3-2 3 2 3-2 3 2 3-2 3 2"/></>,
  pisces: <><path d="M7 4c6 4 6 12 0 16M17 4c-6 4-6 12 0 16M5 12h14"/></>,
};

export default function ZodiacIcon({ sign, label, className = '' }: { sign?: string | null; label?: string; className?: string }) {
  const glyph = sign ? ZODIAC_SIGNS[sign] as ZodiacGlyph | undefined : undefined;
  if (!glyph) return <UiIcon name="star" label={label || 'Chưa có cung hoàng đạo'} className={className} />;

  return (
    <svg aria-label={label || sign || 'Cung hoàng đạo'} role="img" className={className}
      width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {glyphs[glyph]}
    </svg>
  );
}

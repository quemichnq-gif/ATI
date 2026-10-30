import React from 'react';

const ZODIAC_SIGNS = [
  { name: 'Bạch Dương', symbol: '♈', color: '#ef4444', degree: 0 },
  { name: 'Kim Ngưu', symbol: '♉', color: '#a16207', degree: 30 },
  { name: 'Song Tử', symbol: '♊', color: '#facc15', degree: 60 },
  { name: 'Cự Giải', symbol: '♋', color: '#60a5fa', degree: 90 },
  { name: 'Sư Tử', symbol: '♌', color: '#f97316', degree: 120 },
  { name: 'Xử Nữ', symbol: '♍', color: '#4ade80', degree: 150 },
  { name: 'Thiên Bình', symbol: '♎', color: '#f9a8d4', degree: 180 },
  { name: 'Bọ Cạp', symbol: '♏', color: '#a855f7', degree: 210 },
  { name: 'Nhân Mã', symbol: '♐', color: '#fb923c', degree: 240 },
  { name: 'Ma Kết', symbol: '♑', color: '#94a3b8', degree: 270 },
  { name: 'Bảo Bình', symbol: '♒', color: '#38bdf8', degree: 300 },
  { name: 'Song Ngư', symbol: '♓', color: '#818cf8', degree: 330 },
];

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
  ascendant: 'AC', mc: 'MC',
};

const PLANET_COLORS: Record<string, string> = {
  sun: '#fbbf24', moon: '#e2e8f0', mercury: '#a78bfa', venus: '#f472b6',
  mars: '#f87171', jupiter: '#fb923c', saturn: '#94a3b8', uranus: '#38bdf8',
  neptune: '#818cf8', pluto: '#c084fc', ascendant: '#4ade80', mc: '#facc15',
};

const ASPECT_COLORS: Record<string, string> = {
  conjunction: '#fbbf24', opposition: '#f87171', trine: '#4ade80',
  square: '#fb923c', sextile: '#38bdf8',
};

function getZodiacDegree(signName: string): number {
  const s = ZODIAC_SIGNS.find(z => z.name === signName);
  return s ? s.degree + 15 : 0; // midpoint of the sign
}

function polarToCart(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

interface Props {
  planets: Record<string, string | undefined>;
  aspects?: { conjunction?: string; trine?: string; opposition?: string; square?: string; sextile?: string };
  size?: number;
}

export default function NatalChartSVG({ planets, aspects = {}, size = 360 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.47;
  const zodiacOuter = size * 0.47;
  const zodiacInner = size * 0.38;
  const houseR = size * 0.33;
  const planetR = size * 0.28;
  const innerR = size * 0.15;

  // Build planet positions
  const planetPositions: Array<{ key: string; deg: number; symbol: string; color: string }> = [];
  Object.entries(PLANET_SYMBOLS).forEach(([key, symbol]) => {
    const sign = planets[key];
    if (sign) {
      planetPositions.push({
        key, symbol, color: PLANET_COLORS[key] || '#fff',
        deg: getZodiacDegree(sign),
      });
    }
  });

  // Build aspect lines
  const aspectLines: Array<{ x1: number; y1: number; x2: number; y2: number; color: string }> = [];
  Object.entries(aspects).forEach(([type, val]) => {
    if (!val) return;
    const pairs = val.split(',').map(s => s.trim());
    pairs.forEach(pair => {
      const parts = pair.split(' - ');
      if (parts.length !== 2) return;
      // map Vietnamese planet names to keys
      const nameToKey: Record<string, string> = {
        'Mặt Trời': 'sun', 'Mặt Trăng': 'moon', 'Sao Thủy': 'mercury',
        'Sao Kim': 'venus', 'Sao Hỏa': 'mars', 'Sao Mộc': 'jupiter',
        'Sao Thổ': 'saturn', 'Sao Thiên Vương': 'uranus',
        'Sao Hải Vương': 'neptune', 'Sao Diêm Vương': 'pluto',
      };
      const k1 = nameToKey[parts[0].trim()];
      const k2 = nameToKey[parts[1].trim()];
      const p1 = planetPositions.find(p => p.key === k1);
      const p2 = planetPositions.find(p => p.key === k2);
      if (!p1 || !p2) return;
      const pos1 = polarToCart(cx, cy, innerR * 0.9, p1.deg);
      const pos2 = polarToCart(cx, cy, innerR * 0.9, p2.deg);
      aspectLines.push({ x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y, color: ASPECT_COLORS[type] || '#888' });
    });
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ maxWidth: '100%', height: 'auto' }}
      aria-label="Natal Chart biểu đồ chiêm tinh vòng tròn"
    >
      {/* Outer glow */}
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0f0c2e" stopOpacity="1" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx={cx} cy={cy} r={outerR} fill="url(#bgGrad)" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />

      {/* 12 zodiac sector lines */}
      {ZODIAC_SIGNS.map((sign, i) => {
        const startDeg = sign.degree;
        const p1 = polarToCart(cx, cy, zodiacInner, startDeg);
        const p2 = polarToCart(cx, cy, zodiacOuter, startDeg);
        return (
          <line key={`sep-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
        );
      })}

      {/* Zodiac ring */}
      <circle cx={cx} cy={cy} r={zodiacOuter} fill="none" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={zodiacInner} fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />

      {/* Zodiac symbols */}
      {ZODIAC_SIGNS.map((sign, i) => {
        const midDeg = sign.degree + 15;
        const pos = polarToCart(cx, cy, (zodiacOuter + zodiacInner) / 2, midDeg);
        return (
          <g key={`zodiac-${i}`}>
            <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize={size * 0.048} fill={sign.color} fontFamily="serif"
              style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.8))' }}>
              {sign.symbol}
            </text>
          </g>
        );
      })}

      {/* House ring */}
      <circle cx={cx} cy={cy} r={houseR} fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />

      {/* House numbers */}
      {Array.from({ length: 12 }, (_, i) => {
        const deg = i * 30 + 15;
        const pos = polarToCart(cx, cy, (houseR + zodiacInner) / 2, deg);
        return (
          <text key={`house-${i}`} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
            fontSize={size * 0.025} fill="rgba(196,181,253,0.5)" fontFamily="serif">
            {i + 1}
          </text>
        );
      })}

      {/* Aspect lines (inside inner circle) */}
      {aspectLines.map((line, i) => (
        <line key={`asp-${i}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
          stroke={line.color} strokeWidth="0.8" strokeOpacity="0.5"
          strokeDasharray={line.color === ASPECT_COLORS.opposition ? '4,2' : 'none'} />
      ))}

      {/* Inner circle */}
      <circle cx={cx} cy={cy} r={innerR} fill="rgba(15,12,46,0.8)"
        stroke="rgba(139,92,246,0.4)" strokeWidth="1" />

      {/* Center symbol */}
      <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.07} fill="rgba(167,139,250,0.4)" fontFamily="serif">✦</text>

      {/* Planet symbols */}
      {planetPositions.map((p, i) => {
        const pos = polarToCart(cx, cy, planetR, p.deg);
        return (
          <g key={`planet-${i}`} filter="url(#glow)">
            <circle cx={pos.x} cy={pos.y} r={size * 0.028}
              fill="rgba(15,12,46,0.9)" stroke={p.color} strokeWidth="1.2" />
            <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize={p.symbol.length > 2 ? size * 0.022 : size * 0.032}
              fill={p.color} fontFamily="serif" fontWeight="bold">
              {p.symbol}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

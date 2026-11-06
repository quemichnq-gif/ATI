import React from 'react';

const ZODIAC_SIGNS = [
  { name: 'Bạch Dương', symbol: '♈', element: 'fire', color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)', degree: 0 },
  { name: 'Kim Ngưu', symbol: '♉', element: 'earth', color: '#eab308', bgColor: 'rgba(234,179,8,0.10)', degree: 30 },
  { name: 'Song Tử', symbol: '♊', element: 'air', color: '#38bdf8', bgColor: 'rgba(56,189,248,0.10)', degree: 60 },
  { name: 'Cự Giải', symbol: '♋', element: 'water', color: '#818cf8', bgColor: 'rgba(129,140,248,0.12)', degree: 90 },
  { name: 'Sư Tử', symbol: '♌', element: 'fire', color: '#f97316', bgColor: 'rgba(249,115,22,0.12)', degree: 120 },
  { name: 'Xử Nữ', symbol: '♍', element: 'earth', color: '#84cc16', bgColor: 'rgba(132,204,22,0.10)', degree: 150 },
  { name: 'Thiên Bình', symbol: '♎', element: 'air', color: '#f472b6', bgColor: 'rgba(244,114,182,0.10)', degree: 180 },
  { name: 'Bọ Cạp', symbol: '♏', element: 'water', color: '#c084fc', bgColor: 'rgba(192,132,252,0.14)', degree: 210 },
  { name: 'Nhân Mã', symbol: '♐', element: 'fire', color: '#fb923c', bgColor: 'rgba(251,146,60,0.12)', degree: 240 },
  { name: 'Ma Kết', symbol: '♑', element: 'earth', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.12)', degree: 270 },
  { name: 'Bảo Bình', symbol: '♒', element: 'air', color: '#06b6d4', bgColor: 'rgba(6,182,212,0.12)', degree: 300 },
  { name: 'Song Ngư', symbol: '♓', element: 'water', color: '#a78bfa', bgColor: 'rgba(167,139,250,0.12)', degree: 330 },
];

const ROMAN_HOUSES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// SVG Paths cho 12 cung hoàng đạo (viewBox 0 0 24 24)
const ZODIAC_PATHS: Record<string, string[]> = {
  'Bạch Dương': [
    "M12 21V10",
    "M12 11C12 6.5 8.5 4 4.5 4c-1 0-1.5.5-1.5 1s.5 1 1 1c3 0 5 1.5 5 5",
    "M12 11c0-4.5 3.5-7 7.5-7 1 0 1.5.5 1.5 1s-.5 1-1 1c-3 0-5 1.5-5 5",
  ],
  'Kim Ngưu': [
    "M5 6a7 7 0 0 0 14 0",
    "M6 14a6 6 0 1 0 12 0 6 6 0 1 0-12 0",
  ],
  'Song Tử': [
    "M4 4c5 2.5 11 2.5 16 0",
    "M4 20c5-2.5 11-2.5 16 0",
    "M8 5v14",
    "M16 5v14",
  ],
  'Cự Giải': [
    "M7 9a3 3 0 1 0 6 0 3 3 0 0 0-6 0c0-2.5 5.5-6.5 8.5-2",
    "M17 15a3 3 0 1 0-6 0 3 3 0 0 0 6 0c0 2.5-5.5 6.5-8.5 2",
  ],
  'Sư Tử': [
    "M6 12a3.5 3.5 0 1 1 7 0c0 2.5-2 4-2 6",
    "M11 18c2 3 5 2 6-1s-1-4-4-2",
  ],
  'Xử Nữ': [
    "M4 5v11c0 3 4 3 5 0V5",
    "M9 5v11c0 3 4 3 5 0V5",
    "M14 10v7c0 3 3 3 4 1l-3 4",
  ],
  'Thiên Bình': [
    "M3 20h18",
    "M3 15h5a4 4 0 0 1 8 0h5",
  ],
  'Bọ Cạp': [
    "M4 5v11c0 3 4 3 5 0V5",
    "M9 5v11c0 3 4 3 5 0V5",
    "M14 5v11c0 2 3 3 5 0",
    "M18 13l3 3-3 3",
  ],
  'Nhân Mã': [
    "M4 20L20 4",
    "M11 4h9v9",
    "M7 13l4 4",
  ],
  'Ma Kết': [
    "M4 5v11c0 3 4 3 5 0V5",
    "M9 5v11c0 3 4 3 5-1 1-3 5-2 4 2s-3 3-4 1",
  ],
  'Bảo Bình': [
    "M3 9l3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 3 2.5",
    "M3 15l3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 3 2.5",
  ],
  'Song Ngư': [
    "M5 4c5 4.5 5 11.5 0 16",
    "M19 4c-5 4.5-5 11.5 0 16",
    "M3 12h18",
  ],
};

const PLANET_SYMBOLS: Record<string, { label: string; nameVi: string; isAngle?: boolean }> = {
  sun: { label: '☉', nameVi: 'Mặt Trời' },
  moon: { label: '☽', nameVi: 'Mặt Trăng' },
  mercury: { label: '☿', nameVi: 'Sao Thủy' },
  venus: { label: '♀', nameVi: 'Sao Kim' },
  mars: { label: '♂', nameVi: 'Sao Hỏa' },
  jupiter: { label: '♃', nameVi: 'Sao Mộc' },
  saturn: { label: '♄', nameVi: 'Sao Thổ' },
  uranus: { label: '♅', nameVi: 'Sao Thiên Vương' },
  neptune: { label: '♆', nameVi: 'Sao Hải Vương' },
  pluto: { label: '♇', nameVi: 'Sao Diêm Vương' },
  ascendant: { label: 'ASC', nameVi: 'Cung Mọc', isAngle: true },
  mc: { label: 'MC', nameVi: 'Trung Thiên', isAngle: true },
};

const PLANET_COLORS: Record<string, string> = {
  sun: '#facc15',
  moon: '#f1f5f9',
  mercury: '#38bdf8',
  venus: '#f472b6',
  mars: '#f87171',
  jupiter: '#fb923c',
  saturn: '#cbd5e1',
  uranus: '#22d3ee',
  neptune: '#818cf8',
  pluto: '#c084fc',
  ascendant: '#34d399',
  mc: '#eab308',
};

const ASPECT_COLORS: Record<string, string> = {
  conjunction: '#fbbf24', // 0° Trùng tụ
  trine: '#4ade80',       // 120° Tam hợp
  opposition: '#f87171',  // 180° Xung đối
  square: '#fb923c',      // 90° Vuông góc
  sextile: '#38bdf8',     // 60° Lục hợp
};

function getZodiacDegree(signName: string): number {
  const s = ZODIAC_SIGNS.find(z => z.name === signName);
  return s ? s.degree + 15 : 0;
}

function polarToCart(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Generate SVG sector arc path
function describeArcSector(cx: number, cy: number, rIn: number, rOut: number, startAngle: number, endAngle: number) {
  const p1 = polarToCart(cx, cy, rOut, startAngle);
  const p2 = polarToCart(cx, cy, rOut, endAngle);
  const p3 = polarToCart(cx, cy, rIn, endAngle);
  const p4 = polarToCart(cx, cy, rIn, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOut} ${rOut} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rIn} ${rIn} 0 ${largeArcFlag} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

interface Props {
  planets: Record<string, string | undefined>;
  aspects?: { conjunction?: string; trine?: string; opposition?: string; square?: string; sextile?: string };
  size?: number;
}

export default function NatalChartSVG({ planets, aspects = {}, size = 420 }: Props) {
  const cx = size / 2;
  const cy = size / 2;

  // Concentric ring radii
  const rTicks = size * 0.485;
  const rZodiacOuter = size * 0.465;
  const rZodiacInner = size * 0.375;
  const rHouseOuter = size * 0.375;
  const rHouseInner = size * 0.285;
  const rPlanetOrbit = size * 0.235;
  const rInnerAspect = size * 0.175;
  const rCenterRosette = size * 0.055;

  // Build raw planet positions
  const rawPlanetList: Array<{
    key: string;
    sign: string;
    label: string;
    nameVi: string;
    isAngle?: boolean;
    color: string;
    baseDeg: number;
    deg: number;
    radiusOffset: number;
  }> = [];

  Object.entries(PLANET_SYMBOLS).forEach(([key, info]) => {
    const sign = planets[key];
    if (sign) {
      const baseDeg = getZodiacDegree(sign);
      rawPlanetList.push({
        key,
        sign,
        label: info.label,
        nameVi: info.nameVi,
        isAngle: info.isAngle,
        color: PLANET_COLORS[key] || '#fff',
        baseDeg,
        deg: baseDeg,
        radiusOffset: 0,
      });
    }
  });

  // Anti-collision offset: distribute planets that land in the same zodiac sign
  const signGroups: Record<string, typeof rawPlanetList> = {};
  rawPlanetList.forEach(p => {
    if (!signGroups[p.sign]) signGroups[p.sign] = [];
    signGroups[p.sign].push(p);
  });

  Object.values(signGroups).forEach(group => {
    if (group.length > 1) {
      const stepDeg = 24 / group.length;
      const startDeg = group[0].baseDeg - 12 + stepDeg / 2;
      group.forEach((p, idx) => {
        p.deg = startDeg + idx * stepDeg;
        // Alternating radius slightly so glyphs don't overlap
        p.radiusOffset = (idx % 2 === 0 ? 1 : -1) * (size * 0.016);
      });
    }
  });

  // Build aspect lines between connected planets
  const aspectLines: Array<{ x1: number; y1: number; x2: number; y2: number; color: string; type: string }> = [];
  const nameToKey: Record<string, string> = {
    'Mặt Trời': 'sun', 'Mặt Trăng': 'moon', 'Sao Thủy': 'mercury',
    'Sao Kim': 'venus', 'Sao Hỏa': 'mars', 'Sao Mộc': 'jupiter',
    'Sao Thổ': 'saturn', 'Sao Thiên Vương': 'uranus',
    'Sao Hải Vương': 'neptune', 'Sao Diêm Vương': 'pluto',
  };

  Object.entries(aspects).forEach(([type, val]) => {
    if (!val) return;
    const pairs = val.split(',').map(s => s.trim());
    pairs.forEach(pair => {
      const parts = pair.split(' - ');
      if (parts.length !== 2) return;
      const k1 = nameToKey[parts[0].trim()];
      const k2 = nameToKey[parts[1].trim()];
      const p1 = rawPlanetList.find(p => p.key === k1);
      const p2 = rawPlanetList.find(p => p.key === k2);
      if (!p1 || !p2) return;
      const pos1 = polarToCart(cx, cy, rInnerAspect * 0.95, p1.deg);
      const pos2 = polarToCart(cx, cy, rInnerAspect * 0.95, p2.deg);
      aspectLines.push({
        x1: pos1.x,
        y1: pos1.y,
        x2: pos2.x,
        y2: pos2.y,
        color: ASPECT_COLORS[type] || '#888',
        type,
      });
    });
  });

  const zodiacIconSize = size * 0.054;

  return (
    <div className="relative flex justify-center items-center select-none">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="max-w-full h-auto drop-shadow-2xl transition-all"
        aria-label="Natal Chart biểu đồ chiêm tinh học đa tầng chi tiết"
      >
        <defs>
          {/* Gradients */}
          <radialGradient id="skyGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e103a" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#0d0824" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#060314" stopOpacity="1" />
          </radialGradient>

          <radialGradient id="centerCoreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#1e103a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0b071e" stopOpacity="0.8" />
          </radialGradient>

          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="planetGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Deep space background circle */}
        <circle cx={cx} cy={cy} r={rTicks} fill="url(#skyGrad)" stroke="rgba(168,85,247,0.35)" strokeWidth="1.5" />

        {/* 2. Astronomical 360 degree ticks (Astrolabe scale) */}
        {Array.from({ length: 72 }, (_, i) => {
          const deg = i * 5;
          const isMajor = deg % 30 === 0;
          const isSemi = deg % 10 === 0;
          const len = isMajor ? size * 0.022 : isSemi ? size * 0.014 : size * 0.008;
          const strokeW = isMajor ? 1.5 : isSemi ? 1.0 : 0.6;
          const strokeColor = isMajor ? 'rgba(234,179,8,0.7)' : isSemi ? 'rgba(168,85,247,0.5)' : 'rgba(147,197,253,0.25)';
          const p1 = polarToCart(cx, cy, rTicks, deg);
          const p2 = polarToCart(cx, cy, rTicks - len, deg);

          return (
            <line
              key={`tick-${i}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={strokeColor}
              strokeWidth={strokeW}
            />
          );
        })}

        {/* 3. 12 Zodiac sign colored sector backgrounds */}
        {ZODIAC_SIGNS.map((sign, i) => {
          const startDeg = sign.degree;
          const endDeg = sign.degree + 30;
          const pathD = describeArcSector(cx, cy, rZodiacInner, rZodiacOuter, startDeg, endDeg);
          return (
            <path
              key={`sector-${i}`}
              d={pathD}
              fill={sign.bgColor}
              stroke="rgba(168,85,247,0.35)"
              strokeWidth="0.8"
            />
          );
        })}

        {/* 4. Zodiac rings & separator lines */}
        <circle cx={cx} cy={cy} r={rZodiacOuter} fill="none" stroke="rgba(216,180,254,0.4)" strokeWidth="1.2" />
        <circle cx={cx} cy={cy} r={rZodiacInner} fill="none" stroke="rgba(168,85,247,0.5)" strokeWidth="1.2" />

        {/* 5. Zodiac Glyphs in sector centers */}
        {ZODIAC_SIGNS.map((sign, i) => {
          const midDeg = sign.degree + 15;
          const pos = polarToCart(cx, cy, (rZodiacOuter + rZodiacInner) / 2, midDeg);
          const paths = ZODIAC_PATHS[sign.name] || [];
          return (
            <g
              key={`zglyph-${i}`}
              transform={`translate(${pos.x - zodiacIconSize / 2}, ${pos.y - zodiacIconSize / 2})`}
              filter="url(#neonGlow)"
            >
              <svg
                width={zodiacIconSize}
                height={zodiacIconSize}
                viewBox="0 0 24 24"
                fill="none"
                stroke={sign.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {paths.map((d, pi) => (
                  <path key={pi} d={d} />
                ))}
              </svg>
            </g>
          );
        })}

        {/* 6. 12 Houses Cusps & Wheel dividers */}
        {Array.from({ length: 12 }, (_, i) => {
          const deg = i * 30;
          const pOuter = polarToCart(cx, cy, rHouseOuter, deg);
          const pInner = polarToCart(cx, cy, rInnerAspect, deg);
          const isAxis = i === 0 || i === 3 || i === 6 || i === 9;

          return (
            <line
              key={`house-line-${i}`}
              x1={pInner.x}
              y1={pInner.y}
              x2={pOuter.x}
              y2={pOuter.y}
              stroke={isAxis ? 'rgba(234,179,8,0.65)' : 'rgba(168,85,247,0.28)'}
              strokeWidth={isAxis ? 1.6 : 0.8}
              strokeDasharray={isAxis ? 'none' : '3,3'}
            />
          );
        })}

        {/* House boundary rings */}
        <circle cx={cx} cy={cy} r={rHouseInner} fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="0.8" />
        <circle cx={cx} cy={cy} r={rInnerAspect} fill="url(#centerCoreGrad)" stroke="rgba(216,180,254,0.4)" strokeWidth="1.2" />

        {/* 7. Roman numerals for 12 Houses */}
        {ROMAN_HOUSES.map((num, i) => {
          const midDeg = i * 30 + 15;
          const pos = polarToCart(cx, cy, (rHouseOuter + rHouseInner) / 2, midDeg);
          return (
            <text
              key={`roman-${i}`}
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={size * 0.023}
              fill="rgba(216,180,254,0.65)"
              fontFamily="Georgia, serif"
              fontWeight="600"
            >
              {num}
            </text>
          );
        })}

        {/* 8. Four major celestial angles: ASC - DSC & MC - IC */}
        {/* Horizon (ASC - DSC) */}
        <g filter="url(#neonGlow)">
          <line
            x1={cx - rHouseOuter}
            y1={cy}
            x2={cx + rHouseOuter}
            y2={cy}
            stroke="#34d399"
            strokeWidth="1.8"
            strokeDasharray="none"
          />
          {/* ASC arrow point on the left */}
          <polygon
            points={`${cx - rHouseOuter},${cy} ${cx - rHouseOuter + size * 0.02},${cy - size * 0.012} ${cx - rHouseOuter + size * 0.02},${cy + size * 0.012}`}
            fill="#34d399"
          />
        </g>

        {/* Meridian (MC - IC) */}
        <g filter="url(#neonGlow)">
          <line
            x1={cx}
            y1={cy - rHouseOuter}
            x2={cx}
            y2={cy + rHouseOuter}
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />
          {/* MC point on top */}
          <polygon
            points={`${cx},${cy - rHouseOuter} ${cx - size * 0.012},${cy - rHouseOuter + size * 0.02} ${cx + size * 0.012},${cy - rHouseOuter + size * 0.02}`}
            fill="#fbbf24"
          />
        </g>

        {/* 9. Aspect geometric lines across inner core */}
        {aspectLines.map((line, i) => (
          <line
            key={`asp-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.color}
            strokeWidth={line.type === 'conjunction' || line.type === 'trine' ? 1.4 : 1.0}
            strokeOpacity={0.7}
            strokeDasharray={line.type === 'opposition' ? '4,3' : line.type === 'square' ? '2,2' : 'none'}
          />
        ))}

        {/* 10. Center Celestial Compass Rose (Astrolabe Star) */}
        <circle cx={cx} cy={cy} r={rCenterRosette} fill="rgba(15,10,38,0.9)" stroke="rgba(234,179,8,0.6)" strokeWidth="1.2" />
        <path
          d={`M ${cx} ${cy - rCenterRosette * 1.5} L ${cx + rCenterRosette * 0.35} ${cy - rCenterRosette * 0.35} L ${cx + rCenterRosette * 1.5} ${cy} L ${cx + rCenterRosette * 0.35} ${cy + rCenterRosette * 0.35} L ${cx} ${cy + rCenterRosette * 1.5} L ${cx - rCenterRosette * 0.35} ${cy + rCenterRosette * 0.35} L ${cx - rCenterRosette * 1.5} ${cy} L ${cx - rCenterRosette * 0.35} ${cy - rCenterRosette * 0.35} Z`}
          fill="rgba(234,179,8,0.85)"
          filter="url(#neonGlow)"
        />
        <circle cx={cx} cy={cy} r={size * 0.012} fill="#ffffff" />

        {/* 11. Planets & Angles Glyphs on orbit */}
        {rawPlanetList.map((p, i) => {
          const finalR = rPlanetOrbit + p.radiusOffset;
          const pos = polarToCart(cx, cy, finalR, p.deg);
          const nodeRadius = size * (p.isAngle ? 0.034 : 0.03);

          return (
            <g key={`planet-node-${i}`} filter="url(#planetGlow)" className="cursor-pointer group">
              <title>{`${p.nameVi} (${p.sign})`}</title>

              {/* Connecting dashed line from inner house ring to planet */}
              <line
                x1={polarToCart(cx, cy, rHouseInner, p.deg).x}
                y1={polarToCart(cx, cy, rHouseInner, p.deg).y}
                x2={pos.x}
                y2={pos.y}
                stroke={p.color}
                strokeWidth="0.8"
                strokeOpacity="0.4"
                strokeDasharray="2,2"
              />

              {/* Outer halo */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeRadius + 2}
                fill="none"
                stroke={p.color}
                strokeWidth="0.8"
                strokeOpacity="0.4"
              />

              {/* Node background */}
              {p.isAngle ? (
                <rect
                  x={pos.x - nodeRadius * 1.25}
                  y={pos.y - nodeRadius * 0.9}
                  width={nodeRadius * 2.5}
                  height={nodeRadius * 1.8}
                  rx={nodeRadius * 0.5}
                  fill="rgba(10, 6, 26, 0.96)"
                  stroke={p.color}
                  strokeWidth="1.5"
                />
              ) : (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeRadius}
                  fill="rgba(10, 6, 26, 0.96)"
                  stroke={p.color}
                  strokeWidth="1.4"
                />
              )}

              {/* Symbol Glyph */}
              <text
                x={pos.x}
                y={pos.y + (p.isAngle ? 0.5 : 1)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={p.isAngle ? size * 0.021 : size * 0.034}
                fill={p.color}
                fontFamily={p.isAngle ? 'ui-sans-serif, system-ui, sans-serif' : 'serif'}
                fontWeight={p.isAngle ? '700' : 'bold'}
                letterSpacing={p.isAngle ? '0.5px' : 'normal'}
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

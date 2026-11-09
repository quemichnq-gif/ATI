import { useMemo } from 'react';
import StarField from './StarField';

// Dense meteor shower array: negative delays đảm bảo sao băng chuyển động liên tục ngay từ frame đầu tiên sau khi reload, không đứng im
const METEORS = [
  { top: '3%', left: '42%', delay: '-0.4s', duration: '3.2s' },
  { top: '8%', left: '76%', delay: '-1.5s', duration: '3.6s' },
  { top: '14%', left: '56%', delay: '-2.6s', duration: '3.0s' },
  { top: '2%', left: '88%', delay: '-1.0s', duration: '3.8s' },
  { top: '20%', left: '68%', delay: '-2.2s', duration: '3.4s' },
  { top: '6%', left: '94%', delay: '-1.8s', duration: '3.1s' },
  { top: '12%', left: '48%', delay: '-2.9s', duration: '3.5s' },
  { top: '18%', left: '82%', delay: '-0.7s', duration: '3.3s' },
  { top: '24%', left: '60%', delay: '-3.1s', duration: '3.7s' },
];

interface Stardust {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
}

/**
 * Animated Cosmic Space Background (High-Visibility Edition)
 * Features:
 * 1. Active Stardust Drift — luminous celestial particles floating upward
 * 2. Frequent Shooting Stars (Meteors) — vivid luminous streaks crossing every 1-2s
 * 3. Dynamic Twinkling Starfield — multi-frequency starlight with sparkling halos
 * 4. Flowing Nebula Orbs — deep violet & pink cosmic dust shifting actively
 * 5. Hypnotic Celestial Background Drift — gentle 18s breathing motion
 */
// Pre-generated static stardust với negative delay để chuyển động lơ lửng liên tục ngay khi nạp trang
const STATIC_STARDUST: Stardust[] = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  left: (i * 3.1 + 7) % 96 + 2,
  top: (i * 2.7 + 13) % 85 + 15,
  size: (i % 5) * 0.3 + 1.2,
  duration: 5.5 + (i % 4) * 0.9,
  delay: -((i % 7) * 0.8 + 0.2),
}));

export default function CosmicBackground() {
  const stardust = STATIC_STARDUST;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Layer 1: Oversized cosmic background image with visible 18s drift */}
      <div
        className="absolute -inset-[7%] bg-cover bg-top animate-cosmic-drift opacity-90"
        style={{
          backgroundImage: "url('/astrica/images/6870bb19f01c2d68b7b36998_hero-bg-p-1600.png')",
        }}
      />

      {/* Layer 2: Twinkling Starfield across full screen */}
      <StarField count={90} />

      {/* Layer 3: Floating Stardust Particles (Bụi sao chuyển động bay lên) */}
      {stardust.map(s => (
        <span
          key={s.id}
          className="stardust-particle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            // @ts-ignore
            '--duration': `${s.duration}s`,
            '--delay': `${s.delay}s`,
          }}
        />
      ))}

      {/* Layer 4: Shooting stars (Meteors) rực rỡ lướt qua bầu trời */}
      {METEORS.map((m, idx) => (
        <span
          key={idx}
          className="meteor-item"
          style={{
            top: m.top,
            left: m.left,
            animationDelay: m.delay,
            animationDuration: m.duration,
          }}
        />
      ))}

      {/* Layer 5: Floating ambient nebula glow orbs chuyển động rõ rệt */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Nebula Orb 1: Deep cosmic purple glow - top left */}
        <div
          className="nebula-orb-1 absolute rounded-full"
          style={{
            width: '720px',
            height: '720px',
            top: '-120px',
            left: '-140px',
            background: 'radial-gradient(circle, rgba(157,78,221,0.48) 0%, rgba(157,78,221,0.18) 45%, transparent 70%)',
            filter: 'blur(75px)',
            willChange: 'transform, opacity',
          }}
        />

        {/* Nebula Orb 2: Vivid cosmic pink glow - top right */}
        <div
          className="nebula-orb-2 absolute rounded-full"
          style={{
            width: '600px',
            height: '600px',
            top: '30px',
            right: '-80px',
            background: 'radial-gradient(circle, rgba(255,110,180,0.36) 0%, rgba(255,110,180,0.12) 45%, transparent 70%)',
            filter: 'blur(80px)',
            willChange: 'transform, opacity',
          }}
        />

        {/* Nebula Orb 3: Cyan ethereal shimmer - center bottom */}
        <div
          className="nebula-orb-3 absolute rounded-full"
          style={{
            width: '500px',
            height: '500px',
            bottom: '5%',
            left: '30%',
            background: 'radial-gradient(circle, rgba(76,201,240,0.28) 0%, rgba(76,201,240,0.08) 45%, transparent 70%)',
            filter: 'blur(85px)',
            willChange: 'transform, opacity',
          }}
        />

        {/* Nebula Orb 4: Rich violet core - mid left */}
        <div
          className="nebula-orb-4 absolute rounded-full"
          style={{
            width: '440px',
            height: '440px',
            top: '25%',
            left: '16%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.32) 0%, rgba(124,58,237,0.10) 45%, transparent 70%)',
            filter: 'blur(90px)',
            willChange: 'transform, opacity',
          }}
        />
      </div>
    </div>
  );
}

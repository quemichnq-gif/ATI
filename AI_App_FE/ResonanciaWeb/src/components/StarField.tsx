import { useMemo } from 'react';

interface Star {
  id: number; x: number; y: number; size: number;
  color: string; duration: number; delay: number;
}

export default function StarField({ count = 200 }: { count?: number }) {
  const stars = useMemo<Star[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      color: Math.random() > 0.7 ? 'rgba(255,180,255,0.9)' : 'rgba(255,255,255,0.85)',
      duration: Math.random() * 4 + 2,
      delay: Math.random() * 5,
    })), [count]
  );

  return (
    <div className="stars-bg" aria-hidden>
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            '--duration': `${s.duration}s`,
            '--delay': `${s.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

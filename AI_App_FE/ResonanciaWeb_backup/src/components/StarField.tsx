import { useMemo } from 'react';

interface Star {
  id: number; x: number; y: number; size: number;
  color: string; duration: number; delay: number;
}

export default function StarField({ count = 65 }: { count?: number }) {
  const stars = useMemo<Star[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.6 + 0.6,
      color: Math.random() > 0.6 ? 'rgba(216, 180, 254, 0.55)' : 'rgba(255, 255, 255, 0.5)',
      duration: Math.random() * 5 + 3,
      delay: Math.random() * 6,
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

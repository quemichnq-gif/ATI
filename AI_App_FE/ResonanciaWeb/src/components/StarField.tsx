import { useMemo } from 'react';

const STAR_CACHE = new Map<number, Star[]>();

function getCachedStars(count: number): Star[] {
  let cached = STAR_CACHE.get(count);
  if (!cached) {
    cached = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (i * 17.3 + 5.1) % 100,
      y: (i * 23.7 + 9.3) % 100,
      size: ((i * 3.7) % 1.6) + 0.6,
      color: (i % 3 === 0) ? 'rgba(216, 180, 254, 0.55)' : 'rgba(255, 255, 255, 0.5)',
      duration: ((i * 1.9) % 5) + 3,
      delay: (i * 0.7) % 6,
    }));
    STAR_CACHE.set(count, cached);
  }
  return cached;
}

interface Star {
  id: number; x: number; y: number; size: number;
  color: string; duration: number; delay: number;
}

export default function StarField({ count = 65 }: { count?: number }) {
  const stars = useMemo(() => getCachedStars(count), [count]);

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

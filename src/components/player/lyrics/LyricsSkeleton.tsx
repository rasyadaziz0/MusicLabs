'use client';

export function LyricsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: '10vh' }}>
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="lyric-skeleton"
          style={{
            height: i === 0 ? 36 : i <= 2 ? 30 : 26,
            width: `${[80, 65, 72, 55, 68, 48, 60][i]}%`,
            opacity: i <= 1 ? 0.7 : i <= 3 ? 0.4 : 0.2,
          }}
        />
      ))}
    </div>
  );
}

const ink = { stroke: 'var(--color-ink)', strokeWidth: 3.2, strokeLinejoin: 'round', strokeLinecap: 'round' };

const BOX = (
  <g {...ink}>
    <path d="M27 47 L93 45.5 L91.5 86 L28.5 87.5 Z" fill="var(--color-signal)" />
    <path d="M22 35 L98 33 L97.5 47 L22.5 48.5 Z" fill="var(--color-signal)" />
    <path d="M55 34 L65 34 L64.5 87 L55.5 87.3 Z" fill="var(--color-ink)" />
    <path d="M60 33 C48 19 33 22 41 32 Z M60 33 C72 19 87 22 79 32 Z" fill="var(--color-paper)" />
  </g>
);

const TALL = (
  <g {...ink}>
    <path d="M38 36 L82 35 L83 88 L37 88.5 Z" fill="var(--color-paper)" />
    <path d="M34 25 L86 24 L86.5 37 L33.5 37.5 Z" fill="var(--color-paper)" />
    <path d="M56 24.5 L64 24.5 L64.5 88.3 L55.5 88.5 Z" fill="var(--color-signal)" />
    <path d="M34 55 L86 54 L86 61 L34 62 Z" fill="var(--color-signal)" />
    <path d="M60 24 C50 10 38 14 45 23 Z M60 24 C70 10 82 14 75 23 Z" fill="var(--color-ink)" />
  </g>
);

const BAG = (
  <g {...ink}>
    <path d="M47 38 C46 20 74 20 73 38" fill="none" />
    <path d="M33 38 L87 37 L90 89 L30 89.5 Z" fill="var(--color-peach)" />
    <path d="M60 52 L48 45 L48 59 Z M60 52 L72 45 L72 59 Z" fill="var(--color-signal)" />
    <path d="M42 30 C46 22 52 34 50 38 M70 30 C66 22 62 34 64 38" fill="none" />
  </g>
);

const STACK = (
  <g {...ink}>
    <path d="M24 58 L96 57 L95 89 L25 90 Z" fill="var(--color-stone)" />
    <path d="M56.5 57.3 L63.5 57.2 L63.3 89.4 L56.7 89.5 Z" fill="var(--color-ink)" />
    <path d="M40 30 L80 29.5 L80.5 57.5 L39.5 58 Z" fill="var(--color-signal)" />
    <path d="M40 41 L80.5 40.5 L80.5 46 L40 46.5 Z" fill="var(--color-paper)" />
    <path d="M60 30 C52 18 42 22 48 29 Z M60 30 C68 18 78 22 72 29 Z" fill="var(--color-paper)" />
  </g>
);

const ART = [BOX, TALL, BAG, STACK];

export default function GiftArt({ index = 0, className = '' }) {
  return (
    <svg viewBox="0 0 120 100" aria-hidden="true" className={className} style={{ rotate: `${[-3, 2, -1.5, 3][index % 4]}deg` }}>
      <ellipse cx="60" cy="92" rx="40" ry="4" fill="var(--color-ink)" opacity=".1" />
      {ART[index % ART.length]}
    </svg>
  );
}

import { useEffect, useRef, useState } from 'react';

const ONE = [-100, -60, 1080, 2980];
const TWO = [-100, -60, 1600, 2980];
const VIEW = {
  girls: TWO, friends: TWO, pair: TWO, balloons: [-100, -820, 1750, 3740],
  boxman: ONE, grandma: ONE, s1: ONE, s2: ONE, s3: ONE, s4: ONE, s5: ONE, s6: ONE, s7: ONE, s8: ONE, s9: ONE, s10: ONE, s11: ONE, s12: ONE,
};

const FAR = [
  ['s2', 'l', 78, 0.02], ['s4', 'r', 70, 0.1], ['pair', 'l', 84, 0.2, 'heart'], ['s8', 'r', 74, 0.28], ['s6', 'l', 80, 0.36], ['s11', 'r', 72, 0.45],
  ['friends', 'r', 82, 0.54, null, 'stop'], ['s9', 'l', 68, 0.62], ['girls', 'l', 86, 0.7], ['s12', 'r', 76, 0.78], ['s7', 'r', 70, 0.86], ['s10', 'l', 74, 0.94],
];
const NEAR = [
  ['girls', 'r', 60, 0, 'heart', 'stop'], ['s10', 'l', 46, 0.08], ['balloons', 'l', 56, 0.17, 'star'], ['s8', 'r', 48, 0.25], ['boxman', 'r', 44, 0.34, 'gift'], ['s12', 'l', 50, 0.42],
  ['grandma', 'l', 58, 0.5, 'gift'], ['s9', 'r', 47, 0.58], ['pair', 'r', 62, 0.66, 'heart', 'stop'], ['friends', 'l', 52, 0.75, 'star'], ['s1', 'r', 45, 0.83], ['s3', 'l', 49, 0.91],
];

const BUBBLE = {
  heart: <path d="M12 20s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4C19 15.6 12 20 12 20z" className="fill-signal" />,
  gift: <path d="M6 11h12v8H6zM5 8h14v3H5zM12 8v11M12 8c-2-3-5-2-4 0M12 8c2-3 5-2 4 0" className="fill-signal stroke-ink" strokeWidth="1.6" strokeLinejoin="round" />,
  star: <path d="M12 5l2 4.6 5 .5-3.8 3.3 1.1 4.9L12 15.8 7.7 18.3l1.1-4.9L5 10.1l5-.5z" className="fill-signal" />,
};

function Walker({ id, dir, dur, at, bubble, stop, near, i }) {
  const view = VIEW[id];
  const style = {
    '--h': `${(near ? 84 + (i % 4) * 2 : 50 + (i % 4) * 2) * view[3] / 2980}%`,
    '--b': `${near ? -20 + (i % 3) * 2 : 26 + (i % 3) * 2}%`,
    '--x': `${at * 100}cqw`,
    aspectRatio: `${view[2]} / ${view[3]}`,
    animationName: `walk-${dir}${stop ? '-stop' : ''}`,
    animationDuration: `${dur}s`,
    animationDelay: `${-at * dur}s`,
  };
  return (
    <div className={`walker ${i % 2 ? 'walker-extra' : ''}`} style={style}>
      <svg viewBox={view.join(' ')} className={dir === 'l' ? '-scale-x-100' : ''} style={{ animationDelay: `${-(i % 7) * 0.19}s` }}>
        <use href={`/crowd.svg#${id}`} />
      </svg>
      {bubble && (
        <span className="bubble" style={{ animationDuration: `${7 + (i % 4)}s`, animationDelay: `${-(i % 5) * 1.6}s`, top: id === 'balloons' ? '14%' : '-9%' }}>
          <svg viewBox="0 0 24 24">{BUBBLE[bubble]}</svg>
        </span>
      )}
    </div>
  );
}

const Row = ({ list, near }) => list.map(([id, dir, dur, at, bubble, stop], i) => <Walker key={i} {...{ id, dir, dur, at, bubble, stop, near, i }} />);

export default function Crowd() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: '300px' });
    io.observe(el);
    const move = (e) => el.style.setProperty('--mx', (e.clientX / innerWidth - 0.5).toFixed(3));
    addEventListener('pointermove', move, { passive: true });
    return () => { io.disconnect(); removeEventListener('pointermove', move); };
  }, []);
  useEffect(() => {
    if (seen && matchMedia('(prefers-reduced-motion: reduce)').matches) ref.current.querySelectorAll('svg').forEach((s) => s.pauseAnimations?.());
  }, [seen]);
  return (
    <div ref={ref} className={`crowd ${seen ? 'crowd-seen' : ''}`} aria-hidden="true">
      <div className="crowd-layer crowd-far">{seen && <Row list={FAR} />}</div>
      <span className="display crowd-word">
        <span>{[...'giftory'].map((c, i) => <span key={i} style={{ '--i': i }}>{c}</span>)}</span>
      </span>
      <div className="crowd-layer crowd-near">{seen && <Row list={NEAR} near />}</div>
    </div>
  );
}

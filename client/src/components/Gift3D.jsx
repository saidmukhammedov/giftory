export const GIFT_COLORS = [
  ['var(--color-cobalt)', 'var(--color-sun)'],
  ['var(--color-signal)', '#F8F7F3'],
  ['var(--color-mint)', '#17171A'],
  ['var(--color-sun)', 'var(--color-cobalt)'],
];

export const TAKEN = ['#17171A', 'var(--color-signal)'];

export default function Gift3D({ size = 120, colors = GIFT_COLORS[0], open, lift, className = '' }) {
  const [c, r] = colors;
  return (
    <div aria-hidden="true" className={`g3 ${open ? 'g3-open' : ''} ${lift ? 'g3-lift' : ''} ${className}`} style={{ '--s': `${size}px`, '--c': c, '--r': r }}>
      <span className="g3-shadow" />
      <div className="g3-obj">
        <div className="g3-part g3-box"><i className="f" /><i className="s" /></div>
        <div className="g3-part g3-lid">
          <i className="f" /><i className="s" /><i className="t" />
        </div>
      </div>
      <div className="g3-bow"><b /><b /></div>
    </div>
  );
}

import Gift3D, { GIFT_COLORS, TAKEN } from './Gift3D';

export function Tag({ className = '', children }) {
  return (
    <div className={`glass-card group relative flex flex-col gap-3.5 p-4 pb-5 ${className}`}>
      {children}
    </div>
  );
}

export function Photo({ src, className = 'relative' }) {
  return (
    <div className={`isolate overflow-hidden bg-sheet ${className}`}>
      <img src={src} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 size-full scale-125 object-cover opacity-70 blur-xl" />
      <img src={src} alt="" className="relative size-full object-contain" loading="lazy" decoding="async" />
    </div>
  );
}

export function ItemTile({ item, index = 0, wrapped, hideImage, className = 'aspect-[4/3]' }) {
  const showPhoto = item.image && !hideImage && !wrapped;
  return (
    <div className={`relative grid place-items-center overflow-hidden rounded-[20px] bg-sheet ${className}`}>
      {showPhoto ? (
        <Photo src={item.image} className="absolute inset-0" />
      ) : (
        <Gift3D size={84} colors={wrapped ? TAKEN : GIFT_COLORS[index % GIFT_COLORS.length]} lift={!wrapped} />
      )}
    </div>
  );
}

import { Bow, Gift } from './Icons';
import { tileColor } from '../utils';

export function Tag({ className = '', children }) {
  return (
    <div className={`glass-card tag-v relative flex flex-col gap-3.5 px-5 pb-5 pt-12 ${className}`}>
      <span className="hole" />
      {children}
    </div>
  );
}

export function Photo({ src, className = 'relative' }) {
  return (
    <div className={`isolate overflow-hidden bg-stone ${className}`}>
      <img src={src} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 size-full scale-125 object-cover opacity-70 blur-xl" />
      <img src={src} alt="" className="relative size-full object-contain" loading="lazy" decoding="async" />
    </div>
  );
}

export function ItemTile({ item, index = 0, wrapped, hideImage, className = 'aspect-[4/3]' }) {
  const showPhoto = item.image && !hideImage;
  return (
    <div className={`relative grid place-items-center overflow-hidden ${showPhoto ? '' : tileColor(index)} ${className}`}>
      {showPhoto ? <Photo src={item.image} className="absolute inset-0" /> : <Gift size={60} />}
      {wrapped && (
        <div className="frost">
          <Bow />
        </div>
      )}
    </div>
  );
}

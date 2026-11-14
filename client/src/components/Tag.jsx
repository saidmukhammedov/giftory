import { Bow, Gift } from './Icons';
import { tileColor } from '../utils';

// A glass gift tag with a punched hole
export function Tag({ className = '', children }) {
  return (
    <div className={`glass tag-v relative flex flex-col gap-3.5 px-5 pb-5 pt-12 ${className}`}>
      <span className="hole" />
      {children}
    </div>
  );
}

// The item's picture. When wrapped, it frosts over and gets the ribbon.
export function ItemTile({ item, index = 0, wrapped, hideImage, height = 'h-44' }) {
  return (
    <div className={`relative grid ${height} place-items-center overflow-hidden ${tileColor(index)}`}>
      {item.image && !hideImage ? (
        <img src={item.image} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <Gift size={60} />
      )}
      {wrapped && (
        <div className="frost">
          <Bow />
        </div>
      )}
    </div>
  );
}

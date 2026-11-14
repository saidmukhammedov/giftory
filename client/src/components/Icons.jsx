const Svg = ({ size = 20, sw = 2, children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {children}
  </svg>
);

export const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 12 8.5 5H22v14H8.5z" className="fill-ink" />
    <circle cx="9.5" cy="12" r="1.9" className="fill-paper" />
    <path d="M16 5v14" stroke="#FF4D00" strokeWidth="2.6" />
  </svg>
);

export const Bow = ({ width = 72 }) => (
  <svg width={width} height={width * 0.62} viewBox="0 0 64 40" aria-hidden="true">
    <g className="stroke-ink" strokeWidth="2">
      <path d="M32 20C20 3 5 6 7 18c2 12 16 8 25 2z" fill="#FF4D00" />
      <path d="M32 20C44 3 59 6 57 18c-2 12-16 8-25 2z" fill="#FF4D00" />
      <path d="M29 22 22 37M35 22l7 15" />
      <circle cx="32" cy="20" r="5.5" fill="#FF4D00" />
    </g>
  </svg>
);

export const Gift = (p) => <Svg sw={1.4} {...p}><rect x="4" y="9" width="16" height="12" /><path d="M3 9h18V6H3zM12 6v15M12 6C10 2 6 3 7 6M12 6c2-4 6-3 5 0" /></Svg>;
export const Check = (p) => <Svg sw={2.8} {...p}><path d="m5 12 5 5 9-10" /></Svg>;
export const Lock = (p) => <Svg {...p}><rect x="4" y="10" width="16" height="11" rx="1" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Svg>;
export const Plus = (p) => <Svg sw={2.6} {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const Trash = (p) => <Svg {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Svg>;
export const External = (p) => <Svg size={15} sw={2.2} {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" /></Svg>;
export const Send = (p) => <Svg {...p}><path d="m21 4-18 7 6 2 2 6 3-4 5 4z" /><path d="m9 13 12-9" /></Svg>;
export const Back = (p) => <Svg size={16} sw={2.4} {...p}><path d="M15 5 8 12l7 7" /></Svg>;
export const Close = (p) => <Svg sw={2.4} {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const Sun = (p) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>;
export const Moon = (p) => <Svg {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" /></Svg>;
export const Menu = (p) => <Svg sw={2.4} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>;

import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Logo } from './Icons';

// Flat orange/black shapes that sit behind the glass. Each: [kind, size, css position]
export function Page({ shapes = [], children }) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      {shapes.map(([kind, size, pos], i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`pointer-events-none absolute -z-10 ${i > 0 ? 'hidden md:block' : ''} ${kind === 'circle' ? 'rounded-full bg-signal' : kind === 'dot' ? 'rounded-full bg-ink' : 'bg-signal'}`}
          style={{ width: `min(${size}px, 56vw)`, height: `min(${size}px, 56vw)`, ...pos }}
        />
      ))}
      {children}
    </div>
  );
}

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const nav = ({ isActive }) => `px-3 py-2.5 font-semibold no-underline ${isActive ? 'bg-ink text-paper' : 'hover:text-signal'}`;

  return (
    <div className="mx-auto max-w-[1376px] px-4 pt-5 sm:px-8">
      <header className="glass flex flex-wrap items-center justify-between gap-3 py-2.5 pl-5 pr-2.5">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 no-underline" aria-label="Giftory home">
          <Logo />
          <span className="display text-2xl">giftory</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-3">
          {user ? (
            <>
              <NavLink to="/dashboard" className={nav}>My wishlists</NavLink>
              <NavLink to="/reserved" className={nav}>Reserved by me</NavLink>
              <button
                onClick={() => { signOut(); navigate('/'); }}
                className="ml-1 grid size-11 cursor-pointer place-items-center rounded-full bg-signal font-black"
                aria-label={`Log out ${user.name}`}
                title="Log out"
              >
                {user.name[0]?.toUpperCase()}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2.5 font-semibold no-underline hover:text-signal">Log in</Link>
              <Link to="/signup" className="btn btn-primary min-h-[46px] px-5 text-[15px]">Create a wishlist</Link>
            </>
          )}
        </nav>
      </header>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1376px] px-4 pb-10 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink pt-7">
        <div className="flex items-center gap-4">
          <span className="display text-xl">giftory</span>
          <span className="text-[15px] text-mute">Made in Tashkent</span>
        </div>
        <Link to="/signup" className="font-semibold">Create your own wishlist</Link>
      </div>
    </footer>
  );
}

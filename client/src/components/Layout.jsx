import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { usePrefs } from '../i18n';
import { Logo, Moon, Sun } from './Icons';

// Flat orange/ink shapes that sit behind the glass. Each: [kind, size, css position]
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

// EN/RU switch and light/dark toggle
export function PrefsControls() {
  const { t, lang, setLang, theme, setTheme } = usePrefs();
  return (
    <div className="flex items-center gap-1.5">
      <div role="group" aria-label={t('language')} className="flex shadow-[inset_0_0_0_2px_var(--color-ink)]">
        {['en', 'ru'].map((l) => (
          <button key={l} lang={l} aria-pressed={lang === l} onClick={() => setLang(l)} className={`min-h-11 min-w-11 cursor-pointer px-2 text-sm font-bold uppercase ${lang === l ? 'bg-ink text-paper' : 'hover:text-signal'}`}>
            {l}
          </button>
        ))}
      </div>
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label={t(theme === 'dark' ? 'light' : 'dark')}
        title={t(theme === 'dark' ? 'light' : 'dark')}
        className="grid size-11 cursor-pointer place-items-center shadow-[inset_0_0_0_2px_var(--color-ink)] hover:bg-ink hover:text-paper"
      >
        {theme === 'dark' ? <Sun /> : <Moon />}
      </button>
    </div>
  );
}

export function Header() {
  const { user, signOut } = useAuth();
  const { t } = usePrefs();
  const navigate = useNavigate();
  const nav = ({ isActive }) => `px-3 py-2.5 font-semibold no-underline ${isActive ? 'bg-ink text-paper' : 'hover:text-signal'}`;

  return (
    <div className="mx-auto max-w-[1376px] px-4 pt-5 sm:px-8">
      <header className="glass flex flex-wrap items-center justify-between gap-3 py-2.5 pl-5 pr-2.5">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 no-underline" aria-label={t('home')}>
          <Logo />
          <span className="display text-2xl">giftory</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-3">
          {user ? (
            <>
              <NavLink to="/dashboard" className={nav}>{t('myLists')}</NavLink>
              <NavLink to="/reserved" className={nav}>{t('reservedNav')}</NavLink>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2.5 font-semibold no-underline hover:text-signal">{t('login')}</Link>
              <Link to="/signup" className="btn btn-primary min-h-[46px] px-5 text-[15px]">{t('create')}</Link>
            </>
          )}
          <PrefsControls />
          {user && (
            <button
              onClick={() => { signOut(); navigate('/'); }}
              className="grid size-11 cursor-pointer place-items-center rounded-full bg-signal font-black text-black"
              aria-label={t('logout', { name: user.name })}
              title={t('logout', { name: user.name })}
            >
              {user.name[0]?.toUpperCase()}
            </button>
          )}
        </nav>
      </header>
    </div>
  );
}

export function Footer() {
  const { t } = usePrefs();
  return (
    <footer className="mx-auto max-w-[1376px] px-4 pb-10 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink pt-7">
        <div className="flex items-center gap-4">
          <span className="display text-xl">giftory</span>
          <span className="text-[15px] text-mute">{t('madeIn')}</span>
        </div>
        <Link to="/signup" className="font-semibold">{t('createOwn')}</Link>
      </div>
    </footer>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { LANGS, usePrefs } from '../i18n';
import { Chevron, Close, Logo, Menu, Moon, Send, Sun } from './Icons';
import { connectTelegram, useTelegramEnabled } from '../telegram';

export function Page({ shapes = [], children }) {
  return (
    <div className="relative isolate min-h-screen overflow-clip">
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

const box = 'edge';

export function LangSwitch() {
  const { t, lang, setLang } = usePrefs();
  return (
    <div role="group" aria-label={t('language')} className={`flex ${box}`}>
      {LANGS.map((l) => (
        <button key={l} lang={l} aria-pressed={lang === l} onClick={() => setLang(l)} className={`min-h-11 min-w-11 cursor-pointer px-2 text-sm font-bold uppercase ${lang === l ? 'bg-ink text-paper' : 'hover:text-signal-deep'}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function ThemeButton({ withLabel }) {
  const { t, theme, setTheme } = usePrefs();
  const dark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={t(dark ? 'light' : 'dark')}
      title={t(dark ? 'light' : 'dark')}
      className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 px-2.5 font-semibold hover:bg-ink hover:text-paper ${box}`}
    >
      {dark ? <Sun /> : <Moon />}
      {withLabel && <span>{t(dark ? 'lightName' : 'darkName')}</span>}
    </button>
  );
}

export function PrefsControls() {
  return (
    <div className="flex items-center gap-1.5">
      <LangSwitch />
      <ThemeButton />
    </div>
  );
}

const Avatar = ({ user, className = '' }) =>
  user.avatarUrl ? (
    <img src={user.avatarUrl} alt="" className={`size-11 shrink-0 rounded-full object-cover ${className}`} />
  ) : (
    <span className={`grid size-11 shrink-0 place-items-center rounded-full bg-signal font-black text-on-signal ${className}`}>{user.name?.[0]?.toUpperCase()}</span>
  );

function ConnectTelegram({ className }) {
  const { t } = usePrefs();
  const enabled = useTelegramEnabled();
  const { user } = useAuth();
  if (!enabled || user.telegram) return null;
  return <button onClick={connectTelegram} className={className}><Send size={18} /> {t('connectTelegram')}</button>;
}

function useDismiss(open, close, ref) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && close();
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && close();
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, close, ref]);
}

function AccountMenu({ user, onLogout }) {
  const { t } = usePrefs();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const button = useRef(null);
  useDismiss(open, () => { setOpen(false); button.current?.focus(); }, ref);
  const item = 'flex min-h-11 cursor-pointer items-center gap-2 px-3 text-left font-semibold no-underline hover:bg-ink hover:text-paper';

  return (
    <div ref={ref} className="relative">
      <button ref={button} onClick={() => setOpen(!open)} aria-label={t('account')} aria-expanded={open} aria-controls="account-panel" className="cursor-pointer rounded-full">
        <Avatar user={user} className={open ? 'outline-3 outline-offset-2 outline-ink' : ''} />
      </button>
      {open && (
        <div id="account-panel" className="absolute right-0 top-full z-50 mt-3 flex w-64 flex-col p-2 pop">
          <div className="border-b-2 border-ink/15 px-3 pb-3 pt-2">
            <p className="font-bold">{user.name}</p>
            <p className="truncate text-sm text-mute">{user.email}</p>
          </div>
          <Link to="/profile" className={`mt-1 ${item}`}>{t('profile')}</Link>
          <ConnectTelegram className={item} />
          <button onClick={onLogout} className={`mt-1 ${item}`}>{t('logOut')}</button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user, signOut } = useAuth();
  const { t } = usePrefs();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  const menuButton = useRef(null);
  const panel = useRef(null);
  const closeMenu = () => { setMenu(false); menuButton.current?.focus(); };
  useDismiss(menu, closeMenu, ref);
  useEffect(() => { setMenu(false); }, [pathname]);
  useEffect(() => { if (menu) panel.current?.querySelector('a, button')?.focus(); }, [menu]);

  const logout = () => { signOut(); navigate('/'); };
  const links = user ? [['/dashboard', 'myLists'], ['/reserved', 'reservedNav'], ['/profile', 'profile']] : [];
  const desk = ({ isActive }) => `px-3 py-2.5 font-semibold no-underline ${isActive ? 'bg-ink text-paper' : 'hover:text-signal-deep'}`;
  const mob = ({ isActive }) => `flex min-h-14 items-center justify-between border-b-2 border-ink/15 px-1 text-xl font-bold no-underline ${isActive ? 'text-signal-deep' : ''}`;

  return (
    <div ref={ref} className="sticky top-0 z-40 mx-auto max-w-[1376px] px-3 pt-3 sm:px-8 sm:pt-5">
      <a href="#main" className="sr-only z-50 bg-signal px-4 py-3 font-bold text-on-signal focus:not-sr-only focus:absolute focus:left-4 focus:top-4">{t('skipToContent')}</a>
      <header className="glass flex items-center justify-between gap-3 py-2 pl-4 pr-2 sm:pl-5">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 no-underline" aria-label={t('home')}>
          <Logo />
          <span className="display text-2xl">giftory</span>
        </Link>

        <nav className="hidden items-center gap-3 lg:flex">
          {links.slice(0, 2).map(([to, key]) => <NavLink key={to} to={to} className={desk}>{t(key)}</NavLink>)}
          {!user && <Link to="/login" className="px-3 py-2.5 font-semibold no-underline hover:text-signal-deep">{t('login')}</Link>}
          <LangSwitch />
          <ThemeButton />
          {user ? <AccountMenu user={user} onLogout={logout} /> : <Link to="/signup" className="btn btn-primary min-h-11 px-5 text-[15px]">{t('create')}</Link>}
        </nav>

        <button
          ref={menuButton}
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
          aria-controls="mobile-menu"
          aria-label={t(menu ? 'closeMenu' : 'menu')}
          className="grid size-11 cursor-pointer place-items-center hover:text-signal-deep lg:hidden"
        >
          {menu ? <Close /> : <Menu />}
        </button>
      </header>

      {menu && (
        <div ref={panel} id="mobile-menu" className="absolute inset-x-3 top-full mt-2 flex max-h-[calc(100dvh-90px)] flex-col gap-5 overflow-y-auto p-5 sm:inset-x-8 lg:hidden pop">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <Avatar user={user} />
                <div className="min-w-0">
                  <p className="font-bold">{user.name}</p>
                  <p className="truncate text-sm text-mute">{user.email}</p>
                </div>
              </div>
              <nav className="flex flex-col">
                {links.map(([to, key]) => <NavLink key={to} to={to} className={mob}>{t(key)} <Chevron /></NavLink>)}
              </nav>
            </>
          ) : (
            <div className="flex flex-col gap-2.5">
              <Link to="/signup" className="btn btn-primary w-full">{t('create')}</Link>
              <Link to="/login" className="btn btn-outline w-full">{t('login')}</Link>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{t('language')}</span>
              <LangSwitch />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{t('theme')}</span>
              <ThemeButton withLabel />
            </div>
          </div>

          {user && <ConnectTelegram className="btn w-full btn-telegram" />}
          {user && <button onClick={logout} className="btn btn-outline w-full">{t('logOut')}</button>}
        </div>
      )}
    </div>
  );
}

export function Footer() {
  const { t } = usePrefs();
  const { user } = useAuth();
  return (
    <footer className="mx-auto max-w-[1376px] px-4 pb-10 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t-2 border-ink pt-7">
        <div className="flex items-center gap-4">
          <span className="display text-xl">giftory</span>
          <span className="text-[15px] text-mute">{t('madeIn')}</span>
        </div>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1 text-[15px]">
          <Link to="/privacy" className="min-h-11 content-center">{t('privacy')}</Link>
          <Link to="/terms" className="min-h-11 content-center">{t('terms')}</Link>
          <Link to="/cookies" className="min-h-11 content-center">{t('cookies')}</Link>
          {!user && <Link to="/signup" className="min-h-11 content-center font-semibold">{t('createOwn')}</Link>}
        </nav>
      </div>
    </footer>
  );
}

export function CookieNotice() {
  const { t } = usePrefs();
  const [seen, setSeen] = useState(() => { try { return !!localStorage.getItem('giftory_cookie_notice'); } catch { return true; } });
  if (seen) return null;
  const close = () => { try { localStorage.setItem('giftory_cookie_notice', '1'); } catch {} setSeen(true); };
  return (
    <section aria-label={t('cookies')} className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-3xl flex-wrap items-center gap-4 p-4 pop sm:p-5">
      <p className="min-w-0 flex-[1_1_320px] text-[15px] leading-normal">
        {t('cookieNotice')} <Link to="/cookies" className="font-semibold">{t('cookieMore')}</Link>
      </p>
      <button className="btn btn-primary min-h-11" onClick={close}>{t('cookieOk')}</button>
    </section>
  );
}

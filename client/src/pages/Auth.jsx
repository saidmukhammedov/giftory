import { useId, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { Page, PrefsControls } from '../components/Layout';
import { Logo, Send } from '../components/Icons';
import Gift3D, { GIFT_COLORS } from '../components/Gift3D';
import { useProviders, telegramLoginUrl, TELEGRAM_ERRORS } from '../telegram';

export default function Auth({ mode }) {
  const signup = mode === 'signup';
  const { user, signIn } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const tgError = TELEGRAM_ERRORS[params.get('error')];
  const providers = useProviders();
  const telegram = providers?.telegram;
  const [form, setForm] = useState({ name: '', email: '', password: '', acceptTerms: false });
  const [showPw, setShowPw] = useState(false);
  const pwId = useId();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = useMutation({
    mutationFn: () => api.post(`/auth/${signup ? 'register' : 'login'}`, form),
    onSuccess: (r) => { signIn(r.data); navigate(next, { replace: true }); },
  });

  if (user) return <Navigate to={next} replace />;
  const other = `${signup ? '/login' : '/signup'}${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}` : ''}`;

  return (
    <Page>
      <div className="mx-auto flex min-h-screen max-w-[1240px] flex-col gap-8 px-4 pb-14 pt-7 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label={t('home')}>
            <Logo /> <span className="display text-2xl">giftory</span>
          </Link>
          <PrefsControls />
        </header>

        <main id="main" className="grid flex-1 items-center gap-12 md:grid-cols-2">
          <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="glass-card flex w-full max-w-[480px] flex-col gap-5 p-7 sm:p-12">
            <div>
              <h1 className="display text-5xl">{t(signup ? 'signupTitle' : 'loginTitle')}</h1>
              <p className="mt-3 text-lg text-mute">{t(signup ? 'signupSub' : 'loginSub')}</p>
            </div>
            {tgError && <p role="alert" className="rounded-2xl bg-ink p-3 font-semibold text-paper">{t(tgError)}</p>}
            {telegram && (
              <>
                <a href={telegramLoginUrl(next)} className="btn min-h-14 btn-telegram no-underline" aria-describedby="tg-consent">
                  <Send size={20} /> {t('continueTelegram')}
                </a>
                <p id="tg-consent" className="-mt-2 text-sm text-mute">
                  {t.rich('agreeTelegram', { terms: <Link to="/terms" className="font-semibold text-ink">{t('termsShort')}</Link>, privacy: <Link to="/privacy" className="font-semibold text-ink">{t('privacyShort')}</Link> })}
                </p>
                <div className="flex items-center gap-3 text-sm font-semibold text-mute" aria-hidden="true">
                  <span className="h-0.5 flex-1 bg-ink/15" /> {t('orEmail')} <span className="h-0.5 flex-1 bg-ink/15" />
                </div>
              </>
            )}
            {signup && (
              <label className="flex flex-col gap-2 font-bold">
                {t('yourName')}
                <input className="input font-normal" required autoComplete="name" value={form.name} onChange={set('name')} />
              </label>
            )}
            <label className="flex flex-col gap-2 font-bold">
              {t('email')}
              <input className="input font-normal" type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            </label>
            <div className="flex flex-col gap-2">
              <label htmlFor={pwId} className="font-bold">{t('password')}</label>
              <div className="relative">
                <input id={pwId} className="input pr-40" type={showPw ? 'text' : 'password'} required minLength={signup ? 8 : undefined} autoComplete={signup ? 'new-password' : 'current-password'} value={form.password} onChange={set('password')} aria-describedby={signup ? `${pwId}-hint` : undefined} />
                <button type="button" onClick={() => setShowPw(!showPw)} aria-pressed={showPw} aria-controls={pwId} className="absolute right-2 top-1/2 min-h-11 -translate-y-1/2 cursor-pointer px-2 text-sm font-semibold underline">
                  {t(showPw ? 'hidePassword' : 'showPassword')}
                </button>
              </div>
              {signup && <span id={`${pwId}-hint`} className="text-sm text-mute">{t('pwHint')}</span>}
              {!signup && providers?.reset && <Link to="/forgot" className="self-end text-sm font-semibold">{t('forgot')}</Link>}
            </div>
            {signup && (
              <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug">
                <input type="checkbox" required checked={form.acceptTerms} onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })} className="mt-0.5 size-6 shrink-0 cursor-pointer accent-[var(--color-signal)]" />
                <span>{t.rich('agreeTerms', { terms: <Link to="/terms" className="font-semibold">{t('termsShort')}</Link>, privacy: <Link to="/privacy" className="font-semibold">{t('privacyShort')}</Link> })}</span>
              </label>
            )}
            {submit.isError && <p role="alert" className="rounded-2xl bg-ink p-3 font-semibold text-paper">{t.error(submit.error)}</p>}
            <button className="btn btn-primary mt-1 min-h-14" disabled={submit.isPending}>
              {submit.isPending ? t('wait') : t(signup ? 'createAccount' : 'login')}
            </button>
            <p className="text-center text-mute">
              {t(signup ? 'haveAccount' : 'newHere')}{' '}
              <Link to={other} className="font-semibold text-ink">{t(signup ? 'login' : 'register')}</Link>
            </p>
          </form>

          <div aria-hidden="true" className="relative hidden min-h-[460px] place-items-center md:grid">
            <div className="relative">
              <Gift3D size={190} colors={GIFT_COLORS[1]} />
              <Gift3D size={92} colors={GIFT_COLORS[0]} className="absolute -left-28 bottom-0" />
              <Gift3D size={70} colors={GIFT_COLORS[2]} className="absolute -right-20 bottom-3" />
            </div>
          </div>
        </main>
      </div>
    </Page>
  );
}

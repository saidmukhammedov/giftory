import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { Page, PrefsControls } from '../components/Layout';
import { Bow, Logo, Send } from '../components/Icons';
import { useTelegramEnabled, telegramLoginUrl, TELEGRAM_ERRORS } from '../telegram';

export default function Auth({ mode }) {
  const signup = mode === 'signup';
  const { user, signIn } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const tgError = TELEGRAM_ERRORS[params.get('error')];
  const telegram = useTelegramEnabled();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = useMutation({
    mutationFn: () => api.post(`/auth/${signup ? 'register' : 'login'}`, form),
    onSuccess: (r) => { signIn(r.data); navigate(next, { replace: true }); },
  });

  if (user) return <Navigate to={next} replace />;
  const other = `${signup ? '/login' : '/signup'}${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}` : ''}`;

  return (
    <Page shapes={[['circle', 600, { right: -100, top: -120 }], ['dot', 300, { left: '46%', bottom: -140 }], ['square', 260, { left: -100, top: 160, rotate: '12deg' }]]}>
      <div className="mx-auto flex min-h-screen max-w-[1240px] flex-col gap-8 px-4 pb-14 pt-7 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label={t('home')}>
            <Logo /> <span className="display text-2xl">giftory</span>
          </Link>
          <PrefsControls />
        </div>

        <div className="grid flex-1 items-center gap-12 md:grid-cols-2">
          <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="glass flex w-full max-w-[480px] flex-col gap-5 p-7 sm:p-12">
            <div>
              <h1 className="display text-5xl">{t(signup ? 'signupTitle' : 'loginTitle')}</h1>
              <p className="mt-3 text-lg text-mute">{t(signup ? 'signupSub' : 'loginSub')}</p>
            </div>
            {tgError && <p role="alert" className="bg-ink p-3 font-semibold text-paper">{t(tgError)}</p>}
            {telegram && (
              <>
                <a href={telegramLoginUrl(next)} className="btn min-h-14 bg-[#2AABEE] text-black no-underline hover:bg-ink hover:text-paper">
                  <Send size={20} /> {t('continueTelegram')}
                </a>
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
            <label className="flex flex-col gap-2 font-bold">
              {t('password')}
              <span className="relative">
                <input className="input pr-28 font-normal" type={showPw ? 'text' : 'password'} required minLength={signup ? 8 : undefined} autoComplete={signup ? 'new-password' : 'current-password'} value={form.password} onChange={set('password')} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 min-h-11 -translate-y-1/2 cursor-pointer px-2 text-sm font-semibold underline">
                  {t(showPw ? 'hide' : 'show')}
                </button>
              </span>
              {signup && <span className="text-sm font-normal text-mute">{t('pwHint')}</span>}
            </label>
            {submit.isError && <p role="alert" className="bg-ink p-3 font-semibold text-paper">{t.error(submit.error)}</p>}
            <button className="btn btn-primary mt-1 min-h-14" disabled={submit.isPending}>
              {submit.isPending ? t('wait') : t(signup ? 'createAccount' : 'login')}
            </button>
            <p className="text-center text-mute">
              {t(signup ? 'haveAccount' : 'newHere')}{' '}
              <Link to={other} className="font-semibold text-ink">{t(signup ? 'login' : 'register')}</Link>
            </p>
          </form>

          <div aria-hidden="true" className="relative hidden min-h-[460px] place-items-center md:grid">
            <div className="relative aspect-square w-[min(380px,80%)] -rotate-6 overflow-hidden bg-signal">
              <span className="absolute -bottom-[10%] -right-[10%] size-3/5 rounded-full bg-ink" />
              <div className="frost"><Bow width={150} /></div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

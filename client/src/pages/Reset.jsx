import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../auth';
import { usePrefs } from '../i18n';
import { Page, PrefsControls } from '../components/Layout';
import { Logo } from '../components/Icons';

export default function Reset({ mode }) {
  const { t, lang } = usePrefs();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const token = new URLSearchParams(location.hash.slice(1)).get('token');

  const send = useMutation({ mutationFn: () => api.post('/auth/forgot', { email, lang }) });
  const reset = useMutation({
    mutationFn: () => api.post('/auth/reset', { token, password }).then((r) => r.data),
    onSuccess: (data) => { signIn(data); navigate('/dashboard', { replace: true }); },
  });
  const forgot = mode === 'forgot';
  const m = forgot ? send : reset;

  return (
    <Page>
      <div className="mx-auto flex min-h-screen max-w-[1240px] flex-col gap-8 px-4 pb-14 pt-7 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label={t('home')}>
            <Logo /> <span className="display text-2xl">giftory</span>
          </Link>
          <PrefsControls />
        </header>
        <main id="main" className="grid flex-1 items-center">
          <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="glass-card flex w-full max-w-[480px] flex-col gap-5 p-7 sm:p-12">
            <div>
              <h1 className="display text-5xl">{t(forgot ? 'forgotTitle' : 'resetTitle')}</h1>
              <p className="mt-3 text-lg text-mute">{t(forgot ? 'forgotSub' : 'resetSub')}</p>
            </div>
            {forgot && send.isSuccess ? (
              <p role="status" className="font-semibold">{t('forgotSent', { email })}</p>
            ) : !forgot && !token ? (
              <p role="alert" className="font-semibold">{t('resetNoToken')}</p>
            ) : (
              <>
                <label className="flex flex-col gap-2 font-bold">
                  {t(forgot ? 'email' : 'newPassword')}
                  {forgot ? (
                    <input className="input font-normal" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  ) : (
                    <input className="input font-normal" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  )}
                  {!forgot && <span className="text-sm font-normal text-mute">{t('pwHint')}</span>}
                </label>
                {m.isError && <p role="alert" className="rounded-2xl bg-ink p-3 font-semibold text-paper">{t.error(m.error)}</p>}
                <button className="btn btn-primary" disabled={m.isPending}>{t(m.isPending ? 'wait' : forgot ? 'forgotSend' : 'resetSave')}</button>
              </>
            )}
            <Link to={forgot || !token ? '/login' : '/forgot'} className="font-semibold">{t(forgot || !token ? 'backToLogin' : 'resetAgain')}</Link>
          </form>
        </main>
      </div>
    </Page>
  );
}

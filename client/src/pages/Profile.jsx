import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { Page, Header, Footer, LangSwitch, ThemeButton } from '../components/Layout';
import { Send } from '../components/Icons';
import { connectTelegram, useTelegramEnabled } from '../telegram';

function Card({ title, children, tone = '' }) {
  const id = useId();
  return (
    <section className={`glass flex flex-col gap-5 p-6 sm:p-8 ${tone}`} aria-labelledby={id}>
      <h2 id={id} className="display text-3xl">{title}</h2>
      {children}
    </section>
  );
}

// Status line under a form: error in a dark box, success as a quiet note
function Status({ m, ok }) {
  const t = useT();
  if (m.isError) return <p role="alert" className="bg-ink p-3 font-semibold text-paper">{t.error(m.error)}</p>;
  if (m.isSuccess) return <p role="status" className="font-semibold text-signal">{ok}</p>;
  return null;
}

export default function Profile() {
  const { user, setUser, signOut } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const telegramEnabled = useTelegramEnabled();
  const [details, setDetails] = useState({ name: user.name, email: user.email || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveDetails = useMutation({ mutationFn: () => api.patch('/auth/me', details), onSuccess: (r) => setUser(r.data.user) });
  const savePw = useMutation({ mutationFn: () => api.put('/auth/password', pw), onSuccess: (r) => { setUser(r.data.user); setPw({ currentPassword: '', newPassword: '' }); } });
  const disconnect = useMutation({ mutationFn: () => api.delete('/auth/telegram'), onSuccess: (r) => setUser(r.data.user) });
  const remove = useMutation({ mutationFn: () => api.delete('/auth/me'), onSuccess: () => { signOut(); navigate('/', { replace: true }); } });

  const canDisconnect = user.email && user.hasPassword;

  return (
    <Page shapes={[['circle', 460, { right: -140, top: 120 }], ['square', 300, { left: -80, top: 900, rotate: '12deg' }]]}>
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-24 pt-12 outline-none sm:px-8">
        <div>
          <h1 className="display text-[clamp(40px,6vw,72px)]">{t('profileTitle')}</h1>
          <p className="mt-3 text-lg text-mute">{t('profileSub')}</p>
        </div>

        <Card title={t('details')}>
          <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); saveDetails.mutate(); }}>
            <label className="flex flex-col gap-2 font-bold">
              {t('yourName')}
              <input className="input font-normal" required autoComplete="name" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} aria-describedby="name-hint" />
              <span id="name-hint" className="text-sm font-normal text-mute">{t('detailsHint')}</span>
            </label>
            <label className="flex flex-col gap-2 font-bold">
              {t('email')}
              <input className="input font-normal" type="email" autoComplete="email" required={user.hasPassword} value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} aria-describedby="email-hint" />
              <span id="email-hint" className="text-sm font-normal text-mute">{t('emailHint')}</span>
            </label>
            <Status m={saveDetails} ok={t('saved')} />
            <button className="btn btn-primary self-start" disabled={saveDetails.isPending}>{t(saveDetails.isPending ? 'saving' : 'saveChanges')}</button>
          </form>
        </Card>

        <Card title={t('passwordTitle')}>
          {!user.email ? (
            <p className="text-mute">{t('passwordNeedsEmail')}</p>
          ) : (
            <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); savePw.mutate(); }}>
              {/* Hidden username helps password managers save the right login */}
              <input type="email" autoComplete="username" value={user.email} readOnly hidden />
              {user.hasPassword && (
                <label className="flex flex-col gap-2 font-bold">
                  {t('currentPassword')}
                  <input className="input font-normal" type="password" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
                </label>
              )}
              <label className="flex flex-col gap-2 font-bold">
                {t('newPassword')}
                <input className="input font-normal" type="password" required minLength={8} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} aria-describedby="pw-hint" />
                <span id="pw-hint" className="text-sm font-normal text-mute">{t('pwHint')}</span>
              </label>
              <Status m={savePw} ok={t('passwordUpdated')} />
              <button className="btn btn-primary self-start" disabled={savePw.isPending}>{t(savePw.isPending ? 'saving' : user.hasPassword ? 'updatePassword' : 'setPassword')}</button>
            </form>
          )}
        </Card>

        {(telegramEnabled || user.telegram) && (
          <Card title={t('telegramTitle')}>
            <p>{t(user.telegram ? 'telegramOn' : 'telegramOffText')}</p>
            {user.telegram ? (
              <>
                {!canDisconnect && <p className="text-sm text-mute">{t('disconnectNeedsPassword')}</p>}
                <Status m={disconnect} ok="" />
                <button className="btn btn-outline self-start" disabled={!canDisconnect || disconnect.isPending} onClick={() => disconnect.mutate()}>{t('disconnectTelegram')}</button>
              </>
            ) : (
              <button className="btn self-start bg-[#2AABEE] text-black hover:bg-ink hover:text-paper" onClick={connectTelegram}><Send size={18} /> {t('connectTelegram')}</button>
            )}
          </Card>
        )}

        <Card title={t('appearance')}>
          <div className="flex flex-wrap items-center gap-3">
            <LangSwitch />
            <ThemeButton withLabel />
          </div>
        </Card>

        <Card title={t('dataTitle')}>
          <p className="max-w-[60ch] leading-relaxed">{t('dataText')}</p>
          <Link to="/privacy" className="self-start font-semibold">{t('readPrivacy')}</Link>
        </Card>

        <Card title={t('deleteTitle')} tone="shadow-[inset_0_0_0_2px_var(--color-signal)]">
          <p className="max-w-[60ch] leading-relaxed">{t('deleteText')}</p>
          {!confirmDelete ? (
            <button className="btn btn-outline self-start" onClick={() => setConfirmDelete(true)}>{t('deleteAccount')}</button>
          ) : (
            <div role="group" aria-labelledby="delete-q" className="flex flex-col gap-3">
              <p id="delete-q" className="text-lg font-bold">{t('deleteConfirm')}</p>
              <Status m={remove} ok="" />
              <div className="flex flex-wrap gap-3">
                <button className="btn btn-primary" autoFocus onClick={() => setConfirmDelete(false)}>{t('deleteNo')}</button>
                <button className="btn btn-outline" disabled={remove.isPending} onClick={() => remove.mutate()}>{t(remove.isPending ? 'deleting' : 'deleteYes')}</button>
              </div>
            </div>
          )}
        </Card>
      </main>
      <Footer />
    </Page>
  );
}

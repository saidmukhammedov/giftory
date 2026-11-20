import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { telegramLoginUrl, useProviders } from '../telegram';
import Dialog from './Dialog';
import { Send } from './Icons';

export default function JoinDialog({ next, onClose, onJoined }) {
  const t = useT();
  const { signIn } = useAuth();
  const providers = useProviders();
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);

  const join = useMutation({
    mutationFn: () => api.post('/auth/guest', { name, acceptTerms: agree }).then((r) => r.data),
    onSuccess: (data) => { signIn(data); onJoined(); },
  });

  return (
    <Dialog title={t('joinTitle')} onClose={onClose}>
      <p className="text-mute">{t('joinText')}</p>
      {providers?.telegram && (
        <a href={telegramLoginUrl(next)} className="btn w-full btn-telegram no-underline">
          <Send size={18} /> {t('continueTelegram')}
        </a>
      )}
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); join.mutate(); }}>
        <label className="flex flex-col gap-2 font-bold">
          {t('joinName')}
          <input className="input font-normal" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('joinNamePh')} />
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" required className="mt-0.5 size-5 shrink-0 accent-[var(--color-signal)]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>{t.rich('agreeTerms', { terms: <Link to="/terms" target="_blank">{t('termsShort')}</Link>, privacy: <Link to="/privacy" target="_blank">{t('privacyShort')}</Link> })}</span>
        </label>
        {join.isError && <p role="alert" className="rounded-2xl bg-ink p-3 text-sm font-semibold text-paper">{t.error(join.error)}</p>}
        <button className="btn btn-primary" disabled={join.isPending}>{t(join.isPending ? 'wait' : 'joinSubmit')}</button>
      </form>
      <p className="text-sm text-mute">{t('haveAccount')} <Link to={`/login?next=${encodeURIComponent(next)}`}>{t('login')}</Link></p>
    </Dialog>
  );
}

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { Page } from '../components/Layout';

export default function TelegramCallback() {
  const { signIn } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get('token');
    const next = hash.get('next')?.startsWith('/') ? hash.get('next') : '/dashboard';
    history.replaceState(null, '', window.location.pathname);
    if (!token) return navigate('/login?error=telegram', { replace: true });
    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { signIn({ token, user: r.data.user }); navigate(next, { replace: true }); })
      .catch(() => navigate('/login?error=telegram', { replace: true }));
  }, [navigate, signIn]);

  return (
    <Page shapes={[['circle', 520, { right: -120, top: 80 }]]}>
      <p className="display mx-auto max-w-[1376px] px-6 py-32 text-4xl">{t('signingIn')}</p>
    </Page>
  );
}

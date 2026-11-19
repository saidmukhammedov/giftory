import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from './api';
import { usePrefs } from './i18n';
import { inTelegram, telegramApp } from './telegram';

const AuthContext = createContext(null);

async function telegramSignIn() {
  const app = await telegramApp();
  app.ready();
  app.expand();
  const { data } = await api.post('/auth/webapp', { initData: app.initData });
  localStorage.setItem('giftory_token', data.token);
  if (/^[\w-]{4,20}$/.test(data.startParam || '') && location.pathname === '/') {
    history.replaceState(null, '', `/w/${data.startParam}`);
    dispatchEvent(new PopStateEvent('popstate'));
  }
  if (!data.user.botOk) app.requestWriteAccess?.((ok) => ok && api.post('/bot/allow'));
  return data.user;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const { lang } = usePrefs();
  const qc = useQueryClient();

  useEffect(() => {
    const load = inTelegram()
      ? telegramSignIn().catch(() => null)
      : localStorage.getItem('giftory_token')
        ? api.get('/auth/me').then((r) => r.data.user).catch(() => { localStorage.removeItem('giftory_token'); return null; })
        : Promise.resolve(null);
    load.then(setUser).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (user && user.lang !== lang) api.patch('/auth/me', { lang }).then((r) => setUser(r.data.user)).catch(() => {});
  }, [user?.id, lang]);

  const signIn = ({ token, user }) => {
    localStorage.setItem('giftory_token', token);
    setUser(user);
    qc.invalidateQueries();
  };

  const signOut = () => {
    localStorage.removeItem('giftory_token');
    setUser(null);
    qc.clear();
  };

  return <AuthContext.Provider value={{ user, ready, signIn, signOut, setUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

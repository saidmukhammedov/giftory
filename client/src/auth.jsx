import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (!localStorage.getItem('giftory_token')) return setReady(true);
    api.get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem('giftory_token'))
      .finally(() => setReady(true));
  }, []);

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

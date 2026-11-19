import { useQuery } from '@tanstack/react-query';
import api from './api';

export const useProviders = () =>
  useQuery({ queryKey: ['providers'], queryFn: () => api.get('/auth/providers').then((r) => r.data), staleTime: Infinity }).data;
export const useTelegramEnabled = () => useProviders()?.telegram;

export const telegramLoginUrl = (next) => `/api/auth/telegram/start${next ? `?next=${encodeURIComponent(next)}` : ''}`;

export async function connectTelegram() {
  const { ticket } = (await api.post('/auth/telegram/link')).data;
  window.location.href = `/api/auth/telegram/start?ticket=${encodeURIComponent(ticket)}`;
}

export const TELEGRAM_ERRORS = { telegram: 'tgError', telegram_off: 'tgOff', telegram_taken: 'tgTaken' };

export const inTelegram = () => /tgWebApp/.test(location.hash + location.search);

export function telegramApp() {
  if (window.Telegram?.WebApp) return Promise.resolve(window.Telegram.WebApp);
  return new Promise((resolve, reject) => {
    const s = Object.assign(document.createElement('script'), { src: 'https://telegram.org/js/telegram-web-app.js', async: true });
    s.onload = () => resolve(window.Telegram.WebApp);
    s.onerror = reject;
    document.head.append(s);
  });
}

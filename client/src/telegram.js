import { useQuery } from '@tanstack/react-query';
import api from './api';

// Whether the server has Telegram login configured
export const useTelegramEnabled = () =>
  useQuery({ queryKey: ['providers'], queryFn: () => api.get('/auth/providers').then((r) => r.data.telegram), staleTime: Infinity }).data;

export const telegramLoginUrl = (next) => `/api/auth/telegram/start${next ? `?next=${encodeURIComponent(next)}` : ''}`;

// Logged-in user connects Telegram: get a short ticket, then go through the same Telegram flow
export async function connectTelegram() {
  const { ticket } = (await api.post('/auth/telegram/link')).data;
  window.location.href = `/api/auth/telegram/start?ticket=${encodeURIComponent(ticket)}`;
}

export const TELEGRAM_ERRORS = { telegram: 'tgError', telegram_off: 'tgOff', telegram_taken: 'tgTaken' };

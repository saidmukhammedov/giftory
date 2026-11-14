import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('giftory_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errorText = (e) => e?.response?.data?.message || 'Could not reach Giftory. Check your connection and try again.';

export default api;

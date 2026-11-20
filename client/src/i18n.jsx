import { createContext, Fragment, useContext, useEffect, useState } from 'react';
import { errorText } from './api';
import en from './locales/en';
import ru from './locales/ru';
import uz from './locales/uz';

const DICTS = { en, uz, ru };
export const LANGS = ['en', 'uz', 'ru'];
const LOCALES = { ru: 'ru-RU', en: 'en-GB' };
const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const UZ_DAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
const uzDate = (d, o) => [o.year && `${d.getFullYear()}-yil`, `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}`].filter(Boolean).join(' ') + (o.weekday ? `, ${UZ_DAYS[d.getDay()]}` : '');
const pluralIndex = (lang, n) => {
  if (lang === 'uz') return 0;
  if (lang === 'en') return n === 1 ? 0 : 1;
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 1 : 2;
};
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

const PrefsContext = createContext(null);
const saved = (k, fallback) => { try { return localStorage.getItem(k) || fallback; } catch { return fallback; } };

export function PrefsProvider({ children }) {
  const [lang, setLang] = useState(() => { const l = saved('giftory_lang', 'en'); return DICTS[l] ? l : 'en'; });
  const [theme, setTheme] = useState(() => saved('giftory_theme', 'light'));

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('giftory_lang', lang); } catch {}
  }, [lang]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('giftory_theme', theme); } catch {}
  }, [theme]);

  const dict = DICTS[lang] || en;
  const t = (key, vars = {}) => {
    const v = dict[key] ?? en[key] ?? key;
    return fill(Array.isArray(v) ? v[pluralIndex(lang, vars.n)] : v, vars);
  };
  t.rich = (key, nodes) => (dict[key] ?? en[key]).split(/(\{\w+\})/).map((part, i) => {
    const m = part.match(/^\{(\w+)\}$/);
    return <Fragment key={i}>{m ? nodes[m[1]] : part}</Fragment>;
  });
  t.occasion = (o) => dict.occasions?.[o] || en.occasions[o] || o;
  t.prio = (p) => (dict.prio || en.prio)[p];
  t.error = (e) => { const msg = e?.isApiError || !e?.message ? errorText(e) : e.message; return dict.errors?.[msg] || msg; };
  t.date = (d, opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) => {
    if (!d) return '';
    const date = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00`) : new Date(d);
    return lang === 'uz' ? uzDate(date, opts) : date.toLocaleDateString(LOCALES[lang], opts);
  };

  return <PrefsContext.Provider value={{ t, lang, setLang, theme, setTheme }}>{children}</PrefsContext.Provider>;
}

export const usePrefs = () => useContext(PrefsContext);
export const useT = () => useContext(PrefsContext).t;

import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TELEGRAM_ERRORS } from '../telegram';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { Page, Header } from '../components/Layout';
import { Check, Chevron, Plus } from '../components/Icons';
import { BirthdayBanner, isBirthdayToday } from '../components/Birthday';

const OCCASIONS = ['Birthday', 'Wedding', 'New home', 'New baby', 'Graduation', 'Just because'];

const iso = (d) => d.toLocaleDateString('en-CA');
const today = () => iso(new Date());
const nextDate = (md) => {
  const y = new Date().getFullYear();
  return `${y}-${md}` >= today() ? `${y}-${md}` : `${y + 1}-${md}`;
};
const daysUntil = (date) => Math.round((new Date(`${date}T00:00`) - new Date(`${today()}T00:00`)) / 864e5);

const TEMPLATES = [
  { key: 'tplBirthday', occasion: 'Birthday', date: (u) => (u.birthday ? nextDate(u.birthday.slice(5, 10)) : '') },
  { key: 'tplWedding', occasion: 'Wedding', date: () => '' },
  { key: 'tplHome', occasion: 'New home', date: () => '' },
  { key: 'tplNewYear', occasion: 'Just because', date: () => nextDate('12-31') },
];

function NewListForm({ onCancel, initial }) {
  const t = useT();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', occasion: 'Birthday', eventDate: '', note: '', ...initial });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const create = useMutation({
    mutationFn: () => api.post('/wishlists', { ...form, eventDate: form.eventDate || undefined }),
    onSuccess: (r) => navigate(`/w/${r.data.slug}`),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="glass-card flex flex-col gap-5 p-7">
      <h2 className="display text-3xl">{t('newList')}</h2>
      <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
        <label className="flex flex-col gap-2 font-bold">
          {t('listName')}
          <input className="input font-normal" required autoFocus value={form.title} onChange={set('title')} placeholder={t('listNamePh')} />
        </label>
        <label className="flex flex-col gap-2 font-bold">
          {t('occasion')}
          <select className="input font-normal" value={form.occasion} onChange={set('occasion')}>
            {OCCASIONS.map((o) => <option key={o} value={o}>{t.occasion(o)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 font-bold">
          {t('date')}
          <input className="input font-normal" type="date" value={form.eventDate} onChange={set('eventDate')} />
        </label>
      </div>
      <label className="flex flex-col gap-2 font-bold">
        {t('noteForFriends')} <span className="text-sm font-normal text-mute">{t('noteHint')}</span>
        <input className="input font-normal" value={form.note} onChange={set('note')} placeholder={t('notePh')} />
      </label>
      {create.isError && <p role="alert" className="bg-ink p-3 font-semibold text-paper">{t.error(create.error)}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-outline" onClick={onCancel}>{t('cancel')}</button>
        <button className="btn btn-primary" disabled={create.isPending}>{t(create.isPending ? 'creating' : 'createList')}</button>
      </div>
    </form>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const t = useT();
  const [creating, setCreating] = useState(null);
  const newButton = useRef(null);
  const cancel = () => { setCreating(null); requestAnimationFrame(() => newButton.current?.focus()); };
  const start = (tpl) => setCreating(tpl ? { title: t(tpl.key), occasion: tpl.occasion, eventDate: tpl.date(user) } : {});
  const tgError = TELEGRAM_ERRORS[useSearchParams()[0].get('error')];
  const { data: lists, isLoading, isError, error } = useQuery({ queryKey: ['my-lists'], queryFn: () => api.get('/wishlists/mine').then((r) => r.data) });

  return (
    <Page shapes={[['circle', 480, { right: -140, top: 160 }], ['square', 300, { left: -60, top: 760, rotate: '-10deg' }]]}>
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[1376px] flex-col gap-8 px-4 pb-24 pt-12 outline-none sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-lg text-mute">{t('hi', { name: user.name })}</p>
            <h1 className="display mt-2 text-[clamp(40px,5vw,72px)]">{t('yourLists')}</h1>
          </div>
          {!creating && <button ref={newButton} className="btn btn-primary" onClick={() => start()}><Plus size={18} /> {t('newList')}</button>}
        </div>

        {lists?.filter(isBirthdayToday).slice(0, 1).map((l) => <BirthdayBanner key={l.id} name={user.name.split(' ')[0]} picked={l.reserved} />)}
        {tgError && <p role="alert" className="bg-ink p-4 font-semibold text-paper">{t(tgError)}</p>}
        {creating && <NewListForm key={creating.title} initial={creating} onCancel={cancel} />}
        {isError && <p role="alert" className="bg-ink p-4 font-semibold text-paper">{t.error(error)}</p>}
        {isLoading && <p className="text-mute">{t('loadingLists')}</p>}

        {lists && <Countdown lists={lists} />}

        {lists?.length === 0 && !creating && (
          <section aria-labelledby="templates" className="glass-card flex flex-col gap-6 p-7">
            <div>
              <h2 id="templates" className="display text-3xl">{t('noListsTitle')}</h2>
              <p className="mt-2 max-w-xl text-mute">{t('templatesText')}</p>
            </div>
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr))]">
              {TEMPLATES.map((tpl) => {
                const date = tpl.date(user);
                return (
                  <button key={tpl.key} onClick={() => start(tpl)} className="tag-h group flex cursor-pointer flex-col items-start gap-1 border-2 border-ink bg-paper p-5 text-left hover:bg-ink hover:text-paper">
                    <span className="display text-2xl">{t(tpl.key)}</span>
                    <span className="text-sm text-mute group-hover:text-paper/70">{date ? t.date(date) : t('pickDateLater')}</span>
                  </button>
                );
              })}
            </div>
            <button className="btn btn-outline self-start" onClick={() => start()}>{t('fromScratch')}</button>
          </section>
        )}

        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(380px,100%),1fr))]">
          {lists?.map((l) => (
            <Link key={l.id} to={`/w/${l.slug}`} className="glass-card tag-h group relative flex flex-col gap-4 py-7 pl-16 pr-7 no-underline">
              <span className="absolute left-5 top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-paper shadow-[0_0_0_2px_var(--color-ink)]" />
              <div>
                <p className="text-sm font-bold text-mute">{[l.occasion && t.occasion(l.occasion), t.date(l.eventDate)].filter(Boolean).join(', ')}</p>
                <h2 className="display mt-1 text-3xl group-hover:text-signal">{l.title}</h2>
              </div>
              <div className="flex gap-1.5" aria-hidden="true">
                {Array.from({ length: Math.max(l.total, 1) }, (_, i) => (
                  <span key={i} className={`h-2.5 flex-1 ${i < l.reserved ? 'bg-signal' : 'bg-ink/15'}`} />
                ))}
              </div>
              <p className="font-semibold">{l.total ? t('pickedOf', { p: l.reserved, t: l.total }) : t('noWishesYet')}</p>
            </Link>
          ))}
        </div>

        {lists && <GettingStarted lists={lists} onCreate={() => start(TEMPLATES[0])} />}
        <Upcoming />
      </main>
    </Page>
  );
}

function Countdown({ lists }) {
  const t = useT();
  const next = lists
    .filter((l) => l.eventDate && daysUntil(l.eventDate.slice(0, 10)) > 0)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))[0];
  if (!next) return null;
  const days = daysUntil(next.eventDate.slice(0, 10));
  return (
    <Link to={`/w/${next.slug}`} className="glass-dark group flex flex-wrap items-center gap-x-8 gap-y-4 p-7 no-underline">
      <p className="display text-[clamp(64px,9vw,120px)] leading-none text-signal">{days}</p>
      <div className="min-w-0 flex-1 break-words">
        <p className="text-lg font-semibold">{t('daysUntil', { n: days })}</p>
        <p className="display mt-1 text-[clamp(26px,3vw,40px)]">{next.title}</p>
        <p className="mt-2 opacity-75">{next.total ? t('pickedOf', { p: next.reserved, t: next.total }) : t('noWishesYet')}</p>
      </div>
      <Chevron size={32} className="transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function GettingStarted({ lists, onCreate }) {
  const t = useT();
  const { user } = useAuth();
  const first = lists[0];
  let shared = false;
  try { shared = localStorage.getItem('giftory_shared') === '1'; } catch { shared = false; }
  const steps = [
    { key: 'stepList', done: lists.length > 0, action: <button className="cursor-pointer font-semibold underline" onClick={onCreate}>{t('stepListGo')}</button> },
    { key: 'stepWishes', done: lists.some((l) => l.total >= 3), action: first && <Link to={`/w/${first.slug}`} className="font-semibold underline">{t('stepWishesGo')}</Link> },
    { key: 'stepShare', done: shared || lists.some((l) => l.reserved > 0), action: first && <Link to={`/w/${first.slug}`} className="font-semibold underline">{t('stepShareGo')}</Link> },
    { key: 'stepBirthday', done: Boolean(user.birthday), action: <Link to="/profile" className="font-semibold underline">{t('stepBirthdayGo')}</Link> },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  return (
    <section aria-labelledby="start" className="glass-card flex flex-col gap-5 p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="start" className="display text-3xl">{t('startTitle')}</h2>
        <p className="font-semibold text-mute">{t('startProgress', { d: done, n: steps.length })}</p>
      </div>
      <div className="flex gap-1.5" aria-hidden="true">
        {steps.map((s) => <span key={s.key} className={`h-2.5 flex-1 ${s.done ? 'bg-signal' : 'bg-ink/15'}`} />)}
      </div>
      <ol className="grid gap-3 md:grid-cols-2">
        {steps.map((s) => (
          <li key={s.key} className="flex items-start gap-3">
            <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${s.done ? 'bg-signal text-on-signal' : 'shadow-[inset_0_0_0_2px_var(--color-ink)]'}`}>
              {s.done && <Check size={14} />}
              <span className="sr-only">{t(s.done ? 'stepDone' : 'stepTodo')}</span>
            </span>
            <div>
              <p className={`font-bold ${s.done ? 'text-mute line-through' : ''}`}>{t(s.key)}</p>
              {!s.done && s.action}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Upcoming() {
  const t = useT();
  const { data: people } = useQuery({ queryKey: ['follows'], queryFn: () => api.get('/follows').then((r) => r.data) });
  if (!people?.length) return null;
  const when = (p) => {
    if (p.daysUntil == null) return t('noBirthday');
    if (p.daysUntil === 0) return t('birthdayToday');
    const [m, d] = p.birthday.split('-').map(Number);
    return t('birthdayIn', { n: p.daysUntil, date: t.date(new Date(2000, m - 1, d), { day: 'numeric', month: 'long' }) });
  };
  return (
    <section aria-labelledby="upcoming" className="flex flex-col gap-5 pt-8">
      <div>
        <h2 id="upcoming" className="display text-[clamp(30px,3.6vw,48px)]">{t('upcomingTitle')}</h2>
        <p className="mt-1 text-mute">{t('upcomingSub')}</p>
      </div>
      <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr))]">
        {people.map((p) => (
          <li key={p.id} className="glass-card flex items-center gap-4 p-5">
            {p.avatarUrl ? (
              <img src={p.avatarUrl} alt="" className="size-12 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="display grid size-12 shrink-0 place-items-center rounded-full bg-signal text-xl text-on-signal">{p.name[0]?.toUpperCase()}</span>
            )}
            <div className="min-w-0 flex-1 break-words">
              <p className="font-bold">{p.name}</p>
              <p className={`text-sm ${p.daysUntil != null && p.daysUntil <= 7 ? 'font-bold text-signal-deep' : 'text-mute'}`}>{when(p)}</p>
              {p.list && <Link to={`/w/${p.list.slug}`} className="text-sm font-semibold">{p.list.title}</Link>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

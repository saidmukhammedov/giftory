import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TELEGRAM_ERRORS } from '../telegram';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { Page, Header } from '../components/Layout';
import { Plus } from '../components/Icons';

// Stored in English, shown in the current language
const OCCASIONS = ['Birthday', 'Wedding', 'New home', 'New baby', 'Graduation', 'Just because'];

function NewListForm({ onCancel }) {
  const t = useT();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', occasion: 'Birthday', eventDate: '', note: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const create = useMutation({
    mutationFn: () => api.post('/wishlists', { ...form, eventDate: form.eventDate || undefined }),
    onSuccess: (r) => navigate(`/w/${r.data.slug}`),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="glass flex flex-col gap-5 p-7">
      <h2 className="display text-3xl">{t('newList')}</h2>
      <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
        <label className="flex flex-col gap-2 font-bold">
          {t('listName')}
          <input className="input font-normal" required value={form.title} onChange={set('title')} placeholder={t('listNamePh')} />
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
  const [creating, setCreating] = useState(false);
  const tgError = TELEGRAM_ERRORS[useSearchParams()[0].get('error')];
  const { data: lists, isLoading, isError, error } = useQuery({ queryKey: ['my-lists'], queryFn: () => api.get('/wishlists/mine').then((r) => r.data) });

  return (
    <Page shapes={[['circle', 480, { right: -140, top: 160 }], ['square', 300, { left: -60, top: 760, rotate: '-10deg' }]]}>
      <Header />
      <main className="mx-auto flex max-w-[1376px] flex-col gap-8 px-4 pb-24 pt-12 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-lg text-mute">{t('hi', { name: user.name })}</p>
            <h1 className="display mt-2 text-[clamp(40px,5vw,72px)]">{t('yourLists')}</h1>
          </div>
          {!creating && <button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={18} /> {t('newList')}</button>}
        </div>

        {tgError && <p role="alert" className="bg-ink p-4 font-semibold text-paper">{t(tgError)}</p>}
        {creating && <NewListForm onCancel={() => setCreating(false)} />}
        {isError && <p role="alert" className="bg-ink p-4 font-semibold text-paper">{t.error(error)}</p>}
        {isLoading && <p className="text-mute">{t('loadingLists')}</p>}

        {lists?.length === 0 && !creating && (
          <div className="glass flex flex-col items-center gap-4 px-6 py-16 text-center">
            <p className="display text-3xl">{t('noListsTitle')}</p>
            <p className="max-w-md text-mute">{t('noListsText')}</p>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>{t('firstList')}</button>
          </div>
        )}

        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(380px,100%),1fr))]">
          {lists?.map((l) => (
            <Link key={l.id} to={`/w/${l.slug}`} className="glass tag-h group relative flex flex-col gap-4 py-7 pl-16 pr-7 no-underline">
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
      </main>
    </Page>
  );
}

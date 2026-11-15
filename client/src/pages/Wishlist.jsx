import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { Page, Header, Footer } from '../components/Layout';
import { Tag, ItemTile } from '../components/Tag';
import AddItemModal from '../components/AddItemModal';
import { BirthdayBanner, isBirthdayToday } from '../components/Birthday';
import { Check, External, Lock, Plus, Send, Trash, Back } from '../components/Icons';
import { som } from '../utils';

const SHAPES = [['circle', 460, { right: -120, top: -130 }], ['square', 320, { left: -80, top: 700, rotate: '14deg' }]];
const PRIORITY = { high: ['prioHigh', 'bg-signal text-black'], medium: ['prioMedium', 'bg-ink text-paper'] };
const AMOUNTS = [100000, 250000, 500000];

export default function Wishlist() {
  const { slug } = useParams();
  const t = useT();
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['wishlist', slug], queryFn: () => api.get(`/wishlists/${slug}`).then((r) => r.data) });

  return (
    <Page shapes={SHAPES}>
      <Header />
      {isLoading && <p className="mx-auto max-w-[1376px] px-8 py-24 text-mute">{t('opening')}</p>}
      {isError && (
        <div className="mx-auto flex max-w-[1376px] flex-col items-start gap-5 px-8 py-24">
          <h1 className="display text-5xl">{t('cantOpen')}</h1>
          <p className="text-lg text-mute">{t.error(error)}</p>
          <Link to="/" className="btn btn-primary">{t('goHome')}</Link>
        </div>
      )}
      <main id="main" tabIndex={-1} className="outline-none">
        {data && (data.isOwner ? <OwnerView {...data} /> : <FriendView {...data} />)}
      </main>
      <Footer />
    </Page>
  );
}

function ListHeader({ wishlist, aside }) {
  const t = useT();
  return (
    <section className="mx-auto flex max-w-[1376px] flex-wrap items-end justify-between gap-10 px-4 pb-10 pt-14 sm:px-8">
      <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-5">
        <div className="flex items-center gap-3.5">
          <span className="display grid size-14 place-items-center rounded-full bg-signal text-2xl text-black">{wishlist.owner.name?.[0]?.toUpperCase()}</span>
          <div>
            <p className="font-semibold">{wishlist.owner.name}</p>
            <p className="text-mute">{[wishlist.occasion && t.occasion(wishlist.occasion), t.date(wishlist.eventDate)].filter(Boolean).join(', ')}</p>
          </div>
        </div>
        <h1 className="display text-[clamp(42px,5.6vw,88px)]">{wishlist.title}</h1>
        {wishlist.note && <p className="max-w-[34em] text-lg text-mute">“{wishlist.note}”</p>}
      </div>
      {aside}
    </section>
  );
}

function Price({ item }) {
  const t = useT();
  return <p className="display whitespace-nowrap text-lg tracking-tight">{som(item.price)} {t('som')}</p>;
}

function FriendView({ wishlist, items }) {
  const { user } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [amounts, setAmounts] = useState({});
  const [flash, setFlash] = useState('');

  const act = useMutation({
    mutationFn: ({ method, url, body }) => api[method](url, body),
    onSuccess: async (_, { focus = [] }) => {
      await qc.invalidateQueries({ queryKey: ['wishlist', wishlist.slug] });
      requestAnimationFrame(() => focus.map((id) => document.getElementById(id)).find(Boolean)?.focus());
    },
    onError: (e) => {
      setFlash(t.error(e));
      qc.invalidateQueries({ queryKey: ['wishlist', wishlist.slug] });
    },
  });
  const run = (req) => {
    if (!user) return navigate(`/login?next=/w/${wishlist.slug}`);
    setFlash('');
    act.mutate(req);
  };

  const left = (i) => i.price - i.funded;
  const isOpen = (i) => (i.isGroupGift ? left(i) > 0 : !i.isReserved);
  const isMine = (i) => i.reservedByMe || i.myContribution > 0;
  const shown = items.filter((i) => filter === 'all' || (filter === 'free' ? isOpen(i) : isMine(i)));
  const taken = items.filter((i) => !i.isGroupGift && i.isReserved).length;

  return (
    <>
      <ListHeader
        wishlist={wishlist}
        aside={
          <div className="glass-dark flex flex-[0_1_380px] items-start gap-3.5 p-6">
            <Lock size={26} className="mt-0.5 shrink-0 text-signal" />
            <p>{t('secret', { name: wishlist.owner.name })}</p>
          </div>
        }
      />

      <section className="mx-auto flex max-w-[1376px] flex-wrap items-center justify-between gap-4 px-4 pb-7 sm:px-8">
        <div role="group" aria-label={t('filterAria')} className="flex flex-wrap gap-2.5">
          {[['all', 'allWishes'], ['free', 'available'], ['mine', 'mine']].map(([v, label]) => (
            <button key={v} className="chip" aria-pressed={filter === v} onClick={() => setFilter(v)}>{t(label)}</button>
          ))}
        </div>
        <p className="text-mute">{t('wishes', { n: items.length })}, {t('alreadyReserved', { n: taken })}</p>
      </section>

      {flash && <p role="alert" className="mx-auto mb-6 max-w-[1312px] bg-ink p-4 font-semibold text-paper">{flash}</p>}

      <section className="mx-auto max-w-[1376px] px-4 pb-24 sm:px-8">
        {shown.length === 0 && (
          <div className="glass-card flex flex-col items-center gap-4 px-6 py-14 text-center">
            <p className="display text-3xl">{t(filter === 'mine' ? 'noneMine' : 'nonePicked')}</p>
            <button className="btn btn-primary" onClick={() => setFilter('all')}>{t('showAll')}</button>
          </div>
        )}
        <div className="grid gap-x-7 gap-y-8 [grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr))]">
          {shown.map((item) => {
            const index = items.indexOf(item);
            const takenByOther = item.isReserved && !item.reservedByMe;
            const amount = Math.min(amounts[item.id] || 250000, left(item));
            return (
              <Tag key={item.id} className={`[contain-intrinsic-size:auto_540px] [content-visibility:auto] ${takenByOther ? 'opacity-80' : ''}`}>
                <ItemTile item={item} index={index} wrapped={!item.isGroupGift && item.isReserved} />
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap gap-2">
                    {item.isGroupGift && <span className="bg-stone px-2.5 py-1 text-[13px] font-bold">{t('groupGift')}</span>}
                    {!item.isReserved && PRIORITY[item.priority] && <span className={`px-2.5 py-1 text-[13px] font-bold ${PRIORITY[item.priority][1]}`}>{t(PRIORITY[item.priority][0])}</span>}
                  </div>
                  <h2 className="text-xl font-bold leading-tight">{item.name}</h2>
                  <Price item={item} />
                </div>
                {item.note && !takenByOther && <p className="text-[15px] leading-normal text-mute">{item.note}</p>}
                {item.link && !takenByOther && (
                  <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 self-start font-semibold">
                    {t('openStore')} <External />
                  </a>
                )}

                <div className="mt-auto flex flex-col gap-3 pt-1">
                  {!item.isGroupGift && !item.isReserved && (
                    <button id={`reserve-${item.id}`} className="btn btn-primary" disabled={act.isPending} onClick={() => run({ method: 'post', url: `/items/${item.id}/reserve`, focus: [`mine-${item.id}`] })}>
                      {t('reserve')}
                    </button>
                  )}
                  {item.reservedByMe && (
                    <>
                      <span id={`mine-${item.id}`} tabIndex={-1} className="btn btn-outline cursor-default shadow-[inset_0_0_0_2px_var(--color-signal)] hover:!bg-field hover:!text-ink"><Check size={18} /> {t('reservedByYou')}</span>
                      <button className="min-h-11 cursor-pointer font-semibold underline" onClick={() => run({ method: 'delete', url: `/items/${item.id}/reserve`, focus: [`reserve-${item.id}`] })}>{t('cancelReservation')}</button>
                    </>
                  )}
                  {takenByOther && <p className="border-t-2 border-ink/15 pt-3 text-center font-semibold text-mute">{t('takenByOther')}</p>}

                  {item.isGroupGift && (
                    <>
                      <div className="bar" role="progressbar" aria-label={t('raisedAria')} aria-valuemin={0} aria-valuemax={item.price} aria-valuenow={item.funded}>
                        <span style={{ width: `${Math.min(100, (item.funded / item.price) * 100)}%` }} />
                      </div>
                      <div className="flex flex-wrap justify-between gap-2 text-sm">
                        <span className="font-semibold">{t('raised', { x: som(item.funded) })}</span>
                        <span className="text-mute">{t('chipped', { n: item.contributors })}</span>
                      </div>
                      {left(item) > 0 ? (
                        <>
                          <div role="group" aria-label={t('amountAria')} className="flex gap-2">
                            {AMOUNTS.filter((a) => a <= left(item)).map((a) => (
                              <button key={a} className="chip flex-1 px-1.5 text-sm" aria-pressed={amount === a} onClick={() => setAmounts({ ...amounts, [item.id]: a })}>{som(a)}</button>
                            ))}
                          </div>
                          <button id={`chip-${item.id}`} className="btn btn-primary" disabled={act.isPending} onClick={() => run({ method: 'post', url: `/items/${item.id}/contribute`, body: { amount }, focus: [`chip-${item.id}`, `funded-${item.id}`] })}>
                            {t('chipIn', { x: som(amount) })}
                          </button>
                        </>
                      ) : (
                        <p id={`funded-${item.id}`} tabIndex={-1} className="text-center font-bold text-signal-deep">{t('fullyFunded')}</p>
                      )}
                      {item.myContribution > 0 && <p className="text-center text-sm text-mute">{t('youChipped', { x: som(item.myContribution) })}</p>}
                    </>
                  )}
                </div>
              </Tag>
            );
          })}
        </div>
      </section>
    </>
  );
}

function OwnerView({ wishlist, items }) {
  const t = useT();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const url = `${window.location.origin}/w/${wishlist.slug}`;
  const picked = items.filter((i) => !i.isGroupGift && i.isReserved).length;
  const refresh = () => qc.invalidateQueries({ queryKey: ['wishlist', wishlist.slug] });

  const removeItem = useMutation({ mutationFn: (id) => api.delete(`/items/${id}`), onSuccess: refresh });
  const removeList = useMutation({ mutationFn: () => api.delete(`/wishlists/${wishlist.id}`), onSuccess: () => navigate('/dashboard') });

  const [copied, setCopied] = useState('');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied('copied');
    } catch {
      document.getElementById('share')?.select();
      setCopied('copyManual');
    }
    setTimeout(() => setCopied(''), 4000);
  };

  return (
    <>
      <div className="mx-auto flex max-w-[1376px] flex-col gap-8 px-4 pt-10 sm:px-8">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 self-start font-semibold no-underline"><Back /> {t('allLists')}</Link>
        {isBirthdayToday(wishlist) && <BirthdayBanner name={wishlist.owner.name?.split(' ')[0]} picked={picked} />}
      </div>
      <ListHeader
        wishlist={wishlist}
        aside={
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-outline" onClick={() => confirm(t('confirmDeleteList', { t: wishlist.title })) && removeList.mutate()}>{t('deleteList')}</button>
            <button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={18} /> {t('addWish')}</button>
          </div>
        }
      />

      <section className="mx-auto grid max-w-[1376px] gap-5 px-4 pb-10 sm:px-8 md:grid-cols-2">
        <div className="glass-card flex flex-col gap-3.5 p-7">
          <label htmlFor="share" className="font-bold">{t('shareLink')}</label>
          <p role="status" className="sr-only">{copied && t(copied)}</p>
          <div className="flex flex-wrap gap-2.5">
            <input id="share" readOnly value={url} className="input min-w-0 flex-[1_1_200px] font-medium" onFocus={(e) => e.target.select()} />
            <button className="btn btn-primary" onClick={copy}>{t(copied || 'copyLink')}</button>
            <a className="btn btn-outline" href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(wishlist.title)}`} target="_blank" rel="noreferrer">
              <Send size={18} /> Telegram
            </a>
          </div>
        </div>
        <div className="glass-dark flex flex-col justify-center gap-4 p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="display text-3xl">{t('pickedOf', { p: picked, t: items.length })}</span>
            <span className="text-paper/70">{t('namesHidden')}</span>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {items.map((i, n) => <span key={i.id} className={`h-2.5 flex-1 ${n < picked ? 'bg-signal' : 'bg-paper/20'}`} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1376px] px-4 pb-24 sm:px-8">
        <div className="grid gap-x-6 gap-y-8 [grid-template-columns:repeat(auto-fill,minmax(min(270px,100%),1fr))]">
          <button onClick={() => setAdding(true)} className="glass-card flex min-h-[400px] cursor-pointer flex-col items-center justify-center gap-3.5 edge hover:bg-paper/80">
            <span className="grid size-16 place-items-center rounded-full bg-signal text-black"><Plus size={28} /></span>
            <span className="text-lg font-bold">{t('addWish')}</span>
            <span className="max-w-[14em] text-center text-mute">{t('addTileText')}</span>
          </button>

          {items.map((item, index) => {
            const hidden = !item.isGroupGift && item.isReserved;
            const pct = Math.round((item.funded / item.price) * 100) || 0;
            return (
              <Tag key={item.id} className="[contain-intrinsic-size:auto_540px] [content-visibility:auto] pb-3.5">
                <ItemTile item={item} index={index} wrapped={hidden} hideImage={hidden} />
                {hidden ? (
                  <div>
                    <h2 className="text-lg font-bold">{t('friendPicked')}</h2>
                    <p className="text-mute">{t('findOut')}</p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-lg font-bold leading-tight">{item.name}</h2>
                    <Price item={item} />
                  </div>
                )}
                {item.isGroupGift && (
                  <div className="flex flex-col gap-2">
                    <div className="bar"><span style={{ width: `${Math.min(100, pct)}%` }} /></div>
                    <span className="text-sm text-mute">{t('groupRaised', { p: pct })}</span>
                  </div>
                )}
                <div className="mt-auto flex min-h-11 items-center justify-between gap-2 border-t-2 border-ink/15 pt-2">
                  <span className="text-sm font-semibold text-mute">{t(hidden ? 'statusReserved' : item.isGroupGift ? 'statusChipping' : 'statusWaiting')}</span>
                  {!hidden && (
                    <button
                      className="grid size-11 cursor-pointer place-items-center rounded-full hover:bg-ink hover:text-paper"
                      aria-label={t('removeItem', { name: item.name })}
                      onClick={() => confirm(t('confirmRemove', { name: item.name })) && removeItem.mutate(item.id)}
                    >
                      <Trash size={18} />
                    </button>
                  )}
                </div>
              </Tag>
            );
          })}
        </div>
      </section>

      {adding && <AddItemModal list={wishlist} onClose={() => setAdding(false)} />}
    </>
  );
}

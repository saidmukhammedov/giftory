import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { Page, Header } from '../components/Layout';
import { Tag, ItemTile } from '../components/Tag';
import AddItemModal from '../components/AddItemModal';
import { BirthdayBanner, isBirthdayToday } from '../components/Birthday';
import JoinDialog from '../components/JoinDialog';
import QrDialog from '../components/QrDialog';
import { Bell, Check, External, Lock, Plus, Qr, Send, Trash, Back } from '../components/Icons';
import { som } from '../utils';

const today = () => new Date().toLocaleDateString('en-CA');
const isPast = (w) => !!w.eventDate && w.eventDate < today();

const PRIORITY = { high: ['prioHigh', 'bg-signal text-on-signal'], medium: ['prioMedium', 'bg-mint text-[#17171A]'] };
const AMOUNTS = [100000, 250000, 500000];

export default function Wishlist() {
  const { slug } = useParams();
  const t = useT();
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['wishlist', slug], queryFn: () => api.get(`/wishlists/${slug}`).then((r) => r.data) });

  return (
    <Page>
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
    </Page>
  );
}

function ListHeader({ wishlist, aside }) {
  const t = useT();
  const { owner } = wishlist;
  return (
    <section className="mx-auto flex max-w-[1376px] flex-wrap items-end justify-between gap-10 px-4 pb-10 pt-14 sm:px-8">
      <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-5">
        <div className="flex items-center gap-3.5">
          {owner.avatarUrl ? (
            <img src={owner.avatarUrl} alt="" className="size-14 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="display grid size-14 shrink-0 place-items-center rounded-full bg-signal text-2xl text-on-signal">{owner.name?.[0]?.toUpperCase()}</span>
          )}
          <div className="min-w-0 break-words">
            <p className="font-semibold">{owner.name}</p>
            <p className="text-mute">{[wishlist.occasion && t.occasion(wishlist.occasion), t.date(wishlist.eventDate)].filter(Boolean).join(', ')}</p>
          </div>
        </div>
        <h1 className="display break-words text-[clamp(42px,5.6vw,88px)]">{wishlist.title}</h1>
        {wishlist.note && <p className="max-w-[34em] text-lg text-mute">“{wishlist.note}”</p>}
      </div>
      {aside}
    </section>
  );
}

function Thanks({ wishlist }) {
  const t = useT();
  if (!wishlist.thanks) return null;
  return (
    <section className="mx-auto max-w-[1376px] px-4 pb-8 sm:px-8">
      <div className="flex flex-col gap-2 rounded-[28px] bg-sun p-7 text-[#17171A]">
        <p className="font-bold">{t('thanksFrom', { name: wishlist.owner.name })}</p>
        <p className="max-w-[40em] text-lg">“{wishlist.thanks}”</p>
      </div>
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
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [amounts, setAmounts] = useState({});
  const [flash, setFlash] = useState('');
  const [pending, setPending] = useState(null);
  const past = isPast(wishlist);
  const ownerFirst = wishlist.owner.name?.split(' ')[0];

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
    if (!user) return setPending(req);
    setFlash('');
    act.mutate(req);
  };

  const left = (i) => i.price - i.funded;
  const isOpen = (i) => (i.isGroupGift ? left(i) > 0 : !i.isReserved);
  const isMine = (i) => i.reservedByMe || i.myContribution > 0;
  const shown = items.filter((i) => filter === 'all' || (filter === 'free' ? isOpen(i) : isMine(i)));
  const taken = items.filter((i) => !i.isGroupGift && i.isReserved).length;
  const following = wishlist.owner.following;
  const follow = { method: following ? 'delete' : 'post', url: `/follows/${wishlist.owner.id}`, focus: ['follow'] };

  return (
    <>
      <ListHeader
        wishlist={wishlist}
        aside={
          <div className="flex flex-[0_1_380px] flex-col gap-3">
            <p className="flex items-start gap-3 text-[15px] leading-snug text-mute">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-signal text-on-signal"><Lock size={18} /></span>
              <span className="pt-1">{t('secret', { name: wishlist.owner.name })}</span>
            </p>
            {user?.id !== wishlist.owner.id && (
              <button id="follow" className={`btn ${following ? 'btn-outline' : 'btn-primary'}`} aria-pressed={following} disabled={act.isPending} onClick={() => run(follow)}>
                <Bell size={18} /> {t(following ? 'following' : 'followBirthday', { name: ownerFirst })}
              </button>
            )}
          </div>
        }
      />
      <Thanks wishlist={wishlist} />

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
            const named = `name-${item.id}`;
            return (
              <Tag key={item.id} className={`${takenByOther ? 'opacity-80' : ''}`}>
                <ItemTile item={item} index={index} wrapped={!item.isGroupGift && item.isReserved} />
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap gap-2">
                    {item.isGroupGift && <span className="bg-sun text-[#17171A] rounded-full px-3 py-1 text-[13px] font-bold">{t('groupGift')}</span>}
                    {!item.isReserved && PRIORITY[item.priority] && <span className={`rounded-full px-3 py-1 text-[13px] font-bold ${PRIORITY[item.priority][1]}`}>{t(PRIORITY[item.priority][0])}</span>}
                    {item.received && isMine(item) && <span className="bg-ink rounded-full px-3 py-1 text-[13px] font-bold text-paper">{t('received')}</span>}
                  </div>
                  <h2 id={named} className="text-xl font-bold leading-tight">{item.name}</h2>
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
                    <button id={`reserve-${item.id}`} aria-describedby={named} className="btn btn-primary" disabled={act.isPending} onClick={() => run({ method: 'post', url: `/items/${item.id}/reserve`, focus: [`mine-${item.id}`] })}>
                      {t('reserve')}
                    </button>
                  )}
                  {item.reservedByMe && (
                    <>
                      <span id={`mine-${item.id}`} tabIndex={-1} className="btn cursor-default !bg-sheet !shadow-none !filter-none"><Check size={18} className="text-signal-deep" /> {t('reservedByYou')}</span>
                      {!past && !item.received && (
                        <button aria-describedby={named} className="min-h-11 cursor-pointer font-semibold underline" onClick={() => run({ method: 'delete', url: `/items/${item.id}/reserve`, focus: [`reserve-${item.id}`] })}>{t('cancelReservation')}</button>
                      )}
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
                          <button id={`chip-${item.id}`} aria-describedby={named} className="btn btn-primary" disabled={act.isPending} onClick={() => run({ method: 'post', url: `/items/${item.id}/contribute`, body: { amount }, focus: [`chip-${item.id}`, `funded-${item.id}`] })}>
                            {t('chipIn', { x: som(amount) })}
                          </button>
                        </>
                      ) : (
                        <p id={`funded-${item.id}`} tabIndex={-1} className="text-center font-bold text-signal-deep">{t('fullyFunded')}</p>
                      )}
                      {item.myContribution > 0 && <p className="text-center text-sm text-mute">{t('youChipped', { x: som(item.myContribution) })}</p>}
                      {item.myContribution > 0 && <Collecting item={item} named={named} run={run} busy={act.isPending} />}
                    </>
                  )}

                  {isMine(item) && (past || item.received) && (
                    <button aria-describedby={named} aria-pressed={item.signed} className="min-h-11 cursor-pointer text-sm font-semibold underline" onClick={() => run({ method: 'post', url: `/items/${item.id}/sign`, body: { signed: !item.signed } })}>
                      {t(item.signed ? 'signedUndo' : 'signIt', { name: ownerFirst })}
                    </button>
                  )}
                </div>
              </Tag>
            );
          })}
        </div>
      </section>
      {pending && (
        <JoinDialog
          next={`/w/${wishlist.slug}`}
          onClose={() => setPending(null)}
          onJoined={() => { const req = pending; setPending(null); act.mutate(req); }}
        />
      )}
    </>
  );
}

function Collecting({ item, named, run, busy }) {
  const t = useT();
  const { collector } = item;
  if (!collector) {
    return (
      <button aria-describedby={named} className="btn btn-outline text-sm" disabled={busy} onClick={() => run({ method: 'post', url: `/items/${item.id}/collector` })}>
        {t('becomeCollector')}
      </button>
    );
  }
  if (!collector.isMe) {
    return (
      <div className="flex flex-col gap-2 border-t-2 border-ink/15 pt-3 text-sm">
        <p>{t('collectorIs', { name: collector.name })}</p>
        <label className="flex cursor-pointer items-center gap-2.5 font-semibold">
          <input type="checkbox" className="size-5 accent-[var(--color-signal)]" checked={item.myPaid} disabled={busy} onChange={() => run({ method: 'post', url: `/items/${item.id}/paid`, body: { paid: !item.myPaid } })} />
          {t('iPaid', { name: collector.name })}
        </label>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 border-t-2 border-ink/15 pt-3 text-sm">
      <p className="font-bold">{t('youCollect')}</p>
      <ul className="flex flex-col gap-1">
        {item.chippers.map((c) => (
          <li key={c.name} className="flex justify-between gap-2">
            <span>{c.name}, {som(c.amount)} {t('som')}</span>
            <span className={c.paid ? 'font-bold' : 'text-mute'}>{t(c.paid ? 'paid' : 'notPaid')}</span>
          </li>
        ))}
      </ul>
      <button aria-describedby={named} className="min-h-11 cursor-pointer self-start font-semibold underline" onClick={() => run({ method: 'delete', url: `/items/${item.id}/collector` })}>{t('stopCollecting')}</button>
    </div>
  );
}

function OwnerView({ wishlist, items }) {
  const t = useT();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [thanks, setThanks] = useState(wishlist.thanks || '');
  const past = isPast(wishlist);
  const url = `${window.location.origin}/w/${wishlist.slug}`;
  const picked = items.filter((i) => !i.isGroupGift && i.isReserved).length;
  const refresh = () => qc.invalidateQueries({ queryKey: ['wishlist', wishlist.slug] });

  const removeItem = useMutation({ mutationFn: (id) => api.delete(`/items/${id}`), onSuccess: refresh });
  const receive = useMutation({ mutationFn: (item) => api.patch(`/items/${item.id}`, { received: !item.received }), onSuccess: refresh });
  const saveThanks = useMutation({ mutationFn: () => api.patch(`/wishlists/${wishlist.id}`, { thanks }), onSuccess: refresh });
  const removeList = useMutation({ mutationFn: () => api.delete(`/wishlists/${wishlist.id}`), onSuccess: () => navigate('/dashboard') });

  const [copied, setCopied] = useState('');
  const markShared = () => { try { localStorage.setItem('giftory_shared', '1'); } catch { return; } };
  const copy = async () => {
    markShared();
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
            <a className="btn btn-outline" href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(wishlist.title)}`} target="_blank" rel="noreferrer" onClick={markShared}>
              <Send size={18} /> Telegram
            </a>
            <button className="btn btn-outline" onClick={() => { markShared(); setShowQr(true); }}><Qr size={18} /> {t('qrCode')}</button>
          </div>
        </div>
        <div className="glass-card flex flex-col justify-center gap-4 p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="display text-3xl">{t('pickedOf', { p: picked, t: items.length })}</span>
            <span className="text-mute">{t('namesHidden')}</span>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {items.map((i, n) => <span key={i.id} className={`seg ${n < picked ? 'seg-on' : ''}`} />)}
          </div>
        </div>
      </section>

      {(past || wishlist.thanks || items.some((i) => i.received)) && <section className="mx-auto max-w-[1376px] px-4 pb-10 sm:px-8">
        <form className="glass-card flex flex-col gap-3 p-7" onSubmit={(e) => { e.preventDefault(); saveThanks.mutate(); }}>
          <label htmlFor="thanks" className="font-bold">{t('thanksTitle')}</label>
          <span id="thanks-hint" className="-mt-1 text-sm text-mute">{t('thanksHint')}</span>
          <textarea id="thanks" aria-describedby="thanks-hint" className="input min-h-20 py-3" maxLength={500} value={thanks} onChange={(e) => setThanks(e.target.value)} placeholder={t('thanksPh')} />
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-primary" disabled={saveThanks.isPending || thanks === (wishlist.thanks || '')}>{t(saveThanks.isPending ? 'saving' : 'thanksSave')}</button>
            {saveThanks.isSuccess && thanks === wishlist.thanks && <span role="status" className="font-semibold">{t('saved')}</span>}
            {saveThanks.isError && <span role="alert" className="font-semibold">{t.error(saveThanks.error)}</span>}
          </div>
        </form>
      </section>}

      <section className="mx-auto max-w-[1376px] px-4 pb-24 sm:px-8">
        <div className="grid gap-x-6 gap-y-8 [grid-template-columns:repeat(auto-fill,minmax(min(270px,100%),1fr))]">
          <button onClick={() => setAdding(true)} className="group flex min-h-[400px] cursor-pointer flex-col items-center justify-center gap-3.5 rounded-[28px] border-2 border-dashed border-ink/20 p-6 transition-colors hover:border-signal hover:bg-card">
            <span className="grid size-16 place-items-center rounded-full bg-signal text-on-signal shadow-[0_5px_0_#B83700] transition-transform group-hover:-translate-y-1"><Plus size={28} /></span>
            <span className="text-lg font-bold">{t('addWish')}</span>
            <span className="max-w-[14em] text-center text-mute">{t('addTileText')}</span>
          </button>

          {items.map((item, index) => {
            const hidden = !item.isGroupGift && item.isReserved && !past && !item.received;
            const given = item.isReserved || (item.isGroupGift && item.funded > 0);
            const pct = Math.round((item.funded / item.price) * 100) || 0;
            return (
              <Tag key={item.id} className="pb-3.5">
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
                {item.from?.length > 0 && <p className="text-sm font-semibold">{t('fromNames', { names: item.from.join(', ') })}</p>}
                {given && (
                  <button aria-pressed={item.received} className={`btn min-h-11 text-sm ${item.received ? 'btn-primary' : 'btn-outline'}`} disabled={receive.isPending} onClick={() => receive.mutate(item)}>
                    {item.received ? <><Check size={16} /> {t('received')}</> : t('markReceived')}
                  </button>
                )}
                <div className="mt-auto flex min-h-11 items-center justify-between gap-2 border-t-2 border-ink/15 pt-2">
                  <span className="text-sm font-semibold text-mute">{t(item.received ? 'received' : item.isReserved ? 'statusReserved' : item.isGroupGift ? 'statusChipping' : 'statusWaiting')}</span>
                  {!item.isReserved && !(item.isGroupGift && item.funded > 0) && (
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
      {showQr && <QrDialog url={url} title={wishlist.title} onClose={() => setShowQr(false)} />}
    </>
  );
}

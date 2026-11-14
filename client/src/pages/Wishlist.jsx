import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { errorText } from '../api';
import { useAuth } from '../auth';
import { Page, Header, Footer } from '../components/Layout';
import { Tag, ItemTile } from '../components/Tag';
import AddItemModal from '../components/AddItemModal';
import { Check, External, Lock, Plus, Send, Trash, Back } from '../components/Icons';
import { longDate, som } from '../utils';

const SHAPES = [['circle', 460, { right: -120, top: -130 }], ['square', 320, { left: -80, top: 700, rotate: '14deg' }]];
const PRIORITY = { high: ['Really wants this', 'bg-signal'], medium: ['Would love this', 'bg-ink text-paper'] };
const AMOUNTS = [100000, 250000, 500000];

export default function Wishlist() {
  const { slug } = useParams();
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['wishlist', slug], queryFn: () => api.get(`/wishlists/${slug}`).then((r) => r.data) });

  return (
    <Page shapes={SHAPES}>
      <Header />
      {isLoading && <p className="mx-auto max-w-[1376px] px-8 py-24 text-mute">Opening the wishlist…</p>}
      {isError && (
        <div className="mx-auto flex max-w-[1376px] flex-col items-start gap-5 px-8 py-24">
          <h1 className="display text-5xl">Can't open this wishlist</h1>
          <p className="text-lg text-mute">{errorText(error)}</p>
          <Link to="/" className="btn btn-primary">Go to Giftory</Link>
        </div>
      )}
      {data && (data.isOwner ? <OwnerView {...data} /> : <FriendView {...data} />)}
      <Footer />
    </Page>
  );
}

function ListHeader({ wishlist, aside }) {
  return (
    <section className="mx-auto flex max-w-[1376px] flex-wrap items-end justify-between gap-10 px-4 pb-10 pt-14 sm:px-8">
      <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-5">
        <div className="flex items-center gap-3.5">
          <span className="display grid size-14 place-items-center rounded-full bg-signal text-2xl">{wishlist.owner.name?.[0]?.toUpperCase()}</span>
          <div>
            <p className="font-semibold">{wishlist.owner.name}</p>
            <p className="text-mute">{[wishlist.occasion, longDate(wishlist.eventDate)].filter(Boolean).join(', ')}</p>
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
  return <p className="display whitespace-nowrap text-lg tracking-tight">{som(item.price)} soʻm</p>;
}

/* ---------- What friends see ---------- */

function FriendView({ wishlist, items }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [amounts, setAmounts] = useState({});
  const [flash, setFlash] = useState('');

  const act = useMutation({
    mutationFn: ({ method, url, body }) => api[method](url, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist', wishlist.slug] }),
    onError: (e) => {
      setFlash(errorText(e));
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
            <p>{wishlist.owner.name} can't see who reserves what. Your pick stays wrapped until the day.</p>
          </div>
        }
      />

      <section className="mx-auto flex max-w-[1376px] flex-wrap items-center justify-between gap-4 px-4 pb-7 sm:px-8">
        <div role="group" aria-label="Filter wishes" className="flex flex-wrap gap-2.5">
          {[['all', 'All wishes'], ['free', 'Still available'], ['mine', 'Reserved by you']].map(([v, label]) => (
            <button key={v} className="chip" aria-pressed={filter === v} onClick={() => setFilter(v)}>{label}</button>
          ))}
        </div>
        <p className="text-mute">{items.length} wishes, {taken} already reserved</p>
      </section>

      {flash && <p role="alert" className="mx-auto mb-6 max-w-[1312px] bg-ink p-4 font-semibold text-paper">{flash}</p>}

      <section className="mx-auto max-w-[1376px] px-4 pb-24 sm:px-8">
        {shown.length === 0 && (
          <div className="glass flex flex-col items-center gap-4 px-6 py-14 text-center">
            <p className="display text-3xl">{filter === 'mine' ? "You haven't picked anything yet" : 'Everything has been picked'}</p>
            <button className="btn btn-primary" onClick={() => setFilter('all')}>Show all wishes</button>
          </div>
        )}
        <div className="grid gap-x-7 gap-y-8 [grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr))]">
          {shown.map((item) => {
            const index = items.indexOf(item);
            const takenByOther = item.isReserved && !item.reservedByMe;
            const amount = Math.min(amounts[item.id] || 250000, left(item));
            return (
              <Tag key={item.id} className={takenByOther ? 'opacity-80' : ''}>
                <ItemTile item={item} index={index} wrapped={!item.isGroupGift && item.isReserved} />
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap gap-2">
                    {item.isGroupGift && <span className="bg-stone px-2.5 py-1 text-[13px] font-bold">Group gift</span>}
                    {!item.isReserved && PRIORITY[item.priority] && <span className={`px-2.5 py-1 text-[13px] font-bold ${PRIORITY[item.priority][1]}`}>{PRIORITY[item.priority][0]}</span>}
                  </div>
                  <h2 className="text-xl font-bold leading-tight">{item.name}</h2>
                  <Price item={item} />
                </div>
                {item.note && !takenByOther && <p className="text-[15px] leading-normal text-mute">{item.note}</p>}
                {item.link && !takenByOther && (
                  <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 self-start font-semibold">
                    Open in store <External />
                  </a>
                )}

                <div className="mt-auto flex flex-col gap-3 pt-1">
                  {!item.isGroupGift && !item.isReserved && (
                    <button className="btn btn-primary" disabled={act.isPending} onClick={() => run({ method: 'post', url: `/items/${item.id}/reserve` })}>
                      Reserve this gift
                    </button>
                  )}
                  {item.reservedByMe && (
                    <>
                      <span className="btn btn-outline cursor-default shadow-[inset_0_0_0_2px_#FF4D00] hover:!bg-white/50 hover:!text-ink"><Check size={18} /> Reserved by you</span>
                      <button className="min-h-11 cursor-pointer font-semibold underline" onClick={() => run({ method: 'delete', url: `/items/${item.id}/reserve` })}>Cancel reservation</button>
                    </>
                  )}
                  {takenByOther && <p className="border-t-2 border-ink/15 pt-3 text-center font-semibold text-mute">Someone already reserved this</p>}

                  {item.isGroupGift && (
                    <>
                      <div className="bar" role="progressbar" aria-label="Raised so far" aria-valuemin={0} aria-valuemax={item.price} aria-valuenow={item.funded}>
                        <span style={{ width: `${Math.min(100, (item.funded / item.price) * 100)}%` }} />
                      </div>
                      <div className="flex flex-wrap justify-between gap-2 text-sm">
                        <span><strong>{som(item.funded)}</strong> raised</span>
                        <span className="text-mute">{item.contributors} {item.contributors === 1 ? 'friend' : 'friends'} chipped in</span>
                      </div>
                      {left(item) > 0 ? (
                        <>
                          <div role="group" aria-label="Amount to chip in" className="flex gap-2">
                            {AMOUNTS.filter((a) => a <= left(item)).map((a) => (
                              <button key={a} className="chip flex-1 px-1.5 text-sm" aria-pressed={amount === a} onClick={() => setAmounts({ ...amounts, [item.id]: a })}>{som(a)}</button>
                            ))}
                          </div>
                          <button className="btn btn-primary" disabled={act.isPending} onClick={() => run({ method: 'post', url: `/items/${item.id}/contribute`, body: { amount } })}>
                            Chip in {som(amount)} soʻm
                          </button>
                        </>
                      ) : (
                        <p className="text-center font-bold text-signal">Fully funded</p>
                      )}
                      {item.myContribution > 0 && <p className="text-center text-sm text-mute">You chipped in {som(item.myContribution)} soʻm</p>}
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

/* ---------- What the owner sees ---------- */

function OwnerView({ wishlist, items }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/w/${wishlist.slug}`;
  const picked = items.filter((i) => !i.isGroupGift && i.isReserved).length;
  const refresh = () => qc.invalidateQueries({ queryKey: ['wishlist', wishlist.slug] });

  const removeItem = useMutation({ mutationFn: (id) => api.delete(`/items/${id}`), onSuccess: refresh });
  const removeList = useMutation({ mutationFn: () => api.delete(`/wishlists/${wishlist.id}`), onSuccess: () => navigate('/dashboard') });

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="mx-auto max-w-[1376px] px-4 pt-10 sm:px-8">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 font-semibold no-underline"><Back /> All wishlists</Link>
      </div>
      <ListHeader
        wishlist={wishlist}
        aside={
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-outline" onClick={() => confirm(`Delete “${wishlist.title}” and all its wishes?`) && removeList.mutate()}>Delete list</button>
            <button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={18} /> Add a wish</button>
          </div>
        }
      />

      <section className="mx-auto grid max-w-[1376px] gap-5 px-4 pb-10 sm:px-8 md:grid-cols-2">
        <div className="glass flex flex-col gap-3.5 p-7">
          <label htmlFor="share" className="font-bold">Share this link with friends</label>
          <div className="flex flex-wrap gap-2.5">
            <input id="share" readOnly value={url} className="input min-w-0 flex-[1_1_200px] font-medium" onFocus={(e) => e.target.select()} />
            <button className="btn btn-primary" onClick={copy} aria-live="polite">{copied ? 'Link copied' : 'Copy link'}</button>
            <a className="btn btn-outline" href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(wishlist.title)}`} target="_blank" rel="noreferrer">
              <Send size={18} /> Telegram
            </a>
          </div>
        </div>
        <div className="glass-dark flex flex-col justify-center gap-4 p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="display text-3xl">{picked} of {items.length} wishes picked</span>
            <span className="text-[#BDBDB4]">Names stay hidden from you</span>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {items.map((i, n) => <span key={i.id} className={`h-2.5 flex-1 ${n < picked ? 'bg-signal' : 'bg-white/15'}`} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1376px] px-4 pb-24 sm:px-8">
        <div className="grid gap-x-6 gap-y-8 [grid-template-columns:repeat(auto-fill,minmax(min(270px,100%),1fr))]">
          <button onClick={() => setAdding(true)} className="glass flex min-h-[400px] cursor-pointer flex-col items-center justify-center gap-3.5 !shadow-[inset_0_0_0_2px_#000] hover:bg-white/80">
            <span className="grid size-16 place-items-center rounded-full bg-signal"><Plus size={28} /></span>
            <span className="text-lg font-bold">Add a wish</span>
            <span className="max-w-[14em] text-center text-mute">Anything from any store, with a link and a price.</span>
          </button>

          {items.map((item, index) => {
            const hidden = !item.isGroupGift && item.isReserved;
            return (
              <Tag key={item.id} className="pb-3.5">
                <ItemTile item={item} index={index} wrapped={hidden} hideImage={hidden} />
                {hidden ? (
                  <div>
                    <h2 className="text-lg font-bold">A friend picked this</h2>
                    <p className="text-mute">You'll find out on the day.</p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-lg font-bold leading-tight">{item.name}</h2>
                    <Price item={item} />
                  </div>
                )}
                {item.isGroupGift && (
                  <div className="flex flex-col gap-2">
                    <div className="bar"><span style={{ width: `${Math.min(100, (item.funded / item.price) * 100)}%` }} /></div>
                    <span className="text-sm text-mute">Group gift, {Math.round((item.funded / item.price) * 100)}% raised</span>
                  </div>
                )}
                <div className="mt-auto flex min-h-11 items-center justify-between gap-2 border-t-2 border-ink/15 pt-2">
                  <span className="text-sm font-semibold text-mute">{hidden ? 'Reserved' : item.isGroupGift ? 'Friends are chipping in' : 'Waiting for a friend'}</span>
                  {!hidden && (
                    <button
                      className="grid size-11 cursor-pointer place-items-center rounded-full hover:bg-ink hover:text-paper"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => confirm(`Remove “${item.name}” from your list?`) && removeItem.mutate(item.id)}
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

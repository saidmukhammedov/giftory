import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api, { errorText } from '../api';
import { Close } from './Icons';

const PRIORITIES = [['low', 'Nice to have'], ['medium', 'Would love it'], ['high', 'Really want it']];

export default function AddItemModal({ list, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', price: '', link: '', image: '', note: '', priority: 'medium', isGroupGift: false });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const add = useMutation({
    mutationFn: () => api.post(`/wishlists/${list.id}/items`, { ...form, price: Number(String(form.price).replace(/\s/g, '')) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist', list.slug] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); add.mutate(); }}
        className="glass flex h-full w-full max-w-[540px] flex-col bg-paper/80"
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-ink px-7 py-6">
          <div>
            <h2 id="add-title" className="display text-4xl">Add a wish</h2>
            <p className="mt-1 text-mute">To {list.title}</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-outline size-11 min-h-0 p-0" aria-label="Close">
            <Close />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-7 py-6">
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
            <label className="flex flex-col gap-2 font-bold">
              Name
              <input className="input font-normal" required value={form.name} onChange={set('name')} placeholder="Film camera" />
            </label>
            <label className="flex flex-col gap-2 font-bold">
              Price, soʻm
              <input className="input font-normal" required inputMode="numeric" value={form.price} onChange={set('price')} placeholder="1 450 000" />
            </label>
          </div>
          <label className="flex flex-col gap-2 font-bold">
            Link to the item <span className="text-sm font-normal text-mute">Optional. Friends will see an “Open in store” link.</span>
            <input className="input font-normal" type="url" value={form.link} onChange={set('link')} placeholder="https://" />
          </label>
          <label className="flex flex-col gap-2 font-bold">
            Photo link <span className="text-sm font-normal text-mute">Optional. Paste an image address from the store page.</span>
            <input className="input font-normal" type="url" value={form.image} onChange={set('image')} placeholder="https://…/photo.jpg" />
          </label>
          <label className="flex flex-col gap-2 font-bold">
            Note for friends <span className="text-sm font-normal text-mute">Optional</span>
            <textarea className="input min-h-24 py-3 font-normal" value={form.note} onChange={set('note')} placeholder="Size, color, any model is fine…" />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-bold">How much do you want it?</legend>
            <div className="flex gap-1 bg-white/50 p-1 shadow-[inset_0_0_0_2px_#000]">
              {PRIORITIES.map(([v, label]) => (
                <button key={v} type="button" aria-pressed={form.priority === v} onClick={() => setForm({ ...form, priority: v })} className="chip flex-1 px-2 text-sm shadow-none">
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="glass flex items-center justify-between gap-4 p-4">
            <div>
              <p id="group-label" className="font-bold">Let friends chip in together</p>
              <p className="text-sm text-mute">Good for bigger gifts. Friends add any amount until it's covered.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.isGroupGift}
              aria-labelledby="group-label"
              onClick={() => setForm({ ...form, isGroupGift: !form.isGroupGift })}
              className={`flex h-[34px] w-[58px] shrink-0 cursor-pointer p-1 ${form.isGroupGift ? 'justify-end bg-signal' : 'justify-start bg-ink/15'}`}
            >
              <span className="size-[26px] bg-ink" />
            </button>
          </div>

          {add.isError && <p role="alert" className="bg-ink p-3 font-semibold text-paper">{errorText(add.error)}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t-2 border-ink px-7 py-5">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button className="btn btn-primary" disabled={add.isPending}>{add.isPending ? 'Adding…' : 'Add to list'}</button>
        </div>
      </form>
    </div>
  );
}

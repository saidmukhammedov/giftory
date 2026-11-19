import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { useT } from '../i18n';
import { som } from '../utils';
import { Photo } from './Tag';
import { Close, Gift, Wand } from './Icons';
import { useDialog } from './Dialog';

const PRIORITIES = ['low', 'medium', 'high'];

async function compress(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
  const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * scale), height: Math.round(bmp.height * scale) });
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const toBlob = (type) => new Promise((r) => canvas.toBlob(r, type, 0.82));
  const webp = await toBlob('image/webp');
  return webp?.type === 'image/webp' ? webp : toBlob('image/jpeg');
}

export default function AddItemModal({ list, onClose }) {
  const qc = useQueryClient();
  const t = useT();
  const [form, setForm] = useState({ name: '', price: '', link: '', image: '', note: '', priority: 'medium', isGroupGift: false });
  const [linkMode, setLinkMode] = useState(false);
  const [imageLink, setImageLink] = useState('');
  const [dragging, setDragging] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const blank = { name: '', price: '', link: '', image: '', note: '', priority: 'medium', isGroupGift: false };
  const dirty = Object.keys(blank).some((k) => form[k] !== blank[k]);
  const dismiss = () => (!dirty || confirm(t('discardWish'))) && onClose();
  const dialog = useDialog(dismiss);

  const upload = useMutation({
    mutationFn: async (file) => {
      if (!file?.type.startsWith('image/')) throw new Error('Choose a photo file');
      const blob = await compress(file).catch(() => { throw new Error("Couldn't read that photo. Try a JPG or PNG."); });
      return (await api.post('/images', blob, { headers: { 'Content-Type': blob.type } })).data.url;
    },
    onSuccess: (url) => setForm((f) => ({ ...f, image: url })),
  });

  const fill = useMutation({
    mutationFn: () => api.post('/preview', { url: form.link }).then((r) => r.data),
    onSuccess: (d) => setForm((f) => ({ ...f, name: f.name || d.name || '', price: f.price || (d.price ? String(d.price) : ''), image: f.image || d.image || '' })),
  });

  const add = useMutation({
    mutationFn: () => api.post(`/wishlists/${list.id}/items`, { ...form, price: Number(form.price) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist', list.slug] });
      onClose();
    },
  });

  const pick = (e) => upload.mutate(e.target.files?.[0]);
  const drop = (e) => { e.preventDefault(); setDragging(false); upload.mutate(e.dataTransfer.files?.[0]); };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onClick={dismiss}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="add-title" onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-[540px]">
      <form
        onSubmit={(e) => { e.preventDefault(); add.mutate(); }}
        className="glass flex h-full flex-col bg-paper/80"
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-ink px-7 py-6">
          <div>
            <h2 id="add-title" className="display text-4xl">{t('addWish')}</h2>
            <p className="mt-1 text-mute">{t('toList', { t: list.title })}</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-outline size-11 min-h-0 p-0" aria-label={t('close')}>
            <Close />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-7 py-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="item-link" className="font-bold">{t('productLink')} <span className="font-normal text-mute">{t('optional')}</span></label>
            <span id="item-link-hint" className="-mt-1 text-sm text-mute">{t('productLinkHint')}</span>
            <div className="flex gap-2">
              <input id="item-link" aria-describedby="item-link-hint" className="input min-w-0 flex-1" type="url" value={form.link} onChange={set('link')} placeholder="https://uzum.uz/…" />
              <button type="button" className="btn btn-outline px-4" disabled={!/^https?:\/\/[^/]+\.[^/]+/.test(form.link) || fill.isPending} onClick={() => fill.mutate()}>
                <Wand size={18} /> {t(fill.isPending ? 'filling' : 'fillIn')}
              </button>
            </div>
            {fill.isError && <p role="alert" className="bg-ink p-3 text-sm font-semibold text-paper">{t.error(fill.error)}</p>}
            {fill.isSuccess && <p role="status" className="text-sm font-semibold">{t('filled')}</p>}
          </div>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2 font-bold">{t('photo')} <span className="font-normal text-mute">{t('optional')}</span></legend>

            {form.image ? (
              <div className="flex flex-col gap-2.5">
                <Photo src={form.image} className="relative aspect-[4/3] outline-2 outline-ink" />
                <div className="flex gap-2.5">
                  <label className="btn btn-outline min-h-11 flex-1 cursor-pointer text-sm">
                    {t('changePhoto')}
                    <input type="file" accept="image/*" className="sr-only" onChange={pick} />
                  </label>
                  <button type="button" className="btn btn-outline min-h-11 flex-1 text-sm" onClick={() => setForm({ ...form, image: '' })}>{t('removePhoto')}</button>
                </div>
              </div>
            ) : (
              <label
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={drop}
                className={`relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 p-6 text-center edge focus-within:outline-3 focus-within:outline-signal ${dragging ? 'bg-signal/20' : 'bg-field hover:bg-paper'}`}
              >
                <input type="file" accept="image/*" className="sr-only" onChange={pick} disabled={upload.isPending} />
                <span className="grid size-16 place-items-center rounded-full bg-signal text-on-signal"><Gift size={30} /></span>
                <span className="text-lg font-bold">{t(upload.isPending ? 'uploading' : 'chooseGallery')}</span>
                <span className="text-sm text-mute">{t('photoHint')}</span>
              </label>
            )}

            {upload.isError && <p role="alert" className="bg-ink p-3 text-sm font-semibold text-paper">{t.error(upload.error)}</p>}

            {!form.image && (linkMode ? (
              <div className="flex gap-2">
                <input className="input min-w-0 flex-1" type="url" autoFocus value={imageLink} onChange={(e) => setImageLink(e.target.value)} placeholder="https://…/photo.jpg" aria-label={t('imageLink')} />
                <button type="button" className="btn btn-primary px-5" disabled={!imageLink} onClick={() => setForm({ ...form, image: imageLink })}>{t('useImage')}</button>
              </div>
            ) : (
              <button type="button" className="min-h-11 self-start text-sm font-semibold underline" onClick={() => setLinkMode(true)}>{t('pasteLink')}</button>
            ))}
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
            <label className="flex flex-col gap-2 font-bold">
              {t('itemName')}
              <input className="input font-normal" required value={form.name} onChange={set('name')} placeholder={t('itemNamePh')} />
            </label>
            <label className="flex flex-col gap-2 font-bold">
              {t('price')}
              <input
                className="input font-normal"
                required
                inputMode="numeric"
                value={form.price === '' ? '' : som(form.price)}
                onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                placeholder="1 450 000"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 font-bold">
            <span>{t('itemNote')} <span className="font-normal text-mute">{t('optional')}</span></span>
            <textarea className="input min-h-24 py-3 font-normal" value={form.note} onChange={set('note')} placeholder={t('itemNotePh')} />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-bold">{t('howMuch')}</legend>
            <div className="flex gap-1 bg-field p-1 edge">
              {PRIORITIES.map((v) => (
                <label key={v} className="flex-1 cursor-pointer">
                  <input type="radio" name="priority" value={v} checked={form.priority === v} onChange={() => setForm({ ...form, priority: v })} className="peer sr-only" />
                  <span className="flex min-h-11 items-center justify-center px-2 text-center text-sm font-semibold peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal hover:bg-paper peer-checked:hover:bg-ink">
                    {t.prio(v)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="glass-card flex items-center justify-between gap-4 p-4">
            <div>
              <p id="group-label" className="font-bold">{t('groupToggle')}</p>
              <p className="text-sm text-mute">{t('groupToggleHint')}</p>
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

          {add.isError && <p role="alert" className="bg-ink p-3 font-semibold text-paper">{t.error(add.error)}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t-2 border-ink px-7 py-5">
          <button type="button" onClick={onClose} className="btn btn-outline">{t('cancel')}</button>
          <button className="btn btn-primary" disabled={add.isPending || upload.isPending}>{t(add.isPending ? 'adding' : 'addWishSubmit')}</button>
        </div>
      </form>
      </div>
    </div>
  );
}

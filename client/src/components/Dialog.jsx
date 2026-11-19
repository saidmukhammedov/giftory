import { useEffect, useRef } from 'react';
import { useT } from '../i18n';
import { Close } from './Icons';

export function useDialog(onDismiss) {
  const ref = useRef(null);
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    const opener = document.activeElement;
    const first = (q) => ref.current?.querySelector(q);
    (first('input:not([type=file]):not([hidden]):not([type=checkbox]), textarea') || first('a[href], button'))?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') return dismiss.current();
      if (e.key !== 'Tab' || !ref.current) return;
      const items = [...ref.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([hidden]), textarea, label[tabindex]')].filter((el) => el.offsetParent !== null || el.matches('.sr-only'));
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, []);
  return ref;
}

export default function Dialog({ title, onClose, children }) {
  const t = useT();
  const ref = useDialog(onClose);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4" onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={(e) => e.stopPropagation()} className="pop flex max-h-full w-full max-w-[460px] flex-col gap-5 overflow-y-auto p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="dialog-title" className="display text-3xl">{title}</h2>
          <button className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-ink hover:text-paper" aria-label={t('close')} onClick={onClose}><Close /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

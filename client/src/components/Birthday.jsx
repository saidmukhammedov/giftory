import { useT } from '../i18n';
import { Bow } from './Icons';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const isBirthdayToday = (list) => list?.occasion === 'Birthday' && list.eventDate === today();

const BITS = [
  [4, 18, 18, 'sq', 'bg-ink', 20], [12, 70, 12, 'dot', 'bg-paper', 0], [22, 8, 10, 'dot', 'bg-ink', 0], [30, 82, 16, 'sq', 'bg-paper', -15],
  [64, 12, 14, 'sq', 'bg-paper', 35], [72, 76, 20, 'dot', 'bg-ink', 0], [83, 22, 12, 'sq', 'bg-ink', -30], [92, 64, 16, 'dot', 'bg-paper', 0],
  [50, 88, 10, 'sq', 'bg-ink', 10], [96, 8, 10, 'dot', 'bg-ink', 0],
];

export function BirthdayBanner({ name, picked }) {
  const t = useT();
  return (
    <section aria-labelledby="bday" className="relative isolate overflow-hidden rounded-[32px] bg-signal px-6 py-10 text-on-signal sm:px-12 sm:py-14">
      {BITS.map(([l, top, size, shape, color, rot], i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`confetti absolute -z-10 ${color} ${shape === 'dot' ? 'rounded-full' : ''}`}
          style={{ left: `${l}%`, top: `${top}%`, width: size, height: size, rotate: `${rot}deg`, animationDelay: `${i * 60}ms` }}
        />
      ))}
      <div className="flex flex-wrap items-center gap-6">
        <div className="bow-pop shrink-0"><Bow width={96} fill="white" /></div>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
          <h2 id="bday" className="display text-[clamp(36px,6vw,80px)]">{t('happyBirthday', { name })}</h2>
          <p className="max-w-[40ch] text-lg font-semibold">{picked ? t('birthdayText', { n: picked }) : t('birthdayTextNone')}</p>
        </div>
      </div>
    </section>
  );
}

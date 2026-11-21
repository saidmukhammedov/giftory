import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { usePrefs } from '../i18n';
import { Page, Header } from '../components/Layout';
import Gift3D, { GIFT_COLORS } from '../components/Gift3D';

const Hero3D = lazy(() => import('../components/Hero3D'));

const Still = () => (
  <div className="stage-still" aria-hidden="true">
    <Gift3D size={70} colors={GIFT_COLORS[0]} />
    <Gift3D size={150} colors={GIFT_COLORS[1]} />
    <Gift3D size={64} colors={GIFT_COLORS[2]} />
  </div>
);

export default function Landing() {
  const { user, ready } = useAuth();
  const { t, lang } = usePrefs();
  const stage = useRef(null);
  const [gl, setGl] = useState('wait');
  const fail = useCallback(() => setGl('off'), []);
  useEffect(() => {
    Promise.all([document.fonts.load('800 58px Unbounded'), document.fonts.load('600 40px "Golos Text"'), document.fonts.load('500 30px "Golos Text"')]).finally(() => setGl((g) => (g === 'wait' ? 'on' : g)));
  }, []);
  const cards = useMemo(() => [
    ['demoHeadphones', '3 900 000'], ['filmCamera', '1 450 000'], ['demoTea', '450 000'], ['demoBedding', '780 000'],
  ].map(([k, p]) => ({ title: t(k), price: `${p} ${t('som')}`, state: t('stillOpen') })), [t]);

  if (ready && user) return <Navigate to="/dashboard" replace />;
  const h2 = 'display text-[clamp(34px,4.2vw,64px)] [text-wrap:balance]';
  const p = 'mt-4 text-[17px] leading-relaxed sm:text-lg';

  return (
    <Page>
      <Header />
      <main id="main" tabIndex={-1} className="-mt-[76px] outline-none sm:-mt-[92px]">
        <section ref={stage} className={`stage ${gl === 'off' ? '!h-auto' : ''}`}>
          <div className={`stage-view ${gl === 'off' ? '!relative !h-[100svh]' : ''}`}>
            {gl === 'on' ? <Suspense fallback={<Still />}><Hero3D stage={stage} cards={cards} onFail={fail} /></Suspense> : <Still />}
            <div className="ch ch-0" data-ch="-1,0.15">
              <h1 className={`display [text-wrap:balance] ${lang === 'ru' ? 'text-[clamp(44px,6.4vw,104px)]' : 'text-[clamp(48px,7.6vw,124px)]'}`}>{t('heroTitle')}</h1>
              <p className={`${p} max-w-[34ch]`}>{t('heroSub')}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/signup" className="btn btn-primary min-h-[58px] px-8 text-lg">{t('create')}</Link>
                <Link to="/login" className="btn btn-outline min-h-[58px] px-7 text-lg">{t('login')}</Link>
              </div>
            </div>
            {gl === 'on' && (
              <>
                <div className="scroll-hint" aria-hidden="true"><i />{t('scrollHint')}</div>
                <div className="ch ch-1" data-ch="0.19,0.38"><h2 className={h2}>{t('ch1Title')}</h2><p className={p}>{t('ch1Text')}</p></div>
                <div className="ch ch-2" data-ch="0.45,0.68"><h2 className={h2}>{t('ch2Title')}</h2><p className={p}>{t('ch2Text')}</p></div>
                <div className="ch ch-3" data-ch="0.73,1.2"><h2 className={h2}>{t('ch3Title')}</h2><p className={p}>{t('ch3Text')}</p></div>
              </>
            )}
          </div>
        </section>

        <section className="bg-cobalt text-[#F4F1EA]">
          <div className="mx-auto grid max-w-[1376px] items-center gap-14 px-4 py-24 sm:px-8 sm:py-32 md:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="display max-w-[12ch] text-[clamp(40px,5.6vw,92px)] [text-wrap:balance]">{t('groupTitle')}</h2>
              <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-white">{t('groupText')}</p>
            </div>
            <div className="jar justify-self-center" role="img" aria-label={t('groupAria')}>
              <b style={{ height: '60%' }} />
              <div className="absolute inset-x-0 top-[47%] text-center text-[#17171A]">
                <p className="display text-[clamp(30px,4vw,44px)]">2 900 000</p>
                <p className="mt-2 text-[15px] font-semibold">{t('ofTotal', { total: '4 800 000' })}</p>
                <p className="text-[15px]">{t('chipped', { n: 3 })}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-[1376px] flex-col items-center px-4 py-28 text-center sm:px-8 sm:py-36">
          <Gift3D size={110} colors={GIFT_COLORS[1]} open />
          <h2 className="display mt-4 max-w-[13ch] text-[clamp(40px,6vw,96px)] [text-wrap:balance]">{t('ctaTitle')}</h2>
          <p className="mt-5 max-w-[40ch] text-lg text-mute">{t('ctaText')}</p>
          <Link to="/signup" className="btn btn-primary mt-9 min-h-[58px] px-9 text-lg">{t('create')}</Link>
        </section>
      </main>
    </Page>
  );
}

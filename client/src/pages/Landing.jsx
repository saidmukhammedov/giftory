import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { usePrefs } from '../i18n';
import { Page, Header, Footer } from '../components/Layout';
import { Tag, ItemTile } from '../components/Tag';
import { Check } from '../components/Icons';

export default function Landing() {
  const { user, ready } = useAuth();
  const { t, lang } = usePrefs();
  if (ready && user) return <Navigate to="/dashboard" replace />;
  const steps = [['step1', 'step1Text'], ['step2', 'step2Text'], ['step3', 'step3Text']];

  return (
    <Page shapes={[['circle', 600, { right: -110, top: 90 }], ['circle', 520, { right: -120, top: 1800 }]]}>
      <Header />

      <section className="relative mx-auto flex min-h-[820px] max-w-[1376px] flex-col px-4 pb-24 pt-14 sm:px-8">
        <h1 className={`display relative z-10 max-w-[1040px] leading-[.86] lg:max-w-[780px] ${lang === 'ru' ? 'text-[clamp(40px,6vw,90px)]' : 'text-[clamp(52px,8.6vw,128px)]'}`}>{t('heroTitle')}</h1>

        <div className="relative z-0 mt-8 h-[700px] sm:h-[560px] lg:absolute lg:right-8 lg:top-[90px] lg:mt-0 lg:h-[640px] lg:w-[560px]" role="img" aria-label={t('demoAria')}>
          <div className="absolute left-0 top-[40px] w-[200px] -rotate-6 sm:top-[150px] sm:w-[280px]">
            <span className="mb-3 ml-2 inline-block bg-ink px-2.5 py-1 text-[13px] font-bold text-paper">{t('friendSees')}</span>
            <Tag>
              <ItemTile item={{}} index={1} />
              <div>
                <p className="text-lg font-bold">{t('filmCamera')}</p>
                <p className="display text-lg tracking-tight">1 450 000 {t('som')}</p>
              </div>
              <span className="btn btn-primary min-h-[46px] whitespace-normal text-center text-[15px]"><Check size={18} /> {t('reservedByYou')}</span>
            </Tag>
          </div>
          <div className="absolute right-0 top-[300px] w-[200px] rotate-[7deg] sm:top-[200px] sm:w-[290px] lg:right-2.5 lg:top-[30px]">
            <span className="mb-3 ml-2 inline-block bg-signal px-2.5 py-1 text-[13px] font-bold text-black">{t('youSee')}</span>
            <Tag>
              <ItemTile item={{}} index={1} wrapped />
              <div>
                <p className="text-lg font-bold">{t('friendPicked')}</p>
                <p className="text-mute">{t('findOut')}</p>
              </div>
            </Tag>
          </div>
        </div>

        <div className="relative z-10 mt-auto flex max-w-[560px] flex-col gap-6 pt-12">
          <p className="text-xl leading-normal">{t('heroSub')}</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/signup" className="btn btn-primary min-h-[60px] px-8 text-lg">{t('create')}</Link>
            <Link to="/login" className="btn btn-outline min-h-[60px] px-7 text-lg">{t('login')}</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1376px] flex-col gap-24 border-t-2 border-ink px-4 pb-36 pt-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <h2 className="display max-w-[11em] text-[clamp(40px,5.6vw,84px)]">{t('stepsTitle')}</h2>
          <p className="max-w-[22em] text-lg text-mute">{t('stepsSub')}</p>
        </div>
        <div className="relative grid gap-7 md:grid-cols-3 md:gap-10">
          <svg className="absolute -top-12 left-[-4%] hidden h-36 w-[108%] stroke-ink md:block" viewBox="0 0 1000 140" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 10 Q500 170 1000 10" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
          </svg>
          {steps.map(([title, text], i) => (
            <Tag key={title} className={`px-7 pb-8 pt-14 ${i === 1 ? 'md:mt-16' : ''}`}>
              <span className={`display text-8xl leading-[.8] ${i === 1 ? 'text-ink' : 'text-signal'}`}>{i + 1}</span>
              <h3 className="text-2xl font-extrabold">{t(title)}</h3>
              <p className="text-[17px] leading-relaxed text-mute">{t(text)}</p>
            </Tag>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1376px] px-4 pb-36 sm:px-8">
        <div className="glass grid items-center gap-14 p-8 md:grid-cols-2 md:p-16">
          <div className="flex flex-col gap-5">
            <h2 className="display text-[clamp(38px,4.8vw,72px)]">{t('groupTitle')}</h2>
            <p className="max-w-[27em] text-lg leading-relaxed">{t('groupText')}</p>
          </div>
          <div className="glass-dark flex flex-col gap-6 p-8" role="img" aria-label={t('groupAria')}>
            <div className="flex items-center gap-4">
              <ItemTile item={{}} index={0} className="size-20 shrink-0" />
              <div>
                <span className="bg-signal px-2.5 py-1 text-[13px] font-bold text-black">{t('groupGift')}</span>
                <p className="mt-2 text-2xl font-bold">{t('espresso')}</p>
              </div>
            </div>
            <div>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                <span className="display text-4xl">2 900 000</span>
                <span className="text-paper/70">{t('ofTotal', { total: '4 800 000' })}</span>
              </div>
              <div className="bar bg-paper/10 shadow-[inset_0_0_0_2px_var(--color-paper)]"><span style={{ width: '60%' }} /></div>
            </div>
            <p className="text-paper/70">{t('chipped', { n: 3 })}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1376px] px-4 pb-28 sm:px-8">
        <div className="relative flex min-h-[440px] items-center justify-center overflow-hidden bg-signal px-6 py-12">
          <div className="frost" aria-hidden="true" />
          <div className="relative z-10 flex max-w-[600px] flex-col items-start gap-5 bg-ink p-12 text-paper">
            <h2 className="display text-[clamp(36px,4vw,60px)]">{t('ctaTitle')}</h2>
            <p className="text-lg text-paper/70">{t('ctaText')}</p>
            <Link to="/signup" className="btn btn-primary">{t('create')}</Link>
          </div>
        </div>
      </section>

      <Footer />
    </Page>
  );
}

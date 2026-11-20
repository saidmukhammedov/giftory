import { usePrefs } from '../i18n';
import { Page, Header } from '../components/Layout';
import { LEGAL, UPDATED } from '../legal';

export default function Legal({ doc }) {
  const { t, lang } = usePrefs();
  const sections = (LEGAL[lang] || LEGAL.en)[doc];
  const title = t(doc);
  return (
    <Page>
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1376px] px-4 pb-24 pt-14 outline-none sm:px-8">
        <article className="glass-card mx-auto flex max-w-3xl flex-col gap-8 p-7 sm:p-12">
          <header className="flex flex-col gap-3">
            <h1 className="display text-[clamp(36px,5vw,60px)]">{title}</h1>
            <p className="text-mute">{t('lastUpdated', { date: t.date(UPDATED) })}</p>
          </header>
          {sections.map(([heading, paragraphs]) => (
            <section key={heading} className="flex flex-col gap-3">
              <h2 className="text-2xl font-extrabold">{heading}</h2>
              {paragraphs.map((p) => <p key={p} className="max-w-[65ch] text-[17px] leading-relaxed">{p}</p>)}
            </section>
          ))}
        </article>
      </main>
    </Page>
  );
}

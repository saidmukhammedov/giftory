import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { Page, Header } from '../components/Layout';

export default function NotFound() {
  const t = useT();
  return (
    <Page shapes={[['circle', 520, { right: -120, top: 80 }]]}>
      <Header />
      <main className="mx-auto flex max-w-[1376px] flex-col items-start gap-6 px-4 py-28 sm:px-8">
        <h1 className="display text-[clamp(56px,9vw,140px)]">{t('notFoundTitle')}</h1>
        <p className="text-lg text-mute">{t('notFoundText')}</p>
        <Link to="/" className="btn btn-primary">{t('goHome')}</Link>
      </main>
    </Page>
  );
}

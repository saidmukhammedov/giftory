import { Link } from 'react-router-dom';
import { Page, Header } from '../components/Layout';

export default function NotFound() {
  return (
    <Page shapes={[['circle', 520, { right: -120, top: 80 }]]}>
      <Header />
      <main className="mx-auto flex max-w-[1376px] flex-col items-start gap-6 px-4 py-28 sm:px-8">
        <h1 className="display text-[clamp(56px,9vw,140px)]">Nothing to unwrap here</h1>
        <p className="text-lg text-mute">This page doesn't exist. Check the link, or start from the home page.</p>
        <Link to="/" className="btn btn-primary">Go to Giftory</Link>
      </main>
    </Page>
  );
}

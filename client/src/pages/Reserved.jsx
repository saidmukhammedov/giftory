import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { useT } from '../i18n';
import { Page, Header } from '../components/Layout';
import { Tag, ItemTile } from '../components/Tag';
import { som } from '../utils';

export default function Reserved() {
  const t = useT();
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['reserved'], queryFn: () => api.get('/items/reserved/mine').then((r) => r.data) });

  return (
    <Page shapes={[['circle', 460, { right: -140, top: 140 }], ['square', 280, { left: -60, top: 700, rotate: '10deg' }]]}>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none mx-auto flex max-w-[1376px] flex-col gap-8 px-4 pb-24 pt-12 sm:px-8">
        <div>
          <h1 className="display text-[clamp(40px,5vw,72px)]">{t('reservedTitle')}</h1>
          <p className="mt-3 text-lg text-mute">{t('reservedSub')}</p>
        </div>
        {isLoading && <p className="text-mute">{t('loading')}</p>}
        {isError && <p role="alert" className="bg-ink p-4 font-semibold text-paper">{t.error(error)}</p>}
        {data?.length === 0 && (
          <div className="glass flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="display text-3xl">{t('noneReservedTitle')}</p>
            <p className="text-mute">{t('noneReservedText')}</p>
          </div>
        )}
        <div className="grid gap-x-6 gap-y-8 [grid-template-columns:repeat(auto-fill,minmax(min(270px,100%),1fr))]">
          {data?.map((item, i) => (
            <Tag key={item.id}>
              <ItemTile item={item} index={i} />
              <div>
                <h2 className="text-lg font-bold leading-tight">{item.name}</h2>
                <p className="display text-lg tracking-tight">{item.myContribution ? t('youGave', { x: som(item.myContribution) }) : som(item.price)} {t('som')}</p>
              </div>
              <Link to={`/w/${item.wishlist.slug}`} className="mt-auto border-t-2 border-ink/15 pt-3 font-semibold">
                {item.wishlist.title}
                {item.wishlist.eventDate && <span className="block text-sm font-normal text-mute">{t.date(item.wishlist.eventDate)}</span>}
              </Link>
            </Tag>
          ))}
        </div>
      </main>
    </Page>
  );
}

import qrcode from 'qrcode-generator';
import { useT } from '../i18n';
import Dialog from './Dialog';

export default function QrDialog({ url, title, onClose }) {
  const t = useT();
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const svg = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
  const file = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace('<svg ', '<svg width="600" height="600" '))}`;

  return (
    <Dialog title={t('qrTitle')} onClose={onClose}>
      <p className="text-mute">{t('qrText')}</p>
      <div role="img" aria-label={t('qrAria', { t: title })} className="mx-auto w-full max-w-[300px] bg-white p-2 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      <a className="btn btn-primary no-underline" href={file} download={`giftory-${title.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.svg`}>{t('qrDownload')}</a>
    </Dialog>
  );
}

import { Component } from 'react';

export function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem('giftory_reload') || 0);
    if (Date.now() - last < 60000) return false;
    sessionStorage.setItem('giftory_reload', String(Date.now()));
  } catch {}
  location.reload();
  return true;
}

export const Boot = () => (
  <div className="boot" role="status">
    <span className="display">giftory</span>
  </div>
);

export class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error(error); }
  render() {
    if (!this.state.failed) return this.props.children;
    const [text, button] = {
      ru: ['Страница не загрузилась.', 'Обновить'],
      en: ["The page didn't load.", 'Reload'],
    }[document.documentElement.lang] || ['Sahifa yuklanmadi.', 'Yangilash'];
    return (
      <div className="boot" role="alert">
        <span className="display">giftory</span>
        <p className="boot-text">{text}</p>
        <button className="btn btn-primary" onClick={() => location.reload()}>{button}</button>
      </div>
    );
  }
}

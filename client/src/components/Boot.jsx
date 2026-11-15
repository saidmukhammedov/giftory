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
    const ru = document.documentElement.lang === 'ru';
    return (
      <div className="boot" role="alert">
        <span className="display">giftory</span>
        <p className="boot-text">{ru ? 'Страница не загрузилась.' : "The page didn't load."}</p>
        <button className="btn btn-primary" onClick={() => location.reload()}>{ru ? 'Обновить' : 'Reload'}</button>
      </div>
    );
  }
}

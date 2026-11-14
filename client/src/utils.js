export const som = (n) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const longDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

export const tileColor = (i) => ['bg-signal text-ink', 'bg-ink text-paper', 'bg-peach text-ink', 'bg-stone text-ink'][i % 4];

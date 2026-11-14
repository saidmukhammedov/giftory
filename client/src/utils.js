export const som = (n) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const tileColor = (i) => ['bg-signal text-black', 'bg-ink text-paper', 'bg-peach text-ink', 'bg-stone text-ink'][i % 4];

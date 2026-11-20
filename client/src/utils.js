export const som = (n) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');


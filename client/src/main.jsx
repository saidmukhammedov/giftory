import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth';
import { PrefsProvider } from './i18n';
import App from './App';
// Fonts are bundled with the app, so no visitor data goes to a font CDN
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/roboto-flex/full.css';
import './index.css';

// Anonymous, cookieless visit counts (self-hosted Umami, served from our own domain).
// Only in production builds that have a website ID. URL fragments (which can carry login tokens) are never sent.
const umamiId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
if (umamiId && import.meta.env.PROD) {
  const s = Object.assign(document.createElement('script'), { src: '/u/script.js', defer: true });
  Object.entries({ 'data-website-id': umamiId, 'data-host-url': `${location.origin}/u`, 'data-exclude-hash': 'true', 'data-do-not-track': 'true' }).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PrefsProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </PrefsProvider>
    </QueryClientProvider>
  </StrictMode>
);

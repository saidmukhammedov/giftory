import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth';
import { PrefsProvider } from './i18n';
import App from './App';
import { ErrorBoundary, reloadOnce } from './components/Boot';
import '@fontsource/unbounded/800.css';
import '@fontsource/golos-text/400.css';
import '@fontsource/golos-text/500.css';
import '@fontsource/golos-text/600.css';
import '@fontsource/golos-text/700.css';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/roboto-flex/wdth.css';
import './index.css';

const umamiId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
if (umamiId && import.meta.env.PROD) {
  const s = Object.assign(document.createElement('script'), { src: '/u/script.js', defer: true });
  Object.entries({ 'data-website-id': umamiId, 'data-host-url': `${location.origin}/u`, 'data-exclude-hash': 'true', 'data-do-not-track': 'true' }).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

window.addEventListener('vite:preloadError', (e) => { if (reloadOnce()) e.preventDefault(); });

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <PrefsProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </PrefsProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);

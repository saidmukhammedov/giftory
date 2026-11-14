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

import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import { lazy, Suspense, useEffect } from 'react';
import Landing from './pages/Landing';
import { CookieNotice } from './components/Layout';
import { Boot, reloadOnce } from './components/Boot';

// Each page downloads only when it's first opened. If a download fails
// (a new version went live while the page was open), reload once to get the new files.
const page = (load) => lazy(() => load().catch((e) => { reloadOnce(); throw e; }));
const Auth = page(() => import('./pages/Auth'));
const Dashboard = page(() => import('./pages/Dashboard'));
const Wishlist = page(() => import('./pages/Wishlist'));
const Reserved = page(() => import('./pages/Reserved'));
const NotFound = page(() => import('./pages/NotFound'));
const TelegramCallback = page(() => import('./pages/TelegramCallback'));
const Profile = page(() => import('./pages/Profile'));
const Legal = page(() => import('./pages/Legal'));

function Private({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Boot />;
  return user ? children : <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return (
    <>
    <Suspense fallback={<Boot />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/auth/telegram" element={<TelegramCallback />} />
      <Route path="/w/:slug" element={<Wishlist />} />
      <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
      <Route path="/reserved" element={<Private><Reserved /></Private>} />
      <Route path="/profile" element={<Private><Profile /></Private>} />
      <Route path="/privacy" element={<Legal doc="privacy" />} />
      <Route path="/terms" element={<Legal doc="terms" />} />
      <Route path="/cookies" element={<Legal doc="cookies" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
    <CookieNotice />
    </>
  );
}

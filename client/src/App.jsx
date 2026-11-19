import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import { lazy, Suspense, useEffect } from 'react';
import Landing from './pages/Landing';
import { CookieNotice } from './components/Layout';
import { Boot, reloadOnce } from './components/Boot';

const page = (load) => lazy(() => load().catch((e) => { reloadOnce(); throw e; }));
const Auth = page(() => import('./pages/Auth'));
const Dashboard = page(() => import('./pages/Dashboard'));
const Wishlist = page(() => import('./pages/Wishlist'));
const Reserved = page(() => import('./pages/Reserved'));
const NotFound = page(() => import('./pages/NotFound'));
const TelegramCallback = page(() => import('./pages/TelegramCallback'));
const Profile = page(() => import('./pages/Profile'));
const Legal = page(() => import('./pages/Legal'));
const Reset = page(() => import('./pages/Reset'));

function Private({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Boot />;
  return user ? children : <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
    <Suspense fallback={<Boot />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/auth/telegram" element={<TelegramCallback />} />
      <Route path="/forgot" element={<Reset mode="forgot" />} />
      <Route path="/reset" element={<Reset mode="reset" />} />
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

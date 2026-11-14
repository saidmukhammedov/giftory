import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import { lazy, Suspense, useEffect } from 'react';
import Landing from './pages/Landing';
import { CookieNotice } from './components/Layout';

// Each page downloads only when it's first opened
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Reserved = lazy(() => import('./pages/Reserved'));
const NotFound = lazy(() => import('./pages/NotFound'));
const TelegramCallback = lazy(() => import('./pages/TelegramCallback'));
const Profile = lazy(() => import('./pages/Profile'));
const Legal = lazy(() => import('./pages/Legal'));

function Private({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  return user ? children : <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return (
    <>
    <Suspense fallback={null}>
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

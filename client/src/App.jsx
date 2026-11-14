import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Wishlist from './pages/Wishlist';
import Reserved from './pages/Reserved';
import NotFound from './pages/NotFound';

function Private({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  return user ? children : <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/w/:slug" element={<Wishlist />} />
      <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
      <Route path="/reserved" element={<Private><Reserved /></Private>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout       from './components/layout/Layout';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OverviewPage from './pages/OverviewPage';
import ClientsPage  from './pages/ClientsPage';
import AlertsPage   from './pages/AlertsPage';
import ReportsPage  from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/10 border-t-accent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function Public({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"    element={<Public><LoginPage /></Public>} />
        <Route path="/register" element={<Public><RegisterPage /></Public>} />
        <Route path="/" element={<Guard><Layout /></Guard>}>
          <Route index              element={<OverviewPage />} />
          <Route path="clients"     element={<ClientsPage />} />
          <Route path="alerts"      element={<AlertsPage />} />
          <Route path="reports"     element={<ReportsPage />} />
          <Route path="settings"    element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

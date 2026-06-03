import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout       from './components/layout/Layout';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminRegisterPage from './pages/AdminRegisterPage';
import LandingPage  from './pages/LandingPage';
import OverviewPage from './pages/OverviewPage';
import ClientsPage  from './pages/ClientsPage';
import ClientProfilePage from './pages/ClientProfilePage';
import AlertsPage   from './pages/AlertsPage';
import ReportsPage   from './pages/ReportsPage';
import SettingsPage  from './pages/SettingsPage';
import MessagingPage      from './pages/MessagingPage';
import LandingEditorPage  from './pages/LandingEditorPage';
import AdEditorPage       from './pages/AdEditorPage';

const isAdmin = u => u && (u.role === 'admin' || u.role === 'superadmin');

// Dashboard guard — admins only. Clients (viewers) are sent to the public site.
function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-ms-bg flex items-center justify-center">
      <div className="w-5 h-5 border border-ms-border border-t-ms-blue rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/home" replace />;
  return isAdmin(user) ? children : <Navigate to="/home" replace />;
}

// Login / register pages — already-authed users go to their home base.
function Public({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={isAdmin(user) ? '/' : '/home'} replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public landing page */}
        <Route path="/home"     element={<LandingPage />} />
        <Route path="/login"    element={<Public><LoginPage /></Public>} />
        <Route path="/register" element={<Public><RegisterPage /></Public>} />
        <Route path="/register/admin" element={<Public><AdminRegisterPage /></Public>} />

        {/* Protected dashboard */}
        <Route path="/" element={<Guard><Layout /></Guard>}>
          <Route index              element={<OverviewPage />} />
          <Route path="clients"     element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientProfilePage />} />
          <Route path="alerts"      element={<AlertsPage />} />
          <Route path="messaging"   element={<MessagingPage />} />
          <Route path="reports"         element={<ReportsPage />} />
          <Route path="landing-editor" element={<LandingEditorPage />} />
          <Route path="ads"             element={<AdEditorPage />} />
          <Route path="settings"        element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthProvider>
  );
}

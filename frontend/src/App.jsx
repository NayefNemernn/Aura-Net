import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout       from './components/layout/Layout';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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

function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-ms-bg flex items-center justify-center">
      <div className="w-5 h-5 border border-ms-border border-t-ms-blue rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/home" replace />;
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
        {/* Public landing page */}
        <Route path="/home"     element={<LandingPage />} />
        <Route path="/login"    element={<Public><LoginPage /></Public>} />
        <Route path="/register" element={<Public><RegisterPage /></Public>} />

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

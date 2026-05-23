import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../../services/api';

const NAV = [
  { to: '/',               label: 'Overview',  icon: GridIcon,    end: true },
  { to: '/clients',        label: 'Clients',   icon: UsersIcon },
  { to: '/alerts',         label: 'Alerts',    icon: BellIcon },
  { to: '/messaging',      label: 'Messages',  icon: ChatIcon },
  { to: '/reports',        label: 'Reports',   icon: DocIcon },
  { to: '/landing-editor', label: 'Website',   icon: GlobeIcon },
  { to: '/settings',       label: 'Settings',  icon: GearIcon },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const { data } = await api.post('/api/sync');
      if (data.success) {
        showToast(`Sync done — ${data.clientsFound} clients`, 'ok');
        window.dispatchEvent(new CustomEvent('bms-sync-done'));
      } else showToast(data.error, 'err');
    } catch (e) {
      showToast(e.response?.data?.error || e.message, 'err');
    } finally { setSyncing(false); }
  }, []);

  // Auto-sync every 60 seconds
  const syncingRef = useRef(false);
  useEffect(() => {
    const run = async () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      setSyncing(true);
      try {
        const { data } = await api.post('/api/sync');
        if (data.success) {
          showToast(`Auto-sync — ${data.clientsFound} clients`, 'ok');
          window.dispatchEvent(new CustomEvent('bms-sync-done'));
        }
      } catch (_) {}
      finally { setSyncing(false); syncingRef.current = false; }
    };
    const id = setInterval(run, 60_000);
    return () => clearInterval(id);
  }, []);

  const doLogout = async () => { await logout(); nav('/login'); };

  return (
    <div className="flex flex-col h-screen bg-ms-bg overflow-hidden">

      {/* ── Top header ─────────────────────────────────────────────── */}
      <header className="h-12 bg-ms-navy flex items-center px-3 gap-3 flex-shrink-0 z-20">
        <div className="flex items-center gap-2 mr-2">
          <img src="/logo.jpg" alt="Aura Net" className="h-7 w-7 rounded-full object-cover border border-white/20" />
          <span className="text-white font-semibold text-sm tracking-tight hidden sm:block">Aura Net</span>
        </div>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `px-3 py-1.5 text-sm rounded transition-colors ${isActive ? 'bg-white/20 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/10'}`
              }>{label}</NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={sync} disabled={syncing}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded transition-colors disabled:opacity-50">
            {syncing
              ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              : <RefreshIcon size={13} />}
            <span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Sync BMS'}</span>
          </button>

          <div className="flex items-center gap-1.5 pl-2 border-l border-white/20">
            <div className="w-7 h-7 rounded-full bg-ms-blue flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-white/80 text-xs hidden lg:block">{user?.name}</span>
            <button onClick={doLogout} title="Sign out" className="text-white/50 hover:text-white transition-colors ml-0.5">
              <LogoutIcon size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop only */}
        <aside className="hidden lg:flex w-44 flex-shrink-0 bg-ms-sidebar border-r border-ms-border flex-col">
          <nav className="flex-1 py-2">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 mx-2 px-3 py-2 rounded text-sm transition-colors ${
                    isActive ? 'bg-ms-sidebar-active text-ms-blue font-semibold border-l-2 border-ms-blue' : 'text-ms-sub hover:bg-ms-sidebar-active hover:text-ms-text'
                  }`
                }>
                <Icon size={15} />{label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content — extra bottom padding on mobile for the tab bar */}
        <main className="flex-1 overflow-y-auto bg-ms-bg pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar ─────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-ms-surface border-t border-ms-border z-30 flex safe-area-bottom">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${isActive ? 'text-ms-blue' : 'text-ms-dim'}`
            }>
            <Icon size={19} />
            <span className="text-[9px] font-semibold">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Toast ─────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-20 md:bottom-5 right-3 z-50 flex items-center gap-2 px-3 py-2.5 rounded shadow-ms-lg text-sm font-medium border max-w-xs
          ${toast.type === 'ok' ? 'bg-ms-surface border-ms-green text-ms-text' : 'bg-ms-surface border-ms-red text-ms-text'}`}>
          {toast.type === 'ok' ? <span className="text-ms-green">✓</span> : <span className="text-ms-red">✕</span>}
          <span className="truncate">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

function GridIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="1" y="1" width="5.5" height="5.5" rx="1"/><rect x="9.5" y="1" width="5.5" height="5.5" rx="1"/>
    <rect x="1" y="9.5" width="5.5" height="5.5" rx="1"/><rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1"/>
  </svg>;
}
function UsersIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
    <circle cx="12" cy="5" r="2"/><path d="M15 13c0-2-1.3-3.6-3-4.3"/>
  </svg>;
}
function BellIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M8 2a5 5 0 0 1 5 5c0 3 1.5 3.5 1.5 3.5H1.5S3 10 3 7a5 5 0 0 1 5-5Z"/><path d="M7 13.5a1 1 0 0 0 2 0"/>
  </svg>;
}
function DocIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="3" y="2" width="10" height="12" rx="1"/><path d="M6 6h4M6 9h4M6 12h2"/>
  </svg>;
}
function GearIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="8" cy="8" r="2.5"/>
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/>
  </svg>;
}
function ChatIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M14 10c0 1.1-.9 2-2 2H4l-2.5 2.5V4c0-1.1.9-2 2-2h8.5c1.1 0 2 .9 2 2v6Z"/>
  </svg>;
}
function RefreshIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5"/><path d="M8 1v3.5H11.5"/>
  </svg>;
}
function LogoutIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M6 3H3v10h3M10 5l3 3-3 3M13 8H7"/>
  </svg>;
}
function GlobeIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="8" cy="8" r="6.5"/>
    <path d="M8 1.5c-2 2-3 4-3 6.5s1 4.5 3 6.5M8 1.5c2 2 3 4 3 6.5s-1 4.5-3 6.5M1.5 8h13"/>
  </svg>;
}

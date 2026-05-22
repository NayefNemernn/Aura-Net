import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useCallback } from 'react';
import api from '../../services/api';

const NAV = [
  { to: '/',         label: 'Overview',    icon: GridIcon,  end: true },
  { to: '/clients',  label: 'Clients',     icon: UsersIcon },
  { to: '/alerts',   label: 'Alerts',      icon: BellIcon },
  { to: '/reports',  label: 'Reports',     icon: DocIcon },
  { to: '/settings', label: 'Settings',    icon: GearIcon },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [syncing,  setSyncing]  = useState(false);
  const [syncMsg,  setSyncMsg]  = useState('');
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const sync = useCallback(async () => {
    setSyncing(true); setSyncMsg('Connecting to BMS…');
    try {
      setSyncMsg('Scraping clients…');
      const { data } = await api.post('/api/sync');
      if (data.success) {
        showToast(`✅ Sync done — ${data.clientsFound} clients, ${data.alertsCreated} alerts`, 'ok');
      } else {
        showToast(`❌ ${data.error}`, 'err');
      }
    } catch (e) {
      showToast(`❌ ${e.response?.data?.error || e.message}`, 'err');
    } finally { setSyncing(false); setSyncMsg(''); }
  }, []);

  const doLogout = async () => { await logout(); nav('/login'); };

  return (
    <div className="flex h-screen bg-ink overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 bg-surface border-r border-white/[0.06] flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-teal flex items-center justify-center font-display font-black text-[11px] text-white flex-shrink-0">AN</div>
            <span className="font-display font-bold text-base text-white">Aura<span className="text-accent">Net</span></span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-accent/15 text-accent font-medium'
                    : 'text-muted hover:bg-white/[0.04] hover:text-white'
                }`
              }>
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sync + user */}
        <div className="p-3 border-t border-white/[0.05] space-y-2">
          <button onClick={sync} disabled={syncing}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-accent/10 hover:bg-accent/20 text-accent transition-all border border-accent/20 disabled:opacity-60">
            {syncing
              ? <><span className="w-3 h-3 border border-accent/30 border-t-accent rounded-full animate-spin" />{syncMsg || 'Syncing…'}</>
              : <><RefreshIcon size={12} />Sync BMS</>}
          </button>

          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent to-teal flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-dim truncate">{user?.email}</p>
            </div>
            <button onClick={doLogout} title="Sign out"
              className="text-dim hover:text-white transition-colors flex-shrink-0">
              <LogoutIcon size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* ── Toast ───────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl border animate-fade-in
          ${toast.type === 'ok' ? 'bg-s2 border-teal/30 text-white' : 'bg-s2 border-danger/30 text-white'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── Inline SVG icons (no dependency needed) ──────────────────────────
function GridIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="1" y="1" width="5.5" height="5.5" rx="1.5"/><rect x="9.5" y="1" width="5.5" height="5.5" rx="1.5"/>
    <rect x="1" y="9.5" width="5.5" height="5.5" rx="1.5"/><rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1.5"/>
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
    <path d="M3 2h10v12H3z" rx="1.5"/><path d="M6 6h4M6 9h4M6 12h2"/>
  </svg>;
}
function GearIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="8" cy="8" r="2.5"/>
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/>
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

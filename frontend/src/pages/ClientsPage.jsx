import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const STATUS_FILTERS = ['all','online','active','inactive','expired','pending'];

export default function ClientsPage() {
  const [clients,  setClients]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [total,    setTotal]    = useState(0);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('all');
  const [paid,     setPaid]     = useState('all');
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [checked,  setChecked]  = useState([]);
  const [compose,  setCompose]  = useState(false);

  const loadStats = useCallback(async () => {
    try { const { data } = await api.get('/api/clients/stats'); setStats(data.stats); } catch (_) {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: 100 });
      if (status !== 'all') p.set('status', status);
      if (paid   !== 'all') p.set('paid',   paid);
      if (search) p.set('search', search);
      const { data } = await api.get(`/api/clients?${p}`);
      setClients(data.clients);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, status, paid, search]);

  useEffect(() => { setPage(1); }, [status, paid, search]);
  useEffect(() => { load(); loadStats(); }, [load, loadStats]);
  useEffect(() => {
    const h = () => { load(); loadStats(); };
    window.addEventListener('bms-sync-done', h);
    return () => window.removeEventListener('bms-sync-done', h);
  }, [load, loadStats]);

  const togglePaid = async (e, client) => {
    e.stopPropagation();
    const { data } = await api.patch(`/api/clients/${client._id}/paid`);
    patch(client._id, { paid: data.paid });
  };

  const toggleReminder = async (e, client) => {
    e.stopPropagation();
    const { data } = await api.patch(`/api/clients/${client._id}/reminders`);
    patch(client._id, { remindersEnabled: data.remindersEnabled });
  };

  const patch = (id, fields) => {
    setClients(prev => prev.map(c => c._id === id ? { ...c, ...fields } : c));
    if (selected?._id === id) setSelected(s => ({ ...s, ...fields }));
  };

  const allIds     = clients.map(c => c._id);
  const allChecked = allIds.length > 0 && allIds.every(id => checked.includes(id));
  const toggleAll  = () => setChecked(allChecked ? [] : allIds);
  const toggleOne  = (id) => setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="flex flex-col h-full">
      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
        <StatCard label="Total"   value={stats?.total    ?? '—'} color="text-ms-blue" />
        <StatCard label="Online"  value={stats?.online   ?? '—'} color="text-ms-green" />
        <StatCard label="Expired" value={stats?.expired  ?? '—'} color="text-ms-red" />
        <StatCard label="Expiring" value={stats?.expiringSoon ?? '—'} color="text-ms-orange" sub="5 days" className="hidden sm:block" />
        <StatCard label="Pending" value={stats?.pending  ?? '—'} color="text-ms-sub" className="hidden sm:block" />
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="px-3 pb-2 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ms-dim" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="5.5" cy="5.5" r="4"/><path d="M9 9l2.5 2.5"/>
            </svg>
            <input className="ms-input pl-8 py-2 text-sm" placeholder="Search name, username…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <a href="/api/reports/clients?format=csv" download
            className="ms-btn-outline text-xs px-3 flex items-center gap-1 whitespace-nowrap">
            CSV
          </a>
        </div>

        {/* Status filter — horizontal scroll on mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border whitespace-nowrap flex-shrink-0 transition-colors ${
                status === s ? 'bg-ms-blue text-white border-ms-blue' : 'bg-ms-surface text-ms-sub border-ms-border'
              }`}>{s}</button>
          ))}
          <div className="w-px h-4 bg-ms-border self-center flex-shrink-0" />
          {['all','paid','unpaid'].map(p => (
            <button key={p} onClick={() => setPaid(p)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border whitespace-nowrap flex-shrink-0 transition-colors ${
                paid === p ? 'bg-ms-green text-white border-ms-green' : 'bg-ms-surface text-ms-sub border-ms-border'
              }`}>{p}</button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center items-center flex-1">
          <span className="w-6 h-6 border-2 border-ms-border border-t-ms-blue rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-ms-dim gap-2">
          <span className="text-4xl">👥</span>
          <span className="text-sm">{total === 0 ? 'No clients yet — run a BMS sync' : 'No matches'}</span>
        </div>
      ) : (
        <>
          {/* ── Mobile card list ─────────────────────────────── */}
          <div className="md:hidden flex-1 overflow-y-auto px-3 space-y-2 pb-2">
            {clients.map(c => (
              <div key={c._id}
                className={`ms-card p-3 transition-colors ${checked.includes(c._id) ? 'ring-2 ring-ms-blue bg-ms-blue-light/20' : ''}`}>
                <div className="flex items-start gap-2.5">
                  <input type="checkbox" checked={checked.includes(c._id)} onChange={() => toggleOne(c._id)}
                    className="mt-0.5 w-4 h-4 accent-ms-blue flex-shrink-0 cursor-pointer" />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelected(c)}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-ms-text truncate">{c.name || c.username}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="text-xs text-ms-dim font-mono mt-0.5">{c.username}</div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {c.expiry && (
                        <span className={`text-xs font-mono ${
                          isExpired(c.expiry) ? 'text-ms-red font-semibold' :
                          isExpiringSoon(c.expiry) ? 'text-ms-orange font-semibold' : 'text-ms-dim'
                        }`}>Exp: {c.expiry}</span>
                      )}
                      {(c.phone || c.mobile) && (
                        <a href={`tel:${c.phone || c.mobile}`} onClick={e => e.stopPropagation()}
                          className="text-xs text-ms-blue font-mono">
                          {c.phone || c.mobile}
                        </a>
                      )}
                      {c.profile && <span className="text-xs text-ms-sub">{c.profile}</span>}
                    </div>
                    {c.ipAddress && (
                      <div className="text-[10px] text-ms-dim font-mono mt-1">{c.ipAddress} {c.uptime ? `· ${c.uptime}` : ''}</div>
                    )}
                  </div>
                  {/* Quick toggles */}
                  <div className="flex flex-col gap-2 flex-shrink-0 items-center">
                    <button onClick={e => togglePaid(e, c)} className="flex flex-col items-center gap-0.5">
                      <MiniToggle on={c.paid} color="bg-ms-green" />
                      <span className="text-[9px] text-ms-dim">Paid</span>
                    </button>
                    <button onClick={e => toggleReminder(e, c)} className="flex flex-col items-center gap-0.5">
                      <MiniToggle on={c.remindersEnabled !== false} color="bg-ms-blue" />
                      <span className="text-[9px] text-ms-dim">WA</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop table ────────────────────────────────── */}
          <div className="hidden md:flex flex-col flex-1 overflow-hidden px-5 pb-5">
            <div className="ms-card overflow-hidden flex flex-col flex-1">
              <div className="overflow-auto flex-1">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-ms-sidebar border-b border-ms-border">
                      <th className="px-3 py-2.5 w-8">
                        <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-3.5 h-3.5 accent-ms-blue cursor-pointer" />
                      </th>
                      {['Name','Username','Status','Paid','WA','Uptime','IP','MAC','Address','D.Quota','M.Quota','Service','Expiry','AutoRefill','FUP','Speed','Phone','Mobile','Start','Last Seen'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-[11px] text-ms-dim font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ms-border">
                    {clients.map(c => (
                      <tr key={c._id} className={`hover:bg-ms-sidebar transition-colors ${checked.includes(c._id) ? 'bg-ms-blue-light/30' : ''}`}>
                        <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={checked.includes(c._id)} onChange={() => toggleOne(c._id)} className="w-3.5 h-3.5 accent-ms-blue cursor-pointer" />
                        </td>
                        <td className="px-3 py-2 text-ms-text font-medium whitespace-nowrap max-w-[140px] truncate cursor-pointer" onClick={() => setSelected(c)}>{c.name||'—'}</td>
                        <td className="px-3 py-2 text-ms-sub font-mono whitespace-nowrap">{c.username}</td>
                        <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={c.status} /></td>
                        <td className="px-3 py-2 whitespace-nowrap cursor-pointer" onClick={e => togglePaid(e, c)}><Toggle on={c.paid} onColor="bg-ms-green" /></td>
                        <td className="px-3 py-2 whitespace-nowrap cursor-pointer" onClick={e => toggleReminder(e, c)}><Toggle on={c.remindersEnabled !== false} onColor="bg-ms-blue" /></td>
                        <td className="px-3 py-2 text-ms-sub whitespace-nowrap">{c.uptime||'—'}</td>
                        <td className="px-3 py-2 text-ms-sub font-mono whitespace-nowrap">{c.ipAddress||'—'}</td>
                        <td className="px-3 py-2 text-ms-sub font-mono whitespace-nowrap">{c.mac||'—'}</td>
                        <td className="px-3 py-2 text-ms-sub max-w-[120px] truncate">{c.address||'—'}</td>
                        <td className="px-3 py-2 text-ms-sub whitespace-nowrap">{c.dailyQuota||'—'}</td>
                        <td className="px-3 py-2 text-ms-sub whitespace-nowrap">{c.monthlyQuota||'—'}</td>
                        <td className="px-3 py-2 text-ms-sub whitespace-nowrap">{c.profile||'—'}</td>
                        <td className={`px-3 py-2 whitespace-nowrap font-mono text-xs ${isExpiringSoon(c.expiry)?'text-ms-orange font-semibold':isExpired(c.expiry)?'text-ms-red':''}`}>{c.expiry||'—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${c.autoRefill?'bg-ms-green-bg text-ms-green':'bg-ms-sidebar text-ms-dim border border-ms-border'}`}>{c.autoRefill?'Yes':'No'}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${c.fup?'bg-ms-blue-light text-ms-blue':'bg-ms-red-bg text-ms-red'}`}>{c.fup?'ON':'OFF'}</span>
                        </td>
                        <td className="px-3 py-2 text-ms-sub whitespace-nowrap">{c.currentSpeed||'—'}</td>
                        <td className="px-3 py-2 text-ms-sub font-mono whitespace-nowrap">{c.phone||'—'}</td>
                        <td className="px-3 py-2 text-ms-sub font-mono whitespace-nowrap">{c.mobile||'—'}</td>
                        <td className="px-3 py-2 text-ms-sub whitespace-nowrap">{c.startDate||'—'}</td>
                        <td className="px-3 py-2 text-ms-sub whitespace-nowrap">{c.lastSeen||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-ms-border flex-shrink-0">
                  <span className="text-xs text-ms-dim">{total} total · Page {page} of {pages}</span>
                  <div className="flex gap-2">
                    <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="ms-btn-ghost text-xs px-3 py-1 disabled:opacity-40">← Prev</button>
                    <button disabled={page>=pages} onClick={() => setPage(p=>p+1)} className="ms-btn-ghost text-xs px-3 py-1 disabled:opacity-40">Next →</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile pagination */}
          {pages > 1 && (
            <div className="md:hidden flex items-center justify-between px-3 py-2 border-t border-ms-border bg-ms-surface">
              <span className="text-xs text-ms-dim">{total} total · Page {page}/{pages}</span>
              <div className="flex gap-2">
                <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="ms-btn-ghost text-xs px-3 py-1.5 border border-ms-border disabled:opacity-40">←</button>
                <button disabled={page>=pages} onClick={() => setPage(p=>p+1)} className="ms-btn-ghost text-xs px-3 py-1.5 border border-ms-border disabled:opacity-40">→</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating send button on mobile when items are checked */}
      {checked.length > 0 && (
        <button onClick={() => setCompose(true)}
          className="md:hidden fixed bottom-20 right-4 z-40 ms-btn shadow-ms-lg rounded-full px-4 py-3 flex items-center gap-2 text-sm">
          📱 Send ({checked.length})
        </button>
      )}
      {/* Desktop send button in toolbar */}
      {checked.length > 0 && (
        <div className="hidden md:block fixed bottom-6 right-6 z-40">
          <button onClick={() => setCompose(true)} className="ms-btn shadow-ms-lg rounded-full px-5 py-2.5 flex items-center gap-2">
            📱 Send WhatsApp to {checked.length} client{checked.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {selected && (
        <ClientModal client={selected} onClose={() => setSelected(null)}
          onTogglePaid={e => togglePaid(e, selected)}
          onToggleReminder={e => toggleReminder(e, selected)} />
      )}
      {compose && <ComposeModal clientIds={checked} onClose={() => setCompose(false)} />}
    </div>
  );
}

// ── Shared helpers ──────────────────────────────────────────────────────────

function StatCard({ label, value, color, sub, className = '' }) {
  return (
    <div className={`ms-card p-2.5 sm:p-4 ${className}`}>
      <div className="text-[10px] sm:text-[11px] text-ms-dim font-semibold uppercase tracking-wider">{label}</div>
      <div className={`text-2xl sm:text-3xl font-bold tracking-tight mt-0.5 ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-ms-dim">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`pill-${status} whitespace-nowrap`}>{status}</span>;
}

function Toggle({ on, onColor = 'bg-ms-blue' }) {
  return (
    <div className={`w-8 h-4 rounded-full relative transition-colors ${on ? onColor : 'bg-ms-border'}`}>
      <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </div>
  );
}

function MiniToggle({ on, color = 'bg-ms-blue' }) {
  return (
    <div className={`w-9 h-5 rounded-full relative transition-colors ${on ? color : 'bg-ms-border'}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </div>
  );
}

// ── Modals (bottom-sheet on mobile, centered on desktop) ────────────────────

function Sheet({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/50" onClick={onClose}>
      <div className="bg-ms-surface w-full rounded-t-2xl sm:rounded-xl sm:max-w-2xl sm:w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-ms-lg"
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ClientModal({ client: c, onClose, onTogglePaid, onToggleReminder }) {
  const [activeTab, setActiveTab] = useState('info');
  const [editOpen,  setEditOpen]  = useState(false);

  return (
    <>
      <Sheet onClose={onClose}>
        {/* Drag handle on mobile */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-ms-border rounded-full" />
        </div>
        {/* Header */}
        <div className="bg-ms-navy px-4 py-3 flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-base text-white">{c.name || c.username}</div>
            <div className="text-white/60 text-xs font-mono">{c.username}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <StatusBadge status={c.status} />
            <button onClick={onTogglePaid} className={`text-[11px] font-semibold px-2 py-1 rounded border ${c.paid ? 'bg-ms-green/20 text-ms-green border-ms-green/40' : 'bg-white/10 text-white/60 border-white/20'}`}>
              {c.paid ? '✓ Paid' : 'Unpaid'}
            </button>
            <button onClick={onToggleReminder} className={`text-[11px] font-semibold px-2 py-1 rounded border ${c.remindersEnabled !== false ? 'bg-ms-blue/20 text-ms-blue border-ms-blue/40' : 'bg-white/10 text-white/60 border-white/20'}`}>
              {c.remindersEnabled !== false ? '📱 ON' : '📵 OFF'}
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-white/60 hover:text-white text-sm">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-ms-border bg-ms-sidebar">
          {[['info', 'Info'], ['actions', 'BMS Actions']].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === id ? 'border-ms-blue text-ms-blue' : 'border-transparent text-ms-dim hover:text-ms-text'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Info tab */}
        {activeTab === 'info' && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MSection title="Connection">
              <MRow label="IP"       value={c.ipAddress} mono />
              <MRow label="MAC"      value={c.mac}        mono />
              <MRow label="Address"  value={c.address} />
              <MRow label="Uptime"   value={c.uptime} />
              <MRow label="Speed"    value={c.currentSpeed} />
            </MSection>
            <MSection title="Subscription">
              <MRow label="Service"    value={c.profile} />
              <MRow label="Start"      value={c.startDate} />
              <MRow label="Expiry"     value={c.expiry} warn={isExpiringSoon(c.expiry)} err={isExpired(c.expiry)} />
              <MRow label="AutoRefill" value={c.autoRefill ? 'Yes' : 'No'} />
              <MRow label="FUP"        value={c.fup ? 'ON' : 'OFF'} />
            </MSection>
            <MSection title="Quota">
              <MRow label="Daily"   value={c.dailyQuota} />
              <MRow label="Monthly" value={c.monthlyQuota} />
            </MSection>
            <MSection title="Contact">
              <MRow label="Phone"    value={c.phone}    mono link={c.phone ? `tel:${c.phone}` : null} />
              <MRow label="Mobile"   value={c.mobile}   mono link={c.mobile ? `tel:${c.mobile}` : null} />
              <MRow label="Last Seen" value={c.lastSeen} />
            </MSection>
          </div>
        )}

        {/* BMS Actions tab */}
        {activeTab === 'actions' && (
          <BmsActionsPanel username={c.username} onEditUser={() => setEditOpen(true)} />
        )}
      </Sheet>

      {editOpen && (
        <EditUserSheet username={c.username} onClose={() => setEditOpen(false)} />
      )}
    </>
  );
}

function BmsActionsPanel({ username, onEditUser }) {
  const [busy,   setBusy]   = useState(null);  // action key currently running
  const [result, setResult] = useState(null);  // { ok, msg }

  const run = async (action, apiFn) => {
    setBusy(action);
    setResult(null);
    try {
      const data = await apiFn();
      setResult({ ok: true, msg: data.message || data.output || 'Done' });
    } catch (e) {
      setResult({ ok: false, msg: e.response?.data?.error || e.message });
    } finally {
      setBusy(null);
    }
  };

  const simple = (action) => () =>
    run(action, () => api.post('/api/bms/action', { username, action }).then(r => r.data));

  const output = (label) => () =>
    run(label, () => api.post(`/api/bms/output/${encodeURIComponent(username)}`, { label }).then(r => r.data));

  const doPing = () =>
    run('ping', () => api.post(`/api/bms/ping/${encodeURIComponent(username)}`).then(r => r.data));

  const doUserPage = async () => {
    try {
      const { data } = await api.get(`/api/bms/userpage/${encodeURIComponent(username)}`);
      window.open(data.url, '_blank', 'noopener');
    } catch (e) { setResult({ ok: false, msg: e.message }); }
  };

  const ACTIONS = [
    { key: 'refill',      icon: '⚡', label: 'Refill',       color: 'text-ms-green',  fn: simple('refill'),                 desc: 'Refill user quota/account' },
    { key: 'disconnect',  icon: '🔌', label: 'Disconnect',   color: 'text-ms-red',    fn: simple('disconnect'),             desc: 'Drop active session' },
    { key: 'block',       icon: '🚫', label: 'Block',        color: 'text-ms-red',    fn: simple('block'),                  desc: 'Block user access' },
    { key: 'resetMac',    icon: '🔄', label: 'Reset MAC',    color: 'text-ms-orange', fn: simple('resetMac'),               desc: 'Clear MAC binding' },
    { key: 'ping',        icon: '📡', label: 'Ping',         color: 'text-ms-blue',   fn: doPing,                           desc: 'Ping user IP from BNG' },
    { key: 'viewRules',   icon: '📋', label: 'View Rules',   color: 'text-ms-blue',   fn: output('view rules applied'),     desc: 'Show applied rules' },
    { key: 'userTraffic', icon: '📊', label: 'Traffic',      color: 'text-ms-blue',   fn: output('user traffic'),           desc: 'User traffic summary' },
    { key: 'statusBng',   icon: '🖧',  label: 'BNG Status',   color: 'text-ms-blue',   fn: output('status on bng'),          desc: 'Status on BNG router' },
    { key: 'changeplan',  icon: '🔁', label: 'Change Plan',  color: 'text-ms-orange', fn: simple('changeplan'),             desc: 'Change service plan' },
    { key: 'editUser',    icon: '✏️', label: 'Edit User',    color: 'text-ms-blue',   fn: onEditUser,                       desc: 'Edit profile in BMS' },
    { key: 'userPage',    icon: '🔗', label: 'User Page',    color: 'text-ms-dim',    fn: doUserPage,                       desc: 'Open BMS user page' },
  ];

  return (
    <div className="p-4">
      <p className="text-[11px] text-ms-dim mb-3">
        Actions run live on the BMS via Puppeteer — each takes 10–30 s to complete.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {ACTIONS.map(a => (
          <button key={a.key}
            onClick={a.key === 'editUser' ? a.fn : a.fn}
            disabled={!!busy && busy !== a.key}
            className={`flex items-center gap-2.5 p-3 rounded-lg border border-ms-border bg-ms-surface hover:bg-ms-sidebar transition-colors text-left disabled:opacity-40 ${busy === a.key ? 'ring-2 ring-ms-blue' : ''}`}>
            <span className="text-lg leading-none flex-shrink-0">{a.icon}</span>
            <div className="min-w-0">
              <div className={`text-xs font-semibold ${a.color} truncate`}>{a.label}</div>
              <div className="text-[10px] text-ms-dim truncate">{a.desc}</div>
            </div>
            {busy === a.key && (
              <span className="ml-auto w-3.5 h-3.5 border border-ms-border border-t-ms-blue rounded-full animate-spin flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {result && (
        <div className={`rounded-lg p-3 text-xs font-mono whitespace-pre-wrap break-words ${result.ok ? 'bg-ms-green-bg text-ms-green' : 'bg-ms-red-bg text-ms-red'}`}>
          {result.ok ? '✓ ' : '✕ '}{result.msg}
        </div>
      )}
    </div>
  );
}

function EditUserSheet({ username, onClose }) {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [formData, setFormData] = useState(null);
  const [values,   setValues]   = useState({});
  const [error,    setError]    = useState(null);
  const [saveMsg,  setSaveMsg]  = useState(null);

  useEffect(() => {
    api.get(`/api/bms/edit/${encodeURIComponent(username)}`)
      .then(({ data }) => {
        setFormData(data.formData);
        const init = {};
        data.formData.fields.forEach(f => { init[f.name] = f.value ?? ''; });
        setValues(init);
      })
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [username]);

  const setVal = (name, val) => setValues(prev => ({ ...prev, [name]: val }));

  const save = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      const { data } = await api.patch(`/api/bms/edit/${encodeURIComponent(username)}`, { fields: values });
      setSaveMsg({ ok: true, msg: data.message || 'Saved' });
    } catch (e) {
      setSaveMsg({ ok: false, msg: e.response?.data?.error || e.message });
    } finally {
      setSaving(false);
    }
  };

  // Fields to skip in the UI (hidden, csrf, etc.)
  const visibleFields = (formData?.fields || []).filter(f =>
    f.type !== 'hidden' && f.type !== 'submit' && f.type !== 'button' && f.name
  );

  return (
    <Sheet onClose={onClose}>
      <div className="sm:hidden flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 bg-ms-border rounded-full" />
      </div>
      <div className="px-4 py-3 border-b border-ms-border flex items-center justify-between bg-ms-sidebar">
        <div>
          <div className="font-semibold text-sm text-ms-text">Edit User in BMS</div>
          <div className="text-[11px] text-ms-dim font-mono">{username}</div>
        </div>
        <button onClick={onClose} className="text-ms-sub hover:text-ms-text p-1 text-lg">✕</button>
      </div>

      <div className="p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <span className="w-8 h-8 border-2 border-ms-border border-t-ms-blue rounded-full animate-spin" />
            <span className="text-sm text-ms-dim">Connecting to BMS and loading form…</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg p-4 bg-ms-red-bg text-ms-red text-sm">{error}</div>
        )}

        {!loading && !error && formData && (
          <>
            <div className="space-y-3 mb-4">
              {visibleFields.map(f => (
                <div key={f.name}>
                  <label className="block text-[11px] text-ms-dim font-semibold uppercase tracking-wider mb-1">
                    {f.label || f.name}
                  </label>
                  {f.type === 'select' ? (
                    <select className="ms-input" value={values[f.name] ?? ''} onChange={e => setVal(f.name, e.target.value)}>
                      {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea className="ms-input resize-none" rows={3}
                      value={values[f.name] ?? ''} onChange={e => setVal(f.name, e.target.value)} />
                  ) : f.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-ms-blue"
                        checked={!!values[f.name]} onChange={e => setVal(f.name, e.target.checked)} />
                      <span className="text-sm text-ms-text">{f.label || f.name}</span>
                    </label>
                  ) : (
                    <input className="ms-input" type={f.type === 'password' ? 'password' : 'text'}
                      value={values[f.name] ?? ''}
                      onChange={e => setVal(f.name, e.target.value)}
                      placeholder={f.type === 'password' ? 'Leave blank to keep current' : ''} />
                  )}
                </div>
              ))}
            </div>

            {saveMsg && (
              <div className={`rounded-lg p-3 mb-3 text-sm ${saveMsg.ok ? 'bg-ms-green-bg text-ms-green' : 'bg-ms-red-bg text-ms-red'}`}>
                {saveMsg.ok ? '✓ ' : '✕ '}{saveMsg.msg}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="ms-btn flex-1 flex items-center justify-center gap-2">
                {saving ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Saving to BMS…</> : 'Save Changes'}
              </button>
              <button onClick={onClose} className="ms-btn-outline px-4">Cancel</button>
            </div>
            <p className="text-[10px] text-ms-dim mt-2">Changes are written directly to the BMS via Puppeteer.</p>
          </>
        )}
      </div>
    </Sheet>
  );
}

function MSection({ title, children }) {
  return (
    <div>
      <div className="text-[10px] text-ms-dim font-semibold uppercase tracking-wider mb-2">{title}</div>
      <div className="ms-card divide-y divide-ms-border overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function MRow({ label, value, mono, warn, err, link }) {
  const empty = !value || value === '—';
  const cls = warn ? 'text-ms-orange font-semibold' : err ? 'text-ms-red font-semibold' : empty ? 'text-ms-dim' : 'text-ms-text';
  return (
    <div className="flex items-center justify-between px-3 py-2 gap-3">
      <span className="text-xs text-ms-dim flex-shrink-0">{label}</span>
      {link && !empty
        ? <a href={link} className={`text-xs text-ms-blue ${mono ? 'font-mono' : ''} truncate`}>{value}</a>
        : <span className={`text-xs truncate text-right ${mono ? 'font-mono' : ''} ${cls}`}>{empty ? '—' : value}</span>
      }
    </div>
  );
}

function ComposeModal({ clientIds, onClose }) {
  const [msg,     setMsg]     = useState('');
  const [sending, setSending] = useState(false);
  const [result,  setResult]  = useState(null);

  const send = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post('/api/messaging/whatsapp/send', { clientIds, message: msg });
      setResult(data);
    } catch (e) { setResult({ success: false, error: e.response?.data?.error || e.message }); }
    finally { setSending(false); }
  };

  return (
    <Sheet onClose={onClose}>
      <div className="sm:hidden flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 bg-ms-border rounded-full" />
      </div>
      <div className="px-4 py-3 border-b border-ms-border flex items-center justify-between">
        <div>
          <div className="font-semibold text-ms-text">Send WhatsApp</div>
          <div className="text-xs text-ms-dim">{clientIds.length} client{clientIds.length !== 1 ? 's' : ''} selected</div>
        </div>
        <button onClick={onClose} className="text-ms-sub hover:text-ms-text p-1">✕</button>
      </div>
      <div className="p-4 space-y-3">
        {result ? (
          <div className="space-y-3">
            <div className={`text-sm font-semibold ${result.success ? 'text-ms-green' : 'text-ms-red'}`}>
              {result.success
                ? `✓ Sent ${result.sent}${result.failed ? `, ${result.failed} failed` : ''}${result.skipped ? `, ${result.skipped} no phone` : ''}`
                : `✕ ${result.error}`}
            </div>
            {result.errors?.map((e, i) => <div key={i} className="text-xs text-ms-dim">{e}</div>)}
            <button onClick={onClose} className="ms-btn w-full">Close</button>
          </div>
        ) : (
          <>
            <textarea className="ms-input resize-none text-sm" rows={6}
              placeholder="Type your message…" value={msg} onChange={e => setMsg(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={send} disabled={sending || !msg.trim()} className="ms-btn flex-1 flex items-center justify-center gap-2">
                {sending ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Sending…</> : '📱 Send'}
              </button>
              <button onClick={onClose} className="ms-btn-outline px-4">Cancel</button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

function isExpiringSoon(d) {
  if (!d) return false;
  const dt = new Date(d);
  return dt > new Date() && dt < new Date(Date.now() + 5*864e5);
}
function isExpired(d) {
  if (!d) return false;
  return new Date(d) < new Date();
}

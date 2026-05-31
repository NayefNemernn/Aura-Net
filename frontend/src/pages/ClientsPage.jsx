import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge, Sheet, isExpired, isExpiringSoon } from '../components/clients/ClientShared';

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
  const [checked,  setChecked]  = useState([]);
  const [compose,  setCompose]  = useState(false);
  const navigate = useNavigate();
  const openProfile = (c) => navigate(`/clients/${c._id}`);

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
        <StatCard label="Expiring" value={stats?.expiringSoon ?? '—'} color="text-ms-orange" sub="7 days" className="hidden sm:block" />
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
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openProfile(c)}>
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
                        <td className="px-3 py-2 text-ms-blue font-medium whitespace-nowrap max-w-[140px] truncate cursor-pointer hover:underline" onClick={() => openProfile(c)}>{c.name||c.username||'—'}</td>
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


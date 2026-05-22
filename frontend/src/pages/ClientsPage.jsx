import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('all');
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 100 });
      if (status !== 'all') params.set('status', status);
      if (search) params.set('search', search);
      const { data } = await api.get(`/api/clients?${params}`);
      setClients(data.clients);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { setPage(1); }, [status, search]);
  useEffect(() => { load(); }, [load]);

  const statusFilters = ['all','active','inactive','pending'];

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">Clients</h1>
          <p className="text-muted text-sm mt-0.5">{total} records from BMS</p>
        </div>
        <a href="/api/reports/clients?format=csv" download className="btn-ghost text-sm">⬇ Export CSV</a>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="5.5" cy="5.5" r="4"/><path d="M9 9l2.5 2.5"/>
          </svg>
          <input className="input pl-8 py-1.5 text-sm" placeholder="Search name, username…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {statusFilters.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                status === s
                  ? 'bg-accent/15 text-accent border-accent/30'
                  : 'bg-s3 text-dim border-white/[0.06] hover:text-white'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-s2 border-b border-white/[0.06]">
                {['Name','Username','Status','Profile','Group','Expiry','Last Seen'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] text-dim uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-dim text-sm">
                  <span className="inline-block w-5 h-5 border-2 border-white/10 border-t-accent rounded-full animate-spin" />
                </td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-dim text-sm">
                  {total === 0 ? '🔄 No clients yet — run a BMS sync from the sidebar' : '🔍 No matches'}
                </td></tr>
              ) : clients.map(c => (
                <tr key={c._id} onClick={() => setSelected(c)}
                  className="hover:bg-white/[0.025] cursor-pointer transition-colors">
                  <td className="px-4 py-2.5 text-sm text-white font-medium whitespace-nowrap">{c.name || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-dim font-mono">{c.username}</td>
                  <td className="px-4 py-2.5">
                    <span className={`pill-${c.status}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-dim">{c.profile || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-dim">{c.group || '—'}</td>
                  <td className={`px-4 py-2.5 text-xs ${isExpiringSoon(c.expiry) ? 'text-warn' : 'text-dim'}`}>{c.expiry || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-dim">{c.lastSeen || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.05]">
            <span className="text-xs text-dim">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p-1)} className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">← Prev</button>
              <button disabled={page >= pages} onClick={() => setPage(p => p+1)} className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Client detail modal */}
      {selected && <ClientModal client={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ClientModal({ client: c, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-s3 flex items-center justify-center text-muted hover:text-white text-sm transition-colors">✕</button>
        <div className="mb-5">
          <div className="font-display font-bold text-lg text-white">{c.name || c.username}</div>
          <div className="text-xs text-dim mt-0.5">BMS ID: {c.bmsId}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Username', <span className="font-mono text-xs">{c.username}</span>],
            ['Status',   <span className={`pill-${c.status}`}>{c.status}</span>],
            ['Profile',  c.profile || '—'],
            ['Group',    c.group   || '—'],
            ['Expiry',   <span className={isExpiringSoon(c.expiry) ? 'text-warn' : ''}>{c.expiry || '—'}</span>],
            ['Last Seen', c.lastSeen || '—'],
          ].map(([label, val]) => (
            <div key={label} className="card-sm p-3">
              <div className="text-[10px] text-dim uppercase tracking-wider mb-1">{label}</div>
              <div className="text-sm text-white">{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function isExpiringSoon(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d > new Date() && d < new Date(Date.now() + 7*864e5);
}

import { useState } from 'react';
import api from '../services/api';

const REPORTS = [
  { id: 'overview',  icon: '📊', title: 'Business Overview',  desc: 'Total clients, status breakdown, active rate, recent alerts and sync history.' },
  { id: 'clients',   icon: '👥', title: 'Full Client Roster', desc: 'All clients with username, status, profile, group, expiry and last seen.', csv: true },
  { id: 'inactive',  icon: '⚠️', title: 'Inactive Clients',   desc: 'Clients flagged inactive or not seen in 30+ days — for follow-up.' },
  { id: 'expiry',    icon: '📅', title: 'Expiry Forecast',    desc: 'Accounts expiring in the next 7, 14, and 30 days.' },
];

export default function ReportsPage() {
  const [loading, setLoading] = useState({});
  const [result,  setResult]  = useState(null);
  const [active,  setActive]  = useState(null);

  const run = async (id) => {
    setLoading(l => ({ ...l, [id]: true }));
    setResult(null); setActive(null);
    try {
      const { data } = await api.get(`/api/reports/${id}`);
      setResult(data);
      setActive(id);
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    } finally {
      setLoading(l => ({ ...l, [id]: false }));
    }
  };

  const downloadCsv = () => {
    window.location.href = '/api/reports/clients?format=csv';
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white tracking-tight">Reports</h1>
        <p className="text-muted text-sm mt-0.5">Generate reports from your live BMS data</p>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {REPORTS.map(r => (
          <div key={r.id} className={`card p-4 cursor-pointer transition-all hover:-translate-y-0.5 border ${active === r.id ? 'border-accent/40' : 'border-white/[0.06] hover:border-white/10'}`}
            onClick={() => run(r.id)}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-sm text-white mb-1">{r.title}</div>
                <div className="text-xs text-dim leading-relaxed">{r.desc}</div>
              </div>
              <div className="flex-shrink-0">
                {loading[r.id]
                  ? <span className="w-4 h-4 border border-white/20 border-t-accent rounded-full animate-spin inline-block" />
                  : <span className="text-xs text-accent">Run →</span>}
              </div>
            </div>
            {r.csv && (
              <button onClick={e => { e.stopPropagation(); downloadCsv(); }}
                className="mt-3 text-[11px] text-dim hover:text-white transition-colors">
                ⬇ Download CSV
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Result panel */}
      {result && active && <ReportResult id={active} data={result} />}
    </div>
  );
}

function ReportResult({ id, data }) {
  if (id === 'overview') {
    const r = data.report;
    return (
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="font-display font-semibold text-white">Business Overview</span>
          <span className="text-xs text-dim">{new Date(r.generatedAt).toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          {Object.entries(r.summary).map(([k, v]) => (
            <div key={k} className="card-sm p-3 text-center">
              <div className="font-display font-bold text-xl text-white">{v}</div>
              <div className="text-[10px] text-dim capitalize mt-0.5">{k.replace(/([A-Z])/g,' $1')}</div>
            </div>
          ))}
        </div>
        {r.recentAlerts.length > 0 && (
          <div>
            <div className="text-xs text-dim uppercase tracking-wider mb-2">Recent alerts</div>
            <div className="space-y-1">
              {r.recentAlerts.map(a => (
                <div key={a._id} className="text-sm text-muted flex gap-2">
                  <span className={`text-[10px] font-bold uppercase ${a.sev==='critical'?'text-danger':a.sev==='warning'?'text-warn':a.sev==='ok'?'text-teal':'text-accent'}`}>{a.sev}</span>
                  <span>{a.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (id === 'expiry') {
    const r = data.report;
    return (
      <div className="card p-5 space-y-4">
        <div className="font-display font-semibold text-white">Expiry Forecast</div>
        {[['Within 7 days', r.within7, 'text-danger'], ['8–14 days', r.within14, 'text-warn'], ['15–30 days', r.within30, 'text-dim']].map(([label, list, cls]) => (
          <div key={label}>
            <div className={`text-xs font-medium mb-2 ${cls}`}>{label} — {list.length} accounts</div>
            {list.length ? (
              <div className="space-y-1">
                {list.slice(0,5).map(c => (
                  <div key={c._id} className="flex items-center gap-3 text-sm">
                    <span className="text-white">{c.name || c.username}</span>
                    <span className="text-dim text-xs">{c.expiry}</span>
                  </div>
                ))}
                {list.length > 5 && <div className="text-xs text-dim">+{list.length-5} more</div>}
              </div>
            ) : <div className="text-xs text-dim">None</div>}
          </div>
        ))}
      </div>
    );
  }

  // clients / inactive: table
  const list = data.clients || [];
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
        <span className="font-display font-semibold text-sm text-white">{list.length} records</span>
        <span className="text-xs text-dim">{new Date(data.generatedAt).toLocaleString()}</span>
      </div>
      <div className="overflow-x-auto max-h-80">
        <table className="w-full">
          <thead className="sticky top-0 bg-s2">
            <tr>{['Name','Username','Status','Group','Expiry','Last Seen'].map(h => (
              <th key={h} className="text-left px-3 py-2 text-[10px] text-dim uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {list.slice(0,50).map(c => (
              <tr key={c._id}>
                <td className="px-3 py-2 text-xs text-white">{c.name||'—'}</td>
                <td className="px-3 py-2 text-xs text-dim font-mono">{c.username}</td>
                <td className="px-3 py-2"><span className={`pill-${c.status}`}>{c.status}</span></td>
                <td className="px-3 py-2 text-xs text-dim">{c.group||'—'}</td>
                <td className="px-3 py-2 text-xs text-dim">{c.expiry||'—'}</td>
                <td className="px-3 py-2 text-xs text-dim">{c.lastSeen||'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length > 50 && <div className="px-4 py-2 text-xs text-dim border-t border-white/[0.05]">Showing 50 of {list.length}. Download CSV for full list.</div>}
    </div>
  );
}

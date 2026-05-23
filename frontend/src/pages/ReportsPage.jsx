import { useState } from 'react';
import api from '../services/api';

function StatusPill({ status }) {
  const active = status === 'online' || status === 'active';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
      active ? 'bg-ms-green-bg text-ms-green' : 'bg-ms-red-bg text-[#a80000]'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

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
    <div className="p-3 sm:p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-semibold text-2xl text-ms-text tracking-tight">Reports</h1>
        <p className="text-ms-sub text-sm mt-0.5">Generate reports from your live BMS data</p>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {REPORTS.map(r => (
          <div key={r.id}
            className={`ms-card p-4 cursor-pointer transition-all hover:shadow-ms-md border-l-2 ${active === r.id ? 'border-l-ms-blue' : 'border-l-transparent'}`}
            onClick={() => run(r.id)}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-ms-text mb-1">{r.title}</div>
                <div className="text-xs text-ms-dim leading-relaxed">{r.desc}</div>
              </div>
              <div className="flex-shrink-0">
                {loading[r.id]
                  ? <span className="w-4 h-4 border border-ms-border border-t-ms-blue rounded-full animate-spin inline-block" />
                  : <span className="text-xs text-ms-blue font-semibold">Run →</span>}
              </div>
            </div>
            {r.csv && (
              <button onClick={e => { e.stopPropagation(); downloadCsv(); }}
                className="mt-3 text-[11px] text-ms-blue hover:underline">
                Download CSV
              </button>
            )}
          </div>
        ))}
      </div>

      {result && active && <ReportResult id={active} data={result} />}
    </div>
  );
}

function ReportResult({ id, data }) {
  if (id === 'overview') {
    const r = data.report;
    return (
      <div className="ms-card p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-ms-text">Business Overview</span>
          <span className="text-xs text-ms-dim">{new Date(r.generatedAt).toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          {Object.entries(r.summary).map(([k, v]) => (
            <div key={k} className="bg-ms-sidebar border border-ms-border rounded p-3 text-center">
              <div className="font-semibold text-xl text-ms-text">{v}</div>
              <div className="text-[10px] text-ms-dim capitalize mt-0.5">{k.replace(/([A-Z])/g,' $1')}</div>
            </div>
          ))}
        </div>
        {r.recentAlerts.length > 0 && (
          <div>
            <div className="text-xs text-ms-dim font-semibold uppercase tracking-wider mb-2">Recent alerts</div>
            <div className="space-y-1">
              {r.recentAlerts.map(a => (
                <div key={a._id} className="text-sm text-ms-sub flex gap-2">
                  <span className={`text-[10px] font-bold uppercase ${a.sev==='critical'?'text-ms-red':a.sev==='warning'?'text-ms-orange':a.sev==='ok'?'text-ms-green':'text-ms-blue'}`}>{a.sev}</span>
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
    const groups = [
      { label: 'Within 7 days',  list: r.within7,  cls: 'text-ms-red',    bg: 'bg-ms-red-bg' },
      { label: '8–14 days',      list: r.within14, cls: 'text-ms-orange',  bg: 'bg-ms-orange-bg' },
      { label: '15–30 days',     list: r.within30, cls: 'text-ms-sub',     bg: 'bg-ms-sidebar' },
    ];
    return (
      <div className="ms-card overflow-hidden">
        <div className="px-5 py-3 border-b border-ms-border flex items-center justify-between">
          <span className="font-semibold text-ms-text">Expiry Forecast</span>
          <span className="text-xs text-ms-dim">{r.within7.length + r.within14.length + r.within30.length} total accounts</span>
        </div>
        <div className="divide-y divide-ms-border">
          {groups.map(({ label, list, cls, bg }) => (
            <div key={label}>
              <div className={`px-5 py-2.5 flex items-center justify-between ${bg}`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${cls}`}>{label}</span>
                <span className={`text-xs font-semibold ${cls}`}>{list.length} account{list.length !== 1 ? 's' : ''}</span>
              </div>
              {list.length === 0 ? (
                <div className="px-5 py-3 text-xs text-ms-dim">None</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-ms-sidebar border-b border-ms-border">
                      {['#','Name','Username','Service','Expiry','Phone','Status'].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-[11px] text-ms-dim font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ms-border">
                    {list.map((c, i) => (
                      <tr key={c._id} className="hover:bg-ms-sidebar transition-colors">
                        <td className="px-4 py-2 text-xs text-ms-dim">{i + 1}</td>
                        <td className="px-4 py-2 text-sm text-ms-text font-medium whitespace-nowrap">{c.name || '—'}</td>
                        <td className="px-4 py-2 text-xs text-ms-sub font-mono">{c.username}</td>
                        <td className="px-4 py-2 text-xs text-ms-sub">{c.profile || '—'}</td>
                        <td className={`px-4 py-2 text-xs font-semibold whitespace-nowrap ${cls}`}>{c.expiry || '—'}</td>
                        <td className="px-4 py-2 text-xs text-ms-sub font-mono">{c.phone || c.mobile || '—'}</td>
                        <td className="px-4 py-2"><StatusPill status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const list = data.clients || [];
  return (
    <div className="ms-card overflow-hidden">
      <div className="px-4 py-3 border-b border-ms-border flex items-center justify-between">
        <span className="font-semibold text-sm text-ms-text">{list.length} records</span>
        <span className="text-xs text-ms-dim">{new Date(data.generatedAt).toLocaleString()}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-ms-sidebar">
            <tr>{['#','Name','Username','Status','Service','Expiry','Phone','Last Seen'].map(h => (
              <th key={h} className="text-left px-3 py-2 text-xs text-ms-dim font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-ms-border">
            {list.map((c, i) => (
              <tr key={c._id} className="hover:bg-ms-sidebar transition-colors">
                <td className="px-3 py-2 text-xs text-ms-dim">{i + 1}</td>
                <td className="px-3 py-2 text-xs text-ms-text font-medium whitespace-nowrap">{c.name||'—'}</td>
                <td className="px-3 py-2 text-xs text-ms-sub font-mono">{c.username}</td>
                <td className="px-3 py-2"><StatusPill status={c.status} /></td>
                <td className="px-3 py-2 text-xs text-ms-sub">{c.profile||'—'}</td>
                <td className="px-3 py-2 text-xs text-ms-sub whitespace-nowrap">{c.expiry||'—'}</td>
                <td className="px-3 py-2 text-xs text-ms-sub font-mono">{c.phone||c.mobile||'—'}</td>
                <td className="px-3 py-2 text-xs text-ms-sub whitespace-nowrap">{c.lastSeen||'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

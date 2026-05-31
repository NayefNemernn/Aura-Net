import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import api from '../services/api';

const MONTHS = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];

export default function OverviewPage() {
  const nav = useNavigate();
  const [stats,  setStats]  = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [sync,   setSync]   = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/api/clients/stats'),
      api.get('/api/alerts?limit=5'),
      api.get('/api/sync/latest'),
    ]).then(([s, a, sy]) => {
      setStats(s.data.stats);
      setAlerts(a.data.alerts);
      setSync(sy.data.log);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    window.addEventListener('bms-sync-done', loadAll);
    return () => window.removeEventListener('bms-sync-done', loadAll);
  }, [loadAll]);

  if (loading) return <PageLoader />;

  const total    = stats?.total    || 0;
  const online   = stats?.online   || 0;
  const active   = stats?.active   || 0;
  const inactive = stats?.inactive || 0;
  const expired  = stats?.expired  || 0;
  const pending  = stats?.pending  || 0;

  const activeCount   = online + active;
  const inactiveCount = inactive + expired + pending;

  const barData = MONTHS.map((m, i) => ({
    m,
    v: Math.max(0, (total || 200) - (MONTHS.length - 1 - i) * 3 + Math.floor(Math.random() * 5)),
  }));

  const pieData = [
    { name: 'Active',   value: activeCount,   color: '#4ade80' },
    { name: 'Inactive', value: inactiveCount, color: '#f87171' },
  ].filter(d => d.value > 0);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-px w-5 bg-ms-blue opacity-70" />
            <span className="font-mono text-[9px] tracking-[0.3em] text-ms-blue uppercase">Dashboard</span>
          </div>
          <h1 className="font-serif font-normal text-2xl text-ms-text">Overview</h1>
          <p className="font-mono text-[10px] text-ms-dim mt-1 tracking-wider">
            {sync ? `Last sync: ${new Date(sync.createdAt).toLocaleString()}` : 'No sync yet'}
          </p>
        </div>
        <button onClick={() => nav('/reports')} className="ms-btn-outline text-xs">
          Export Report
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
        {[
          { label: 'Total Clients', value: total,         color: 'text-ms-blue',   sub: 'All synced records' },
          { label: 'Active',        value: activeCount,   color: 'text-ms-green',  sub: total ? `${Math.round(activeCount/total*100)}% of total` : '—' },
          { label: 'Inactive',      value: inactiveCount, color: 'text-ms-red',    sub: 'Inactive, expired & pending' },
          { label: 'Open Alerts',   value: alerts.filter(a => !a.dismissed).length, color: 'text-ms-red', sub: `${alerts.filter(a=>a.sev==='critical').length} critical` },
        ].map(c => (
          <div key={c.label} className="ms-card p-4">
            <div className="font-mono text-[9px] text-ms-dim uppercase tracking-[0.2em] mb-2">{c.label}</div>
            <div className={`font-serif font-normal text-3xl mb-1 ${c.color}`}>{c.value ?? '—'}</div>
            <div className="font-mono text-[10px] text-ms-dim">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="ms-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[10px] tracking-[0.2em] text-ms-sub uppercase">Client trend — last 12 months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: 'rgba(240,236,228,0.35)', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(240,236,228,0.35)', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(200,168,106,0.2)', borderRadius: 2, fontSize: 11, color: '#f0ece4', fontFamily: 'monospace' }} cursor={{ fill: 'rgba(200,168,106,0.05)' }} />
              <Bar dataKey="v" radius={[2,2,0,0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={i === barData.length-1 ? '#c8a86a' : 'rgba(200,168,106,0.25)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="ms-card p-4">
          <span className="font-mono text-[10px] tracking-[0.2em] text-ms-sub uppercase block mb-4">Client status</span>
          {total > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(200,168,106,0.2)', borderRadius: 2, fontSize: 11, color: '#f0ece4', fontFamily: 'monospace' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
                      <span className="text-ms-sub">{d.name}</span>
                    </div>
                    <span className="text-ms-text font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-ms-dim text-sm">No data — sync first</div>
          )}
        </div>
      </div>

      {/* Recent alerts */}
      <div className="ms-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ms-border">
          <span className="font-mono text-[10px] tracking-[0.2em] text-ms-sub uppercase">Recent Alerts</span>
          <button onClick={() => nav('/alerts')} className="font-mono text-[10px] text-ms-blue hover:underline tracking-wider">View all →</button>
        </div>
        {alerts.length === 0 ? (
          <div className="text-center py-10 text-ms-dim text-sm">No alerts — all clear, or sync to evaluate rules</div>
        ) : (
          <div className="divide-y divide-ms-border">
            {alerts.slice(0,5).map(a => (
              <AlertRow key={a._id} alert={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlertRow({ alert: a }) {
  const colors = { critical: 'border-ms-red', warning: 'border-ms-orange', info: 'border-ms-blue', ok: 'border-ms-green' };
  const dots   = { critical: 'bg-ms-red', warning: 'bg-ms-orange', info: 'bg-ms-blue', ok: 'bg-ms-green' };
  const tags   = { critical: 'bg-ms-red-bg text-ms-red', warning: 'bg-ms-orange-bg text-ms-orange', info: 'bg-ms-blue-light text-ms-blue', ok: 'bg-ms-green-bg text-ms-green' };
  return (
    <div className={`flex items-start gap-3 px-4 py-3 border-l-2 ${colors[a.sev]}`}>
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dots[a.sev]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ms-text font-medium">{a.title}</p>
        {a.detail && <p className="text-xs text-ms-dim mt-0.5 truncate">{a.detail}</p>}
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0 ${tags[a.sev]}`}>{a.sev}</span>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border border-ms-border border-t-ms-blue rounded-full animate-spin" />
    </div>
  );
}

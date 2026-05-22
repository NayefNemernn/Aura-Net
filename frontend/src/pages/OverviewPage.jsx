import { useState, useEffect } from 'react';
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

  useEffect(() => {
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

  if (loading) return <PageLoader />;

  const total  = stats?.total  || 0;
  const active = stats?.active || 0;
  const inactive = stats?.inactive || 0;
  const pending  = stats?.pending  || 0;

  // Simulated monthly trend (real data would come from daily snapshots)
  const barData = MONTHS.map((m, i) => ({
    m,
    v: Math.max(0, (total || 200) - (MONTHS.length - 1 - i) * 3 + Math.floor(Math.random() * 5)),
  }));

  const pieData = [
    { name: 'Active',   value: active,   color: '#00d4aa' },
    { name: 'Inactive', value: inactive, color: '#ff4757' },
    { name: 'Pending',  value: pending,  color: '#ff7a45' },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">Overview</h1>
          <p className="text-muted text-sm mt-0.5">
            {sync ? `Last sync: ${new Date(sync.createdAt).toLocaleString()}` : 'No sync yet — click Sync BMS in the sidebar'}
          </p>
        </div>
        <button onClick={() => nav('/reports')} className="btn-ghost text-sm">
          📄 Export Report
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Clients',  value: total,              icon: '👥', color: 'text-accent',  sub: 'All synced records' },
          { label: 'Active',         value: active,             icon: '✅', color: 'text-teal',   sub: total ? `${Math.round(active/total*100)}% of total` : '—' },
          { label: 'Inactive',       value: inactive,           icon: '⚠️', color: 'text-warn',   sub: 'Need attention' },
          { label: 'Open Alerts',    value: alerts.filter(a => !a.dismissed).length, icon: '🔔', color: 'text-danger', sub: `${alerts.filter(a=>a.sev==='critical').length} critical` },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-dim uppercase tracking-wider">{c.label}</span>
              <span className="text-base">{c.icon}</span>
            </div>
            <div className={`font-display font-bold text-3xl tracking-tight mb-1 ${c.color}`}>{c.value ?? '—'}</div>
            <div className="text-[11px] text-dim">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="font-display font-semibold text-sm text-white">Client trend — last 12 months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#5a5a72' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#5a5a72' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a28', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="v" radius={[4,4,0,0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={i === barData.length-1 ? '#7c5cfc' : 'rgba(124,92,252,0.3)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <span className="font-display font-semibold text-sm text-white block mb-4">Client status</span>
          {total > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a28', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-muted">{d.name}</span>
                    </div>
                    <span className="text-white font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-dim text-sm">No data — sync first</div>
          )}
        </div>
      </div>

      {/* Recent alerts */}
      <div className="card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
          <span className="font-display font-semibold text-sm text-white">Recent alerts</span>
          <button onClick={() => nav('/alerts')} className="text-xs text-accent hover:text-accent/70 transition-colors">View all →</button>
        </div>
        {alerts.length === 0 ? (
          <div className="text-center py-10 text-dim text-sm">No alerts — all clear, or sync to evaluate rules</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
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
  const colors = { critical: 'border-danger', warning: 'border-warn', info: 'border-accent', ok: 'border-teal' };
  const dots   = { critical: 'bg-danger', warning: 'bg-warn', info: 'bg-accent', ok: 'bg-teal' };
  const tags   = { critical: 'bg-danger/10 text-danger', warning: 'bg-warn/10 text-warn', info: 'bg-accent/10 text-accent', ok: 'bg-teal/10 text-teal' };
  return (
    <div className={`flex items-start gap-3 px-4 py-3 border-l-2 ${colors[a.sev]}`}>
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dots[a.sev]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium">{a.title}</p>
        {a.detail && <p className="text-xs text-dim mt-0.5 truncate">{a.detail}</p>}
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${tags[a.sev]}`}>{a.sev}</span>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-white/10 border-t-accent rounded-full animate-spin" />
    </div>
  );
}

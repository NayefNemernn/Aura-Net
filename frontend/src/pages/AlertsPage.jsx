import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const SEV = ['all','critical','warning','info','ok'];
const SEV_COLORS = {
  critical: { border: 'border-danger', dot: 'bg-danger', tag: 'bg-danger/10 text-danger' },
  warning:  { border: 'border-warn',   dot: 'bg-warn',   tag: 'bg-warn/10 text-warn' },
  info:     { border: 'border-accent', dot: 'bg-accent', tag: 'bg-accent/10 text-accent' },
  ok:       { border: 'border-teal',   dot: 'bg-teal',   tag: 'bg-teal/10 text-teal' },
};

export default function AlertsPage() {
  const [alerts,  setAlerts]  = useState([]);
  const [counts,  setCounts]  = useState({});
  const [filter,  setFilter]  = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/alerts?sev=${filter}`);
      setAlerts(data.alerts);
      setCounts(data.counts);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const dismiss = async (id) => {
    await api.patch(`/api/alerts/${id}/dismiss`);
    setAlerts(prev => prev.filter(a => a._id !== id));
  };

  const dismissAll = async () => {
    await api.post('/api/alerts/dismiss-all', { sev: filter !== 'all' ? filter : undefined });
    load();
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">Alerts</h1>
          <p className="text-muted text-sm mt-0.5">{total} open alerts from latest sync</p>
        </div>
        <button onClick={dismissAll} className="btn-ghost text-sm">✓ Dismiss {filter !== 'all' ? filter : 'all'}</button>
      </div>

      {/* Severity filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {SEV.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
              filter === s
                ? 'bg-accent/15 text-accent border-accent/30'
                : 'bg-s3 text-dim border-white/[0.06] hover:text-white'
            }`}>
            {s}
            {s !== 'all' && counts[s] > 0 && (
              <span className="ml-1.5 bg-white/10 text-white/70 text-[9px] px-1.5 py-0.5 rounded-full">{counts[s]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-white/10 border-t-accent rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-3xl mb-3">🛡️</div>
          <div className="text-white font-medium mb-1">No alerts</div>
          <div className="text-dim text-sm">All clear — sync BMS to re-evaluate</div>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(a => {
            const c = SEV_COLORS[a.sev] || SEV_COLORS.info;
            return (
              <div key={a._id} className={`card border-l-2 ${c.border} flex items-start gap-3 p-4 hover:bg-white/[0.02] transition-colors`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${c.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{a.title}</p>
                  {a.detail && <p className="text-xs text-dim mt-0.5 line-clamp-2">{a.detail}</p>}
                  <p className="text-[10px] text-dim/60 mt-1">{new Date(a.createdAt).toLocaleString()} · {a.rule}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${c.tag}`}>{a.sev}</span>
                  <button onClick={() => dismiss(a._id)}
                    className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-dim hover:text-white text-xs transition-colors">
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

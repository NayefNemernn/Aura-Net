import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const SEV = ['all','critical','warning','info','ok'];
const SEV_COLORS = {
  critical: { border: 'border-ms-red',    dot: 'bg-ms-red',    tag: 'bg-ms-red-bg text-ms-red' },
  warning:  { border: 'border-ms-orange', dot: 'bg-ms-orange', tag: 'bg-ms-orange-bg text-ms-orange' },
  info:     { border: 'border-ms-blue',   dot: 'bg-ms-blue',   tag: 'bg-ms-blue-light text-ms-blue' },
  ok:       { border: 'border-ms-green',  dot: 'bg-ms-green',  tag: 'bg-ms-green-bg text-ms-green' },
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
  useEffect(() => {
    window.addEventListener('bms-sync-done', load);
    return () => window.removeEventListener('bms-sync-done', load);
  }, [load]);

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
    <div className="p-3 sm:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h1 className="font-semibold text-xl sm:text-2xl text-ms-text tracking-tight">Alerts</h1>
          <p className="text-ms-sub text-xs sm:text-sm mt-0.5">{total} open alerts</p>
        </div>
        <button onClick={dismissAll} className="ms-btn-ghost text-xs sm:text-sm border border-ms-border px-3 py-2 whitespace-nowrap">
          Dismiss {filter !== 'all' ? filter : 'all'}
        </button>
      </div>

      {/* Severity filter — horizontal scroll on mobile */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {SEV.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors border whitespace-nowrap flex-shrink-0 ${
              filter === s ? 'bg-ms-blue-light text-ms-blue border-ms-blue/30' : 'bg-ms-surface text-ms-sub border-ms-border'
            }`}>
            {s}
            {s !== 'all' && counts[s] > 0 && (
              <span className="ml-1 bg-ms-border text-ms-dim text-[9px] px-1.5 py-0.5 rounded-full">{counts[s]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-ms-border border-t-ms-blue rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="ms-card text-center py-16">
          <div className="text-3xl mb-3">🛡️</div>
          <div className="text-ms-text font-semibold mb-1">No alerts</div>
          <div className="text-ms-dim text-sm">All clear — sync BMS to re-evaluate</div>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(a => {
            const c = SEV_COLORS[a.sev] || SEV_COLORS.info;
            return (
              <div key={a._id} className={`ms-card border-l-2 ${c.border} flex items-start gap-3 p-4 hover:bg-ms-sidebar transition-colors`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${c.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ms-text font-medium">{a.title}</p>
                  {a.detail && <p className="text-xs text-ms-dim mt-0.5 line-clamp-2">{a.detail}</p>}
                  <p className="text-[10px] text-ms-dim mt-1">{new Date(a.createdAt).toLocaleString()} · {a.rule}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${c.tag}`}>{a.sev}</span>
                  <button onClick={() => dismiss(a._id)}
                    className="w-6 h-6 rounded bg-ms-sidebar hover:bg-ms-border flex items-center justify-center text-ms-dim hover:text-ms-text text-xs transition-colors">
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

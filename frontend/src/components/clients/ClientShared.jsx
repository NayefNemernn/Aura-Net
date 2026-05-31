import { useState, useEffect } from 'react';
import api from '../../services/api';

// ── Date helpers ────────────────────────────────────────────────────────────
export function isExpiringSoon(d) {
  if (!d) return false;
  const dt = new Date(d);
  return dt > new Date() && dt < new Date(Date.now() + 7 * 864e5);
}
export function isExpired(d) {
  if (!d) return false;
  return new Date(d) < new Date();
}

// ── Status pill ───────────────────────────────────────────────────────────--
export function StatusBadge({ status }) {
  return <span className={`pill-${status} whitespace-nowrap`}>{status}</span>;
}

// ── Bottom-sheet (mobile) / centered modal (desktop) ─────────────────────────
export function Sheet({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/50" onClick={onClose}>
      <div className="bg-ms-surface w-full rounded-t-2xl sm:rounded-xl sm:max-w-2xl sm:w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-ms-lg"
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ── Read-only info section + row ─────────────────────────────────────────────
export function MSection({ title, children }) {
  return (
    <div>
      <div className="text-[10px] text-ms-dim font-semibold uppercase tracking-wider mb-2">{title}</div>
      <div className="ms-card divide-y divide-ms-border overflow-hidden">{children}</div>
    </div>
  );
}

export function MRow({ label, value, mono, warn, err, link }) {
  const empty = !value || value === '—';
  const cls = warn ? 'text-ms-orange font-semibold' : err ? 'text-ms-red font-semibold' : empty ? 'text-ms-dim' : 'text-ms-text';
  return (
    <div className="flex items-center justify-between px-3 py-2 gap-3">
      <span className="text-xs text-ms-dim flex-shrink-0">{label}</span>
      {link && !empty
        ? <a href={link} className={`text-xs text-ms-blue ${mono ? 'font-mono' : ''} truncate`}>{value}</a>
        : <span className={`text-xs truncate text-right ${mono ? 'font-mono' : ''} ${cls}`}>{empty ? '—' : value}</span>}
    </div>
  );
}

// ── Live BMS actions (run via Puppeteer) ─────────────────────────────────────
export function BmsActionsPanel({ username, onEditUser }) {
  const [busy, setBusy]     = useState(null);
  const [result, setResult] = useState(null);

  const run = async (action, apiFn) => {
    setBusy(action); setResult(null);
    try {
      const data = await apiFn();
      setResult({ ok: true, msg: data.message || data.output || 'Done' });
    } catch (e) {
      setResult({ ok: false, msg: e.response?.data?.error || e.message });
    } finally { setBusy(null); }
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
    { key: 'refill',      icon: '⚡', label: 'Refill',      color: 'text-ms-green',  fn: simple('refill'),             desc: 'Refill user quota/account' },
    { key: 'disconnect',  icon: '🔌', label: 'Disconnect',  color: 'text-ms-red',    fn: simple('disconnect'),         desc: 'Drop active session' },
    { key: 'block',       icon: '🚫', label: 'Block',       color: 'text-ms-red',    fn: simple('block'),              desc: 'Block user access' },
    { key: 'resetMac',    icon: '🔄', label: 'Reset MAC',   color: 'text-ms-orange', fn: simple('resetMac'),           desc: 'Clear MAC binding' },
    { key: 'ping',        icon: '📡', label: 'Ping',        color: 'text-ms-blue',   fn: doPing,                       desc: 'Ping user IP from BNG' },
    { key: 'viewRules',   icon: '📋', label: 'View Rules',  color: 'text-ms-blue',   fn: output('view rules applied'), desc: 'Show applied rules' },
    { key: 'userTraffic', icon: '📊', label: 'Traffic',     color: 'text-ms-blue',   fn: output('user traffic'),       desc: 'User traffic summary' },
    { key: 'statusBng',   icon: '🖧',  label: 'BNG Status',  color: 'text-ms-blue',   fn: output('status on bng'),      desc: 'Status on BNG router' },
    { key: 'changeplan',  icon: '🔁', label: 'Change Plan', color: 'text-ms-orange', fn: simple('changeplan'),         desc: 'Change service plan' },
    { key: 'editUser',    icon: '✏️', label: 'Edit in BMS', color: 'text-ms-blue',   fn: onEditUser,                   desc: 'Edit profile in BMS' },
    { key: 'userPage',    icon: '🔗', label: 'User Page',   color: 'text-ms-dim',    fn: doUserPage,                   desc: 'Open BMS user page' },
  ];

  return (
    <div className="p-4">
      <p className="text-[11px] text-ms-dim mb-3">
        Actions run live on the BMS via Puppeteer — each takes 10–30 s to complete.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {ACTIONS.map(a => (
          <button key={a.key} onClick={a.fn} disabled={!!busy && busy !== a.key}
            className={`flex items-center gap-2.5 p-3 rounded-lg border border-ms-border bg-ms-surface hover:bg-ms-sidebar transition-colors text-left disabled:opacity-40 ${busy === a.key ? 'ring-2 ring-ms-blue' : ''}`}>
            <span className="text-lg leading-none flex-shrink-0">{a.icon}</span>
            <div className="min-w-0">
              <div className={`text-xs font-semibold ${a.color} truncate`}>{a.label}</div>
              <div className="text-[10px] text-ms-dim truncate">{a.desc}</div>
            </div>
            {busy === a.key && <span className="ml-auto w-3.5 h-3.5 border border-ms-border border-t-ms-blue rounded-full animate-spin flex-shrink-0" />}
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

// ── Edit user form pulled live from BMS ──────────────────────────────────────
export function EditUserSheet({ username, onClose }) {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [formData, setFormData] = useState(null);
  const [values, setValues]     = useState({});
  const [error, setError]       = useState(null);
  const [saveMsg, setSaveMsg]   = useState(null);

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
    } finally { setSaving(false); }
  };

  const visibleFields = (formData?.fields || []).filter(f =>
    f.type !== 'hidden' && f.type !== 'submit' && f.type !== 'button' && f.name);

  return (
    <Sheet onClose={onClose}>
      <div className="sm:hidden flex justify-center pt-2 pb-1"><div className="w-10 h-1 bg-ms-border rounded-full" /></div>
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
        {error && <div className="rounded-lg p-4 bg-ms-red-bg text-ms-red text-sm">{error}</div>}
        {!loading && !error && formData && (
          <>
            <div className="space-y-3 mb-4">
              {visibleFields.map(f => (
                <div key={f.name}>
                  <label className="block text-[11px] text-ms-dim font-semibold uppercase tracking-wider mb-1">{f.label || f.name}</label>
                  {f.type === 'select' ? (
                    <select className="ms-input" value={values[f.name] ?? ''} onChange={e => setVal(f.name, e.target.value)}>
                      {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea className="ms-input resize-none" rows={3} value={values[f.name] ?? ''} onChange={e => setVal(f.name, e.target.value)} />
                  ) : f.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-ms-blue" checked={!!values[f.name]} onChange={e => setVal(f.name, e.target.checked)} />
                      <span className="text-sm text-ms-text">{f.label || f.name}</span>
                    </label>
                  ) : (
                    <input className="ms-input" type={f.type === 'password' ? 'password' : 'text'}
                      value={values[f.name] ?? ''} onChange={e => setVal(f.name, e.target.value)}
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

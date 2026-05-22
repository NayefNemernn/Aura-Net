import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [pwForm,   setPwForm]   = useState({ current: '', next: '' });
  const [pwMsg,    setPwMsg]    = useState('');

  useEffect(() => {
    api.get('/api/settings').then(r => setSettings(r.data.settings)).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const { data } = await api.patch('/api/settings', settings);
      setSettings(data.settings);
      setMsg('✅ Settings saved');
      updateUser({ ...user, name: settings.name });
    } catch (e) { setMsg('❌ ' + (e.response?.data?.error || e.message)); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000); }
  };

  const changePassword = async () => {
    setPwMsg('');
    try {
      await api.patch('/api/auth/password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwMsg('✅ Password changed');
      setPwForm({ current: '', next: '' });
    } catch (e) { setPwMsg('❌ ' + (e.response?.data?.error || e.message)); }
    setTimeout(() => setPwMsg(''), 3000);
  };

  const set = (path, val) => {
    setSettings(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) { cur[parts[i]] = { ...cur[parts[i]] }; cur = cur[parts[i]]; }
      cur[parts[parts.length - 1]] = val;
      return next;
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><span className="w-6 h-6 border-2 border-white/10 border-t-accent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="font-display font-bold text-2xl text-white tracking-tight mb-6">Settings</h1>

      {/* BMS Connection */}
      <Section title="BMS Connection" desc="Configure your libatech BMS credentials for live scraping.">
        <Field label="BMS URL">
          <input className="input" value={settings.bmsUrl} onChange={e => set('bmsUrl', e.target.value)} placeholder="https://bms.libatech.net.lb" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Username">
            <input className="input" value={settings.bmsUser} onChange={e => set('bmsUser', e.target.value)} placeholder="nasri" />
          </Field>
          <Field label="Password">
            <input className="input" type="password" onChange={e => set('bmsPass', e.target.value)} placeholder="New password (leave blank to keep)" />
          </Field>
        </div>
        <Field label="Auto-sync interval">
          <select className="input" value={settings.syncInterval} onChange={e => set('syncInterval', +e.target.value)}>
            {[15,30,60,360,720].map(m => <option key={m} value={m}>{m < 60 ? `Every ${m} min` : `Every ${m/60}h`}</option>)}
            <option value={0}>Manual only</option>
          </select>
        </Field>
      </Section>

      {/* Alert Rules */}
      <Section title="Alert Rules" desc="Choose which conditions trigger alerts after each sync.">
        {[
          { key: 'inactive30',   label: 'Client not seen in 30+ days',        sev: 'critical' },
          { key: 'statusChange', label: 'Client status changed between syncs', sev: 'warning' },
          { key: 'batchNew',     label: '5+ new clients added in one sync',    sev: 'info' },
          { key: 'expiry7d',     label: 'Account expiring within 7 days',      sev: 'warning' },
          { key: 'drop10pct',    label: 'Active clients drop 10%+',            sev: 'critical' },
          { key: 'syncOk',       label: 'Sync success confirmation',           sev: 'ok' },
        ].map(r => (
          <div key={r.key} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
            <div>
              <div className="text-sm text-white">{r.label}</div>
              <div className={`text-[10px] uppercase tracking-wider mt-0.5 font-medium ${r.sev==='critical'?'text-danger':r.sev==='warning'?'text-warn':r.sev==='ok'?'text-teal':'text-accent'}`}>{r.sev}</div>
            </div>
            <Toggle checked={settings.alertRules?.[r.key] ?? true} onChange={v => set(`alertRules.${r.key}`, v)} />
          </div>
        ))}
      </Section>

      {/* Profile */}
      <Section title="Profile">
        <Field label="Display Name">
          <input className="input" value={settings.name || ''} onChange={e => set('name', e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="input" value={settings.email || ''} disabled style={{ opacity: 0.5 }} />
        </Field>
      </Section>

      {/* Save */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : null}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>

      {/* Change password */}
      <Section title="Change Password">
        <Field label="Current Password">
          <input className="input" type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} />
        </Field>
        <Field label="New Password">
          <input className="input" type="password" value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} />
        </Field>
        <div className="flex items-center gap-3">
          <button onClick={changePassword} className="btn-primary">Update Password</button>
          {pwMsg && <span className="text-sm text-muted">{pwMsg}</span>}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, desc, children }) {
  return (
    <div className="card p-5 mb-4">
      <div className="font-display font-semibold text-base text-white mb-0.5">{title}</div>
      {desc && <div className="text-xs text-dim mb-4">{desc}</div>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-dim uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-accent/40' : 'bg-s3'} border ${checked ? 'border-accent/50' : 'border-white/10'}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

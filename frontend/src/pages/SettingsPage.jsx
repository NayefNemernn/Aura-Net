import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Switch from '../components/ui/Switch';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [pwForm,   setPwForm]   = useState({ current: '', next: '' });
  const [pwMsg,    setPwMsg]    = useState('');
  const [wa,       setWa]       = useState({ status: 'disconnected', qr: null });
  const [waSending, setWaSending] = useState(false);
  const [waMsg,    setWaMsg]    = useState('');
  const [whishQr,  setWhishQr]  = useState(null);
  const [siteQr,   setSiteQr]   = useState(null);
  const [qrPhone,  setQrPhone]  = useState('');
  const [qrFormat, setQrFormat] = useState('image');
  const [qrSending,setQrSending]= useState(false);
  const [qrMsg,    setQrMsg]    = useState('');
  const waInterval = useRef(null);

  const effectiveSiteUrl = (settings?.siteUrl?.trim()) || (typeof window !== 'undefined' ? `${window.location.origin}/home` : '');

  const loadWhishQr = useCallback(() => {
    api.get('/api/payments/whish').then(r => setWhishQr(r.data.qr)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/api/settings').then(r => setSettings(r.data.settings)).finally(() => setLoading(false));
    loadWhishQr();
  }, [loadWhishQr]);

  // Refresh the website QR preview whenever the site URL changes (debounced).
  useEffect(() => {
    if (!effectiveSiteUrl) return;
    const t = setTimeout(() => {
      api.get('/api/website/qr', { params: { url: effectiveSiteUrl } })
        .then(r => setSiteQr(r.data.qr)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [effectiveSiteUrl]);

  const downloadSitePng = () => {
    if (!siteQr) return;
    const a = document.createElement('a');
    a.href = siteQr; a.download = 'website-qr.png'; a.click();
  };

  const downloadSitePdf = async () => {
    try {
      const res = await api.get('/api/website/qr.pdf', { params: { url: effectiveSiteUrl }, responseType: 'blob' });
      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = 'website-qr.pdf'; a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (e) { setQrMsg(e.response?.data?.error || e.message); setTimeout(() => setQrMsg(''), 5000); }
  };

  const sendSiteQr = async () => {
    if (!qrPhone.trim()) { setQrMsg('Enter a phone number'); setTimeout(() => setQrMsg(''), 4000); return; }
    setQrSending(true); setQrMsg('');
    try {
      await api.post('/api/website/qr/send', { phone: qrPhone, format: qrFormat, url: effectiveSiteUrl });
      setQrMsg(`Sent as ${qrFormat === 'pdf' ? 'PDF' : 'image'} to ${qrPhone}`);
      setQrPhone('');
    } catch (e) { setQrMsg(e.response?.data?.error || e.message); }
    finally { setQrSending(false); setTimeout(() => setQrMsg(''), 5000); }
  };

  const pollWa = useCallback(() => {
    api.get('/api/whatsapp/status').then(r => setWa(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    pollWa();
    waInterval.current = setInterval(pollWa, 3000);
    return () => clearInterval(waInterval.current);
  }, [pollWa]);

  const waConnect = async () => {
    await api.post('/api/whatsapp/connect');
    pollWa();
  };

  const waDisconnect = async () => {
    await api.post('/api/whatsapp/disconnect');
    setWa({ status: 'disconnected', qr: null });
  };

  const waSendReminders = async () => {
    setWaSending(true); setWaMsg('');
    try {
      const { data } = await api.post('/api/whatsapp/send-reminders');
      setWaMsg(`Sent ${data.sent} reminder${data.sent !== 1 ? 's' : ''}`);
    } catch (e) { setWaMsg(e.response?.data?.error || e.message); }
    finally { setWaSending(false); setTimeout(() => setWaMsg(''), 5000); }
  };

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const { data } = await api.patch('/api/settings', settings);
      setSettings(data.settings);
      setMsg('Settings saved');
      updateUser({ ...user, name: settings.name });
      loadWhishQr();
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000); }
  };

  const changePassword = async () => {
    setPwMsg('');
    try {
      await api.patch('/api/auth/password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwMsg('Password changed');
      setPwForm({ current: '', next: '' });
    } catch (e) { setPwMsg(e.response?.data?.error || e.message); }
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="w-6 h-6 border-2 border-ms-border border-t-ms-blue rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-3 sm:p-6 max-w-2xl">
      <h1 className="font-semibold text-2xl text-ms-text tracking-tight mb-6">Settings</h1>

      {/* BMS Connection */}
      <Section title="BMS Connection" desc="Configure your libatech BMS credentials for live scraping.">
        <Field label="BMS URL">
          <input className="ms-input" value={settings.bmsUrl} onChange={e => set('bmsUrl', e.target.value)} placeholder="https://bms.libatech.net.lb" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Username">
            <input className="ms-input" value={settings.bmsUser} onChange={e => set('bmsUser', e.target.value)} placeholder="nasri" />
          </Field>
          <Field label="Password">
            <input className="ms-input" type="password" onChange={e => set('bmsPass', e.target.value)} placeholder="New password (leave blank to keep)" />
          </Field>
        </div>
        <Field label="Auto-sync interval">
          <select className="ms-input" value={settings.syncInterval} onChange={e => set('syncInterval', +e.target.value)}>
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
          <div key={r.key} className="flex items-center justify-between py-3 border-b border-ms-border last:border-0">
            <div>
              <div className="text-sm text-ms-text">{r.label}</div>
              <div className={`text-[10px] uppercase tracking-wider mt-0.5 font-semibold ${r.sev==='critical'?'text-ms-red':r.sev==='warning'?'text-ms-orange':r.sev==='ok'?'text-ms-green':'text-ms-blue'}`}>{r.sev}</div>
            </div>
            <Toggle checked={settings.alertRules?.[r.key] ?? true} onChange={v => set(`alertRules.${r.key}`, v)} />
          </div>
        ))}
      </Section>

      {/* Profile */}
      <Section title="Profile">
        <Field label="Display Name">
          <input className="ms-input" value={settings.name || ''} onChange={e => set('name', e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="ms-input opacity-50 cursor-not-allowed" value={settings.email || ''} disabled />
        </Field>
      </Section>

      {/* WhatsApp Reminders */}
      <Section title="WhatsApp Reminders" desc="Send renewal reminders to clients 2 days before and on the day of expiry.">
        {/* Status bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              wa.status === 'ready'      ? 'bg-ms-green animate-pulse' :
              wa.status === 'qr'        ? 'bg-ms-orange animate-pulse' :
              wa.status === 'connecting' ? 'bg-ms-blue  animate-pulse' :
              'bg-ms-dim'
            }`} />
            <span className="text-sm text-ms-text capitalize font-medium">
              {wa.status === 'qr' ? 'Scan QR code' :
               wa.status === 'connecting' ? 'Connecting…' :
               wa.status === 'ready' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex gap-2">
            {wa.status === 'disconnected' && (
              <button onClick={waConnect} className="ms-btn text-xs px-3 py-1.5">Connect WhatsApp</button>
            )}
            {wa.status !== 'disconnected' && (
              <button onClick={waDisconnect} className="ms-btn-outline text-xs px-3 py-1.5">Disconnect</button>
            )}
          </div>
        </div>

        {/* QR Code */}
        {wa.status === 'qr' && wa.qr && (
          <div className="flex flex-col items-center gap-2 py-3">
            <img src={wa.qr} alt="WhatsApp QR" className="w-48 h-48 rounded border border-ms-border" />
            <p className="text-xs text-ms-dim">Open WhatsApp → Linked Devices → Link a Device → Scan</p>
          </div>
        )}

        {/* Manual send */}
        {wa.status === 'ready' && (
          <div className="flex items-center gap-3 pt-1">
            <button onClick={waSendReminders} disabled={waSending}
              className="ms-btn text-xs px-3 py-1.5 flex items-center gap-2">
              {waSending
                ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
                : '📱 Send Reminders Now'}
            </button>
            {waMsg && <span className="text-sm text-ms-sub">{waMsg}</span>}
          </div>
        )}

        <p className="text-xs text-ms-dim">
          Reminders are also sent automatically every day at 09:00 for clients expiring today or in 2 days (phone number must be scraped from BMS).
        </p>
      </Section>

      {/* Whish Money Payment */}
      <Section title="Whish Money Payment" desc="Your Whish pay link / account. Clients scan the QR or get the link on WhatsApp to pay you.">
        <Field label="Whish pay link">
          <input className="ms-input" value={settings.whish?.payLink || ''} onChange={e => set('whish.payLink', e.target.value)}
            placeholder="https://whish.money/… (your 'pay me' link)" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Whish number">
            <input className="ms-input" value={settings.whish?.number || ''} onChange={e => set('whish.number', e.target.value)}
              placeholder="71 234 567" />
          </Field>
          <Field label="Account name">
            <input className="ms-input" value={settings.whish?.accountName || ''} onChange={e => set('whish.accountName', e.target.value)}
              placeholder="Aura Net" />
          </Field>
        </div>
        <Field label="WhatsApp message template">
          <textarea className="ms-input resize-none" rows={3}
            value={settings.whish?.messageTemplate || ''} onChange={e => set('whish.messageTemplate', e.target.value)} />
          <p className="text-[11px] text-ms-dim mt-1">Placeholders: <code>{'{name}'}</code> <code>{'{link}'}</code> <code>{'{account}'}</code></p>
        </Field>

        {whishQr ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <img src={whishQr} alt="Whish payment QR" className="w-44 h-44 rounded-lg border border-ms-border bg-white p-1.5" />
            <p className="text-xs text-ms-dim">Scan with your phone camera to pay · save the QR to share it</p>
          </div>
        ) : (
          <p className="text-xs text-ms-dim">Add a pay link or number above and <b>Save Settings</b> to generate the QR.</p>
        )}
      </Section>

      {/* Website QR Code */}
      <Section title="Website QR Code" desc="A scannable QR for your public website. Share it with clients, or send it straight to their WhatsApp as an image or a PDF card.">
        <Field label="Website URL">
          <input className="ms-input" value={settings.siteUrl || ''} onChange={e => set('siteUrl', e.target.value)}
            placeholder={effectiveSiteUrl} />
          <p className="text-[11px] text-ms-dim mt-1">The address the QR opens. Leave blank to use this dashboard's <code>/home</code> page.</p>
        </Field>

        {siteQr && (
          <div className="flex flex-col items-center gap-3 py-2">
            <img src={siteQr} alt="Website QR" className="w-44 h-44 rounded-lg border border-ms-border bg-white p-1.5" />
            <div className="flex gap-2">
              <button onClick={downloadSitePng} className="ms-btn-outline text-xs px-3 py-1.5">⬇ Image (PNG)</button>
              <button onClick={downloadSitePdf} className="ms-btn-outline text-xs px-3 py-1.5">⬇ PDF</button>
            </div>
          </div>
        )}

        {/* Send to WhatsApp */}
        <div className="border-t border-ms-border pt-3 mt-1">
          <label className="block text-xs text-ms-dim font-semibold uppercase tracking-wider mb-1.5">Send to a client on WhatsApp</label>
          {wa.status !== 'ready' && (
            <p className="text-[11px] text-ms-orange mb-2">Connect WhatsApp above to send.</p>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <input className="ms-input flex-1" value={qrPhone} onChange={e => setQrPhone(e.target.value)}
              placeholder="Client phone e.g. 71 234 567" />
            <select className="ms-input sm:w-32" value={qrFormat} onChange={e => setQrFormat(e.target.value)}>
              <option value="image">As Image</option>
              <option value="pdf">As PDF</option>
            </select>
            <button onClick={sendSiteQr} disabled={qrSending || wa.status !== 'ready'}
              className="ms-btn text-xs px-4 py-1.5 flex items-center justify-center gap-2 disabled:opacity-50">
              {qrSending
                ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
                : '📱 Send'}
            </button>
          </div>
          {qrMsg && <span className="block text-sm text-ms-sub mt-2">{qrMsg}</span>}
        </div>
      </Section>

      {/* Save */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={save} disabled={saving} className="ms-btn flex items-center gap-2">
          {saving ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : null}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {msg && <span className="text-sm text-ms-sub">{msg}</span>}
      </div>

      {/* Change password */}
      <Section title="Change Password">
        <Field label="Current Password">
          <input className="ms-input" type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} />
        </Field>
        <Field label="New Password">
          <input className="ms-input" type="password" value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} />
        </Field>
        <div className="flex items-center gap-3">
          <button onClick={changePassword} className="ms-btn">Update Password</button>
          {pwMsg && <span className="text-sm text-ms-sub">{pwMsg}</span>}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, desc, children }) {
  return (
    <div className="ms-card p-5 mb-4">
      <div className="font-semibold text-base text-ms-text mb-0.5">{title}</div>
      {desc && <div className="text-xs text-ms-dim mb-4">{desc}</div>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-ms-dim font-semibold uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return <Switch checked={checked} onChange={onChange} size={13} className="flex-shrink-0" />;
}

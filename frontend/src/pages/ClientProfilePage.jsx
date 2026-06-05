import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  StatusBadge, isExpired, isExpiringSoon,
  BmsActionsPanel, EditUserSheet,
} from '../components/clients/ClientShared';
import PaidDial from '../components/ui/PaidDial';

// Fields the admin may edit (must match EDITABLE_FIELDS on the backend)
const EDITABLE = new Set([
  'name','address','phone','mobile','profile','expiry','startDate','note',
  'buildingDetail','sector','station','cpe','radioName','rxccq','signalNoise',
  'signalStrength','routerOsVersion','fq','sellingPrice','vlan','nationality',
  'whishPayments','zone',
]);

export default function ClientProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client,  setClient]  = useState(null);
  const [form,    setForm]    = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);
  const [editBms, setEditBms] = useState(false);
  const [whish,   setWhish]   = useState(null);
  const [paySending, setPaySending] = useState(false);
  const [payMsg,  setPayMsg]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/clients/${id}`);
      setClient(data.client);
      const f = {};
      EDITABLE.forEach(k => { f[k] = data.client[k] ?? ''; });
      setForm(f);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/api/payments/whish').then(r => setWhish(r.data)).catch(() => {}); }, []);

  const sendWhish = async () => {
    setPaySending(true); setPayMsg(null);
    try {
      await api.post('/api/payments/whish/send', { clientId: id });
      setPayMsg({ ok: true, msg: 'Pay link sent on WhatsApp' });
    } catch (e) {
      setPayMsg({ ok: false, msg: e.response?.data?.error || e.message });
    } finally { setPaySending(false); }
  };

  const setF = (k, v) => { setForm(p => ({ ...p, [k]: v })); setSaveMsg(null); };

  const dirty = client && [...EDITABLE].some(k => (form[k] ?? '') !== (client[k] ?? ''));

  const save = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      const payload = {};
      EDITABLE.forEach(k => { payload[k] = form[k]; });
      const { data } = await api.patch(`/api/clients/${id}`, payload);
      setClient(data.client);
      setSaveMsg({ ok: true, msg: 'Profile saved' });
    } catch (e) {
      setSaveMsg({ ok: false, msg: e.response?.data?.error || e.message });
    } finally { setSaving(false); }
  };

  const toggle = async (kind) => {
    const { data } = await api.patch(`/api/clients/${id}/${kind}`);
    setClient(c => ({ ...c, ...data }));
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <span className="w-6 h-6 border-2 border-ms-border border-t-ms-blue rounded-full animate-spin" />
    </div>
  );
  if (error) return (
    <div className="p-6">
      <button onClick={() => navigate('/clients')} className="ms-btn-ghost text-sm mb-4">← Back to clients</button>
      <div className="rounded-lg p-4 bg-ms-red-bg text-ms-red text-sm">{error}</div>
    </div>
  );

  const c = client;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-ms-navy px-4 sm:px-6 py-4 flex items-start justify-between gap-3 sticky top-0 z-10">
        <div className="min-w-0">
          <button onClick={() => navigate('/clients')} className="text-white/60 hover:text-white text-xs mb-1">← Clients</button>
          <div className="font-semibold text-lg text-white truncate">{c.name || c.username}</div>
          <div className="text-white/60 text-xs font-mono">{c.username}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <StatusBadge status={c.status} />
          <div className="flex flex-col items-center gap-0.5">
            <PaidDial checked={c.paid} onChange={() => toggle('paid')} size={36} />
            <span className="text-[9px] text-white/50">{c.paid ? 'Paid' : 'Unpaid'}</span>
          </div>
          <button onClick={() => toggle('reminders')}
            className={`text-[11px] font-semibold px-2 py-1 rounded border ${c.remindersEnabled !== false ? 'bg-ms-blue/20 text-ms-blue border-ms-blue/40' : 'bg-white/10 text-white/60 border-white/20'}`}>
            {c.remindersEnabled !== false ? '📱 WA ON' : '📵 WA OFF'}
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5 max-w-4xl w-full mx-auto pb-28">
        {/* Live BMS state — read only */}
        <Section title="Live status (from BMS — read-only)" hint="Updated automatically on every sync">
          <ReadRow label="Status"  value={c.status} />
          <ReadRow label="IP"      value={c.ipAddress} mono />
          <ReadRow label="MAC"     value={c.mac} mono />
          <ReadRow label="Uptime"  value={c.uptime} />
          <ReadRow label="Speed"   value={c.currentSpeed} />
          <ReadRow label="Last Seen" value={c.lastSeen} />
          <ReadRow label="Daily Quota"   value={c.dailyQuota} />
          <ReadRow label="Monthly Quota" value={c.monthlyQuota} />
          <ReadRow label="AutoRefill" value={c.autoRefill ? 'Yes' : 'No'} />
          <ReadRow label="FUP" value={c.fup ? 'ON' : 'OFF'} />
        </Section>

        {/* Identity & contact */}
        <Section title="Identity & Contact">
          <Field label="Full Name"     value={form.name}        onChange={v => setF('name', v)} />
          <Field label="Phone"         value={form.phone}       onChange={v => setF('phone', v)} />
          <Field label="Mobile"        value={form.mobile}      onChange={v => setF('mobile', v)} />
          <Field label="Nationality"   value={form.nationality} onChange={v => setF('nationality', v)} />
          <Field label="Address"       value={form.address}     onChange={v => setF('address', v)} />
          <Field label="Building (B.D.)" value={form.buildingDetail} onChange={v => setF('buildingDetail', v)} />
          <Field label="Zone"          value={form.zone}        onChange={v => setF('zone', v)} />
        </Section>

        {/* Subscription */}
        <Section title="Subscription" hint="Synced from BMS — edits are overwritten on next sync if BMS has a value">
          <Field label="Service / Profile" value={form.profile}   onChange={v => setF('profile', v)} />
          <Field label="Start Date"        value={form.startDate} onChange={v => setF('startDate', v)} placeholder="YYYY-MM-DD" />
          <Field label="Expiry Date"       value={form.expiry}    onChange={v => setF('expiry', v)} placeholder="YYYY-MM-DD"
            valueClass={isExpired(form.expiry) ? 'text-ms-red' : isExpiringSoon(form.expiry) ? 'text-ms-orange' : ''} />
          <Field label="Selling Price"     value={form.sellingPrice} onChange={v => setF('sellingPrice', v)} />
          <Field label="VLAN"              value={form.vlan}      onChange={v => setF('vlan', v)} />
          <Field label="Whish Payments"    value={form.whishPayments} onChange={v => setF('whishPayments', v)} placeholder="ON / OFF" />
          <Field label="F-Q"               value={form.fq}        onChange={v => setF('fq', v)} placeholder="ON / OFF" />
        </Section>

        {/* Wireless / signal */}
        <Section title="Wireless / Signal" hint="Usually empty for fiber/PPPoE — fill in for radio clients">
          <Field label="Sector"          value={form.sector}         onChange={v => setF('sector', v)} />
          <Field label="Station"         value={form.station}        onChange={v => setF('station', v)} />
          <Field label="CPE"             value={form.cpe}            onChange={v => setF('cpe', v)} />
          <Field label="Radio Name"      value={form.radioName}      onChange={v => setF('radioName', v)} />
          <Field label="RXCCQ"           value={form.rxccq}          onChange={v => setF('rxccq', v)} />
          <Field label="Signal Noise"    value={form.signalNoise}    onChange={v => setF('signalNoise', v)} />
          <Field label="Signal Strength" value={form.signalStrength} onChange={v => setF('signalStrength', v)} />
          <Field label="Router OS Version" value={form.routerOsVersion} onChange={v => setF('routerOsVersion', v)} />
        </Section>

        {/* Notes */}
        <Section title="Admin Notes">
          <div className="px-3 py-3">
            <textarea className="ms-input resize-none w-full" rows={4}
              placeholder="Notes about this client…"
              value={form.note} onChange={e => setF('note', e.target.value)} />
          </div>
        </Section>

        {/* Whish payment */}
        <div>
          <div className="text-[10px] text-ms-dim font-semibold uppercase tracking-wider mb-2">Whish Payment</div>
          {whish?.configured ? (
            <div className="ms-card p-4 flex flex-col sm:flex-row items-center gap-4">
              {whish.qr && <img src={whish.qr} alt="Whish payment QR" className="w-32 h-32 rounded-lg border border-ms-border bg-white p-1.5 flex-shrink-0" />}
              <div className="flex-1 min-w-0 w-full">
                {whish.whish?.accountName && <div className="text-sm text-ms-text font-medium">{whish.whish.accountName}</div>}
                <a href={whish.target} target="_blank" rel="noopener noreferrer" className="text-xs text-ms-blue font-mono break-all hover:underline">{whish.target}</a>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <button onClick={sendWhish} disabled={paySending || !(c.phone || c.mobile)}
                    className="ms-btn text-xs px-3 py-2 flex items-center gap-2 disabled:opacity-40">
                    {paySending
                      ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
                      : '📱 Send pay link on WhatsApp'}
                  </button>
                  <button onClick={() => navigator.clipboard?.writeText(whish.target)} className="ms-btn-outline text-xs px-3 py-2">Copy link</button>
                </div>
                {!(c.phone || c.mobile) && <p className="text-[11px] text-ms-dim mt-1">No phone number on file for this client.</p>}
                {payMsg && <p className={`text-xs mt-2 ${payMsg.ok ? 'text-ms-green' : 'text-ms-red'}`}>{payMsg.ok ? '✓ ' : '✕ '}{payMsg.msg}</p>}
              </div>
            </div>
          ) : (
            <div className="ms-card p-3 text-xs text-ms-dim">
              Add your Whish pay link in <button className="text-ms-blue underline" onClick={() => navigate('/settings')}>Settings</button> to send payment requests.
            </div>
          )}
        </div>

        {/* Live BMS actions */}
        <div>
          <div className="text-[10px] text-ms-dim font-semibold uppercase tracking-wider mb-2">BMS Actions</div>
          <div className="ms-card overflow-hidden">
            <BmsActionsPanel username={c.username} onEditUser={() => setEditBms(true)} />
          </div>
        </div>

        {c.adminUpdatedAt && (
          <p className="text-[10px] text-ms-dim">Profile last edited {new Date(c.adminUpdatedAt).toLocaleString()}</p>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 sm:left-auto sm:right-6 sm:bottom-6 z-30 px-3 sm:px-0">
        <div className="bg-ms-surface border border-ms-border rounded-t-xl sm:rounded-xl shadow-ms-lg px-4 py-3 flex items-center gap-3">
          {saveMsg && (
            <span className={`text-xs font-semibold ${saveMsg.ok ? 'text-ms-green' : 'text-ms-red'}`}>
              {saveMsg.ok ? '✓ ' : '✕ '}{saveMsg.msg}
            </span>
          )}
          {!saveMsg && <span className="text-xs text-ms-dim">{dirty ? 'Unsaved changes' : 'All changes saved'}</span>}
          <button onClick={save} disabled={saving || !dirty}
            className="ms-btn text-sm px-5 flex items-center gap-2 disabled:opacity-40 ml-auto">
            {saving ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : 'Save Profile'}
          </button>
        </div>
      </div>

      {editBms && <EditUserSheet username={c.username} onClose={() => setEditBms(false)} />}
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <div className="text-[10px] text-ms-dim font-semibold uppercase tracking-wider">{title}</div>
        {hint && <span className="text-[10px] text-ms-dim/70">· {hint}</span>}
      </div>
      <div className="ms-card divide-y divide-ms-border overflow-hidden">{children}</div>
    </div>
  );
}

function ReadRow({ label, value, mono }) {
  const empty = !value;
  return (
    <div className="flex items-center justify-between px-3 py-2 gap-3">
      <span className="text-xs text-ms-dim flex-shrink-0">{label}</span>
      <span className={`text-xs truncate text-right ${mono ? 'font-mono' : ''} ${empty ? 'text-ms-dim' : 'text-ms-text'}`}>{empty ? '—' : value}</span>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, valueClass = '' }) {
  const empty = !value;
  return (
    <div className="flex items-center justify-between px-3 py-1.5 gap-3">
      <label className="text-xs text-ms-dim flex-shrink-0 w-32">{label}</label>
      <input
        className={`flex-1 bg-transparent text-xs text-right outline-none border-b border-transparent focus:border-ms-blue py-1 ${empty ? 'placeholder:text-ms-dim/60' : 'text-ms-text'} ${valueClass}`}
        value={value ?? ''}
        placeholder={placeholder || 'Add…'}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

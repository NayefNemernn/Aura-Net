import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export default function MessagingPage() {
  const [tab, setTab] = useState('whatsapp');
  return (
    <div className="p-3 sm:p-6 max-w-5xl">
      <h1 className="font-semibold text-2xl text-ms-text tracking-tight mb-1">Messaging</h1>
      <p className="text-ms-sub text-sm mb-5">WhatsApp bulk send, renewal reminders, and Telegram alerts.</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-ms-border">
        {[['whatsapp','📱 WhatsApp'],['telegram','✈️ Telegram']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === key ? 'border-ms-blue text-ms-blue' : 'border-transparent text-ms-sub hover:text-ms-text'
            }`}>{label}</button>
        ))}
      </div>

      {tab === 'whatsapp' && <WhatsAppTab />}
      {tab === 'telegram' && <TelegramTab />}
    </div>
  );
}

// ── WhatsApp Tab ────────────────────────────────────────────────────────────

function WhatsAppTab() {
  const [wa,          setWa]          = useState({ status: 'disconnected', qr: null });
  const [recipients,  setRecipients]  = useState([]);
  const [search,      setSearch]      = useState('');
  const [selected,    setSelected]    = useState([]);
  const [message,     setMessage]     = useState('');
  const [appendFooter, setAppendFooter] = useState(true);
  const [sending,     setSending]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [recTab,      setRecTab]      = useState('compose'); // 'compose' | 'reminders' | 'templates'
  const [testingId,   setTestingId]   = useState(null);
  const pollRef = useRef(null);

  const pollWa = useCallback(() => {
    api.get('/api/whatsapp/status').then(r => setWa(r.data)).catch(() => {});
  }, []);

  const loadRecipients = useCallback(async () => {
    try {
      const p = new URLSearchParams();
      if (search) p.set('search', search);
      const { data } = await api.get(`/api/messaging/recipients?${p}`);
      setRecipients(data.clients);
    } catch (_) {}
  }, [search]);

  useEffect(() => {
    pollWa();
    pollRef.current = setInterval(pollWa, 3000);
    return () => clearInterval(pollRef.current);
  }, [pollWa]);

  useEffect(() => { loadRecipients(); }, [loadRecipients]);

  const waConnect    = () => { api.post('/api/whatsapp/connect'); pollWa(); };
  const waDisconnect = () => { api.post('/api/whatsapp/disconnect').then(() => setWa({ status: 'disconnected', qr: null })); };

  const toggleSelect = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const allSelected  = recipients.length > 0 && selected.length === recipients.length;
  const toggleAll    = () => setSelected(allSelected ? [] : recipients.map(c => c._id));

  const testReminder = async (c) => {
    setTestingId(c._id); setResult(null);
    try {
      const { data } = await api.post('/api/whatsapp/test-reminder', { clientId: c._id });
      setResult({ success: true, sent: 1, note: `Test reminder sent to ${c.name || c.username}` });
    } catch (e) { setResult({ success: false, error: e.response?.data?.error || e.message }); }
    finally { setTestingId(null); }
  };

  const toggleReminder = async (c) => {
    const { data } = await api.patch(`/api/clients/${c._id}/reminders`);
    setRecipients(prev => prev.map(r => r._id === c._id ? { ...r, remindersEnabled: data.remindersEnabled } : r));
  };

  const allRemEnabled = recipients.length > 0 && recipients.every(c => c.remindersEnabled !== false);
  const toggleAllReminders = async () => {
    const enabled = !allRemEnabled;
    const ids = recipients.map(c => c._id);
    setRecipients(prev => prev.map(c => ({ ...c, remindersEnabled: enabled })));
    try { await api.post('/api/clients/reminders/bulk', { ids, enabled }); }
    catch { loadRecipients(); }
  };

  const send = async () => {
    if (!message.trim() || selected.length === 0) return;
    setSending(true); setResult(null);
    try {
      const { data } = await api.post('/api/messaging/whatsapp/send', { clientIds: selected, message, appendFooter });
      setResult(data);
      if (data.success) setMessage('');
    } catch (e) { setResult({ success: false, error: e.response?.data?.error || e.message }); }
    finally { setSending(false); }
  };

  const sendReminders = async () => {
    setSending(true);
    try {
      const { data } = await api.post('/api/whatsapp/send-reminders');
      setResult({ success: true, sent: data.sent, skipped: 0, failed: 0 });
    } catch (e) { setResult({ success: false, error: e.response?.data?.error || e.message }); }
    finally { setSending(false); }
  };

  const statusColor = { ready: 'bg-ms-green', qr: 'bg-ms-orange', connecting: 'bg-ms-blue', disconnected: 'bg-ms-dim' };
  const statusLabel = { ready: 'Connected', qr: 'Scan QR Code', connecting: 'Connecting…', disconnected: 'Disconnected' };

  return (
    <div className="space-y-4">
      {/* Connection card */}
      <div className="ms-card p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 animate-pulse ${statusColor[wa.status] || 'bg-ms-dim'}`} />
          <div>
            <div className="font-semibold text-sm text-ms-text">{statusLabel[wa.status] || wa.status}</div>
            <div className="text-xs text-ms-dim">WhatsApp Web session</div>
          </div>
        </div>
        <div className="flex gap-2">
          {wa.status === 'disconnected' && (
            <button onClick={waConnect} className="ms-btn text-xs px-3 py-1.5">Connect</button>
          )}
          {wa.status === 'qr' && wa.qr && (
            <div className="flex flex-col items-center gap-1">
              <img src={wa.qr} alt="QR" className="w-36 h-36 rounded border border-ms-border" />
              <p className="text-[10px] text-ms-dim text-center">WhatsApp → Linked Devices → Link a Device</p>
            </div>
          )}
          {wa.status !== 'disconnected' && wa.status !== 'qr' && (
            <button onClick={waDisconnect} className="ms-btn-outline text-xs px-3 py-1.5">Disconnect</button>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-ms-border">
        {[['compose','Compose & Send'],['reminders','Auto-Reminders'],['templates','Templates']].map(([k,l]) => (
          <button key={k} onClick={() => setRecTab(k)}
            className={`px-3 py-1.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              recTab === k ? 'border-ms-blue text-ms-blue' : 'border-transparent text-ms-sub hover:text-ms-text'}`}>{l}</button>
        ))}
      </div>

      {recTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recipient picker */}
          <div className="ms-card overflow-hidden">
            <div className="px-4 py-3 border-b border-ms-border flex items-center justify-between">
              <span className="font-semibold text-sm text-ms-text">Recipients</span>
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-ms-blue font-semibold">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="w-3.5 h-3.5 accent-ms-blue" />
                  Select all
                </label>
                <span className="text-ms-dim">· {selected.length} selected</span>
              </div>
            </div>
            <div className="px-3 py-2 border-b border-ms-border">
              <input className="ms-input py-1.5 text-xs" placeholder="Search…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-ms-border">
              {recipients.length === 0
                ? <div className="text-center py-8 text-ms-dim text-xs">No clients with phone numbers</div>
                : recipients.map(c => (
                  <label key={c._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-ms-sidebar cursor-pointer">
                    <input type="checkbox" checked={selected.includes(c._id)} onChange={() => toggleSelect(c._id)}
                      className="w-3.5 h-3.5 accent-ms-blue flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ms-text font-medium truncate">{c.name || c.username}</div>
                      <div className="text-xs text-ms-dim font-mono">{c.phone || c.mobile}</div>
                    </div>
                    <span className={`pill-${c.status} flex-shrink-0`}>{c.status}</span>
                  </label>
                ))
              }
            </div>
          </div>

          {/* Composer */}
          <div className="ms-card p-4 space-y-3">
            <div className="font-semibold text-sm text-ms-text">Message</div>
            <textarea className="ms-input resize-none text-sm" rows={8}
              placeholder="Type your message…"
              value={message} onChange={e => setMessage(e.target.value)} />
            <label className="flex items-center gap-2 text-xs text-ms-sub cursor-pointer">
              <input type="checkbox" checked={appendFooter} onChange={e => setAppendFooter(e.target.checked)}
                className="w-3.5 h-3.5 accent-ms-blue" />
              Append Aura Net footer <span className="text-ms-dim">(edit it in the Templates tab)</span>
            </label>
            {result && (
              <div className={`text-sm ${result.success ? 'text-ms-green' : 'text-ms-red'}`}>
                {result.success
                  ? `✓ Sent ${result.sent}${result.failed ? `, ${result.failed} failed` : ''}${result.skipped ? `, ${result.skipped} skipped (no phone)` : ''}`
                  : `✕ ${result.error}`}
              </div>
            )}
            <button onClick={send} disabled={sending || wa.status !== 'ready' || selected.length === 0 || !message.trim()}
              className="ms-btn w-full flex items-center justify-center gap-2">
              {sending ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Sending…</> : `📱 Send to ${selected.length} client${selected.length !== 1 ? 's' : ''}`}
            </button>
            {wa.status !== 'ready' && <p className="text-xs text-ms-orange text-center">Connect WhatsApp above to send messages</p>}
          </div>
        </div>
      )}

      {recTab === 'reminders' && (
        <div className="ms-card overflow-hidden">
          <div className="px-4 py-3 border-b border-ms-border flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-ms-text">Auto-Reminder Recipients</div>
              <div className="text-xs text-ms-dim mt-0.5">Auto reminders go out daily at 09:00 to clients expiring today & in 2 days. “Test” sends one message now (any expiry).</div>
            </div>
            <button onClick={sendReminders} disabled={sending || wa.status !== 'ready'}
              className="ms-btn text-xs px-3 py-1.5 flex items-center gap-1.5">
              {sending ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : null}
              Send Now
            </button>
          </div>
          {/* Search + bulk toggle */}
          <div className="px-3 py-2 border-b border-ms-border flex items-center gap-3 flex-wrap">
            <input className="ms-input py-1.5 text-xs flex-1 min-w-[160px]" placeholder="Search…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <label className="flex items-center gap-1.5 cursor-pointer text-ms-blue font-semibold text-xs whitespace-nowrap">
              <input type="checkbox" checked={allRemEnabled} onChange={toggleAllReminders}
                className="w-3.5 h-3.5 accent-ms-blue" />
              Reminders on for all
            </label>
          </div>
          {result && (
            <div className={`px-4 py-2 text-sm border-b border-ms-border ${result.success ? 'text-ms-green' : 'text-ms-red'}`}>
              {result.success ? `✓ ${result.note || `Sent ${result.sent} reminder${result.sent !== 1 ? 's' : ''}`}` : `✕ ${result.error}`}
            </div>
          )}
          <div className="divide-y divide-ms-border max-h-[500px] overflow-y-auto">
            {recipients.length === 0
              ? <div className="text-center py-10 text-ms-dim text-sm">No clients with phone numbers found</div>
              : recipients.map(c => (
                <div key={c._id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ms-text font-medium">{c.name || c.username}</div>
                    <div className="text-xs text-ms-dim font-mono">{c.phone || c.mobile}</div>
                    {c.expiry && <div className={`text-xs mt-0.5 ${isExpiringSoon(c.expiry) ? 'text-ms-orange font-semibold' : 'text-ms-dim'}`}>Expires: {c.expiry}</div>}
                  </div>
                  <span className={`pill-${c.status}`}>{c.status}</span>
                  <button onClick={() => testReminder(c)} disabled={testingId === c._id || wa.status !== 'ready'}
                    title={wa.status !== 'ready' ? 'Connect WhatsApp first' : 'Send a test reminder to this client now'}
                    className="ms-btn-outline text-[11px] px-2.5 py-1 disabled:opacity-40 flex-shrink-0">
                    {testingId === c._id ? '…' : 'Test'}
                  </button>
                  <button onClick={() => toggleReminder(c)}
                    className={`w-10 h-5 rounded-full relative flex-shrink-0 transition-colors ${c.remindersEnabled !== false ? 'bg-ms-blue' : 'bg-ms-border'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${c.remindersEnabled !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {recTab === 'templates' && <TemplatesPanel />}
    </div>
  );
}

// ── Templates Panel ─────────────────────────────────────────────────────────

function TemplatesPanel() {
  const [m,       setM]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');

  useEffect(() => {
    api.get('/api/settings')
      .then(r => setM(r.data.settings.messaging || { reminderExpired:'', reminderSoon:'', footer:'' }))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setM(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await api.patch('/api/settings', { messaging: m });
      setMsg('✓ Saved');
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000); }
  };

  if (loading) return <div className="flex justify-center py-12"><span className="w-5 h-5 border-2 border-ms-border border-t-ms-blue rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="ms-card p-4">
        <div className="font-semibold text-sm text-ms-text mb-1">Reminder Templates</div>
        <div className="text-xs text-ms-dim mb-3">
          Used by Auto-Reminders and the “Test” button. Placeholders:{' '}
          <code className="text-ms-blue">{'{name}'}</code>,{' '}
          <code className="text-ms-blue">{'{expiry}'}</code>,{' '}
          <code className="text-ms-blue">{'{days}'}</code>. WhatsApp formatting: <code className="text-ms-blue">*bold*</code>.
        </div>

        <label className="block text-xs text-ms-dim font-semibold uppercase tracking-wider mb-1.5">Expired today</label>
        <textarea className="ms-input resize-none text-sm mb-4" rows={4}
          value={m.reminderExpired || ''} onChange={e => set('reminderExpired', e.target.value)} />

        <label className="block text-xs text-ms-dim font-semibold uppercase tracking-wider mb-1.5">Expiring soon</label>
        <textarea className="ms-input resize-none text-sm" rows={4}
          value={m.reminderSoon || ''} onChange={e => set('reminderSoon', e.target.value)} />
      </div>

      <div className="ms-card p-4">
        <div className="font-semibold text-sm text-ms-text mb-1">Footer</div>
        <div className="text-xs text-ms-dim mb-3">Appended to every reminder, and to composed messages when “Append Aura Net footer” is ticked. Leave blank for no footer.</div>
        <textarea className="ms-input resize-none text-sm" rows={3}
          placeholder="— Aura Net"
          value={m.footer || ''} onChange={e => set('footer', e.target.value)} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="ms-btn text-sm px-4 py-2">
          {saving ? 'Saving…' : 'Save Templates'}
        </button>
        {msg && <span className="text-sm text-ms-sub">{msg}</span>}
      </div>

      <PreviewCard m={m} />
    </div>
  );
}

// Live preview of how a reminder will read with the current templates + footer.
function PreviewCard({ m }) {
  const render = (tpl, days) => {
    const body = String(tpl || '').replace(/\{(\w+)\}/g, (_, k) =>
      ({ name: 'Ahmad', expiry: '2026-06-10', days: String(days) }[k] ?? ''));
    return m.footer && m.footer.trim() ? `${body}\n\n${m.footer}` : body;
  };
  return (
    <div className="ms-card p-4">
      <div className="font-semibold text-sm text-ms-text mb-2">Preview</div>
      <div className="grid sm:grid-cols-2 gap-3">
        {[['Expired today', m.reminderExpired, 0], ['Expiring soon', m.reminderSoon, 2]].map(([label, tpl, days]) => (
          <div key={label}>
            <div className="text-[10px] text-ms-dim uppercase tracking-wider mb-1">{label}</div>
            <div className="bg-ms-sidebar border border-ms-border rounded-lg p-3 text-xs text-ms-text whitespace-pre-line">{render(tpl, days)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Telegram Tab ────────────────────────────────────────────────────────────

function TelegramTab() {
  const [settings, setSettings] = useState(null);
  const [botInfo,  setBotInfo]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [testing,  setTesting]  = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    api.get('/api/settings').then(r => {
      setSettings(r.data.settings);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (settings?.telegramToken) {
      api.get('/api/messaging/telegram/status').then(r => {
        setBotInfo(r.data.bot);
      }).catch(() => {});
    }
  }, [settings?.telegramToken]);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await api.patch('/api/settings', {
        telegramToken:  settings.telegramToken,
        telegramChatId: settings.telegramChatId,
        telegramAlerts: settings.telegramAlerts,
      });
      setMsg('Saved');
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000); }
  };

  const detectChatId = async () => {
    setDetecting(true);
    try {
      const { data } = await api.post('/api/messaging/telegram/detect-chat');
      setSettings(s => ({ ...s, telegramChatId: data.chatId }));
    } catch (e) { setMsg(e.response?.data?.error || e.message); setTimeout(() => setMsg(''), 5000); }
    finally { setDetecting(false); }
  };

  const test = async () => {
    setTesting(true); setMsg('');
    try {
      await api.post('/api/messaging/telegram/test');
      setMsg('✓ Test message sent!');
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    finally { setTesting(false); setTimeout(() => setMsg(''), 4000); }
  };

  const setAlert = (key, val) => setSettings(s => ({ ...s, telegramAlerts: { ...s.telegramAlerts, [key]: val } }));

  if (loading) return <div className="flex justify-center py-12"><span className="w-5 h-5 border-2 border-ms-border border-t-ms-blue rounded-full animate-spin" /></div>;

  const configured = settings?.telegramToken && settings?.telegramChatId;

  return (
    <div className="space-y-4 max-w-lg">
      {/* Bot setup */}
      <div className="ms-card p-5 space-y-4">
        <div>
          <div className="font-semibold text-sm text-ms-text mb-0.5">Bot Configuration</div>
          <div className="text-xs text-ms-dim">
            1. Open Telegram → search <span className="font-mono text-ms-blue">@BotFather</span> → /newbot → copy the token
          </div>
        </div>

        <div>
          <label className="block text-xs text-ms-dim font-semibold uppercase tracking-wider mb-1.5">Bot Token</label>
          <input className="ms-input font-mono text-sm"
            placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
            value={settings?.telegramToken || ''}
            onChange={e => setSettings(s => ({ ...s, telegramToken: e.target.value }))} />
          {botInfo && <div className="text-xs text-ms-green mt-1">✓ Bot: @{botInfo.username}</div>}
        </div>

        <div>
          <label className="block text-xs text-ms-dim font-semibold uppercase tracking-wider mb-1.5">Your Chat ID</label>
          <div className="flex gap-2">
            <input className="ms-input font-mono text-sm"
              placeholder="e.g. 123456789"
              value={settings?.telegramChatId || ''}
              onChange={e => setSettings(s => ({ ...s, telegramChatId: e.target.value }))} />
            <button onClick={detectChatId} disabled={detecting || !settings?.telegramToken}
              className="ms-btn-outline text-xs px-3 whitespace-nowrap flex-shrink-0">
              {detecting ? '…' : 'Auto-detect'}
            </button>
          </div>
          <div className="text-xs text-ms-dim mt-1">
            2. Send any message to your bot → click Auto-detect
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="ms-btn text-sm px-4 py-2">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={test} disabled={testing || !configured} className="ms-btn-outline text-sm px-4 py-2">
            {testing ? 'Sending…' : 'Send Test'}
          </button>
          {msg && <span className="text-sm text-ms-sub">{msg}</span>}
        </div>
      </div>

      {/* Alert forwarding toggles */}
      <div className="ms-card p-5">
        <div className="font-semibold text-sm text-ms-text mb-1">Alert Forwarding</div>
        <div className="text-xs text-ms-dim mb-4">Choose which alerts get forwarded to your Telegram bot.</div>
        <div className="space-y-3">
          {[
            { key: 'syncOk',       label: 'Sync complete',              sub: 'Confirmation after each BMS sync' },
            { key: 'critical',     label: 'Critical alerts',            sub: 'Client drops, expiry spikes' },
            { key: 'expirySoon',   label: 'Expiry reminders',           sub: 'Accounts expiring in 7 days' },
            { key: 'statusChange', label: 'Status changes',             sub: 'Clients going online / offline' },
          ].map(r => (
            <div key={r.key} className="flex items-center justify-between py-2 border-b border-ms-border last:border-0">
              <div>
                <div className="text-sm text-ms-text">{r.label}</div>
                <div className="text-xs text-ms-dim">{r.sub}</div>
              </div>
              <button onClick={() => setAlert(r.key, !(settings?.telegramAlerts?.[r.key] ?? true))}
                className={`w-10 h-5 rounded-full relative flex-shrink-0 transition-colors ${(settings?.telegramAlerts?.[r.key] ?? true) ? 'bg-ms-blue' : 'bg-ms-border'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${(settings?.telegramAlerts?.[r.key] ?? true) ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={save} disabled={saving} className="ms-btn text-sm px-4 py-2 mt-4">
          {saving ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}

function isExpiringSoon(d) {
  if (!d) return false;
  const dt = new Date(d);
  return dt > new Date() && dt < new Date(Date.now() + 5*864e5);
}

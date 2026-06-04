import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function ContactInboxPage() {
  const [contacts, setContacts] = useState([]);
  const [unread,   setUnread]   = useState(0);
  const [filter,   setFilter]   = useState('all'); // all | unread
  const [loading,  setLoading]  = useState(true);
  const [busy,     setBusy]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/contact');
      setContacts(data.contacts || []);
      setUnread(data.unread || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Tell the sidebar badge to re-fetch the unread count.
  const pingBadge = () => window.dispatchEvent(new Event('contact-unread-refresh'));

  const setRead = async (id, read) => {
    setContacts(prev => prev.map(c => c._id === id ? { ...c, read } : c));
    setUnread(prev => Math.max(0, prev + (read ? -1 : 1)));
    try { await api.patch(`/api/contact/${id}/read`, { read }); pingBadge(); }
    catch { load(); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    const wasUnread = contacts.find(c => c._id === id)?.read === false;
    setContacts(prev => prev.filter(c => c._id !== id));
    if (wasUnread) setUnread(prev => Math.max(0, prev - 1));
    try { await api.delete(`/api/contact/${id}`); pingBadge(); }
    catch { load(); }
  };

  const markAllRead = async () => {
    if (!unread) return;
    setBusy(true);
    try {
      await api.post('/api/contact/read-all');
      setContacts(prev => prev.map(c => ({ ...c, read: true })));
      setUnread(0);
      pingBadge();
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  const shown = filter === 'unread' ? contacts.filter(c => !c.read) : contacts;

  return (
    <div className="p-3 sm:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="font-semibold text-xl sm:text-2xl text-ms-text tracking-tight">Inbox</h1>
          <p className="text-ms-sub text-xs sm:text-sm mt-0.5">
            {contacts.length} message{contacts.length === 1 ? '' : 's'} from the website
            {unread > 0 && <span className="text-ms-blue"> · {unread} unread</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="ms-btn-ghost text-xs sm:text-sm border border-ms-border px-3 py-2">Refresh</button>
          <button onClick={markAllRead} disabled={!unread || busy}
            className="ms-btn-ghost text-xs sm:text-sm border border-ms-border px-3 py-2 disabled:opacity-40 whitespace-nowrap">
            Mark all read
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 mb-4">
        {['all', 'unread'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors border ${
              filter === f ? 'bg-ms-blue-light text-ms-blue border-ms-blue/30' : 'bg-ms-surface text-ms-sub border-ms-border'
            }`}>
            {f}
            {f === 'unread' && unread > 0 && (
              <span className="ml-1 bg-ms-border text-ms-dim text-[9px] px-1.5 py-0.5 rounded-full">{unread}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-ms-border border-t-ms-blue rounded-full animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <div className="ms-card text-center py-16">
          <div className="text-3xl mb-3">📭</div>
          <div className="text-ms-text font-semibold mb-1">{filter === 'unread' ? 'No unread messages' : 'No messages yet'}</div>
          <div className="text-ms-dim text-sm">Submissions from the website contact form land here.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map(c => (
            <div key={c._id}
              className={`ms-card p-4 transition-colors ${c.read ? '' : 'border-l-2 border-ms-blue bg-ms-blue-light'}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!c.read && <span className="w-2 h-2 rounded-full bg-ms-blue flex-shrink-0" />}
                    <span className="text-sm text-ms-text font-semibold">{c.name}</span>
                    {c.subject && <span className="text-[11px] text-ms-sub">· {c.subject}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <a href={`tel:${c.phone}`} className="text-xs text-ms-blue hover:underline">{c.phone}</a>
                    {c.email && <a href={`mailto:${c.email}`} className="text-xs text-ms-blue hover:underline">{c.email}</a>}
                  </div>
                  <p className="text-sm text-ms-sub mt-2 whitespace-pre-line break-words">{c.message}</p>
                  <p className="text-[10px] text-ms-dim mt-2">{new Date(c.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <button onClick={() => setRead(c._id, !c.read)}
                    className="text-[10px] text-ms-sub border border-ms-border px-2 py-1 rounded hover:text-ms-text hover:border-ms-blue transition-colors whitespace-nowrap">
                    {c.read ? 'Mark unread' : 'Mark read'}
                  </button>
                  <button onClick={() => remove(c._id)}
                    className="text-[10px] text-ms-red border border-ms-red/30 px-2 py-1 rounded hover:bg-ms-red-bg transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

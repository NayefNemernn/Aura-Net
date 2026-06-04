import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Landing-page sections the ad button can jump to (must match the
// section `id`s in the public components).
const SECTIONS = [
  { id: 'packages', label: 'Internet Packages' },
  { id: 'cameras',  label: 'Cameras' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'media',    label: 'Media Gallery' },
  { id: 'contact',  label: 'Contact' },
];

export default function AdEditorPage() {
  const [ad,        setAd]        = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlMode,   setUrlMode]   = useState(false);
  const [msg,       setMsg]       = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    api.get('/api/landing')
      .then(({ data }) => {
        const a = data.content.ad || {};
        setAd(a);
        setUrlMode(!!a.linkUrl && !a.linkSection);
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setAd(p => ({ ...p, [k]: v }));

  // Unified "button action" selector: no button / a section / a custom URL.
  const linkValue = ad?.linkSection ? `section:${ad.linkSection}` : ((urlMode || ad?.linkUrl) ? 'url' : '');
  const onLinkChange = (v) => {
    if (v === '')          { setUrlMode(false); setAd(p => ({ ...p, linkSection: '', linkUrl: '' })); }
    else if (v === 'url')  { setUrlMode(true);  setAd(p => ({ ...p, linkSection: '' })); }
    else                   { setUrlMode(false); setAd(p => ({ ...p, linkSection: v.split(':')[1], linkUrl: '' })); }
  };

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const { data } = await api.put('/api/landing/ad', {
        enabled:     ad.enabled,
        title:       ad.title,
        body:        ad.body,
        linkUrl:     ad.linkSection ? '' : (ad.linkUrl || ''),
        linkSection: ad.linkSection || '',
        ctaLabel:    ad.ctaLabel,
      });
      setAd(data.ad);
      setMsg('Saved — live on the website');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    finally { setSaving(false); }
  };

  const uploadImage = async (file) => {
    setUploading(true); setMsg('');
    const form = new FormData();
    form.append('image', file);
    try {
      const { data } = await api.post('/api/landing/ad/image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAd(data.ad);
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    finally { setUploading(false); }
  };

  const removeImage = async () => {
    try { const { data } = await api.delete('/api/landing/ad/image'); setAd(data.ad); }
    catch (e) { setMsg(e.response?.data?.error || e.message); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="w-6 h-6 border-2 border-ms-border border-t-ms-blue rounded-full animate-spin" />
    </div>
  );

  const img = ad.imageUrl
    ? (ad.imageUrl.startsWith('http') ? ad.imageUrl : `${BACKEND}${ad.imageUrl}`)
    : null;

  return (
    <div className="p-3 sm:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-semibold text-2xl text-ms-text tracking-tight">Pop-up Ad</h1>
          <p className="text-xs text-ms-dim mt-1">Shown to visitors when they open the website. They can close it.</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-ms-sub">{msg}</span>}
          <button onClick={save} disabled={saving} className="ms-btn flex items-center gap-2">
            {saving ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="ms-card p-5 space-y-4">
          {/* Enable */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-ms-text font-medium">Show pop-up ad</div>
              <div className="text-[11px] text-ms-dim">Turn off to hide it from the website.</div>
            </div>
            <button onClick={() => set('enabled', !ad.enabled)}
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${ad.enabled ? 'bg-ms-green' : 'bg-ms-border'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${ad.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs text-ms-dim font-semibold uppercase tracking-wider mb-1.5">Image</label>
            {img ? (
              <div className="relative inline-block">
                <img src={img} alt="Ad" className="max-h-44 rounded border border-ms-border" />
                <button onClick={removeImage}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80">✕</button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="ms-btn-outline text-xs px-3 py-2 flex items-center gap-2">
                {uploading ? <><span className="w-3 h-3 border border-ms-blue/30 border-t-ms-blue rounded-full animate-spin" />Uploading…</> : '📷 Upload image'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { if (e.target.files[0]) uploadImage(e.target.files[0]); e.target.value = ''; }} />
          </div>

          <Field label="Title">
            <input className="ms-input" value={ad.title || ''} onChange={e => set('title', e.target.value)} placeholder="Summer Offer!" />
          </Field>
          <Field label="Body text">
            <textarea className="ms-input resize-none" rows={3} value={ad.body || ''} onChange={e => set('body', e.target.value)}
              placeholder="Get 3 months free on any fiber plan…" />
          </Field>
          <Field label="Button action">
            <select className="ms-input" value={linkValue} onChange={e => onLinkChange(e.target.value)}>
              <option value="">No button</option>
              <optgroup label="Scroll to section">
                {SECTIONS.map(s => <option key={s.id} value={`section:${s.id}`}>{s.label}</option>)}
              </optgroup>
              <option value="url">Custom URL…</option>
            </select>
            <p className="text-[11px] text-ms-dim mt-1">
              {ad.linkSection
                ? 'The button scrolls visitors straight to that section of the website.'
                : urlMode
                  ? 'The button opens this link in a new tab.'
                  : 'Pick where the button takes visitors, or leave as “No button”.'}
            </p>
          </Field>
          {linkValue === 'url' && (
            <Field label="Button link (URL)">
              <input className="ms-input" value={ad.linkUrl || ''} onChange={e => set('linkUrl', e.target.value)} placeholder="https://…" />
            </Field>
          )}
          {linkValue && (
            <Field label="Button label">
              <input className="ms-input" value={ad.ctaLabel || ''} onChange={e => set('ctaLabel', e.target.value)} placeholder="Learn More" />
            </Field>
          )}
        </div>

        {/* Live preview */}
        <div>
          <div className="text-[10px] text-ms-dim font-semibold uppercase tracking-wider mb-2">Preview</div>
          <div className="ms-card p-4 bg-ms-navy flex items-center justify-center min-h-[260px]">
            {(img || ad.title || ad.body) ? (
              <div className="relative w-full max-w-xs bg-ms-surface border border-ms-border rounded-lg overflow-hidden shadow-ms-lg">
                <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-xs">✕</span>
                {img && <img src={img} alt="" className="w-full object-cover max-h-40" />}
                {(ad.title || ad.body || ad.linkSection || ad.linkUrl) && (
                  <div className="p-4 text-center">
                    {ad.title && <div className="text-lg font-semibold text-ms-text mb-1">{ad.title}</div>}
                    {ad.body && <div className="text-xs text-ms-sub whitespace-pre-line">{ad.body}</div>}
                    {(ad.linkSection || ad.linkUrl) && (
                      <span className="inline-block mt-3 px-4 py-2 bg-ms-blue text-white text-[10px] tracking-[0.2em] uppercase rounded-sm">
                        {ad.ctaLabel || 'Learn More'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-ms-dim">Add an image or text to see the pop-up</span>
            )}
          </div>
          {!ad.enabled && <p className="text-[11px] text-ms-orange mt-2">The ad is currently <b>off</b> — toggle “Show pop-up ad” and Save to display it.</p>}
        </div>
      </div>
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

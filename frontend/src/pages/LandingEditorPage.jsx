import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TABS = [
  { id: 'hero',    label: 'Hero',      icon: '🏠' },
  { id: 'plans',   label: 'Plans',     icon: '📦' },
  { id: 'media',   label: 'Media',     icon: '🎬' },
  { id: 'contact', label: 'Contact',   icon: '📞' },
  { id: 'titles',  label: 'Sections',  icon: '✏️' },
];

export default function LandingEditorPage() {
  const [tab,     setTab]     = useState('hero');
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    api.get('/api/landing').then(({ data }) => {
      setContent(data.content);
    }).finally(() => setLoading(false));
  }, []);

  const save = async (patch) => {
    setSaving(true);
    try {
      const { data } = await api.put('/api/landing', patch);
      setContent(data.content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-ms-border border-t-ms-blue rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-3 sm:p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="font-semibold text-2xl text-ms-text tracking-tight">Website Editor</h1>
          <p className="text-ms-sub text-sm mt-0.5">Edit landing page content visible at <code className="text-ms-blue">/home</code></p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-ms-green text-sm font-semibold">✓ Saved</span>}
          <a href="/home" target="_blank" rel="noopener"
            className="ms-btn-outline text-sm">Preview ↗</a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-ms-border overflow-x-auto pb-0 scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-ms-blue text-ms-blue' : 'border-transparent text-ms-dim hover:text-ms-text'
            }`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {content && (
        <>
          {tab === 'hero'    && <HeroTab    content={content} onSave={save} saving={saving} />}
          {tab === 'plans'   && <PlansTab   content={content} onSave={save} saving={saving} setContent={setContent} />}
          {tab === 'media'   && <MediaTab   content={content} setContent={setContent} />}
          {tab === 'contact' && <ContactTab content={content} onSave={save} saving={saving} />}
          {tab === 'titles'  && <TitlesTab  content={content} onSave={save} saving={saving} />}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Hero Tab
───────────────────────────────────────────────────────────────────── */
function HeroTab({ content, onSave, saving }) {
  const [hero,   setHero]   = useState({ ...content.hero });
  const [offers, setOffers] = useState(content.offers.map(o => ({ ...o })));

  const setH = (k, v) => setHero(p => ({ ...p, [k]: v }));
  const setO = (i, k, v) => setOffers(p => p.map((o, j) => j === i ? { ...o, [k]: v } : o));
  const addOffer = () => setOffers(p => [...p, { speed:'', price:'', tag:'', color:'#00d4ff' }]);
  const delOffer = (i) => setOffers(p => p.filter((_,j) => j !== i));

  return (
    <div className="space-y-4">
      <Card title="Hero Text">
        <Grid2>
          <Field label="Badge Text">
            <input className="ms-input" value={hero.badge} onChange={e => setH('badge', e.target.value)} />
          </Field>
          <Field label="CTA Button 1 Label">
            <input className="ms-input" value={hero.cta1} onChange={e => setH('cta1', e.target.value)} />
          </Field>
        </Grid2>
        <Grid3>
          <Field label="Title Line 1">
            <input className="ms-input" value={hero.title1} onChange={e => setH('title1', e.target.value)} />
          </Field>
          <Field label="Title Line 2 (gradient)">
            <input className="ms-input" value={hero.title2} onChange={e => setH('title2', e.target.value)} />
          </Field>
          <Field label="Title Line 3">
            <input className="ms-input" value={hero.title3} onChange={e => setH('title3', e.target.value)} />
          </Field>
        </Grid3>
        <Field label="Subtitle">
          <textarea className="ms-input resize-none" rows={3} value={hero.subtitle} onChange={e => setH('subtitle', e.target.value)} />
        </Field>
        <Field label="CTA Button 2 Label">
          <input className="ms-input" value={hero.cta2} onChange={e => setH('cta2', e.target.value)} />
        </Field>
      </Card>

      <Card title="Offer Chips (shown in hero)" action={
        <button onClick={addOffer} className="ms-btn text-xs px-3 py-1.5">+ Add Offer</button>
      }>
        {offers.length === 0 && <div className="text-sm text-ms-dim py-2">No offer chips — add one above.</div>}
        {offers.map((o, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-end pb-3 border-b border-ms-border last:border-0 last:pb-0">
            <Field label="Tag">
              <input className="ms-input" value={o.tag} onChange={e => setO(i,'tag',e.target.value)} placeholder="Starter" />
            </Field>
            <Field label="Speed">
              <input className="ms-input" value={o.speed} onChange={e => setO(i,'speed',e.target.value)} placeholder="50 Mbps" />
            </Field>
            <Field label="Price">
              <input className="ms-input" value={o.price} onChange={e => setO(i,'price',e.target.value)} placeholder="$29" />
            </Field>
            <div className="flex items-end gap-2">
              <Field label="Color">
                <input type="color" className="h-[38px] w-full rounded border border-ms-border cursor-pointer" value={o.color} onChange={e => setO(i,'color',e.target.value)} />
              </Field>
              <button onClick={() => delOffer(i)} className="mb-0.5 text-ms-red hover:bg-ms-red-bg px-2 py-2 rounded text-sm">✕</button>
            </div>
          </div>
        ))}
      </Card>

      <SaveBar onSave={() => onSave({ hero, offers })} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Plans Tab
───────────────────────────────────────────────────────────────────── */
function PlansTab({ content, onSave, saving }) {
  const [plans, setPlans] = useState(content.plans.map(p => ({ ...p, features: [...(p.features||[])] })));
  const [open, setOpen]   = useState(null);

  const setP = (i, k, v) => setPlans(prev => prev.map((p,j) => j===i ? {...p,[k]:v} : p));
  const setFeat = (i, fi, v) => setP(i, 'features', plans[i].features.map((f,j) => j===fi ? v : f));
  const addFeat = (i) => setP(i, 'features', [...plans[i].features, '']);
  const delFeat = (i, fi) => setP(i, 'features', plans[i].features.filter((_,j) => j!==fi));
  const addPlan = () => {
    setPlans(p => [...p, { name:'New Plan', speed:'', price:0, color:'#0070ff', hot:false, features:[] }]);
    setOpen(plans.length);
  };
  const delPlan = (i) => { setPlans(p => p.filter((_,j) => j!==i)); setOpen(null); };
  const movePlan = (i, dir) => {
    const arr = [...plans];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setPlans(arr);
    setOpen(j);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={addPlan} className="ms-btn text-sm">+ Add Plan</button>
      </div>

      {plans.map((p, i) => (
        <div key={i} className="ms-card overflow-hidden">
          {/* Plan row header */}
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-ms-sidebar transition-colors"
            onClick={() => setOpen(open === i ? null : i)}>
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }}/>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm text-ms-text">{p.name || 'Unnamed plan'}</span>
              <span className="text-ms-dim text-xs ml-3">{p.speed} · ${p.price}/mo</span>
              {p.hot && <span className="ml-2 text-[10px] bg-ms-blue text-white px-1.5 py-0.5 rounded font-semibold">POPULAR</span>}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={e => { e.stopPropagation(); movePlan(i,-1); }} disabled={i===0}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-ms-sidebar disabled:opacity-30 text-ms-dim">↑</button>
              <button onClick={e => { e.stopPropagation(); movePlan(i,1); }} disabled={i===plans.length-1}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-ms-sidebar disabled:opacity-30 text-ms-dim">↓</button>
              <button onClick={e => { e.stopPropagation(); delPlan(i); }}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-ms-red-bg text-ms-red text-sm">✕</button>
              <span className="text-ms-dim text-xs ml-1">{open===i?'▲':'▼'}</span>
            </div>
          </div>

          {/* Expanded edit form */}
          {open === i && (
            <div className="px-4 pb-4 pt-2 border-t border-ms-border bg-ms-sidebar/40 space-y-3">
              <Grid3>
                <Field label="Plan Name">
                  <input className="ms-input" value={p.name} onChange={e => setP(i,'name',e.target.value)} />
                </Field>
                <Field label="Speed">
                  <input className="ms-input" value={p.speed} onChange={e => setP(i,'speed',e.target.value)} placeholder="100 Mbps" />
                </Field>
                <Field label="Monthly Price ($)">
                  <input className="ms-input" type="number" value={p.price} onChange={e => setP(i,'price',+e.target.value)} />
                </Field>
              </Grid3>
              <Grid2>
                <Field label="Accent Color">
                  <div className="flex gap-2 items-center">
                    <input type="color" className="h-[38px] w-12 rounded border border-ms-border cursor-pointer flex-shrink-0" value={p.color} onChange={e => setP(i,'color',e.target.value)} />
                    <input className="ms-input" value={p.color} onChange={e => setP(i,'color',e.target.value)} />
                  </div>
                </Field>
                <Field label="Mark as Popular">
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-ms-blue" checked={p.hot} onChange={e => setP(i,'hot',e.target.checked)} />
                    <span className="text-sm text-ms-text">Show "POPULAR" badge</span>
                  </label>
                </Field>
              </Grid2>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-ms-dim font-semibold uppercase tracking-wider">Features</label>
                  <button onClick={() => addFeat(i)} className="text-xs text-ms-blue hover:underline">+ Add feature</button>
                </div>
                <div className="space-y-1.5">
                  {p.features.map((f,fi) => (
                    <div key={fi} className="flex gap-2">
                      <input className="ms-input text-sm" value={f} onChange={e => setFeat(i,fi,e.target.value)} placeholder="Feature description" />
                      <button onClick={() => delFeat(i,fi)} className="text-ms-red hover:bg-ms-red-bg px-2 rounded text-sm flex-shrink-0">✕</button>
                    </div>
                  ))}
                  {p.features.length === 0 && <p className="text-xs text-ms-dim">No features yet</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <SaveBar onSave={() => onSave({ plans })} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Media Tab
───────────────────────────────────────────────────────────────────── */
function MediaTab({ content, setContent }) {
  const [media,      setMedia]      = useState(content.media || []);
  const [ytUrl,      setYtUrl]      = useState('');
  const [ytTitle,    setYtTitle]    = useState('');
  const [ytDesc,     setYtDesc]     = useState('');
  const [addingYt,   setAddingYt]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [ytOpen,     setYtOpen]     = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [editTitle,  setEditTitle]  = useState('');
  const [editDesc,   setEditDesc]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const fileRef = useRef(null);
  const [err,  setErr]  = useState('');

  const refresh = (newMedia) => {
    setMedia(newMedia);
    setContent(prev => ({ ...prev, media: newMedia }));
  };

  const addYouTube = async () => {
    if (!ytUrl.trim()) return;
    setAddingYt(true); setErr('');
    try {
      const { data } = await api.post('/api/landing/media/youtube', { url: ytUrl, title: ytTitle, description: ytDesc });
      refresh(data.media);
      setYtUrl(''); setYtTitle(''); setYtDesc(''); setYtOpen(false);
    } catch (e) { setErr(e.response?.data?.error || e.message); }
    finally { setAddingYt(false); }
  };

  const uploadPhoto = async (file) => {
    setUploading(true); setErr('');
    const form = new FormData();
    form.append('photo', file);
    try {
      const { data } = await api.post('/api/landing/media/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      refresh(data.media);
    } catch (e) { setErr(e.response?.data?.error || e.message); }
    finally { setUploading(false); }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Remove this item from the website?')) return;
    try {
      const { data } = await api.delete(`/api/landing/media/${id}`);
      refresh(data.media);
    } catch (e) { alert(e.message); }
  };

  const move = async (i, dir) => {
    const arr = [...media];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setMedia(arr);
    try {
      const { data } = await api.patch('/api/landing/media/reorder', { ids: arr.map(m => m._id) });
      refresh(data.media);
    } catch (_) {}
  };

  const startEdit = (item) => { setEditId(item._id); setEditTitle(item.title); setEditDesc(item.description); };
  const saveEdit = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/api/landing/media/${editId}`, { title: editTitle, description: editDesc });
      refresh(data.media);
      setEditId(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setYtOpen(v => !v)} className="ms-btn text-sm flex items-center gap-2">
          ▶ Add YouTube Video
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="ms-btn-outline text-sm flex items-center gap-2">
          {uploading ? <><span className="w-3 h-3 border border-ms-blue border-t-transparent rounded-full animate-spin"/>Uploading…</> : '📷 Upload Photo'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { if (e.target.files[0]) uploadPhoto(e.target.files[0]); e.target.value=''; }} />
      </div>

      {err && <div className="text-ms-red text-sm bg-ms-red-bg px-3 py-2 rounded">{err}</div>}

      {/* YouTube add panel */}
      {ytOpen && (
        <div className="ms-card p-4 space-y-3">
          <div className="font-semibold text-sm text-ms-text">Add YouTube Video</div>
          <Field label="YouTube URL">
            <input className="ms-input" value={ytUrl} onChange={e => setYtUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..." />
          </Field>
          <Grid2>
            <Field label="Title (optional)">
              <input className="ms-input" value={ytTitle} onChange={e => setYtTitle(e.target.value)} placeholder="Video title" />
            </Field>
            <Field label="Description (optional)">
              <input className="ms-input" value={ytDesc} onChange={e => setYtDesc(e.target.value)} placeholder="Short description" />
            </Field>
          </Grid2>
          {/* Thumbnail preview */}
          {ytUrl && (() => {
            const m = ytUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/);
            const id = m ? m[1] : null;
            return id ? (
              <div className="flex items-center gap-3">
                <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt="thumb"
                  className="w-32 h-20 object-cover rounded border border-ms-border" />
                <span className="text-xs text-ms-green">✓ Valid YouTube URL</span>
              </div>
            ) : <span className="text-xs text-ms-red">⚠ Could not detect YouTube ID</span>;
          })()}
          <div className="flex gap-2">
            <button onClick={addYouTube} disabled={addingYt || !ytUrl} className="ms-btn text-sm flex items-center gap-2">
              {addingYt ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"/>Adding…</> : 'Add to Website'}
            </button>
            <button onClick={() => setYtOpen(false)} className="ms-btn-outline text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Media grid */}
      {media.length === 0 ? (
        <div className="ms-card p-10 text-center text-ms-dim text-sm">
          <div className="text-4xl mb-3">🎬</div>
          No media added yet — add a YouTube video or upload a photo above.<br/>
          <span className="text-xs mt-1 block">The media section will not appear on the website until you add items here.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {media.map((item, i) => (
            <div key={item._id} className="ms-card overflow-hidden">
              {/* Thumbnail */}
              <div className="relative">
                {item.type === 'youtube' ? (
                  <img
                    src={`https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`}
                    alt={item.title || 'YouTube'}
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <img
                    src={`${BACKEND}${item.url}`}
                    alt={item.title || 'Photo'}
                    className="w-full h-44 object-cover"
                  />
                )}
                {/* Type badge */}
                <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  item.type === 'youtube' ? 'bg-red-600 text-white' : 'bg-ms-blue text-white'
                }`}>
                  {item.type === 'youtube' ? '▶ YouTube' : '📷 Photo'}
                </span>
                {/* Position badge */}
                <span className="absolute top-2 right-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">
                  #{i + 1}
                </span>
              </div>

              {/* Info / edit */}
              <div className="p-3">
                {editId === item._id ? (
                  <div className="space-y-2">
                    <input className="ms-input text-sm" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" />
                    <input className="ms-input text-sm" value={editDesc}  onChange={e => setEditDesc(e.target.value)}  placeholder="Description" />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} disabled={saving} className="ms-btn text-xs px-3 py-1.5">
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditId(null)} className="ms-btn-outline text-xs px-3 py-1.5">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-medium text-ms-text truncate">{item.title || <span className="text-ms-dim italic">No title</span>}</div>
                    {item.description && <div className="text-xs text-ms-dim truncate mt-0.5">{item.description}</div>}
                    {item.type === 'youtube' && (
                      <div className="text-[10px] font-mono text-ms-dim mt-1 truncate">{item.url}</div>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              {editId !== item._id && (
                <div className="px-3 pb-3 flex items-center justify-between">
                  <div className="flex gap-1">
                    <button onClick={() => move(i,-1)} disabled={i===0}
                      className="w-7 h-7 flex items-center justify-center rounded border border-ms-border text-ms-dim hover:bg-ms-sidebar disabled:opacity-30 text-sm">↑</button>
                    <button onClick={() => move(i,1)} disabled={i===media.length-1}
                      className="w-7 h-7 flex items-center justify-center rounded border border-ms-border text-ms-dim hover:bg-ms-sidebar disabled:opacity-30 text-sm">↓</button>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(item)}
                      className="text-xs text-ms-blue border border-ms-blue px-2 py-1 rounded hover:bg-ms-blue-light">Edit</button>
                    <button onClick={() => deleteItem(item._id)}
                      className="text-xs text-ms-red border border-ms-red/30 px-2 py-1 rounded hover:bg-ms-red-bg">Remove</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Contact Tab
───────────────────────────────────────────────────────────────────── */
function ContactTab({ content, onSave, saving }) {
  const [contact, setContact] = useState({ ...content.contact });
  const set = (k, v) => setContact(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <Card title="Contact Information" desc="Shown in the contact section of your landing page (optional — leave blank to hide).">
        <Grid2>
          <Field label="Phone">
            <input className="ms-input" value={contact.phone} onChange={e => set('phone', e.target.value)} placeholder="+961 XX XXX XXX" />
          </Field>
          <Field label="Email">
            <input className="ms-input" value={contact.email} onChange={e => set('email', e.target.value)} placeholder="info@auranet.lb" />
          </Field>
          <Field label="Address">
            <input className="ms-input" value={contact.address} onChange={e => set('address', e.target.value)} placeholder="Beirut, Lebanon" />
          </Field>
          <Field label="Working Hours">
            <input className="ms-input" value={contact.hours} onChange={e => set('hours', e.target.value)} placeholder="Mon–Sat, 9am–6pm" />
          </Field>
        </Grid2>
      </Card>
      <SaveBar onSave={() => onSave({ contact })} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Section Titles Tab
───────────────────────────────────────────────────────────────────── */
function TitlesTab({ content, onSave, saving }) {
  const [titles, setTitles] = useState({ ...content.sectionTitles });
  const set = (k, v) => setTitles(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <Card title="Section Headings" desc="Change the title displayed at the top of each section on the landing page.">
        <Field label="Plans Section Title">
          <input className="ms-input" value={titles.plans} onChange={e => set('plans', e.target.value)} />
        </Field>
        <Field label="Router Section Title">
          <input className="ms-input" value={titles.router} onChange={e => set('router', e.target.value)} />
        </Field>
        <Field label="LAN Cables Section Title">
          <input className="ms-input" value={titles.cables} onChange={e => set('cables', e.target.value)} />
        </Field>
        <Field label="Media Gallery Section Title">
          <input className="ms-input" value={titles.media} onChange={e => set('media', e.target.value)} />
        </Field>
      </Card>
      <SaveBar onSave={() => onSave({ sectionTitles: titles })} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Shared UI
───────────────────────────────────────────────────────────────────── */
function Card({ title, desc, action, children }) {
  return (
    <div className="ms-card p-5">
      <div className="flex items-start justify-between mb-1 gap-3">
        <div>
          <div className="font-semibold text-base text-ms-text">{title}</div>
          {desc && <div className="text-xs text-ms-dim mt-0.5">{desc}</div>}
        </div>
        {action}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
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

function Grid2({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function Grid3({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{children}</div>;
}

function SaveBar({ onSave, saving }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <button onClick={onSave} disabled={saving} className="ms-btn flex items-center gap-2">
        {saving ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"/>Saving…</> : 'Save Changes'}
      </button>
      <span className="text-xs text-ms-dim">Changes go live immediately on the website</span>
    </div>
  );
}

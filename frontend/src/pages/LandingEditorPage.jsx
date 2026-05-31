import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/* ─── Default data (mirrors component defaults) ─────────────────── */
const DEFAULT_PACKAGES = [
  { tier:'Starter',   name:'Fiber 50',  speed:'50',    price:'29', routerName:'Wi-Fi 6 Dual-Band',  features:['Wi-Fi 6 router included','Static IP address','RJ45 wiring installation','24/7 technical support','Free router replacement'] },
  { tier:'Home Plus', name:'Fiber 100', speed:'100',   price:'49', routerName:'Wi-Fi 6 Tri-Band',   features:['Wi-Fi 6 tri-band router included','Dual static IP addresses','Cat6 shielded wiring','Priority 24/7 support','Mesh extender eligible','Network monitoring dashboard'], popular:true },
  { tier:'Business',  name:'Fiber 1G',  speed:'1,000', price:'89', routerName:'Enterprise 6-Antenna',features:['Enterprise router + PoE switch','Block of 5 static IPs','Cat6a shielded wiring','Dedicated account manager','Full mesh deployment','99.9% uptime SLA','VLAN configuration'] },
];

const DEFAULT_CAMERAS = [
  { name:'PTZ Dome Camera', model:'Hikvision DS-2DE4A425IWG-E', type:'Dome PTZ · Indoor/Outdoor', resolution:'4MP 25×', cable:'Cat6 PoE+', connector:'RJ45 Shielded',
    specs:[{label:'Optical Zoom',value:'25×'},{label:'IR Range',value:'100m'},{label:'Pan/Tilt',value:'360°/90°'},{label:'Protocol',value:'ONVIF'}],
    features:['Night Vision','PTZ Control','Live View','AI Detection'] },
  { name:'Dome Camera', model:'Hikvision DS-2CD2143G2-I', type:'Dome · Indoor/Outdoor', resolution:'4K 8MP', cable:'Cat6 PoE', connector:'RJ45 Shielded',
    specs:[{label:'Sensor',value:'1/1.8" CMOS'},{label:'IR Range',value:'40m'},{label:'Aperture',value:'f/1.6'},{label:'Protocol',value:'ONVIF'}],
    features:['Night Vision','AI Detection','Cloud Storage','Smart Alerts'] },
  { name:'Bullet Camera', model:'Hikvision DS-2CD2T86G2-4I', type:'Bullet · Outdoor', resolution:'4K 8MP', cable:'Cat6 PoE', connector:'RJ45 Shielded',
    specs:[{label:'Sensor',value:'1/1.8" CMOS'},{label:'IR Range',value:'80m'},{label:'Aperture',value:'f/1.6'},{label:'Protocol',value:'ONVIF'}],
    features:['Night Vision','AI Detection','Cloud Storage','Smart Alerts'] },
  { name:'Dome Camera Pro', model:'Dahua IPC-HDW3849H-AS-PV', type:'Dome · Outdoor', resolution:'4K 8MP', cable:'Cat5e PoE', connector:'RJ45',
    specs:[{label:'Sensor',value:'1/2.8" CMOS'},{label:'IR Range',value:'30m'},{label:'Aperture',value:'f/1.0'},{label:'Protocol',value:'ONVIF'}],
    features:['Night Vision','Smart Alerts','Cloud Storage','Live View'] },
];

const TABS = [
  { id:'hero',     label:'Hero'      },
  { id:'packages', label:'Packages'  },
  { id:'cameras',  label:'Cameras'   },
  { id:'media',    label:'Media'     },
  { id:'contact',  label:'Contact'   },
  { id:'sections', label:'Sections'  },
];

export default function LandingEditorPage() {
  const [tab,     setTab]     = useState('hero');
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    api.get('/api/landing').then(({ data }) => setContent(data.content)).finally(() => setLoading(false));
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
      <div className="w-5 h-5 border border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-px w-6 bg-primary opacity-70" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-primary uppercase">Website Editor</span>
          </div>
          <h1 className="font-serif font-normal text-2xl text-foreground">Landing Page</h1>
          <p className="font-mono text-[11px] text-muted-foreground mt-1 tracking-wider">
            Edits go live immediately at <span className="text-primary">/home</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="font-mono text-[10px] tracking-wider text-primary uppercase">✓ Saved</span>
          )}
          <a href="/home" target="_blank" rel="noopener"
            className="px-4 py-2 border border-border text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase rounded-sm hover:border-primary hover:text-primary transition-all duration-200">
            Preview ↗
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-border overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 font-mono text-[10px] tracking-[0.2em] uppercase whitespace-nowrap border-b-2 -mb-px transition-all duration-200 ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {content && (
        <>
          {tab === 'hero'     && <HeroTab     content={content} onSave={save} saving={saving} />}
          {tab === 'packages' && <PackagesTab content={content} onSave={save} saving={saving} />}
          {tab === 'cameras'  && <CamerasTab  content={content} onSave={save} saving={saving} />}
          {tab === 'media'    && <MediaTab    content={content} setContent={setContent} />}
          {tab === 'contact'  && <ContactTab  content={content} onSave={save} saving={saving} />}
          {tab === 'sections' && <SectionsTab content={content} onSave={save} saving={saving} />}
        </>
      )}
    </div>
  );
}

/* ─── Hero Tab ───────────────────────────────────────────────────── */
function HeroTab({ content, onSave, saving }) {
  const [hero, setHero] = useState({
    badge:    content.hero?.badge    || 'EST. 2017 · INTERNET & SECURITY',
    title1:   content.hero?.title1   || 'Internet &',
    title2:   content.hero?.title2   || 'cameras,',
    title3:   content.hero?.title3   || 'installed\nproperly.',
    subtitle: content.hero?.subtitle || '',
    cta1:     content.hero?.cta1     || 'View Packages',
    cta2:     content.hero?.cta2     || 'Book a Free Survey',
  });
  const set = (k, v) => setHero(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <Panel title="Hero Text" desc="The large headline shown in the first section of the site.">
        <Field label="Eyebrow / Badge Text">
          <Input value={hero.badge} onChange={e => set('badge', e.target.value)} placeholder="EST. 2017 · INTERNET & SECURITY" />
        </Field>
        <Grid3>
          <Field label="Headline Line 1">
            <Input value={hero.title1} onChange={e => set('title1', e.target.value)} placeholder="Internet &" />
          </Field>
          <Field label="Headline Line 2 (gold italic)">
            <Input value={hero.title2} onChange={e => set('title2', e.target.value)} placeholder="cameras," />
          </Field>
          <Field label="Headline Line 3">
            <Input value={hero.title3} onChange={e => set('title3', e.target.value)} placeholder="installed properly." />
          </Field>
        </Grid3>
        <Field label="Subtitle / Description">
          <TextArea rows={3} value={hero.subtitle} onChange={e => set('subtitle', e.target.value)}
            placeholder="We build quiet, reliable networks…" />
        </Field>
        <Grid2>
          <Field label="Primary CTA Label">
            <Input value={hero.cta1} onChange={e => set('cta1', e.target.value)} placeholder="View Packages" />
          </Field>
          <Field label="Secondary CTA Label">
            <Input value={hero.cta2} onChange={e => set('cta2', e.target.value)} placeholder="Book a Free Survey" />
          </Field>
        </Grid2>
      </Panel>
      <SaveBar onSave={() => onSave({ hero })} saving={saving} />
    </div>
  );
}

/* ─── Packages Tab ────────────────────────────────────────────────── */
function PackagesTab({ content, onSave, saving }) {
  const [packages, setPackages] = useState(
    (content.packages?.length ? content.packages : DEFAULT_PACKAGES).map(p => ({ ...p, features: [...(p.features || [])] }))
  );
  const [open, setOpen] = useState(null);

  const setP  = (i, k, v) => setPackages(prev => prev.map((p, j) => j === i ? { ...p, [k]: v } : p));
  const setF  = (i, fi, v) => setP(i, 'features', packages[i].features.map((f, j) => j === fi ? v : f));
  const addF  = (i) => setP(i, 'features', [...packages[i].features, '']);
  const delF  = (i, fi) => setP(i, 'features', packages[i].features.filter((_, j) => j !== fi));
  const move  = (i, dir) => {
    const arr = [...packages]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setPackages(arr); setOpen(j);
  };
  const del   = (i) => { setPackages(p => p.filter((_, j) => j !== i)); setOpen(null); };
  const add   = () => {
    setPackages(p => [...p, { tier:'New Tier', name:'New Package', speed:'', price:'0', routerName:'', features:[], popular:false }]);
    setOpen(packages.length);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={add} className="px-4 py-2 bg-primary text-background font-mono text-[10px] tracking-[0.2em] uppercase rounded-sm hover:bg-primary/90 transition-colors">
          + Add Package
        </button>
      </div>

      {packages.map((p, i) => (
        <div key={i} className="bg-card border border-border rounded-sm overflow-hidden">
          {/* Row header */}
          <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-secondary/40 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}>
            <div className="flex-1 min-w-0">
              <span className="font-mono font-semibold text-sm text-foreground">{p.name || 'Unnamed'}</span>
              <span className="font-mono text-[10px] text-muted-foreground ml-3">{p.speed} Mbps · ${p.price}/mo</span>
              {p.popular && <span className="ml-2 font-mono text-[9px] bg-primary text-background px-2 py-0.5 rounded-sm tracking-wider uppercase">Popular</span>}
            </div>
            <div className="flex items-center gap-1">
              <IconBtn onClick={e => { e.stopPropagation(); move(i,-1); }} disabled={i===0}>↑</IconBtn>
              <IconBtn onClick={e => { e.stopPropagation(); move(i,1);  }} disabled={i===packages.length-1}>↓</IconBtn>
              <IconBtn danger onClick={e => { e.stopPropagation(); del(i); }}>✕</IconBtn>
              <span className="font-mono text-[10px] text-muted-foreground ml-1">{open===i?'▲':'▼'}</span>
            </div>
          </div>

          {open === i && (
            <div className="px-4 pb-5 pt-3 border-t border-border bg-background/40 space-y-4">
              <Grid3>
                <Field label="Package Name">
                  <Input value={p.name} onChange={e => setP(i,'name',e.target.value)} placeholder="Fiber 100" />
                </Field>
                <Field label="Tier Label">
                  <Input value={p.tier} onChange={e => setP(i,'tier',e.target.value)} placeholder="Home Plus" />
                </Field>
                <Field label="Speed (Mbps)">
                  <Input value={p.speed} onChange={e => setP(i,'speed',e.target.value)} placeholder="100" />
                </Field>
              </Grid3>
              <Grid2>
                <Field label="Monthly Price ($)">
                  <Input value={p.price} onChange={e => setP(i,'price',e.target.value)} placeholder="49" />
                </Field>
                <Field label="Included Router Name">
                  <Input value={p.routerName} onChange={e => setP(i,'routerName',e.target.value)} placeholder="Wi-Fi 6 Tri-Band" />
                </Field>
              </Grid2>
              <Field label="Mark as Popular">
                <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5" checked={!!p.popular} onChange={e => setP(i,'popular',e.target.checked)} />
                  <span className="font-mono text-xs text-muted-foreground">Show "Most Popular" badge</span>
                </label>
              </Field>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[9px] tracking-[0.25em] text-muted-foreground uppercase">Features</span>
                  <button onClick={() => addF(i)} className="font-mono text-[10px] text-primary hover:underline tracking-wider">+ Add feature</button>
                </div>
                <div className="space-y-1.5">
                  {p.features.map((f, fi) => (
                    <div key={fi} className="flex gap-2">
                      <Input value={f} onChange={e => setF(i,fi,e.target.value)} placeholder="Feature description" />
                      <button onClick={() => delF(i,fi)} className="text-red-400 hover:text-red-300 px-2 text-sm flex-shrink-0">✕</button>
                    </div>
                  ))}
                  {p.features.length === 0 && <p className="font-mono text-[11px] text-muted-foreground">No features yet — add one above</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <SaveBar onSave={() => onSave({ packages })} saving={saving} />
    </div>
  );
}

/* ─── Cameras Tab ─────────────────────────────────────────────────── */
function CamerasTab({ content, onSave, saving }) {
  const [cameras, setCameras] = useState(
    (content.cameras?.length ? content.cameras : DEFAULT_CAMERAS).map(c => ({
      ...c,
      specs:    (c.specs    || []).map(s => ({ ...s })),
      features: [...(c.features || [])],
    }))
  );
  const [open, setOpen] = useState(null);

  const setC  = (i, k, v) => setCameras(prev => prev.map((c, j) => j === i ? { ...c, [k]: v } : c));
  const setS  = (i, si, k, v) => setC(i, 'specs', cameras[i].specs.map((s,j) => j===si ? {...s,[k]:v} : s));
  const setF  = (i, fi, v) => setC(i, 'features', cameras[i].features.map((f,j) => j===fi ? v : f));
  const addF  = (i) => setC(i, 'features', [...cameras[i].features, '']);
  const delF  = (i, fi) => setC(i, 'features', cameras[i].features.filter((_,j) => j!==fi));
  const move  = (i, dir) => {
    const arr = [...cameras]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setCameras(arr); setOpen(j);
  };
  const del   = (i) => { setCameras(c => c.filter((_,j) => j!==i)); setOpen(null); };
  const add   = () => {
    setCameras(c => [...c, { name:'New Camera', model:'', type:'', resolution:'', cable:'Cat6 PoE', connector:'RJ45',
      specs:[{label:'Sensor',value:''},{label:'IR Range',value:''},{label:'Aperture',value:''},{label:'Protocol',value:'ONVIF'}],
      features:['Night Vision','Live View'] }]);
    setOpen(cameras.length);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={add} className="px-4 py-2 bg-primary text-background font-mono text-[10px] tracking-[0.2em] uppercase rounded-sm hover:bg-primary/90 transition-colors">
          + Add Camera
        </button>
      </div>

      {cameras.map((c, i) => (
        <div key={i} className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-secondary/40 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}>
            <div className="flex-1 min-w-0">
              <span className="font-mono font-semibold text-sm text-foreground">{c.name || 'Unnamed Camera'}</span>
              <span className="font-mono text-[10px] text-muted-foreground ml-3">{c.resolution} · {c.type}</span>
            </div>
            <div className="flex items-center gap-1">
              <IconBtn onClick={e => { e.stopPropagation(); move(i,-1); }} disabled={i===0}>↑</IconBtn>
              <IconBtn onClick={e => { e.stopPropagation(); move(i,1);  }} disabled={i===cameras.length-1}>↓</IconBtn>
              <IconBtn danger onClick={e => { e.stopPropagation(); del(i); }}>✕</IconBtn>
              <span className="font-mono text-[10px] text-muted-foreground ml-1">{open===i?'▲':'▼'}</span>
            </div>
          </div>

          {open === i && (
            <div className="px-4 pb-5 pt-3 border-t border-border bg-background/40 space-y-4">
              <Grid2>
                <Field label="Camera Name">
                  <Input value={c.name} onChange={e => setC(i,'name',e.target.value)} placeholder="4K Bullet Camera" />
                </Field>
                <Field label="Model Number">
                  <Input value={c.model} onChange={e => setC(i,'model',e.target.value)} placeholder="Hikvision DS-..." />
                </Field>
              </Grid2>
              <Grid3>
                <Field label="Type">
                  <Input value={c.type} onChange={e => setC(i,'type',e.target.value)} placeholder="Bullet · Outdoor" />
                </Field>
                <Field label="Resolution">
                  <Input value={c.resolution} onChange={e => setC(i,'resolution',e.target.value)} placeholder="4K 8MP" />
                </Field>
                <Field label="Cable">
                  <Input value={c.cable} onChange={e => setC(i,'cable',e.target.value)} placeholder="Cat6 PoE" />
                </Field>
              </Grid3>
              <Field label="Connector">
                <Input value={c.connector} onChange={e => setC(i,'connector',e.target.value)} placeholder="RJ45 Shielded" />
              </Field>

              {/* Specs (4 key-value pairs) */}
              <div>
                <span className="font-mono text-[9px] tracking-[0.25em] text-muted-foreground uppercase block mb-2">Specs (4 rows)</span>
                <div className="space-y-1.5">
                  {(c.specs || []).map((s, si) => (
                    <div key={si} className="grid grid-cols-2 gap-2">
                      <Input value={s.label} onChange={e => setS(i,si,'label',e.target.value)} placeholder={`Spec ${si+1} label`} />
                      <Input value={s.value} onChange={e => setS(i,si,'value',e.target.value)} placeholder={`Spec ${si+1} value`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[9px] tracking-[0.25em] text-muted-foreground uppercase">Feature Badges</span>
                  <button onClick={() => addF(i)} className="font-mono text-[10px] text-primary hover:underline tracking-wider">+ Add</button>
                </div>
                <div className="space-y-1.5">
                  {c.features.map((f, fi) => (
                    <div key={fi} className="flex gap-2">
                      <Input value={f} onChange={e => setF(i,fi,e.target.value)} placeholder="e.g. Night Vision" />
                      <button onClick={() => delF(i,fi)} className="text-red-400 hover:text-red-300 px-2 text-sm flex-shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <SaveBar onSave={() => onSave({ cameras })} saving={saving} />
    </div>
  );
}

/* ─── Media Tab ───────────────────────────────────────────────────── */
function MediaTab({ content, setContent }) {
  const [media,      setMedia]     = useState(content.media || []);
  const [ytUrl,      setYtUrl]     = useState('');
  const [ytTitle,    setYtTitle]   = useState('');
  const [ytDesc,     setYtDesc]    = useState('');
  const [addingYt,   setAddingYt]  = useState(false);
  const [uploading,  setUploading] = useState(false);
  const [ytOpen,     setYtOpen]    = useState(false);
  const [editId,     setEditId]    = useState(null);
  const [editTitle,  setEditTitle] = useState('');
  const [editDesc,   setEditDesc]  = useState('');
  const [savingEdit, setSavingEdit]= useState(false);
  const [err,        setErr]       = useState('');
  const fileRef = useRef(null);

  const refresh = (newMedia) => {
    setMedia(newMedia);
    setContent(prev => ({ ...prev, media: newMedia }));
  };

  const addYouTube = async () => {
    if (!ytUrl.trim()) return;
    setAddingYt(true); setErr('');
    try {
      const { data } = await api.post('/api/landing/media/youtube', { url:ytUrl, title:ytTitle, description:ytDesc });
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
      const { data } = await api.post('/api/landing/media/photo', form, { headers:{'Content-Type':'multipart/form-data'} });
      refresh(data.media);
    } catch (e) { setErr(e.response?.data?.error || e.message); }
    finally { setUploading(false); }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Remove this item?')) return;
    try { const { data } = await api.delete(`/api/landing/media/${id}`); refresh(data.media); }
    catch (e) { alert(e.message); }
  };

  const move = async (i, dir) => {
    const arr = [...media]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setMedia(arr);
    try { const { data } = await api.patch('/api/landing/media/reorder', { ids: arr.map(m => m._id) }); refresh(data.media); }
    catch (_) {}
  };

  const startEdit = (item) => { setEditId(item._id); setEditTitle(item.title||''); setEditDesc(item.description||''); };
  const saveEdit  = async () => {
    setSavingEdit(true);
    try { const { data } = await api.patch(`/api/landing/media/${editId}`, { title:editTitle, description:editDesc }); refresh(data.media); setEditId(null); }
    catch (e) { alert(e.message); }
    finally { setSavingEdit(false); }
  };

  const ytId = (() => {
    const m = ytUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/);
    return m ? m[1] : null;
  })();

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setYtOpen(v => !v)}
          className="px-4 py-2 bg-primary text-background font-mono text-[10px] tracking-[0.2em] uppercase rounded-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
          ▶ Add YouTube Video
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="px-4 py-2 border border-border text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase rounded-sm hover:border-primary hover:text-primary transition-all duration-200 flex items-center gap-2">
          {uploading ? <><span className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin"/>Uploading…</> : '📷 Upload Photo'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { if (e.target.files[0]) uploadPhoto(e.target.files[0]); e.target.value=''; }} />
      </div>

      {err && <div className="font-mono text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-sm">{err}</div>}

      {/* YouTube panel */}
      {ytOpen && (
        <div className="bg-card border border-border rounded-sm p-5 space-y-3">
          <div className="font-mono text-[10px] tracking-[0.25em] text-primary uppercase">Add YouTube Video</div>
          <Field label="YouTube URL">
            <Input value={ytUrl} onChange={e => setYtUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
          </Field>
          <Grid2>
            <Field label="Title (optional)">
              <Input value={ytTitle} onChange={e => setYtTitle(e.target.value)} placeholder="Video title" />
            </Field>
            <Field label="Description (optional)">
              <Input value={ytDesc} onChange={e => setYtDesc(e.target.value)} placeholder="Short description" />
            </Field>
          </Grid2>
          {ytUrl && (
            ytId
              ? <div className="flex items-center gap-3">
                  <img src={`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`} alt="thumb"
                    className="w-28 h-16 object-cover rounded-sm border border-border"
                    onError={e => { e.currentTarget.src=`https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`; }} />
                  <span className="font-mono text-[10px] text-primary">✓ Valid YouTube URL</span>
                </div>
              : <span className="font-mono text-[10px] text-red-400">⚠ Could not detect YouTube ID</span>
          )}
          <div className="flex gap-2">
            <button onClick={addYouTube} disabled={addingYt || !ytUrl}
              className="px-4 py-2 bg-primary text-background font-mono text-[10px] tracking-[0.2em] uppercase rounded-sm hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {addingYt ? <><span className="w-3 h-3 border border-background/30 border-t-background rounded-full animate-spin"/>Adding…</> : 'Add to Website'}
            </button>
            <button onClick={() => setYtOpen(false)}
              className="px-4 py-2 border border-border text-muted-foreground font-mono text-[10px] uppercase rounded-sm hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Media grid */}
      {media.length === 0 ? (
        <div className="bg-card border border-border rounded-sm p-12 text-center">
          <div className="text-3xl mb-3 opacity-30">▶</div>
          <div className="font-mono text-[11px] text-muted-foreground tracking-wider">
            No media added yet.<br/>
            <span className="text-[10px] opacity-60">The media section won't appear on the website until you add items.</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {media.map((item, i) => (
            <div key={item._id} className="bg-card border border-border rounded-sm overflow-hidden">
              <div className="relative">
                {item.type === 'youtube' ? (
                  <img src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`} alt={item.title||'YouTube'}
                    className="w-full h-40 object-cover" style={{filter:'brightness(.7)'}}
                    onError={e => { e.currentTarget.src=`https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`; }} />
                ) : (
                  <img src={`${BACKEND}${item.url}`} alt={item.title||'Photo'}
                    className="w-full h-40 object-cover" style={{filter:'brightness(.7)'}} />
                )}
                <span className={`absolute top-2 left-2 font-mono text-[9px] tracking-wider px-2 py-0.5 rounded-sm uppercase ${
                  item.type === 'youtube' ? 'bg-red-600 text-white' : 'bg-primary text-background'
                }`}>{item.type === 'youtube' ? '▶ YouTube' : '📷 Photo'}</span>
                <span className="absolute top-2 right-2 font-mono text-[9px] bg-black/60 text-foreground/70 px-2 py-0.5 rounded-sm">#{i+1}</span>
              </div>

              <div className="p-3">
                {editId === item._id ? (
                  <div className="space-y-2">
                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" />
                    <Input value={editDesc}  onChange={e => setEditDesc(e.target.value)}  placeholder="Description" />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} disabled={savingEdit}
                        className="px-3 py-1.5 bg-primary text-background font-mono text-[9px] tracking-wider uppercase rounded-sm disabled:opacity-50">
                        {savingEdit ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="px-3 py-1.5 border border-border text-muted-foreground font-mono text-[9px] uppercase rounded-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="font-mono text-xs text-foreground truncate">{item.title || <span className="text-muted-foreground italic">No title</span>}</div>
                    {item.description && <div className="font-mono text-[10px] text-muted-foreground truncate mt-0.5">{item.description}</div>}
                  </>
                )}
              </div>

              {editId !== item._id && (
                <div className="px-3 pb-3 flex items-center justify-between">
                  <div className="flex gap-1">
                    <IconBtn onClick={() => move(i,-1)} disabled={i===0}>↑</IconBtn>
                    <IconBtn onClick={() => move(i,1)}  disabled={i===media.length-1}>↓</IconBtn>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(item)} className="font-mono text-[10px] text-primary border border-primary/30 px-2 py-1 rounded-sm hover:bg-primary/10">Edit</button>
                    <button onClick={() => deleteItem(item._id)} className="font-mono text-[10px] text-red-400 border border-red-400/30 px-2 py-1 rounded-sm hover:bg-red-400/10">Remove</button>
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

/* ─── Contact Tab ─────────────────────────────────────────────────── */
function ContactTab({ content, onSave, saving }) {
  const [contact, setContact] = useState({ phone:'', email:'', address:'', hours:'', ...(content.contact||{}) });
  const set = (k, v) => setContact(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <Panel title="Contact Information" desc="Shown in the contact section. Leave blank to hide a field.">
        <Grid2>
          <Field label="Phone">
            <Input value={contact.phone}   onChange={e => set('phone',   e.target.value)} placeholder="+961 79 381 887" />
          </Field>
          <Field label="Email">
            <Input value={contact.email}   onChange={e => set('email',   e.target.value)} placeholder="info@auranet.lb" />
          </Field>
          <Field label="Address">
            <Input value={contact.address} onChange={e => set('address', e.target.value)} placeholder="Beirut, Lebanon" />
          </Field>
          <Field label="Support Hours">
            <Input value={contact.hours}   onChange={e => set('hours',   e.target.value)} placeholder="24/7 · 365 Days" />
          </Field>
        </Grid2>
      </Panel>
      <SaveBar onSave={() => onSave({ contact })} saving={saving} />
    </div>
  );
}

/* ─── Sections Tab ────────────────────────────────────────────────── */
function SectionsTab({ content, onSave, saving }) {
  const [titles, setTitles] = useState({
    packages:'', cameras:'', hardware:'', contact:'', media:'',
    ...(content.sectionTitles||{}),
  });
  const set = (k, v) => setTitles(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <Panel title="Section Headings" desc="The headline displayed at the top of each section.">
        <Field label="Internet Packages Section">
          <Input value={titles.packages} onChange={e => set('packages', e.target.value)} placeholder="Choose Your Bandwidth" />
        </Field>
        <Field label="Cameras Section">
          <Input value={titles.cameras} onChange={e => set('cameras', e.target.value)} placeholder="The Sentinel View" />
        </Field>
        <Field label="Hardware Section">
          <Input value={titles.hardware} onChange={e => set('hardware', e.target.value)} placeholder="The Hard Iron" />
        </Field>
        <Field label="Contact Section">
          <Input value={titles.contact} onChange={e => set('contact', e.target.value)} placeholder="Start Your Deployment" />
        </Field>
        <Field label="Media Gallery Section">
          <Input value={titles.media} onChange={e => set('media', e.target.value)} placeholder="Our Network in Action" />
        </Field>
      </Panel>
      <SaveBar onSave={() => onSave({ sectionTitles: titles })} saving={saving} />
    </div>
  );
}

/* ─── Shared UI Primitives ────────────────────────────────────────── */
function Panel({ title, desc, action, children }) {
  return (
    <div className="bg-card border border-border rounded-sm p-5">
      <div className="flex items-start justify-between mb-1 gap-3">
        <div>
          <div className="font-serif text-lg font-normal text-foreground">{title}</div>
          {desc && <div className="font-mono text-[10px] text-muted-foreground mt-1 tracking-wider">{desc}</div>}
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
      <label className="block font-mono text-[9px] tracking-[0.25em] text-muted-foreground uppercase mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full h-10 bg-background border border-border rounded-sm px-3 font-mono text-xs text-foreground placeholder-muted-foreground/30 outline-none focus:border-primary transition-colors"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-background border border-border rounded-sm px-3 py-2.5 font-mono text-xs text-foreground placeholder-muted-foreground/30 outline-none focus:border-primary transition-colors resize-none"
    />
  );
}

function Grid2({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}
function Grid3({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{children}</div>;
}

function IconBtn({ onClick, disabled, danger, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-7 h-7 flex items-center justify-center rounded-sm border text-xs transition-colors disabled:opacity-30 ${
        danger
          ? 'border-red-400/30 text-red-400 hover:bg-red-400/10'
          : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function SaveBar({ onSave, saving }) {
  return (
    <div className="flex items-center gap-4 pt-1">
      <button onClick={onSave} disabled={saving}
        className="px-6 py-2.5 bg-primary text-background font-mono font-semibold text-[10px] tracking-[0.25em] uppercase rounded-sm hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-colors">
        {saving
          ? <><span className="w-3 h-3 border border-background/30 border-t-background rounded-full animate-spin"/>Saving…</>
          : 'Save Changes'}
      </button>
      <span className="font-mono text-[10px] text-muted-foreground tracking-wider">Changes go live immediately</span>
    </div>
  );
}

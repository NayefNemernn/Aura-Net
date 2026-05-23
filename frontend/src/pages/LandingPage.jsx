import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/* ─────────────────────────────────────────────────────────────────────
   Scroll-reveal hook
───────────────────────────────────────────────────────────────────── */
function useReveal(threshold = 0.18) {
  const ref  = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─────────────────────────────────────────────────────────────────────
   Global CSS for dark-theme landing page
───────────────────────────────────────────────────────────────────── */
const CSS = `
  .ld { background:#060b18; color:#e8edf5; font-family:"Segoe UI",system-ui,sans-serif; overflow-x:hidden; }
  .ld * { box-sizing:border-box; }
  .ld a { text-decoration:none; color:inherit; }

  @keyframes led-pulse  { 0%,100%{opacity:.4} 50%{opacity:1} }
  @keyframes led-blink  { 0%,88%,100%{opacity:1} 93%{opacity:.1} }
  @keyframes rtr-halo   { 0%,100%{opacity:.35} 50%{opacity:.75} }
  @keyframes float-dot  { 0%{transform:translateY(0) translateX(0);opacity:0}
                          8%{opacity:.9} 90%{opacity:.9}
                          100%{transform:translateY(-180px) translateX(18px);opacity:0} }
  @keyframes fade-up    { from{transform:translateY(44px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes slide-r    { from{transform:translateX(90px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes slide-l    { from{transform:translateX(-90px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes cable-in   { from{transform:translateX(-62%)} to{transform:translateX(0)} }
  @keyframes port-light { 0%,100%{fill:#051224} 50%{fill:#00d4ff} }
  @keyframes data-flow  { 0%{stroke-dashoffset:900} 100%{stroke-dashoffset:0} }
  @keyframes spark      { 0%{opacity:0;r:0} 40%{opacity:1;r:8} 100%{opacity:0;r:14} }
  @keyframes hero-bg    { 0%{background-position:0 0} 100%{background-position:60px 60px} }
  @keyframes glow-ring  { 0%,100%{opacity:.18} 50%{opacity:.45} }

  .reveal        { opacity:0; transition:opacity .7s ease, transform .7s ease; }
  .reveal.show   { opacity:1; transform:none !important; }
  .from-right    { transform:translateX(80px); }
  .from-left     { transform:translateX(-80px); }
  .from-bottom   { transform:translateY(50px); }

  .plan-card {
    background:#0d1829; border:1px solid rgba(0,212,255,.18);
    border-radius:14px; padding:28px 24px; transition:all .3s;
    position:relative; overflow:hidden; cursor:default;
  }
  .plan-card::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg,rgba(0,212,255,.04),transparent);
    opacity:0; transition:opacity .3s;
  }
  .plan-card:hover { border-color:rgba(0,212,255,.7); transform:translateY(-5px);
    box-shadow:0 0 32px rgba(0,212,255,.22); }
  .plan-card:hover::after { opacity:1; }
  .plan-card.hot { border-color:rgba(0,212,255,.55); box-shadow:0 0 22px rgba(0,212,255,.18); }

  .ld-input {
    background:rgba(255,255,255,.04); border:1px solid rgba(0,212,255,.22);
    border-radius:8px; padding:13px 16px; color:#e8edf5; font-size:14px;
    outline:none; width:100%; transition:border-color .2s, box-shadow .2s;
    font-family:inherit;
  }
  .ld-input::placeholder { color:rgba(232,237,245,.3); }
  .ld-input:focus { border-color:#00d4ff; box-shadow:0 0 0 3px rgba(0,212,255,.12); }
  textarea.ld-input { resize:vertical; min-height:110px; }

  .cta-primary {
    background:linear-gradient(135deg,#0055cc,#00d4ff); color:#fff;
    font-weight:700; padding:14px 34px; border-radius:9px; border:none;
    cursor:pointer; font-size:15px; font-family:inherit;
    transition:all .3s; box-shadow:0 4px 22px rgba(0,96,255,.38);
  }
  .cta-primary:hover { transform:translateY(-3px); box-shadow:0 8px 32px rgba(0,96,255,.55); }

  .cta-outline {
    background:transparent; border:1.5px solid #00d4ff; color:#00d4ff;
    padding:12px 30px; border-radius:9px; cursor:pointer; font-size:15px;
    font-weight:600; font-family:inherit; transition:all .3s;
  }
  .cta-outline:hover { background:rgba(0,212,255,.1); box-shadow:0 0 22px rgba(0,212,255,.3); }

  .send-btn {
    background:linear-gradient(135deg,#0055cc,#00d4ff); color:#fff;
    font-weight:700; padding:14px; border-radius:9px; border:none;
    cursor:pointer; font-size:15px; font-family:inherit;
    width:100%; transition:all .3s;
  }
  .send-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 22px rgba(0,96,255,.5); }
  .send-btn:disabled { opacity:.55; cursor:not-allowed; }

  .nav-lnk { color:rgba(232,237,245,.65); font-size:14px; cursor:pointer;
    transition:color .2s; background:none; border:none; font-family:inherit; padding:0; }
  .nav-lnk:hover { color:#00d4ff; }

  .sect-rule { height:1px; background:linear-gradient(90deg,transparent,rgba(0,212,255,.28),transparent); }

  /* ── Responsive layout helpers ─────────────────────────── */
  .ld-hero-grid   { display:grid; grid-template-columns:1fr 1fr; gap:60px; width:100%; max-width:1280px; margin:0 auto; align-items:center; }
  .ld-router-grid { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; }
  .ld-hero-svg    { display:flex; justify-content:center; align-items:center; }
  .ld-h1          { font-size:52px; font-weight:800; line-height:1.12; margin:0 0 20px; }
  .ld-h2          { font-size:34px; font-weight:800; line-height:1.2; margin:0 0 14px; }
  .ld-offers-row  { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:36px; }
  .ld-cta-row     { display:flex; gap:14px; }
  .ld-form-row    { display:flex; gap:12px; margin-bottom:14px; }
  .ld-cables-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .ld-nav-links   { display:flex; gap:32px; align-items:center; }
  .ld-hamburger   { display:none; flex-direction:column; gap:5px; cursor:pointer;
    background:none; border:none; padding:4px; }
  .ld-hamburger span { display:block; width:22px; height:2px; background:#e8edf5;
    border-radius:2px; transition:all .3s; }
  .ld-mobile-nav  { display:none; position:absolute; top:64px; left:0; right:0;
    background:rgba(6,11,24,.97); border-bottom:1px solid rgba(0,212,255,.15);
    padding:12px 5%; flex-direction:column; gap:2px; z-index:99; }
  .ld-mobile-nav.open { display:flex; }
  .ld-mobile-nav button { text-align:left; font-size:15px; padding:11px 0;
    border-bottom:1px solid rgba(255,255,255,.06); }
  .ld-mobile-nav button:last-child { border-bottom:none; padding-top:12px; }

  @media (max-width:900px) {
    .ld-hero-grid   { grid-template-columns:1fr; gap:32px; }
    .ld-hero-svg    { display:none; }
    .ld-router-grid { grid-template-columns:1fr; gap:32px; }
    .ld-h1          { font-size:40px; }
  }
  @media (max-width:640px) {
    .ld-h1          { font-size:30px; }
    .ld-h2          { font-size:24px; }
    .ld-cta-row     { flex-direction:column; }
    .ld-form-row    { flex-direction:column; }
    .ld-nav-links   { display:none; }
    .ld-hamburger   { display:flex; }
    .ld-cable-area  { transform:scale(.72); transform-origin:center; margin:-16px 0; }
    .ld-form-box    { padding:24px 18px !important; }
  }
`;

/* ─────────────────────────────────────────────────────────────────────
   Main landing page
───────────────────────────────────────────────────────────────────── */
// Default content used as fallback before API loads
const DEFAULT = {
  hero: {
    badge:'Fiber-Optic Network Provider', title1:'Blazing Fast', title2:'Fiber Internet', title3:'For Everyone',
    subtitle:'Experience the power of pure fiber optics — ultra-low latency, symmetric speeds, and 99.9% uptime backed by 24/7 local support.',
    cta1:'View All Plans', cta2:'Client Login',
  },
  offers: [
    { speed:'50 Mbps',  price:'$29', tag:'Starter',      color:'#00d4ff' },
    { speed:'100 Mbps', price:'$49', tag:'Most Popular',  color:'#0060ff' },
    { speed:'1 Gbps',   price:'$89', tag:'Business',      color:'#7c3aed' },
  ],
  plans: [
    { name:'Starter',     speed:'50 Mbps',  price:29,  color:'#0070ff', features:['Unlimited data','2 devices','Email support'] },
    { name:'Home Plus',   speed:'100 Mbps', price:49,  color:'#00d4ff', hot:true, features:['Unlimited data','6 devices','24/7 support'] },
    { name:'Business',    speed:'500 Mbps', price:89,  color:'#a855f7', features:['Unlimited data','20 devices','Priority support','Static IP'] },
    { name:'Gigabit Pro', speed:'1 Gbps',   price:149, color:'#ff8c00', features:['Unlimited data','Unlimited devices','Dedicated support','2× Static IPs','SLA 99.9%'] },
  ],
  contact: { phone:'', email:'', address:'', hours:'' },
  sectionTitles: { plans:'Choose Your Speed', router:'Enterprise-Grade Routing Core', cables:'Direct Ethernet Infrastructure', media:'Our Network in Action' },
  media: [],
};

export default function LandingPage() {
  const nav = useNavigate();
  const [content, setContent] = useState(DEFAULT);
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    api.get('/api/landing').then(({ data }) => {
      // Merge with defaults so missing fields don't break anything
      setContent(prev => ({ ...prev, ...data.content }));
    }).catch(() => {}); // silently fall back to defaults
  }, []);

  return (
    <div className="ld">
      <style>{CSS}</style>
      <FloatingParticles />
      <NavBar onNav={scrollTo} onLogin={() => nav('/login')} />
      <HeroSection content={content} onNav={scrollTo} onLogin={() => nav('/login')} />
      <div className="sect-rule" />
      <PlansSection content={content} />
      <div className="sect-rule" />
      <RouterScrollSection content={content} />
      <div className="sect-rule" />
      <LanCablesSection content={content} />
      {content.media?.length > 0 && (
        <>
          <div className="sect-rule" />
          <MediaSection content={content} />
        </>
      )}
      <div className="sect-rule" />
      <SignInSection onLogin={() => nav('/login')} onRegister={() => nav('/register')} />
      <div className="sect-rule" />
      <ContactSection content={content} />
      <Footer onNav={scrollTo} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Floating background particles
───────────────────────────────────────────────────────────────────── */
function FloatingParticles() {
  const dots = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top:  `${40 + Math.random() * 60}%`,
    size: 1.5 + Math.random() * 2.5,
    dur:  `${4 + Math.random() * 6}s`,
    delay:`${Math.random() * 6}s`,
    color: i % 3 === 0 ? '#00d4ff' : i % 3 === 1 ? '#0060ff' : '#00ff9d',
  }));
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
      {dots.map(d => (
        <div key={d.id} style={{
          position:'absolute', left:d.left, top:d.top,
          width:d.size, height:d.size, borderRadius:'50%',
          background:d.color, boxShadow:`0 0 6px ${d.color}`,
          animation:`float-dot ${d.dur} ${d.delay} ease-in-out infinite`,
          opacity:0,
        }} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Navbar
───────────────────────────────────────────────────────────────────── */
function NavBar({ onNav, onLogin }) {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const go = (id) => { onNav(id); setMenuOpen(false); };

  return (
    <nav style={{
      position:'sticky', top:0, zIndex:100, padding:'0 5%',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      height:64, transition:'all .3s',
      background: scrolled || menuOpen ? 'rgba(6,11,24,.97)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,212,255,.1)' : '1px solid transparent',
    }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <NetworkIcon size={28} />
        <span style={{ fontWeight:700, fontSize:18, letterSpacing:'.5px' }}>
          <span style={{ color:'#00d4ff' }}>AURA</span>
          <span style={{ color:'#e8edf5' }}> NET</span>
        </span>
      </div>

      {/* Desktop links */}
      <div className="ld-nav-links">
        <button className="nav-lnk" onClick={() => go('hero')}>Home</button>
        <button className="nav-lnk" onClick={() => go('plans')}>Plans</button>
        <button className="nav-lnk" onClick={() => go('contact')}>Contact</button>
        <button className="cta-primary" style={{ padding:'9px 22px', fontSize:13 }} onClick={onLogin}>
          Sign In
        </button>
      </div>

      {/* Hamburger — mobile only */}
      <button className="ld-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
        <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
        <span style={{ opacity: menuOpen ? 0 : 1 }} />
        <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
      </button>

      {/* Mobile dropdown */}
      <div className={`ld-mobile-nav${menuOpen ? ' open' : ''}`}>
        <button className="nav-lnk" onClick={() => go('hero')}>Home</button>
        <button className="nav-lnk" onClick={() => go('plans')}>Plans</button>
        <button className="nav-lnk" onClick={() => go('contact')}>Contact</button>
        <button className="cta-primary" style={{ marginTop:4, padding:'12px', textAlign:'center' }} onClick={() => { onLogin(); setMenuOpen(false); }}>
          Sign In
        </button>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Hero
───────────────────────────────────────────────────────────────────── */
function HeroSection({ content, onNav, onLogin }) {
  const h = content.hero;
  return (
    <section id="hero" style={{
      minHeight:'calc(100vh - 64px)', display:'flex', alignItems:'center',
      padding:'clamp(40px,6vw,60px) 5% clamp(48px,7vw,80px)',
      position:'relative', zIndex:1, overflow:'hidden',
    }}>
      <div style={{
        position:'absolute', inset:0, opacity:.045,
        backgroundImage:'linear-gradient(rgba(0,212,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,1) 1px,transparent 1px)',
        backgroundSize:'60px 60px', animation:'hero-bg 8s linear infinite', pointerEvents:'none',
      }}/>

      <div className="ld-hero-grid">
        <div>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(0,212,255,.08)', border:'1px solid rgba(0,212,255,.25)',
            borderRadius:30, padding:'6px 16px', fontSize:12, color:'#00d4ff',
            fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase',
            marginBottom:24, animation:'fade-up .7s ease both',
          }}>
            <span style={{ width:7, height:7, background:'#00d4ff', borderRadius:'50%', boxShadow:'0 0 8px #00d4ff', animation:'led-pulse 1.8s ease infinite' }} />
            {h.badge}
          </div>

          <h1 className="ld-h1" style={{ animation:'fade-up .7s .1s ease both', opacity:0 }}>
            <span style={{ color:'#e8edf5' }}>{h.title1}</span><br/>
            <span style={{ background:'linear-gradient(135deg,#00d4ff,#0060ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              {h.title2}
            </span><br/>
            <span style={{ color:'#e8edf5' }}>{h.title3}</span>
          </h1>

          <p style={{ fontSize:16, color:'rgba(232,237,245,.6)', lineHeight:1.7, margin:'0 0 32px', maxWidth:480, animation:'fade-up .7s .2s ease both', opacity:0 }}>
            {h.subtitle}
          </p>

          <div className="ld-offers-row" style={{ animation:'fade-up .7s .3s ease both', opacity:0 }}>
            {content.offers.map((o, i) => (
              <div key={i} style={{
                background:'rgba(0,212,255,.07)', border:`1px solid ${o.color}40`,
                borderRadius:10, padding:'10px 16px', cursor:'pointer', transition:'all .2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = o.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${o.color}40`}
              >
                <div style={{ fontSize:11, color:'rgba(232,237,245,.5)', letterSpacing:'.5px', textTransform:'uppercase' }}>{o.tag}</div>
                <div style={{ fontSize:18, fontWeight:700, color:o.color }}>{o.speed}</div>
                <div style={{ fontSize:13, color:'rgba(232,237,245,.7)' }}>from <b style={{ color:'#fff' }}>{o.price}</b>/mo</div>
              </div>
            ))}
          </div>

          <div className="ld-cta-row" style={{ animation:'fade-up .7s .4s ease both', opacity:0 }}>
            <button className="cta-primary" onClick={() => onNav('plans')}>{h.cta1}</button>
            <button className="cta-outline" onClick={onLogin}>{h.cta2}</button>
          </div>
        </div>

        <div className="ld-hero-svg" style={{ animation:'fade-up .9s .15s ease both', opacity:0 }}>
          <RouterFiberSvg />
        </div>
      </div>

      <div style={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6, opacity:.4 }}>
        <span style={{ fontSize:11, letterSpacing:'1.5px', textTransform:'uppercase' }}>Scroll</span>
        <div style={{ width:1, height:40, background:'linear-gradient(#00d4ff,transparent)' }} />
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Hero animated SVG — fiber cables converging into router
───────────────────────────────────────────────────────────────────── */
function RouterFiberSvg() {
  return (
    <svg viewBox="0 0 520 390" style={{ width:'100%', maxWidth:540 }} aria-hidden="true">
      <defs>
        <filter id="g1"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="g2"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="g3"><feGaussianBlur stdDeviation="12" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>

        <linearGradient id="fg1" gradientUnits="userSpaceOnUse" x1="0" y1="65" x2="285" y2="190"><stop offset="0%" stopColor="#00d4ff" stopOpacity=".05"/><stop offset="60%" stopColor="#00d4ff" stopOpacity=".75"/><stop offset="100%" stopColor="#00d4ff" stopOpacity=".15"/></linearGradient>
        <linearGradient id="fg2" gradientUnits="userSpaceOnUse" x1="0" y1="195" x2="285" y2="202"><stop offset="0%" stopColor="#0070ff" stopOpacity=".05"/><stop offset="60%" stopColor="#0070ff" stopOpacity=".8"/><stop offset="100%" stopColor="#0070ff" stopOpacity=".15"/></linearGradient>
        <linearGradient id="fg3" gradientUnits="userSpaceOnUse" x1="0" y1="320" x2="285" y2="214"><stop offset="0%" stopColor="#00ff9d" stopOpacity=".05"/><stop offset="60%" stopColor="#00ff9d" stopOpacity=".7"/><stop offset="100%" stopColor="#00ff9d" stopOpacity=".15"/></linearGradient>
        <linearGradient id="fg4" gradientUnits="userSpaceOnUse" x1="520" y1="18" x2="295" y2="182"><stop offset="0%" stopColor="#a855f7" stopOpacity=".05"/><stop offset="55%" stopColor="#a855f7" stopOpacity=".7"/><stop offset="100%" stopColor="#a855f7" stopOpacity=".15"/></linearGradient>
        <linearGradient id="fg5" gradientUnits="userSpaceOnUse" x1="520" y1="370" x2="295" y2="222"><stop offset="0%" stopColor="#ff8c00" stopOpacity=".05"/><stop offset="55%" stopColor="#ff8c00" stopOpacity=".7"/><stop offset="100%" stopColor="#ff8c00" stopOpacity=".15"/></linearGradient>

        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity=".28"/>
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Fiber paths */}
      <path id="fp1" d="M 0,65  C 90,65  185,115 285,190" fill="none" stroke="url(#fg1)" strokeWidth="2.5" strokeLinecap="round"/>
      <path id="fp2" d="M 0,195 C 95,195 190,198 285,202" fill="none" stroke="url(#fg2)" strokeWidth="2.5" strokeLinecap="round"/>
      <path id="fp3" d="M 0,320 C 90,300 180,258 285,214" fill="none" stroke="url(#fg3)" strokeWidth="2.5" strokeLinecap="round"/>
      <path id="fp4" d="M 520,18  C 440,70  370,135 295,182" fill="none" stroke="url(#fg4)" strokeWidth="2.5" strokeLinecap="round"/>
      <path id="fp5" d="M 520,370 C 445,332 375,280 295,222" fill="none" stroke="url(#fg5)" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Router halo glow */}
      <ellipse cx="338" cy="202" rx="90" ry="58" fill="url(#halo)" style={{ animation:'rtr-halo 3.2s ease-in-out infinite' }}/>

      {/* Router — 3-face pseudo-3D */}
      {/* Top face */}
      <polygon points="287,148 477,148 492,165 302,165" fill="#0d1f3c" stroke="#1a4080" strokeWidth=".8"/>
      {/* Front face */}
      <rect x="287" y="165" width="190" height="78" rx="3" fill="#0a1628" stroke="#00d4ff" strokeWidth="1.6"/>
      {/* Right face */}
      <polygon points="477,148 492,165 492,243 477,243" fill="#071020" stroke="#1a4080" strokeWidth=".8"/>

      {/* Antennas */}
      {[[314,165,314,126,312,122],[362,165,362,120,360,116],[440,165,440,132,438,128]].map(([x1,y1,x2,y2,cx,cy],i) => (
        <g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1a3a6a" strokeWidth="3" strokeLinecap="round"/>
          <circle cx={cx} cy={cy} r="4" fill="#00d4ff" filter="url(#g1)" style={{ animation:`led-pulse ${1.8+i*.4}s ease infinite ${i*.3}s` }}/>
        </g>
      ))}

      {/* LEDs row */}
      {[
        [305,185,'#00ff6a',2],
        [321,185,'#00d4ff',3],
        [337,185,'#ff8c00',2.5],
        [353,185,'#00d4ff',4],
        [369,185,'#00ff6a',1.8],
      ].map(([cx,cy,c,dur],i) => (
        <circle key={i} cx={cx} cy={cy} r="4.5" fill={c} filter="url(#g1)"
          style={{ animation:`led-${i%2===0?'pulse':'blink'} ${dur}s ease infinite ${i*.35}s` }}/>
      ))}

      {/* Brand text */}
      <text x="430" y="200" fill="#1e4070" fontSize="8.5" textAnchor="middle"
        fontFamily="monospace" letterSpacing="2.5">AURA·NET</text>

      {/* Ethernet ports */}
      {[295,318,341,364,387].map((x,i) => (
        <g key={i}>
          <rect x={x} y="210" width="18" height="11" rx="2" fill="#050e1c"
            stroke={i===3?'#00d4ff':'#0050a0'} strokeWidth={i===3?1.2:.8}/>
          <line x1={x+4} y1="214" x2={x+14} y2="214" stroke="#0a2040" strokeWidth="1.2"/>
        </g>
      ))}

      {/* Outgoing cables from right side — short stubs */}
      {[175,192,209,226].map((y,i) => (
        <line key={i} x1="477" y1={y} x2="520" y2={y}
          stroke={['#00d4ff','#0060ff','#00ff9d','#ff8c00'][i]}
          strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 4" opacity=".5"/>
      ))}

      {/* Animated particles — fp1 cyan */}
      {[0,1.3].map((d,i) => <circle key={i} r={i===0?4:3} fill="#00d4ff" filter="url(#g1)" opacity={i===0?1:.65}><animateMotion dur="2.6s" repeatCount="indefinite" begin={`${d}s`}><mpath href="#fp1"/></animateMotion></circle>)}
      {/* fp2 blue */}
      {[.5,1.9].map((d,i) => <circle key={i} r={i===0?4:3} fill="#0070ff" filter="url(#g1)" opacity={i===0?1:.65}><animateMotion dur="3s" repeatCount="indefinite" begin={`${d}s`}><mpath href="#fp2"/></animateMotion></circle>)}
      {/* fp3 green */}
      {[.8,2.2].map((d,i) => <circle key={i} r={i===0?4:3} fill="#00ff9d" filter="url(#g1)" opacity={i===0?1:.65}><animateMotion dur="2.8s" repeatCount="indefinite" begin={`${d}s`}><mpath href="#fp3"/></animateMotion></circle>)}
      {/* fp4 purple */}
      <circle r="4" fill="#a855f7" filter="url(#g1)"><animateMotion dur="2.4s" repeatCount="indefinite" begin=".3s"><mpath href="#fp4"/></animateMotion></circle>
      {/* fp5 orange */}
      <circle r="4" fill="#ff8c00" filter="url(#g1)"><animateMotion dur="2.9s" repeatCount="indefinite" begin="1.1s"><mpath href="#fp5"/></animateMotion></circle>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Plans section
───────────────────────────────────────────────────────────────────── */
const PLANS = [
  { name:'Starter',     speed:'50 Mbps',   price:29,  color:'#0070ff', features:['Unlimited data','2 devices','Email support'] },
  { name:'Home Plus',   speed:'100 Mbps',  price:49,  color:'#00d4ff', features:['Unlimited data','6 devices','24/7 support'], hot:true },
  { name:'Business',    speed:'500 Mbps',  price:89,  color:'#a855f7', features:['Unlimited data','20 devices','Priority support','Static IP'] },
  { name:'Gigabit Pro', speed:'1 Gbps',    price:149, color:'#ff8c00', features:['Unlimited data','Unlimited devices','Dedicated support','2× Static IPs','SLA 99.9%'] },
];

function PlansSection({ content }) {
  const [ref, visible] = useReveal();
  return (
    <section id="plans" ref={ref} style={{ padding:'clamp(48px,8vw,90px) 5%', position:'relative', zIndex:1 }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>
        <SectionHeader
          badge="Internet Plans"
          title={content.sectionTitles?.plans || 'Choose Your Speed'}
          sub="All plans include fiber-optic connection, free installation, and no hidden fees."
          visible={visible}
        />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:20, marginTop:48 }}>
          {content.plans.map((p, i) => (
            <div key={p.name} className={`plan-card${p.hot?' hot':''}`}
              style={{ animationDelay:`${i*.1}s`, opacity: visible ? 1 : 0,
                animation: visible ? `fade-up .6s ${i*.12}s ease both` : 'none' }}>
              {p.hot && (
                <div style={{ position:'absolute', top:14, right:14, background:'linear-gradient(135deg,#0055cc,#00d4ff)',
                  color:'#fff', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, letterSpacing:'.8px' }}>
                  POPULAR
                </div>
              )}
              <div style={{ fontSize:13, color:p.color, fontWeight:600, letterSpacing:'.5px', textTransform:'uppercase', marginBottom:8 }}>{p.name}</div>
              <div style={{ fontSize:36, fontWeight:800, color:p.color, lineHeight:1, marginBottom:4 }}>{p.speed}</div>
              <div style={{ fontSize:13, color:'rgba(232,237,245,.5)', marginBottom:20 }}>Fiber Optic</div>
              <div style={{ fontSize:34, fontWeight:700, color:'#e8edf5', marginBottom:4 }}>
                ${p.price}<span style={{ fontSize:14, fontWeight:400, color:'rgba(232,237,245,.5)' }}>/mo</span>
              </div>
              <div style={{ height:1, background:'rgba(0,212,255,.12)', margin:'18px 0' }}/>
              <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:8 }}>
                {p.features.map(f => (
                  <li key={f} style={{ fontSize:13, color:'rgba(232,237,245,.7)', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ color:p.color, fontSize:10 }}>◆</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Router side-view scroll section
───────────────────────────────────────────────────────────────────── */
function RouterScrollSection({ content }) {
  const [ref, visible] = useReveal(0.15);
  return (
    <section style={{ padding:'clamp(48px,8vw,90px) 5%', position:'relative', zIndex:1, overflow:'hidden' }}>
      <div ref={ref} className="ld-router-grid" style={{ maxWidth:1280, margin:'0 auto' }}>

        <div className={`reveal from-left${visible?' show':''}`}>
          <SectionHeader
            badge="Infrastructure"
            title={content.sectionTitles?.router || 'Enterprise-Grade Routing Core'}
            sub="Every client is served through carrier-grade routers with full redundancy, live monitoring, and intelligent traffic management."
            visible={visible}
            align="left"
          />
          <div style={{ display:'flex', flexDirection:'column', gap:14, marginTop:32 }}>
            {[
              ['⚡','Sub-5ms latency','Hardware-accelerated packet forwarding'],
              ['🔒','Always encrypted','WPA3 + TLS 1.3 across the entire backbone'],
              ['♾️','Unlimited bandwidth','No throttling, no fair-use caps'],
            ].map(([icon,title,desc]) => (
              <div key={title} style={{ display:'flex', gap:14, alignItems:'flex-start',
                background:'rgba(0,212,255,.04)', border:'1px solid rgba(0,212,255,.1)',
                borderRadius:10, padding:'14px 16px' }}>
                <span style={{ fontSize:22 }}>{icon}</span>
                <div>
                  <div style={{ fontWeight:600, fontSize:14, color:'#e8edf5', marginBottom:3 }}>{title}</div>
                  <div style={{ fontSize:13, color:'rgba(232,237,245,.5)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Router side-view SVG */}
        <div className={`reveal from-right${visible?' show':''}`} style={{ display:'flex', justifyContent:'center' }}>
          <RouterSideViewSvg />
        </div>
      </div>
    </section>
  );
}

function RouterSideViewSvg() {
  return (
    <svg viewBox="0 0 560 280" style={{ width:'100%', maxWidth:520 }} aria-hidden="true">
      <defs>
        <filter id="sg1"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="body-g" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0d2040"/><stop offset="100%" stopColor="#060d1a"/>
        </linearGradient>
        <linearGradient id="data-g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0"/><stop offset="50%" stopColor="#00d4ff"/><stop offset="100%" stopColor="#00d4ff" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="wan-g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff8c00" stopOpacity="0"/><stop offset="50%" stopColor="#ff8c00"/><stop offset="100%" stopColor="#ff8c00" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* WAN cable from left */}
      <path d="M 10,140 C 60,140 80,140 110,140" stroke="#ff8c00" strokeWidth="6" strokeLinecap="round" fill="none" opacity=".7"/>
      <path d="M 10,140 C 60,140 80,140 110,140" stroke="url(#wan-g)" strokeWidth="6" strokeLinecap="round" fill="none" strokeDasharray="400" strokeDashoffset="400" style={{ animation:'data-flow 2.2s linear infinite' }}/>
      {/* WAN label */}
      <text x="12" y="132" fill="#ff8c00" fontSize="9" fontFamily="monospace" opacity=".8">WAN / FIBER</text>

      {/* Router body — side profile (longer/thinner) */}
      <rect x="110" y="95" width="310" height="90" rx="6" fill="url(#body-g)" stroke="#00d4ff" strokeWidth="1.8"/>
      {/* Vents top */}
      {Array.from({length:14},(_,i) => (
        <line key={i} x1={125+i*19} y1="95" x2={125+i*19} y2="106" stroke="#0d2040" strokeWidth="5" strokeLinecap="round" opacity=".9"/>
      ))}
      {/* Vents bottom */}
      {Array.from({length:14},(_,i) => (
        <line key={i} x1={125+i*19} y1="175" x2={125+i*19} y2="185" stroke="#0d2040" strokeWidth="5" strokeLinecap="round" opacity=".9"/>
      ))}

      {/* LED strip on left face */}
      {[['#00ff6a',2],['#00d4ff',3],['#00d4ff',1.8],['#ff8c00',2.4]].map(([c,dur],i) => (
        <circle key={i} cx="124" cy={116+i*14} r="4.5" fill={c} filter="url(#sg1)"
          style={{ animation:`led-${i%2===0?'pulse':'blink'} ${dur}s ease infinite ${i*.4}s` }}/>
      ))}
      {/* AURA NET label */}
      <text x="265" y="144" fill="#1e4070" fontSize="11" textAnchor="middle" fontFamily="monospace" letterSpacing="3">AURA · NET</text>

      {/* Data flow pulse along router body */}
      <line x1="150" y1="140" x2="390" y2="140" stroke="url(#data-g)" strokeWidth="2" strokeDasharray="180" strokeDashoffset="180"
        style={{ animation:'data-flow 1.8s linear infinite' }} opacity=".7"/>

      {/* LAN ports on right face */}
      {Array.from({length:5},(_,i) => (
        <g key={i}>
          <rect x="416" y={105+i*15} width="14" height="9" rx="1.5" fill="#050e1c" stroke="#0055aa" strokeWidth=".9"/>
          <line x1="419" y1={108+i*15} x2="427" y2={108+i*15} stroke="#0a2040" strokeWidth="1"/>
        </g>
      ))}
      {/* Port label */}
      <text x="437" y="100" fill="rgba(0,212,255,.4)" fontSize="8" fontFamily="monospace">LAN ×5</text>

      {/* LAN cables going right */}
      {[['#00d4ff',110],['#0060ff',124],['#00ff9d',138],['#ff8c00',152],['#a855f7',166]].map(([c,y],i) => (
        <g key={i}>
          <path d={`M 430,${y} C 470,${y} 490,${y+8*(i%2===0?1:-1)} 550,${y+8*(i%2===0?1:-1)}`}
            stroke={c} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity=".6"/>
          <path d={`M 430,${y} C 470,${y} 490,${y+8*(i%2===0?1:-1)} 550,${y+8*(i%2===0?1:-1)}`}
            stroke={c} strokeWidth="3.5" strokeLinecap="round" fill="none"
            strokeDasharray="300" strokeDashoffset="300"
            style={{ animation:`data-flow ${1.5+i*.25}s ${i*.2}s linear infinite` }}/>
        </g>
      ))}
      <text x="548" y="98" fill="rgba(232,237,245,.4)" fontSize="8" fontFamily="monospace">CLIENTS</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   LAN cables section
───────────────────────────────────────────────────────────────────── */
const CABLES = [
  { color:'#0070ff', label:'LAN 1 — Client A', id:'c1' },
  { color:'#00d4ff', label:'LAN 2 — Client B', id:'c2' },
  { color:'#00cc66', label:'LAN 3 — Client C', id:'c3' },
  { color:'#ffaa00', label:'LAN 4 — Client D', id:'c4' },
  { color:'#a855f7', label:'LAN 5 — Client E', id:'c5' },
];

function LanCablesSection({ content }) {
  const [ref, visible] = useReveal(0.12);
  return (
    <section style={{ padding:'clamp(48px,8vw,90px) 5%', position:'relative', zIndex:1 }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>
        <SectionHeader
          badge="Connectivity"
          title={content.sectionTitles?.cables || 'Direct Ethernet Infrastructure'}
          sub="Every subscriber gets a dedicated cable run — no shared wireless bottlenecks."
          visible={visible}
        />

        <div className="ld-cables-wrap">
          <div ref={ref} style={{ marginTop:56, display:'flex', flexDirection:'column', gap:16, minWidth:560 }}>
            {CABLES.map((c, i) => (
              <div key={c.id} className="cable-wrap" style={{
                opacity: visible ? 1 : 0,
                animation: visible ? `slide-l .55s ${i*.12}s ease both` : 'none',
              }}>
                <LanCableRow cable={c} idx={i} animating={visible} />
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ marginTop:32, display:'flex', gap:24, justifyContent:'center', flexWrap:'wrap' }}>
          {['Orange/White','Green/White','Blue/White','Brown/White'].map(p => (
            <div key={p} style={{ fontSize:12, color:'rgba(232,237,245,.4)', display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:24, height:2, background:'rgba(232,237,245,.3)', borderRadius:2 }}/>
              {p} pairs
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LanCableRow({ cable, idx, animating }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0 }}>
      {/* Cable label */}
      <div style={{ width:140, fontSize:12, color:'rgba(232,237,245,.5)', fontFamily:'monospace', flexShrink:0 }}>
        {cable.label}
      </div>

      <svg viewBox="0 0 900 36" style={{ flex:1, height:36 }} aria-hidden="true">
        <defs>
          <linearGradient id={`cg-${cable.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={cable.color} stopOpacity=".12"/>
            <stop offset="40%" stopColor={cable.color} stopOpacity=".7"/>
            <stop offset="100%" stopColor={cable.color} stopOpacity=".9"/>
          </linearGradient>
        </defs>

        {/* Cable jacket */}
        <rect x="0" y="12" width="800" height="12" rx="6" fill="rgba(255,255,255,.04)" stroke={cable.color} strokeWidth=".8" strokeOpacity=".3"/>
        {/* Inner wires — 4 pairs */}
        {[0,1,2,3].map(j => (
          <line key={j} x1="0" y1={14+j*2.8} x2="800" y2={14+j*2.8}
            stroke={[cable.color,'#fff',cable.color,'#fff'][j]} strokeWidth=".7"
            opacity={[.6,.2,.4,.2][j]}/>
        ))}
        {/* Animated data pulse */}
        <rect x="0" y="12" width="120" height="12" rx="6"
          fill={cable.color} opacity=".45"
          style={{ animation: animating ? `data-flow ${2+idx*.3}s ${idx*.2}s linear infinite` : 'none' }}
        >
          {animating && <animate attributeName="x" from="-120" to="820" dur={`${2+idx*.3}s`} begin={`${idx*.2}s`} repeatCount="indefinite"/>}
        </rect>

        {/* RJ45 connector at the end */}
        {/* Boot/strain relief */}
        <rect x="800" y="10" width="18" height="16" rx="4" fill={cable.color} opacity=".35"/>
        {/* Connector body */}
        <rect x="818" y="9" width="28" height="18" rx="3" fill="#0d1829" stroke={cable.color} strokeWidth="1.2"/>
        {/* Locking tab */}
        <rect x="826" y="5" width="12" height="7" rx="2" fill="#0d1829" stroke={cable.color} strokeWidth=".8" strokeOpacity=".6"/>
        {/* 8 contacts */}
        {Array.from({length:8},(_,k) => (
          <rect key={k} x={821+k*3} y="22" width="2" height="5" rx=".5" fill="#c8a600" opacity=".85"/>
        ))}
        {/* Signal indicator */}
        <circle cx="846" cy="18" r="3" fill={cable.color} opacity=".7"
          style={{ animation:`led-pulse ${1.5+idx*.2}s ease infinite ${idx*.15}s` }}/>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Sign-in section
───────────────────────────────────────────────────────────────────── */
function SignInSection({ onLogin, onRegister }) {
  const [ref, visible] = useReveal();
  return (
    <section style={{ padding:'clamp(48px,8vw,90px) 5%', position:'relative', zIndex:1 }}>
      <div ref={ref} style={{ maxWidth:520, margin:'0 auto', textAlign:'center',
        opacity: visible ? 1 : 0, animation: visible ? 'fade-up .7s ease both' : 'none' }}>
        <div style={{ background:'rgba(0,212,255,.06)', border:'1px solid rgba(0,212,255,.18)',
          borderRadius:16, padding:'clamp(24px,5vw,40px) clamp(20px,5vw,36px)' }}>
          <NetworkIcon size={44} style={{ margin:'0 auto 16px' }} />
          <h2 style={{ fontSize:26, fontWeight:700, margin:'0 0 10px' }}>
            Already a <span style={{ color:'#00d4ff' }}>client</span>?
          </h2>
          <p style={{ color:'rgba(232,237,245,.55)', fontSize:14, margin:'0 0 28px' }}>
            Access your account dashboard to view usage, manage your subscription, and get support.
          </p>
          <div style={{ display:'flex', gap:12 }}>
            <button className="cta-primary" style={{ flex:1 }} onClick={onLogin}>Sign In</button>
            <button className="cta-outline" style={{ flex:1 }} onClick={onRegister}>Register</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Contact section — cable-plug animation
───────────────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────────────
   Media gallery section — only rendered when media exists
───────────────────────────────────────────────────────────────────── */
function MediaSection({ content }) {
  const [ref, visible] = useReveal(0.08);
  const [lightbox, setLightbox] = useState(null); // { type, videoId, url, title }

  const sorted = [...content.media].sort((a,b) => (a.order||0)-(b.order||0));

  return (
    <section style={{ padding:'clamp(48px,8vw,90px) 5%', position:'relative', zIndex:1 }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>
        <SectionHeader
          badge="Media"
          title={content.sectionTitles?.media || 'Our Network in Action'}
          sub="Photos and videos from our infrastructure and team."
          visible={visible}
        />

        <div ref={ref} style={{
          marginTop:48,
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',
          gap:16,
          opacity: visible ? 1 : 0,
          animation: visible ? 'fade-up .7s ease both' : 'none',
        }}>
          {sorted.map(item => (
            <div key={item._id} onClick={() => setLightbox(item)}
              style={{
                borderRadius:12, overflow:'hidden', cursor:'pointer', position:'relative',
                border:'1px solid rgba(0,212,255,.12)',
                transition:'all .3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(0,212,255,.5)'; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,212,255,.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(0,212,255,.12)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
            >
              {item.type === 'youtube' ? (
                <>
                  <img src={`https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`}
                    alt={item.title} style={{ width:'100%', height:195, objectFit:'cover', display:'block' }} />
                  {/* Play button overlay */}
                  <div style={{
                    position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                    background:'rgba(0,0,0,.25)',
                  }}>
                    <div style={{
                      width:52, height:52, borderRadius:'50%', background:'rgba(255,0,0,.85)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:18, boxShadow:'0 4px 20px rgba(0,0,0,.5)',
                    }}>▶</div>
                  </div>
                </>
              ) : (
                <img src={`${BACKEND}${item.url}`} alt={item.title}
                  style={{ width:'100%', height:195, objectFit:'cover', display:'block' }} />
              )}
              {(item.title || item.description) && (
                <div style={{ padding:'12px 14px', background:'#0a1628' }}>
                  {item.title && <div style={{ fontSize:14, fontWeight:600, color:'#e8edf5' }}>{item.title}</div>}
                  {item.description && <div style={{ fontSize:12, color:'rgba(232,237,245,.5)', marginTop:2 }}>{item.description}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.88)',
          display:'flex', alignItems:'center', justifyContent:'center', padding:20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            maxWidth:900, width:'100%', borderRadius:12, overflow:'hidden',
            border:'1px solid rgba(0,212,255,.2)',
          }}>
            {lightbox.type === 'youtube' ? (
              <div style={{ position:'relative', paddingBottom:'56.25%', background:'#000' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${lightbox.videoId}?autoplay=1`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:0 }}
                />
              </div>
            ) : (
              <img src={`${BACKEND}${lightbox.url}`} alt={lightbox.title}
                style={{ width:'100%', maxHeight:'80vh', objectFit:'contain', display:'block', background:'#050e1c' }} />
            )}
            {(lightbox.title || lightbox.description) && (
              <div style={{ padding:'14px 18px', background:'#0a1628' }}>
                {lightbox.title && <div style={{ fontSize:15, fontWeight:600, color:'#e8edf5' }}>{lightbox.title}</div>}
                {lightbox.description && <div style={{ fontSize:13, color:'rgba(232,237,245,.55)', marginTop:3 }}>{lightbox.description}</div>}
              </div>
            )}
          </div>
          <button onClick={() => setLightbox(null)} style={{
            position:'fixed', top:16, right:20, color:'rgba(232,237,245,.7)', fontSize:28,
            background:'none', border:'none', cursor:'pointer', lineHeight:1,
          }}>✕</button>
        </div>
      )}
    </section>
  );
}

function ContactSection({ content }) {
  const [ref, visible]    = useReveal(0.1);
  const [plugged, setPlugged] = useState(false);
  const [formShown, setFormShown] = useState(false);
  const [form,    setForm]   = useState({ name:'', phone:'', email:'', subject:'', message:'' });
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [err,     setErr]     = useState('');

  const connect = () => {
    if (plugged) return;
    setPlugged(true);
    setTimeout(() => setFormShown(true), 1400);
  };

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true); setErr('');
    try {
      await api.post('/api/contact', form);
      setSent(true);
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" ref={ref} style={{ padding:'clamp(48px,8vw,90px) 5% clamp(56px,9vw,100px)', position:'relative', zIndex:1 }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>
        <SectionHeader
          badge="Get In Touch"
          title="Connect With Us"
          sub="Have a question or ready to subscribe? Plug in and let us know."
          visible={visible}
        />

        {/* Cable animation area */}
        <div className="ld-cable-area" style={{
          marginTop:52, display:'flex', alignItems:'center', justifyContent:'center',
          gap:0, position:'relative', height:120,
          opacity: visible ? 1 : 0, animation: visible ? 'fade-up .7s .1s ease both' : 'none',
        }}>
          {/* Cable (translates right on connect) */}
          <div style={{
            display:'flex', alignItems:'center',
            transform: plugged ? 'translateX(0)' : 'translateX(-50px)',
            transition: 'transform 1.1s cubic-bezier(.68,-.55,.27,1.55)',
            zIndex:2,
          }}>
            <RJ45ConnectorSvg color={plugged ? '#00d4ff' : '#4a6080'} />
            <svg viewBox="0 0 260 20" style={{ width: plugged ? 260 : 200, height:20, transition:'width 1.1s ease' }}>
              <defs>
                <linearGradient id="cable-body" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1a3a5a"/><stop offset="100%" stopColor={plugged ? '#00d4ff' : '#2a4a7a'} stopOpacity=".6"/>
                </linearGradient>
              </defs>
              <rect x="0" y="6" width="260" height="8" rx="4" fill="url(#cable-body)"/>
              {plugged && (
                <rect x="0" y="6" width="40" height="8" rx="4" fill="#00d4ff" opacity=".7">
                  <animate attributeName="x" from="-40" to="260" dur="1s" begin="0s" repeatCount="indefinite"/>
                </rect>
              )}
            </svg>
          </div>

          {/* Router port target */}
          <div style={{ position:'relative', zIndex:1 }}>
            <RouterPortSvg connected={plugged} />
            {plugged && (
              <div style={{
                position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                width:60, height:60, borderRadius:'50%',
                background:'radial-gradient(circle,rgba(0,212,255,.5) 0%,transparent 70%)',
                animation:'rtr-halo .6s ease-out both',
              }}/>
            )}
          </div>
        </div>

        {/* Connect button */}
        {!plugged && (
          <div style={{ textAlign:'center', marginTop:28,
            opacity: visible ? 1 : 0, animation: visible ? 'fade-up .7s .25s ease both' : 'none' }}>
            <button className="cta-primary" style={{ fontSize:16, padding:'16px 44px' }} onClick={connect}>
              Contact Us
            </button>
            <p style={{ marginTop:12, fontSize:12, color:'rgba(232,237,245,.35)' }}>
              Click to connect and send us a message
            </p>
          </div>
        )}

        {/* Contact form — fades in after cable connects */}
        {formShown && (
          <div style={{
            maxWidth:600, margin:'40px auto 0',
            opacity: formShown ? 1 : 0,
            animation: 'fade-up .7s ease both',
          }}>
            {sent ? (
              <div style={{ textAlign:'center', padding:'48px 24px',
                background:'rgba(0,212,255,.06)', border:'1px solid rgba(0,212,255,.2)', borderRadius:14 }}>
                <div style={{ fontSize:44, marginBottom:12 }}>✅</div>
                <h3 style={{ fontSize:22, fontWeight:700, color:'#00d4ff', marginBottom:8 }}>Message Sent!</h3>
                <p style={{ color:'rgba(232,237,245,.6)', fontSize:14 }}>
                  We've received your message and will get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="ld-form-box" style={{
                background:'rgba(13,24,41,.8)', border:'1px solid rgba(0,212,255,.2)',
                borderRadius:14, padding:'36px 32px',
                backdropFilter:'blur(12px)',
              }}>
                <div className="ld-form-row">
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                    <label style={{ fontSize:11, color:'rgba(232,237,245,.5)', letterSpacing:'.6px', textTransform:'uppercase' }}>Full Name *</label>
                    <input className="ld-input" required value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Ahmad Hassan" />
                  </div>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                    <label style={{ fontSize:11, color:'rgba(232,237,245,.5)', letterSpacing:'.6px', textTransform:'uppercase' }}>Phone *</label>
                    <input className="ld-input" required type="tel" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+961 XX XXX XXX" />
                  </div>
                </div>
                <div className="ld-form-row">
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                    <label style={{ fontSize:11, color:'rgba(232,237,245,.5)', letterSpacing:'.6px', textTransform:'uppercase' }}>Email</label>
                    <input className="ld-input" type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                    <label style={{ fontSize:11, color:'rgba(232,237,245,.5)', letterSpacing:'.6px', textTransform:'uppercase' }}>Subject</label>
                    <select className="ld-input" value={form.subject} onChange={e => setF('subject', e.target.value)}
                      style={{ appearance:'none', WebkitAppearance:'none' }}>
                      <option value="">Select topic…</option>
                      <option>New Connection</option>
                      <option>Plan Upgrade</option>
                      <option>Technical Support</option>
                      <option>Billing</option>
                      <option>General Inquiry</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:20, display:'flex', flexDirection:'column', gap:6 }}>
                  <label style={{ fontSize:11, color:'rgba(232,237,245,.5)', letterSpacing:'.6px', textTransform:'uppercase' }}>Message *</label>
                  <textarea className="ld-input" required value={form.message} onChange={e => setF('message', e.target.value)} placeholder="Tell us how we can help you…" />
                </div>
                {err && <div style={{ color:'#ff5555', fontSize:13, marginBottom:14 }}>{err}</div>}
                <button type="submit" disabled={sending} className="send-btn">
                  {sending ? 'Sending…' : '📡 Send Message'}
                </button>

                {/* Contact details below form */}
                {(content?.contact?.phone || content?.contact?.email || content?.contact?.address || content?.contact?.hours) && (
                  <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid rgba(0,212,255,.12)',
                    display:'flex', flexWrap:'wrap', gap:20 }}>
                    {[
                      { icon:'📞', val: content.contact.phone,   label:'Phone' },
                      { icon:'✉️', val: content.contact.email,   label:'Email' },
                      { icon:'📍', val: content.contact.address, label:'Address' },
                      { icon:'🕐', val: content.contact.hours,   label:'Hours' },
                    ].filter(c => c.val).map(c => (
                      <div key={c.label} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                        <span style={{ fontSize:14 }}>{c.icon}</span>
                        <div>
                          <div style={{ fontSize:10, color:'rgba(232,237,245,.4)', textTransform:'uppercase', letterSpacing:'.5px' }}>{c.label}</div>
                          <div style={{ fontSize:13, color:'rgba(232,237,245,.75)', marginTop:1 }}>{c.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   RJ45 connector SVG (end of cable)
───────────────────────────────────────────────────────────────────── */
function RJ45ConnectorSvg({ color }) {
  return (
    <svg viewBox="0 0 52 40" style={{ width:52, height:40 }} aria-hidden="true">
      {/* Strain relief boot */}
      <rect x="0" y="10" width="16" height="20" rx="4" fill={color} opacity=".3"/>
      {/* Connector body */}
      <rect x="14" y="7" width="34" height="26" rx="3" fill="#0a1628" stroke={color} strokeWidth="1.5"/>
      {/* Locking tab */}
      <rect x="22" y="2" width="14" height="8" rx="2" fill="#0a1628" stroke={color} strokeWidth="1" strokeOpacity=".7"/>
      {/* 8 gold contacts */}
      {Array.from({length:8},(_,i) => (
        <rect key={i} x={18+i*3.5} y="28" width="2.2" height="5" rx=".5" fill="#c8a600" opacity=".9"/>
      ))}
      {/* LED */}
      <circle cx="44" cy="18" r="3" fill={color} opacity=".9"
        style={{ animation:`led-pulse 1.5s ease infinite` }}/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Router port (target of the cable plug)
───────────────────────────────────────────────────────────────────── */
function RouterPortSvg({ connected }) {
  return (
    <svg viewBox="0 0 120 100" style={{ width:130, height:110 }} aria-hidden="true">
      <defs>
        <filter id="pg1"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Router panel */}
      <rect x="10" y="10" width="100" height="80" rx="6" fill="#0a1628" stroke="#00d4ff" strokeWidth="1.6"/>
      {/* Top vents */}
      {Array.from({length:5},(_,i) => <line key={i} x1={22+i*16} y1="10" x2={22+i*16} y2="22" stroke="#071020" strokeWidth="8" strokeLinecap="round"/>)}
      {/* LEDs */}
      {[['#00ff6a',2],['#00d4ff',3],['#ff8c00',2.4]].map(([c,dur],i) => (
        <circle key={i} cx={24+i*12} cy="36" r="4" fill={c} filter="url(#pg1)"
          style={{ animation:`led-${i%2===0?'pulse':'blink'} ${dur}s ease infinite ${i*.4}s` }}/>
      ))}
      {/* Main port — highlighted */}
      <rect x="36" y="52" width="38" height="24" rx="4" fill="#050e1c"
        stroke={connected ? '#00d4ff' : '#1a4080'}
        strokeWidth={connected ? 2 : 1}
        style={{ filter: connected ? 'drop-shadow(0 0 6px #00d4ff)' : 'none' }}/>
      {/* Port contacts */}
      {Array.from({length:8},(_,i) => (
        <rect key={i} x={40+i*4} y="70" width="2.5" height="6" rx=".5"
          fill={connected ? '#00d4ff' : '#1a3a6a'} opacity={connected ? 1 : .5}/>
      ))}
      {/* Connected indicator */}
      {connected && (
        <circle cx="75" cy="30" r="5" fill="#00ff6a" filter="url(#pg1)"
          style={{ animation:'led-pulse 1s ease infinite' }}/>
      )}
      {/* Label */}
      <text x="55" y="90" fill={connected ? '#00d4ff' : '#1e4070'} fontSize="7"
        textAnchor="middle" fontFamily="monospace" letterSpacing="1">
        {connected ? 'CONNECTED' : 'OPEN PORT'}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Footer
───────────────────────────────────────────────────────────────────── */
function Footer({ onNav }) {
  return (
    <footer style={{ padding:'40px 5% 28px', borderTop:'1px solid rgba(0,212,255,.08)', position:'relative', zIndex:1 }}>
      <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <NetworkIcon size={22} />
          <span style={{ fontWeight:700, color:'rgba(232,237,245,.7)', fontSize:14 }}>
            <span style={{ color:'#00d4ff' }}>AURA</span> NET
          </span>
        </div>
        <div style={{ display:'flex', gap:24 }}>
          <button className="nav-lnk" onClick={() => onNav('hero')}>Home</button>
          <button className="nav-lnk" onClick={() => onNav('plans')}>Plans</button>
          <button className="nav-lnk" onClick={() => onNav('contact')}>Contact</button>
        </div>
        <p style={{ fontSize:12, color:'rgba(232,237,245,.3)', margin:0 }}>
          © {new Date().getFullYear()} Aura Net. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Shared components
───────────────────────────────────────────────────────────────────── */
function SectionHeader({ badge, title, sub, visible, align = 'center' }) {
  return (
    <div style={{ textAlign: align === 'center' ? 'center' : 'left',
      opacity: visible ? 1 : 0, animation: visible ? 'fade-up .6s ease both' : 'none' }}>
      <div style={{ display:'inline-flex', alignItems:'center', gap:8,
        background:'rgba(0,212,255,.08)', border:'1px solid rgba(0,212,255,.2)',
        borderRadius:30, padding:'5px 14px', fontSize:11, color:'#00d4ff',
        fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase', marginBottom:16 }}>
        {badge}
      </div>
      <h2 className="ld-h2">
        {title}
      </h2>
      {sub && <p style={{ fontSize:15, color:'rgba(232,237,245,.55)', maxWidth:540,
        margin: align === 'center' ? '0 auto' : '0', lineHeight:1.7 }}>{sub}</p>}
    </div>
  );
}

function NetworkIcon({ size = 24, style: s }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={s}>
      <circle cx="12" cy="12" r="3" fill="#00d4ff"/>
      <circle cx="4"  cy="6"  r="2" fill="#0060ff" opacity=".8"/>
      <circle cx="20" cy="6"  r="2" fill="#0060ff" opacity=".8"/>
      <circle cx="4"  cy="18" r="2" fill="#0060ff" opacity=".8"/>
      <circle cx="20" cy="18" r="2" fill="#0060ff" opacity=".8"/>
      <line x1="12" y1="12" x2="4"  y2="6"  stroke="#00d4ff" strokeWidth="1.3" opacity=".6"/>
      <line x1="12" y1="12" x2="20" y2="6"  stroke="#00d4ff" strokeWidth="1.3" opacity=".6"/>
      <line x1="12" y1="12" x2="4"  y2="18" stroke="#00d4ff" strokeWidth="1.3" opacity=".6"/>
      <line x1="12" y1="12" x2="20" y2="18" stroke="#00d4ff" strokeWidth="1.3" opacity=".6"/>
    </svg>
  );
}

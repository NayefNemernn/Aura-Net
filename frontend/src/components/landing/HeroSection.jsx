import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Zap, Shield, Wifi } from 'lucide-react';

export default function HeroSection() {
  const scrollTo = (id) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden blueprint-grid">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(200,168,106,0.06) 0%, transparent 65%)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to top, #0c0c0c, transparent)' }} />

      <div className="relative z-20 w-full px-6 lg:px-16 xl:px-24 py-32 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: text ── */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10 bg-primary opacity-70" />
                <span className="font-mono text-[10px] tracking-[0.3em] text-primary uppercase">
                  Internet & Surveillance
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-serif font-normal leading-[1.02] tracking-tight text-foreground"
                style={{ fontSize: 'clamp(52px,7.5vw,100px)' }}>
                Internet &<br />
                <span className="text-primary italic">cameras,</span><br />
                installed<br />
                properly.
              </h1>

              <p className="mt-8 text-base text-muted-foreground leading-relaxed max-w-md">
                We build quiet, reliable networks — fiber routers, HD cameras,
                Wi‑Fi coverage and UPS backup — for people who notice the details.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 mt-10">
                <button
                  onClick={() => scrollTo('#packages')}
                  className="group px-8 py-4 bg-primary text-background font-mono font-semibold text-[11px] tracking-[0.2em] uppercase rounded-sm hover:bg-primary/90 transition-all duration-300 flex items-center gap-3"
                >
                  View Packages
                  <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                </button>
                <button
                  onClick={() => scrollTo('#cameras')}
                  className="px-8 py-4 border border-border text-muted-foreground font-mono font-semibold text-[11px] tracking-[0.2em] uppercase rounded-sm hover:border-primary/50 hover:text-primary transition-all duration-300"
                >
                  Security Systems
                </button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-border">
                {[
                  { icon: Zap,    value: '1 Gbps',  label: 'Max Speed' },
                  { icon: Shield, value: '4K UHD',  label: 'Camera Res' },
                  { icon: Wifi,   value: '99.9%',   label: 'Uptime SLA' },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="font-mono font-bold text-sm text-foreground">{value}</div>
                      <div className="font-mono text-[10px] text-muted-foreground mt-0.5 tracking-wider uppercase">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Right: product showcase panel ── */}
          <div className="order-1 lg:order-2 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative"
            >
              {/* Main router panel — light inner bg frames the white-bg product photo cleanly */}
              <div className="relative rounded-sm overflow-hidden animate-float"
                style={{
                  border: '1px solid rgba(200,168,106,0.3)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 50px rgba(200,168,106,0.1)',
                }}>

                {/* Light product backdrop */}
                <div style={{ background: '#f0ece4', padding: '28px 20px 0' }}>
                  {/* Corner marks over light bg */}
                  {[
                    { top: 8, left: 8 },
                    { top: 8, right: 8, rotate: 90 },
                  ].map(({ rotate = 0, ...pos }, i) => (
                    <div key={i} className="absolute pointer-events-none"
                      style={{ ...pos, transform: `rotate(${rotate}deg)`, opacity: 0.35 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12">
                        <path d="M 0 12 L 0 0 L 12 0" fill="none" stroke="#0c0c0c" strokeWidth="1.2"/>
                      </svg>
                    </div>
                  ))}

                  {/* Router photo — natural colors on cream background */}
                  <img
                    src="/products/router.png"
                    alt="Aura Net Wi-Fi 6 Router"
                    className="w-full max-w-sm mx-auto block"
                    style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))' }}
                  />
                </div>

                {/* Dark spec strip at the bottom */}
                <div className="flex items-center justify-between px-5 py-3"
                  style={{ background: '#0e0e0e', borderTop: '1px solid rgba(200,168,106,0.2)' }}>
                  {[
                    { label: 'Standard', value: 'Wi-Fi 6' },
                    { label: 'Speed',    value: '1 Gbps'  },
                    { label: 'Antennas', value: '6 × Ext' },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <div className="font-mono text-[8px] text-muted-foreground uppercase tracking-wider">{label}</div>
                      <div className="font-mono text-xs text-primary font-semibold mt-0.5">{value}</div>
                    </div>
                  ))}
                  {/* Live LED dots */}
                  <div className="flex gap-1.5 items-center">
                    {['#00ff6a','#c8a86a','#c8a86a','#ff8c00'].map((c, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full"
                        style={{ background: c, boxShadow: `0 0 4px ${c}` }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* PTZ camera — top right floating badge */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="absolute -top-4 -right-4 bg-card border border-border rounded-sm p-2 flex items-center gap-2.5"
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
              >
                <div className="w-10 h-10 rounded-sm flex items-center justify-center overflow-hidden" style={{ background:'#f0ece4' }}>
                  <img src="/products/cam-ptz.png" alt="PTZ Camera" className="w-9 h-9 object-contain" />
                </div>
                <div>
                  <div className="font-mono text-[9px] text-primary tracking-wider uppercase">PTZ · 4K</div>
                  <div className="font-mono text-[9px] text-muted-foreground">360° Pan</div>
                </div>
              </motion.div>

              {/* Dome camera — bottom left floating badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4, duration: 0.6 }}
                className="absolute -bottom-4 -left-4 bg-card border border-border rounded-sm p-2 flex items-center gap-2.5"
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
              >
                <div className="w-10 h-10 rounded-sm flex items-center justify-center overflow-hidden" style={{ background:'#f0ece4' }}>
                  <img src="/products/cam-dome.png" alt="Dome Camera" className="w-9 h-9 object-contain" />
                </div>
                <div>
                  <div className="font-mono text-[9px] text-primary tracking-wider uppercase">Dome · HD</div>
                  <div className="font-mono text-[9px] text-muted-foreground">Night Vision</div>
                </div>
              </motion.div>

              {/* Wifi 6 spec badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.5 }}
                className="absolute top-1/2 -right-2 lg:right-0 -translate-y-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-sm px-3 py-1.5"
              >
                <span className="font-mono text-[10px] text-primary tracking-wider">Wi-Fi 6 · AX6000</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

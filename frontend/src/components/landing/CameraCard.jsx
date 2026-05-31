import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Moon, Cloud, Cpu, RotateCcw } from 'lucide-react';

const ICONS = {
  'Night Vision': Moon,
  'Cloud Storage': Cloud,
  'AI Detection': Cpu,
  'Live View': Eye,
  'Smart Alerts': Cpu,
  'PTZ Control': RotateCcw,
};

export default function CameraCard({ camera, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="group"
    >
      <div className="relative bg-card/60 border border-border rounded-sm overflow-hidden hover:border-primary/30 transition-all duration-500">
        {/* Image area */}
        <div className="relative flex items-center justify-center bg-card" style={{ height: 220 }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 40%, rgba(200,168,106,0.07) 0%, transparent 65%)' }} />
          <img
            src={camera.image}
            alt={camera.name}
            className="h-40 object-contain group-hover:scale-105 transition-transform duration-700 relative z-10"
            style={{ filter: 'drop-shadow(0 12px 32px rgba(200,168,106,0.2))' }}
          />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
            style={{ background: 'linear-gradient(to top, #111, transparent)' }} />

          {/* Resolution badge */}
          <div className="absolute top-3 right-3">
            <span className="font-mono text-[9px] tracking-wider bg-primary text-background px-2 py-1 rounded-sm font-semibold">
              {camera.resolution}
            </span>
          </div>

          {/* Type badge */}
          <div className="absolute bottom-3 left-3">
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-sm">
              {camera.type}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-serif text-xl font-normal text-foreground">{camera.name}</h3>
          <p className="font-mono text-[10px] text-muted-foreground mt-1 tracking-wider">{camera.model}</p>

          {/* Specs */}
          <div className="grid grid-cols-2 gap-2 mt-4 py-4 border-y border-border">
            {camera.specs.map((s) => (
              <div key={s.label}>
                <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
                <div className="font-mono text-xs font-semibold text-foreground mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mt-4">
            {camera.features.map((f) => {
              const Icon = ICONS[f] || Eye;
              return (
                <div key={f} className="flex items-center gap-1.5 px-2 py-1 bg-secondary/50 rounded-sm border border-border/50">
                  <Icon className="w-3 h-3 text-primary" />
                  <span className="font-mono text-[10px] text-muted-foreground">{f}</span>
                </div>
              );
            })}
          </div>

          {/* Cable info */}
          <div className="flex items-center gap-2 mt-4 p-2.5 bg-secondary/30 rounded-sm border border-border/50">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="font-mono text-[10px] text-muted-foreground">
              Cable: {camera.cable} · Connector: {camera.connector}
            </span>
          </div>

          <button
            onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full mt-5 py-3 font-mono text-[11px] font-semibold tracking-[0.2em] uppercase rounded-sm border border-border text-foreground hover:border-primary hover:text-primary transition-all duration-300"
          >
            Request Installation
          </button>
        </div>
      </div>
    </motion.div>
  );
}

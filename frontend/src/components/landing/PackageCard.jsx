import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';

export default function PackageCard({ pkg, index, isPopular }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className={`relative group ${isPopular ? 'lg:-mt-4' : ''}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase bg-primary text-background px-4 py-1 rounded-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      <div className={`relative h-full p-8 rounded-sm border transition-all duration-500 ${
        isPopular
          ? 'bg-card border-primary/40 glow-pulse'
          : 'bg-card/60 border-border hover:border-primary/30'
      }`}>
        {/* Tier */}
        <div className="flex items-center gap-2 mb-4">
          <Zap className={`w-3.5 h-3.5 ${isPopular ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">{pkg.tier}</span>
        </div>

        <h3 className="font-serif text-2xl font-normal text-foreground">{pkg.name}</h3>

        {/* Speed */}
        <div className="mt-3 mb-1">
          <span className="font-mono text-4xl font-black text-foreground">{pkg.speed}</span>
          <span className="text-muted-foreground ml-1 text-sm font-mono">Mbps</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-6">
          <span className="font-serif text-3xl font-normal text-primary">${pkg.price}</span>
          <span className="text-muted-foreground text-sm font-mono">/mo</span>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-3 mb-6 py-4 border-y border-border">
          {pkg.specs.map((s) => (
            <div key={s.label}>
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
              <div className="font-mono text-xs font-semibold text-foreground mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {pkg.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>

        {/* Router badge */}
        <div className="flex items-center gap-3 p-3 rounded-sm bg-secondary/50 border border-border mb-6">
          <img src={pkg.routerImage} alt={pkg.routerName} className="w-12 h-12 object-contain" />
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Included Router</div>
            <div className="font-mono text-xs font-semibold text-foreground mt-0.5">{pkg.routerName}</div>
          </div>
        </div>

        <button
          onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
          className={`w-full py-3.5 font-mono text-[11px] font-semibold tracking-[0.2em] uppercase rounded-sm transition-all duration-300 ${
            isPopular
              ? 'bg-primary text-background hover:bg-primary/90'
              : 'border border-border text-foreground hover:border-primary hover:text-primary'
          }`}
        >
          Select Package
        </button>
      </div>
    </motion.div>
  );
}

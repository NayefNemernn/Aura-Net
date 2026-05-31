import React from 'react';
import { motion } from 'framer-motion';

export default function SectionDivider({ image, alt, label }) {
  return (
    <div className="relative py-8 overflow-hidden">
      {/* Vertical cable line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden lg:block"
        style={{ background: 'linear-gradient(to bottom, rgba(200,168,106,0.15), rgba(200,168,106,0.35), rgba(200,168,106,0.15))' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.8 }}
        className="relative max-w-xs mx-auto"
      >
        {/* Glow behind image */}
        <div className="absolute inset-0 rounded-full blur-[60px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(200,168,106,0.08) 0%, transparent 70%)' }} />

        <div className="relative bg-card/60 border border-border rounded-sm overflow-hidden p-4">
          <img
            src={image}
            alt={alt}
            className="w-full h-36 object-contain"
            style={{ filter: 'drop-shadow(0 8px 24px rgba(200,168,106,0.2))' }}
          />
        </div>

        {label && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-primary bg-background/90 backdrop-blur-sm px-3 py-1 rounded-sm border border-primary/20 whitespace-nowrap">
              {label}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

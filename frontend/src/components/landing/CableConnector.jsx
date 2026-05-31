import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function CableConnector() {
  const { scrollYProgress } = useScroll();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const cableHeight      = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const glowOpacity      = useTransform(scrollYProgress, [0, 0.1, 0.5, 1], [0, 0.7, 1, 0.6]);
  const pulseY           = useTransform(scrollYProgress, [0, 1], ['-10%', '90%']);
  const outerGlowOpacity = useTransform(glowOpacity, v => v * 0.3);

  if (!mounted) return null;

  return (
    <div className="fixed left-1/2 top-0 bottom-0 z-10 pointer-events-none hidden lg:block" style={{ transform: 'translateX(-50%)' }}>
      {/* Base cable */}
      <motion.div
        className="absolute left-1/2 top-0 w-px"
        style={{
          height: cableHeight,
          transform: 'translateX(-50%)',
          background: 'linear-gradient(to bottom, transparent, rgba(200,168,106,0.3), transparent)',
        }}
      />

      {/* Glowing data pulse */}
      <motion.div
        className="absolute left-1/2 w-px h-32"
        style={{
          top: pulseY,
          transform: 'translateX(-50%)',
          opacity: glowOpacity,
          background: 'linear-gradient(to bottom, transparent, rgba(200,168,106,0.9), transparent)',
          filter: 'blur(1px)',
        }}
      />
      {/* Outer glow */}
      <motion.div
        className="absolute left-1/2 w-1.5 h-32"
        style={{
          top: pulseY,
          transform: 'translateX(-50%)',
          opacity: outerGlowOpacity,
          background: 'linear-gradient(to bottom, transparent, rgba(200,168,106,0.4), transparent)',
          filter: 'blur(4px)',
        }}
      />

      {/* Section nodes */}
      {[15, 33, 52, 70, 87].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2"
          style={{ top: `${pos}%`, transform: 'translate(-50%, -50%)' }}
        >
          <motion.div
            className="w-2.5 h-2.5 rounded-full border border-primary/40 bg-background"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <motion.div
              className="absolute inset-0.5 rounded-full bg-primary"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.3 }}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

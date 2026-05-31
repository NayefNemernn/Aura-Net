import React from 'react';
import { motion } from 'framer-motion';
import { Cable, Server, Shield } from 'lucide-react';

const hardware = [
  {
    category: 'Network Cables',
    icon: Cable,
    image: '/products/cam-bullet.png',
    items: [
      { name: 'Cat5e UTP Cable',       spec: '100m · 1 Gbps · Unshielded',    use: 'Basic camera runs & short internet connections' },
      { name: 'Cat6 STP Cable',        spec: '100m · 10 Gbps · Shielded',     use: 'Professional internet & PoE camera installations' },
      { name: 'Cat6a S/FTP Cable',     spec: '100m · 10 Gbps · Foil + Braid', use: 'Enterprise runs, high-interference environments' },
      { name: 'RJ45 Shielded Connectors', spec: 'Gold-plated pins · EZ-Crimp', use: 'All ethernet terminations' },
    ],
  },
  {
    category: 'PoE Switches',
    icon: Server,
    image: '/products/router.png',
    items: [
      { name: 'TP-Link TL-SG1016PE',  spec: '16-Port · 150W PoE+',       use: 'Budget-friendly PoE installations (4–8 cameras)' },
      { name: 'Ubiquiti USW-Lite-16', spec: '16-Port · 45W PoE Budget',   use: 'Small camera systems' },
      { name: 'Ubiquiti USW-Pro-24',  spec: '24-Port · 400W PoE Budget',  use: 'Full building deployments' },
    ],
  },
  {
    category: 'Infrastructure',
    icon: Shield,
    image: '/products/cam-ptz.png',
    items: [
      { name: 'Hikvision DS-7616NXI', spec: '16-Channel NVR · 4K',         use: 'Camera recording & playback' },
      { name: 'Keystone Patch Panel', spec: '24-Port · Cat6 · Rack Mount',  use: 'Organized cable management' },
      { name: 'Mini UPS',             spec: '12V DC · Keeps router alive',   use: 'Internet during power cuts' },
    ],
  },
];

export default function HardwareSection() {
  return (
    <section id="hardware" className="relative py-24 lg:py-32 blueprint-grid">
      <div className="w-full px-6 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-primary opacity-70" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-primary uppercase">
              Professional Hardware
            </span>
            <div className="h-px w-8 bg-primary opacity-70" />
          </div>
          <h2 className="font-serif font-normal text-foreground" style={{ fontSize: 'clamp(30px,4vw,52px)' }}>
            The Hard <span className="text-primary italic">Iron</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Every component we deploy is enterprise-certified. From gold-plated RJ45 pins to shielded Cat6a cabling.
          </p>
        </motion.div>

        <div className="space-y-16">
          {hardware.map((group, gi) => {
            const Icon = group.icon;
            return (
              <motion.div
                key={group.category}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6 }}
                className="grid lg:grid-cols-2 gap-8 items-center"
              >
                {/* Image side */}
                <div className={`relative ${gi % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="absolute inset-0 rounded-lg blur-[40px] pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(200,168,106,0.06) 0%, transparent 70%)' }} />
                  <div className="relative bg-card/60 border border-border rounded-sm p-8 flex items-center justify-center" style={{ minHeight: 220 }}>
                    <img
                      src={group.image}
                      alt={group.category}
                      className="max-h-44 object-contain"
                      style={{ filter: 'drop-shadow(0 12px 40px rgba(200,168,106,0.18))' }}
                    />
                  </div>
                </div>

                {/* Content side */}
                <div className={gi % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-serif text-xl font-normal text-foreground">{group.category}</h3>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <div key={item.name} className="p-4 bg-card/60 border border-border rounded-sm hover:border-primary/20 transition-colors duration-300">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-foreground text-sm">{item.name}</h4>
                            <p className="font-mono text-[10px] text-primary mt-0.5 tracking-wider">{item.spec}</p>
                            <p className="text-xs text-muted-foreground mt-1.5">{item.use}</p>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0 mt-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

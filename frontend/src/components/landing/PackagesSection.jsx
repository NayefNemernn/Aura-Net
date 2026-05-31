import React from 'react';
import { motion } from 'framer-motion';
import PackageCard from './PackageCard';

const ROUTER_IMG = '/products/router.png';

const packages = [
  {
    tier: 'Starter',
    name: 'Fiber 50',
    speed: '50',
    price: '29',
    routerImage: ROUTER_IMG,
    routerName: 'Wi-Fi 6 Dual-Band',
    specs: [
      { label: 'Download', value: '50 Mbps' },
      { label: 'Upload',   value: '25 Mbps' },
      { label: 'Latency',  value: '<8ms' },
      { label: 'Cable',    value: 'Cat5e' },
    ],
    features: [
      'Wi-Fi 6 router included',
      'Static IP address',
      'RJ45 wiring installation',
      '24/7 technical support',
      'Free router replacement',
    ],
  },
  {
    tier: 'Home Plus',
    name: 'Fiber 100',
    speed: '100',
    price: '49',
    routerImage: ROUTER_IMG,
    routerName: 'Wi-Fi 6 Tri-Band',
    specs: [
      { label: 'Download', value: '100 Mbps' },
      { label: 'Upload',   value: '50 Mbps' },
      { label: 'Latency',  value: '<5ms' },
      { label: 'Cable',    value: 'Cat6' },
    ],
    features: [
      'Wi-Fi 6 tri-band router included',
      'Dual static IP addresses',
      'Cat6 shielded wiring',
      'Priority 24/7 support',
      'Mesh extender eligible',
      'Network monitoring dashboard',
    ],
  },
  {
    tier: 'Business',
    name: 'Fiber 1G',
    speed: '1,000',
    price: '89',
    routerImage: ROUTER_IMG,
    routerName: 'Enterprise 6-Antenna',
    specs: [
      { label: 'Download', value: '1 Gbps' },
      { label: 'Upload',   value: '1 Gbps' },
      { label: 'Latency',  value: '<3ms' },
      { label: 'Cable',    value: 'Cat6a' },
    ],
    features: [
      'Enterprise router + PoE switch',
      'Block of 5 static IPs',
      'Cat6a shielded wiring',
      'Dedicated account manager',
      'Full mesh deployment',
      '99.9% uptime SLA',
      'VLAN configuration',
    ],
  },
];

const SPECS_MAP = [
  [{ label:'Download', value:'50 Mbps' }, { label:'Upload', value:'25 Mbps' }, { label:'Latency', value:'<8ms' }, { label:'Cable', value:'Cat5e' }],
  [{ label:'Download', value:'100 Mbps'}, { label:'Upload', value:'50 Mbps' }, { label:'Latency', value:'<5ms' }, { label:'Cable', value:'Cat6'  }],
  [{ label:'Download', value:'1 Gbps'  }, { label:'Upload', value:'1 Gbps'  }, { label:'Latency', value:'<3ms' }, { label:'Cable', value:'Cat6a' }],
];

export default function PackagesSection({ content }) {
  const raw = content?.packages || packages;
  const pkgs = raw.map((p, i) => ({
    ...p,
    routerImage: ROUTER_IMG,
    specs: p.specs || SPECS_MAP[i] || SPECS_MAP[0],
  }));

  const title = content?.sectionTitles?.packages || 'Choose Your Bandwidth';

  return (
    <section id="packages" className="relative py-24 lg:py-32">
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
              Connectivity Packages
            </span>
            <div className="h-px w-8 bg-primary opacity-70" />
          </div>
          <h2 className="font-serif font-normal text-foreground" style={{ fontSize: 'clamp(30px,4vw,52px)' }}>
            {title.split(' ').slice(0,-1).join(' ')}{' '}
            <span className="text-primary italic">{title.split(' ').slice(-1)}</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Every package includes professional installation with certified cabling,
            enterprise-grade router, and dedicated support.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {pkgs.map((pkg, i) => (
            <PackageCard key={pkg.name + i} pkg={pkg} index={i} isPopular={!!pkg.popular || (!pkg.popular && i === 1 && !raw.some(p => p.popular))} />
          ))}
        </div>
      </div>
    </section>
  );
}

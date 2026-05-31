import React from 'react';
import { motion } from 'framer-motion';
import CameraCard from './CameraCard';

const cameras = [
  {
    name: 'PTZ Dome Camera',
    model: 'Hikvision DS-2DE4A425IWG-E',
    type: 'Dome PTZ · Indoor/Outdoor',
    resolution: '4MP 25×',
    image: '/products/cam-ptz.png',
    cable: 'Cat6 PoE+',
    connector: 'RJ45 Shielded',
    specs: [
      { label: 'Optical Zoom', value: '25×' },
      { label: 'IR Range',     value: '100m' },
      { label: 'Pan/Tilt',     value: '360°/90°' },
      { label: 'Protocol',     value: 'ONVIF' },
    ],
    features: ['Night Vision', 'PTZ Control', 'Live View', 'AI Detection'],
  },
  {
    name: 'Dome Camera',
    model: 'Hikvision DS-2CD2143G2-I',
    type: 'Dome · Indoor/Outdoor',
    resolution: '4K 8MP',
    image: '/products/cam-dome.png',
    cable: 'Cat6 PoE',
    connector: 'RJ45 Shielded',
    specs: [
      { label: 'Sensor',    value: '1/1.8" CMOS' },
      { label: 'IR Range',  value: '40m' },
      { label: 'Aperture',  value: 'f/1.6' },
      { label: 'Protocol',  value: 'ONVIF' },
    ],
    features: ['Night Vision', 'AI Detection', 'Cloud Storage', 'Smart Alerts'],
  },
  {
    name: 'Bullet Camera',
    model: 'Hikvision DS-2CD2T86G2-4I',
    type: 'Bullet · Outdoor',
    resolution: '4K 8MP',
    image: '/products/cam-bullet.png',
    cable: 'Cat6 PoE',
    connector: 'RJ45 Shielded',
    specs: [
      { label: 'Sensor',    value: '1/1.8" CMOS' },
      { label: 'IR Range',  value: '80m' },
      { label: 'Aperture',  value: 'f/1.6' },
      { label: 'Protocol',  value: 'ONVIF' },
    ],
    features: ['Night Vision', 'AI Detection', 'Cloud Storage', 'Smart Alerts'],
  },
  {
    name: 'Dome Camera Pro',
    model: 'Dahua IPC-HDW3849H-AS-PV',
    type: 'Dome · Outdoor',
    resolution: '4K 8MP',
    image: '/products/cam-dome.png',
    cable: 'Cat5e PoE',
    connector: 'RJ45',
    specs: [
      { label: 'Sensor',    value: '1/2.8" CMOS' },
      { label: 'IR Range',  value: '30m' },
      { label: 'Aperture',  value: 'f/1.0' },
      { label: 'Protocol',  value: 'ONVIF' },
    ],
    features: ['Night Vision', 'Smart Alerts', 'Cloud Storage', 'Live View'],
  },
];

const IMG_MAP = ['/products/cam-ptz.png', '/products/cam-dome.png', '/products/cam-bullet.png', '/products/cam-dome.png'];

export default function CamerasSection({ content }) {
  const raw = content?.cameras?.length ? content.cameras : cameras;
  const list = raw.map((c, i) => ({ ...c, image: c.image || IMG_MAP[i % IMG_MAP.length] }));
  const title = content?.sectionTitles?.cameras || 'The Sentinel View';

  return (
    <section id="cameras" className="relative py-24 lg:py-32">
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
              Surveillance Systems
            </span>
            <div className="h-px w-8 bg-primary opacity-70" />
          </div>
          <h2 className="font-serif font-normal text-foreground" style={{ fontSize: 'clamp(30px,4vw,52px)' }}>
            {title}
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Professional-grade IP cameras with PoE installation.
            Every system includes Cat6 cabling, RJ45 termination, and NVR configuration.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {list.map((camera, i) => (
            <CameraCard key={camera.model + i} camera={camera} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

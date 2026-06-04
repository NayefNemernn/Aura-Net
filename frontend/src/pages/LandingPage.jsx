import React, { useEffect, useState } from 'react';
import api from '../services/api';

import Navbar          from '../components/landing/Navbar';
import CableConnector  from '../components/landing/CableConnector';
import HeroSection     from '../components/landing/HeroSection';
import SectionDivider  from '../components/landing/SectionDivider';
import PackagesSection from '../components/landing/PackagesSection';
import CamerasSection  from '../components/landing/CamerasSection';
import HardwareSection from '../components/landing/HardwareSection';
import MediaSection    from '../components/landing/MediaSection';
import ContactSection  from '../components/landing/ContactSection';
import Footer          from '../components/landing/Footer';
import AdPopup         from '../components/landing/AdPopup';

export default function LandingPage() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    api.get('/api/landing').then(({ data }) => setContent(data.content)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <CableConnector />

      <HeroSection content={content} />

      <SectionDivider
        image="/products/cam-bullet.png"
        alt="Bullet camera — Cat6 PoE outdoor"
        label="Cat6 · PoE · Connected"
      />

      <PackagesSection content={content} />

      <SectionDivider
        image="/products/router.png"
        alt="Wi-Fi 6 enterprise router with 6 antennas"
        label="Wi-Fi 6 · 1 Gbps · Active"
      />

      <CamerasSection content={content} />

      <SectionDivider
        image="/products/cam-ptz.png"
        alt="PTZ dome camera 360 degree pan tilt"
        label="PTZ · 4K · Online"
      />

      <HardwareSection content={content} />

      {content?.media?.length > 0 && (
        <MediaSection content={content} />
      )}

      <ContactSection contact={content?.contact} title={content?.sectionTitles?.contact} />

      <Footer />

      <AdPopup ad={content?.ad} />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Wifi, Shield, Cable, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const navLinks = [
  { label: 'Internet',  href: '#packages',  icon: Wifi },
  { label: 'Cameras',   href: '#cameras',   icon: Shield },
  { label: 'Hardware',  href: '#hardware',  icon: Cable },
  { label: 'Contact',   href: '#contact',   icon: Phone },
];

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-background/90 backdrop-blur-xl border-b border-border'
            : 'bg-transparent'
        }`}
      >
        <div className="w-full px-6 lg:px-16 xl:px-24">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-sm border border-primary/40 flex items-center justify-center">
                <span className="font-serif text-primary font-bold text-sm">A</span>
              </div>
              <span className="font-mono font-bold text-xs tracking-[0.25em] text-foreground uppercase">
                Aura<span className="text-primary">Net</span>
              </span>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="font-mono text-[10.5px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 tracking-[0.2em] uppercase"
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 border border-primary/50 text-primary font-mono text-[10px] tracking-[0.2em] uppercase rounded-sm hover:bg-primary hover:text-background transition-all duration-300"
              >
                Client Login
              </button>
            </div>

            {/* Hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl pt-20"
          >
            <div className="flex flex-col items-center gap-6 py-12">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.href}
                    onClick={() => scrollTo(link.href)}
                    className="flex items-center gap-3 font-mono text-base font-medium text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase"
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </button>
                );
              })}
              <button
                onClick={() => { setMobileOpen(false); navigate('/login'); }}
                className="mt-4 px-8 py-3 bg-primary text-background font-mono font-semibold text-xs tracking-[0.2em] uppercase rounded-sm"
              >
                Client Login
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

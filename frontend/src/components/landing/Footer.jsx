import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  const scrollTo = (id) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <footer className="border-t border-border py-10">
      <div className="w-full px-6 lg:px-16 xl:px-24">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center">
            <img src="/logo.png" alt="Aura Net" className="h-8 w-auto object-contain opacity-80" />
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-6">
            {[
              { label: 'Internet',  id: '#packages' },
              { label: 'Cameras',   id: '#cameras'  },
              { label: 'Hardware',  id: '#hardware' },
              { label: 'Contact',   id: '#contact'  },
            ].map(({ label, id }) => (
              <button
                key={label}
                onClick={() => scrollTo(id)}
                className="font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em]"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => navigate('/login')}
              className="font-mono text-[10px] text-primary hover:text-primary/80 transition-colors uppercase tracking-[0.2em]"
            >
              Client Login
            </button>
          </div>

          <p className="font-mono text-[9px] text-muted-foreground/50 tracking-wider">
            © {new Date().getFullYear()} AURA NET. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}

import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Shows a closable pop-up ad on the public site when the admin has enabled one.
// Dismissal is remembered for the session, keyed to the ad's updatedAt so a
// freshly-edited ad shows again even to visitors who closed the previous one.
export default function AdPopup({ ad }) {
  const [open, setOpen] = useState(false);
  const seenKey = `aura-ad-seen-${ad?.updatedAt || 'v1'}`;

  useEffect(() => {
    if (!ad?.enabled) return;
    if (!(ad.imageUrl || ad.title || ad.body)) return;
    if (sessionStorage.getItem(seenKey)) return;
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, [ad, seenKey]);

  if (!open || !ad) return null;

  const close = () => { sessionStorage.setItem(seenKey, '1'); setOpen(false); };
  const img = ad.imageUrl
    ? (ad.imageUrl.startsWith('http') ? ad.imageUrl : `${BACKEND}${ad.imageUrl}`)
    : null;

  const Img = img && (
    <img src={img} alt={ad.title || 'Advertisement'} className="w-full object-cover max-h-[60vh]" />
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={close} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md bg-card border border-border rounded-lg overflow-hidden shadow-2xl animate-[fadeIn_.25s_ease]"
        onClick={e => e.stopPropagation()}>
        <button onClick={close} aria-label="Close ad"
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
          ✕
        </button>

        {Img && (ad.linkUrl
          ? <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer">{Img}</a>
          : Img)}

        {(ad.title || ad.body || ad.linkUrl) && (
          <div className="p-5 text-center">
            {ad.title && <h3 className="font-serif text-2xl text-foreground mb-2">{ad.title}</h3>}
            {ad.body && <p className="text-sm text-muted-foreground whitespace-pre-line">{ad.body}</p>}
            {ad.linkUrl && (
              <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer"
                className="inline-block mt-4 px-6 py-2.5 bg-primary text-primary-foreground font-mono text-xs tracking-[0.2em] uppercase rounded-sm hover:opacity-90 transition-opacity">
                {ad.ctaLabel || 'Learn More'}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

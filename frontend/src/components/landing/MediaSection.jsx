import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function MediaSection({ content }) {
  const [lightbox, setLightbox] = useState(null);

  const sorted = [...(content.media || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  if (sorted.length === 0) return null;

  const title = content?.sectionTitles?.media || 'Our Network in Action';

  return (
    <section id="media" className="relative py-24 lg:py-32">
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
              Gallery
            </span>
            <div className="h-px w-8 bg-primary opacity-70" />
          </div>
          <h2 className="font-serif font-normal text-foreground" style={{ fontSize: 'clamp(30px,4vw,52px)' }}>
            {title}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1"
          style={{ border: '1px solid rgba(200,168,106,0.16)' }}>
          {sorted.map((item, i) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              onClick={() => setLightbox(item)}
              className="relative overflow-hidden cursor-pointer group"
              style={{ borderRight: '1px solid rgba(200,168,106,0.16)', aspectRatio: '16/10' }}
            >
              {item.type === 'youtube' ? (
                <>
                  <img
                    src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`}
                    alt={item.title || 'Video'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    style={{ filter: 'brightness(0.65)' }}
                    onError={e => { e.currentTarget.src = `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`; }}
                  />
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-sm flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{ background: 'rgba(200,168,106,0.85)' }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="#0c0c0c">
                        <polygon points="6,3 17,10 6,17" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={`${BACKEND}${item.url}`}
                  alt={item.title || 'Photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  style={{ filter: 'brightness(0.7)' }}
                />
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4"
                style={{ background: 'linear-gradient(to top, rgba(12,12,12,0.85) 0%, transparent 60%)' }}>
                {(item.title || item.description) && (
                  <div>
                    {item.title && <div className="font-mono text-xs text-foreground font-semibold tracking-wider">{item.title}</div>}
                    {item.description && <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{item.description}</div>}
                  </div>
                )}
              </div>

              {/* Type badge */}
              {item.type === 'youtube' && (
                <div className="absolute top-3 left-3">
                  <span className="font-mono text-[9px] tracking-wider bg-red-600 text-white px-2 py-0.5 rounded-sm uppercase">▶ YouTube</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && createPortal(
        <div onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          style={{ background: 'rgba(0,0,0,0.94)' }}>
          <div onClick={e => e.stopPropagation()}
            className="w-full max-w-4xl"
            style={{ border: '1px solid rgba(200,168,106,0.25)' }}>
            {lightbox.type === 'youtube' ? (
              <>
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${lightbox.videoId}?autoplay=1&rel=0`}
                    title={lightbox.title || 'YouTube'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  />
                </div>
                {(lightbox.title || lightbox.description) && (
                  <div className="p-4" style={{ background: '#111', borderTop: '1px solid rgba(200,168,106,0.15)' }}>
                    {lightbox.title && <div className="font-mono text-sm text-foreground font-semibold">{lightbox.title}</div>}
                    {lightbox.description && <div className="font-mono text-xs text-muted-foreground mt-1">{lightbox.description}</div>}
                  </div>
                )}
              </>
            ) : (
              <>
                <img src={`${BACKEND}${lightbox.url}`} alt={lightbox.title || 'Photo'}
                  className="w-full max-h-[80vh] object-contain block" style={{ background: '#080808' }} />
                {(lightbox.title || lightbox.description) && (
                  <div className="p-4" style={{ background: '#111', borderTop: '1px solid rgba(200,168,106,0.15)' }}>
                    {lightbox.title && <div className="font-mono text-sm text-foreground font-semibold">{lightbox.title}</div>}
                    {lightbox.description && <div className="font-mono text-xs text-muted-foreground mt-1">{lightbox.description}</div>}
                  </div>
                )}
              </>
            )}
          </div>
          <button onClick={() => setLightbox(null)}
            className="fixed top-5 right-5 font-mono text-foreground/50 hover:text-primary transition-colors text-xl w-10 h-10 flex items-center justify-center"
            style={{ border: '1px solid rgba(200,168,106,0.2)', background: 'rgba(12,12,12,0.8)' }}>
            ✕
          </button>
        </div>,
        document.body
      )}
    </section>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Phone, Mail, MapPin, Clock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function ContactSection({ contact = {} }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  // Pre-fill the form with the signed-in client's details
  useEffect(() => {
    if (!user) return;
    setForm(p => ({
      ...p,
      name:  p.name  || user.name  || '',
      email: p.email || user.email || '',
      phone: p.phone || user.phone || '',
    }));
  }, [user]);

  const firstName = user?.name?.trim().split(/\s+/)[0] || '';

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true); setErr('');
    try {
      await api.post('/api/contact', form);
      setSent(true);
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    } finally {
      setSending(false);
    }
  };

  const inputClass = "w-full h-12 bg-card border border-border rounded-sm px-4 font-mono text-sm text-foreground placeholder-muted-foreground/40 outline-none focus:border-primary transition-colors";
  const labelClass = "block font-mono text-[9px] tracking-[0.25em] text-muted-foreground uppercase mb-2";

  const infoItems = [
    { icon: Phone,  label: 'Direct Line',  value: contact.phone   || '79 381 887' },
    { icon: Mail,   label: 'Email',        value: contact.email   || '' },
    { icon: MapPin, label: 'Location',     value: contact.address || '' },
    { icon: Clock,  label: 'Support Hours',value: contact.hours   || '24/7 · 365 Days' },
  ].filter(i => i.value);

  return (
    <section id="contact" className="relative py-24 lg:py-32">
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
              Get In Touch
            </span>
            <div className="h-px w-8 bg-primary opacity-70" />
          </div>
          <h2 className="font-serif font-normal text-foreground" style={{ fontSize: 'clamp(30px,4vw,52px)' }}>
            {firstName
              ? <>Welcome back, <span className="text-primary italic">{firstName}</span></>
              : <>Start Your <span className="text-primary italic">Deployment</span></>}
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            {firstName
              ? `Hi ${firstName}, your details are filled in below — just tell us how we can help and our team will reach out to you directly.`
              : 'Get a free on-site consultation. Our certified technicians will assess your infrastructure needs.'}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            {sent ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-5 bg-card/60 border border-border rounded-sm">
                <div className="font-serif text-5xl text-primary">✓</div>
                <h3 className="font-serif text-2xl font-normal text-foreground">Message Sent</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  We've received your message and will get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input className={inputClass} required value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Ahmad Hassan" />
                  </div>
                  <div>
                    <label className={labelClass}>Phone *</label>
                    <input className={inputClass} required type="tel" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+961 XX XXX XXX" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input className={inputClass} type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className={labelClass}>Service Required</label>
                    <select
                      className={inputClass + ' appearance-none cursor-pointer'}
                      value={form.subject}
                      onChange={e => setF('subject', e.target.value)}
                    >
                      <option value="">Select service…</option>
                      <option>New Internet Connection</option>
                      <option>Camera Installation</option>
                      <option>Internet + Cameras</option>
                      <option>Technical Support</option>
                      <option>Free Consultation</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Project Details *</label>
                  <textarea
                    className={inputClass + ' h-32 py-3 resize-none'}
                    required
                    value={form.message}
                    onChange={e => setF('message', e.target.value)}
                    placeholder="Describe your infrastructure requirements…"
                  />
                </div>
                {err && <p className="text-red-400 text-sm font-mono">{err}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-4 bg-primary text-background font-mono font-semibold text-[11px] tracking-[0.25em] uppercase rounded-sm hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {sending
                    ? <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    : <><Send className="w-4 h-4" /> Request Deployment</>
                  }
                </button>
              </form>
            )}
          </motion.div>

          {/* Info panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-4"
          >
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-start gap-4 p-5 bg-card/60 border border-border rounded-sm">
                <div className="w-9 h-9 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-mono text-[9px] tracking-[0.25em] text-muted-foreground uppercase">{item.label}</div>
                  <div className="text-sm text-foreground mt-1">{item.value}</div>
                </div>
              </div>
            ))}

            {/* WhatsApp CTA */}
            <a
              href="tel:79381887"
              className="flex items-center justify-center gap-3 w-full py-4 bg-primary/10 border border-primary/30 rounded-sm hover:bg-primary/20 transition-colors duration-300"
            >
              <Phone className="w-4 h-4 text-primary" />
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary font-semibold">Call 79 381 887</span>
            </a>

            {/* Certifications */}
            <div className="p-5 bg-card/60 border border-border rounded-sm">
              <div className="font-mono text-[9px] tracking-[0.25em] text-muted-foreground uppercase mb-3">Certifications</div>
              <div className="flex flex-wrap gap-2">
                {['Hikvision Partner', 'Cat6a Certified', 'PoE Specialist', 'CCTV Expert'].map((c) => (
                  <span key={c} className="font-mono text-[9px] px-2 py-1 border border-primary/30 text-primary rounded-sm tracking-wider">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

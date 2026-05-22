import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', bmsUrl: 'https://bms.libatech.net.lb', bmsUser: '', bmsPass: '' });
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await register(form);
      nav('/');
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Registration failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4 py-12">
      <div className="fixed top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-teal flex items-center justify-center font-display font-black text-sm text-white">AN</div>
            <span className="font-display font-bold text-xl text-white">Aura<span className="text-accent">Net</span></span>
          </div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight mb-1">Create account</h1>
          <p className="text-muted text-sm">Get your business intelligence dashboard</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          {err && <div className="bg-danger/10 border border-danger/20 text-danger text-sm px-3 py-2 rounded-lg">{err}</div>}

          <div>
            <label className="block text-xs text-dim uppercase tracking-wider mb-1.5">Full Name</label>
            <input className="input" type="text" placeholder="Nasri Khoury" value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="block text-xs text-dim uppercase tracking-wider mb-1.5">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="block text-xs text-dim uppercase tracking-wider mb-1.5">Password</label>
            <input className="input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
          </div>

          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-xs text-dim mb-3 uppercase tracking-wider">BMS Connection (optional — set later in Settings)</p>
            <div className="space-y-3">
              <input className="input" type="text" placeholder="BMS URL" value={form.bmsUrl} onChange={set('bmsUrl')} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input" type="text"     placeholder="Username" value={form.bmsUser} onChange={set('bmsUser')} />
                <input className="input" type="password" placeholder="Password" value={form.bmsPass} onChange={set('bmsPass')} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
            {busy ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {busy ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-dim mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent/80 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

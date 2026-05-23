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
    <div className="min-h-screen bg-ms-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <img src="/logo.jpg" alt="Aura Net" className="h-12 w-12 rounded-full object-cover shadow-ms" />
            <span className="font-semibold text-xl text-ms-text">Aura Net</span>
          </div>
          <h1 className="font-semibold text-2xl text-ms-text tracking-tight mb-1">Create account</h1>
          <p className="text-ms-sub text-sm">Get your business intelligence dashboard</p>
        </div>

        <form onSubmit={submit} className="ms-card p-6 space-y-4">
          {err && <div className="bg-ms-red-bg border border-ms-red/30 text-ms-red text-sm px-3 py-2 rounded">{err}</div>}

          <div>
            <label className="block text-xs text-ms-dim font-semibold mb-1.5">Full Name</label>
            <input className="ms-input" type="text" placeholder="Nasri Khoury" value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="block text-xs text-ms-dim font-semibold mb-1.5">Email</label>
            <input className="ms-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="block text-xs text-ms-dim font-semibold mb-1.5">Password</label>
            <input className="ms-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
          </div>

          <div className="border-t border-ms-border pt-4">
            <p className="text-xs text-ms-dim font-semibold mb-3">BMS Connection (optional — set later in Settings)</p>
            <div className="space-y-3">
              <input className="ms-input" type="text" placeholder="BMS URL" value={form.bmsUrl} onChange={set('bmsUrl')} />
              <div className="grid grid-cols-2 gap-2">
                <input className="ms-input" type="text"     placeholder="Username" value={form.bmsUser} onChange={set('bmsUser')} />
                <input className="ms-input" type="password" placeholder="Password" value={form.bmsPass} onChange={set('bmsPass')} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={busy} className="ms-btn w-full py-2.5 flex items-center justify-center gap-2">
            {busy ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {busy ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-ms-dim mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-ms-blue hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await login(form.email, form.password);
      nav('/');
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Login failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      {/* Background blobs */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-teal/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-teal flex items-center justify-center font-display font-black text-sm text-white">AN</div>
            <span className="font-display font-bold text-xl text-white">Aura<span className="text-accent">Net</span></span>
          </div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight mb-1">Welcome back</h1>
          <p className="text-muted text-sm">Sign in to your dashboard</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          {err && (
            <div className="bg-danger/10 border border-danger/20 text-danger text-sm px-3 py-2 rounded-lg">{err}</div>
          )}
          <div>
            <label className="block text-xs text-dim uppercase tracking-wider mb-1.5">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs text-dim uppercase tracking-wider mb-1.5">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
            {busy ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-dim mt-5">
          No account?{' '}
          <Link to="/register" className="text-accent hover:text-accent/80 transition-colors">Create one</Link>
        </p>
      </div>
    </div>
  );
}

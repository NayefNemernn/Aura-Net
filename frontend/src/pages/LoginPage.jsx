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
    <div className="min-h-screen bg-ms-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <img src="/logo.jpg" alt="Aura Net" className="h-12 w-12 rounded-full object-cover shadow-ms" />
            <span className="font-semibold text-xl text-ms-text">Aura Net</span>
          </div>
          <h1 className="font-semibold text-2xl text-ms-text tracking-tight mb-1">Welcome back</h1>
          <p className="text-ms-sub text-sm">Sign in to your dashboard</p>
        </div>

        <form onSubmit={submit} className="ms-card p-6 space-y-4">
          {err && (
            <div className="bg-ms-red-bg border border-ms-red/30 text-ms-red text-sm px-3 py-2 rounded">{err}</div>
          )}
          <div>
            <label className="block text-xs text-ms-dim font-semibold mb-1.5">Email</label>
            <input className="ms-input" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs text-ms-dim font-semibold mb-1.5">Password</label>
            <input className="ms-input" type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          </div>
          <button type="submit" disabled={busy} className="ms-btn w-full py-2.5 flex items-center justify-center gap-2">
            {busy ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-ms-dim mt-5">
          No account?{' '}
          <Link to="/register" className="text-ms-blue hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}

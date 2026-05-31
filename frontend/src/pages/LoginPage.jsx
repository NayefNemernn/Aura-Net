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
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(200,168,106,0.06) 0%, transparent 65%)' }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-sm border border-ms-blue/40 flex items-center justify-center">
              <span className="font-serif text-ms-blue font-bold text-lg">A</span>
            </div>
            <span className="font-mono font-bold text-sm tracking-[0.25em] text-ms-text uppercase">
              Aura<span className="text-ms-blue">Net</span>
            </span>
          </div>
          <h1 className="font-serif font-normal text-2xl text-ms-text mb-1">Welcome back</h1>
          <p className="font-mono text-[10px] tracking-[0.2em] text-ms-dim uppercase">Sign in to your dashboard</p>
        </div>

        <form onSubmit={submit} className="bg-ms-surface border border-ms-border rounded-sm p-6 space-y-4">
          {err && (
            <div className="bg-ms-red-bg border border-ms-red/30 text-ms-red font-mono text-xs px-3 py-2 rounded-sm">{err}</div>
          )}
          <div>
            <label className="block font-mono text-[9px] tracking-[0.25em] text-ms-dim uppercase mb-1.5">Email</label>
            <input className="ms-input" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div>
            <label className="block font-mono text-[9px] tracking-[0.25em] text-ms-dim uppercase mb-1.5">Password</label>
            <input className="ms-input" type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          </div>
          <button type="submit" disabled={busy}
            className="w-full py-3 bg-ms-blue hover:bg-ms-blue-dark text-black font-mono font-semibold text-[10px] tracking-[0.25em] uppercase rounded-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {busy && <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            {busy ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className="text-center font-mono text-[10px] text-ms-dim mt-5 tracking-wider">
          No account?{' '}
          <Link to="/register" className="text-ms-blue hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}

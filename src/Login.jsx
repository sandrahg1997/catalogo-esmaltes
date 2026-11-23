import { useState } from 'react';
import { supabase } from './cloud.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setErr('Email o contraseña incorrectos.');
    setBusy(false);
  };

  return (
    <form className="screen login" onSubmit={submit}>
      <h1>Mis esmaltes</h1>
      <p className="muted">Entra con tu cuenta para ver tu colección.</p>
      <label className="field">Email
        <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="field">Contraseña
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {err && <p role="alert" className="err">{err}</p>}
      <button className="primary" disabled={busy} style={{ marginTop: 18, width: '100%' }}>{busy ? 'Entrando…' : 'Entrar'}</button>
    </form>
  );
}

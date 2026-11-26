import { useState } from 'react'
import { api } from '../session'
export default function Register({ onRegistered }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const change = e => setForm({ ...form, [e.target.name]: e.target.value })
  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setError(''); setNotice('')
    if (!form.name.trim()) { setError('Enter your name.'); return }
    if (new TextEncoder().encode(form.password).length > 72) { setError('Password must be at most 72 bytes.'); return }
    setBusy(true)
    try {
      const data = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ ...form, email: form.email.trim(), name: form.name.trim() }) })
      setNotice(data.msg)
      setForm({ name: '', email: '', password: '' })
      onRegistered(data.msg)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return <form className="auth-form" onSubmit={submit} aria-labelledby="register-heading" aria-busy={busy}>
    <h2 id="register-heading">&#127807; Register</h2>
    {error && <p className="error" role="alert">{error}</p>}
    {notice && <p className="notice" role="status">{notice}</p>}
    <label>Name<input name="name" autoComplete="name" value={form.name} onChange={change} required maxLength={100} /></label>
    <label>Email<input name="email" type="email" autoComplete="email" value={form.email} onChange={change} required /></label>
    <label>Password<input name="password" type="password" autoComplete="new-password" value={form.password} onChange={change} required minLength={8} aria-describedby="password-help" /></label>
    <p id="password-help">Use at least 8 characters (maximum 72 bytes).</p>
    <button disabled={busy}>{busy ? 'Please wait...' : 'Register'}</button>
  </form>
}

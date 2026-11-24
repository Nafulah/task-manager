import { useEffect, useRef, useState } from 'react'
import { api } from '../session'
export default function Login({ onLogin, focusLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const emailRef = useRef(null)
  useEffect(() => { if (focusLogin) emailRef.current?.focus() }, [focusLogin])
  const change = e => setForm({ ...form, [e.target.name]: e.target.value })
  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setError(''); setNotice('')

    setBusy(true)
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ ...form, email: form.email.trim(), name: form.name.trim() }) })
      localStorage.setItem('token', data.token)
      localStorage.setItem('userName', data.user.name)
      localStorage.setItem('userEmail', data.user.email)
      localStorage.setItem('lastActivity', String(Date.now()))
      onLogin()
      setForm({ name: '', email: '', password: '' })
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return <form className="auth-form" onSubmit={submit} aria-labelledby="login-heading" aria-busy={busy}>
    <h2 id="login-heading">&#128272; Login</h2>
    {error && <p className="error" role="alert">{error}</p>}
    {notice && <p className="notice" role="status">{notice}</p>}

    <label>Email<input ref={emailRef} aria-describedby={focusLogin ? 'logout-message' : undefined} name="email" type="email" autoComplete="email" value={form.email} onChange={change} required /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" value={form.password} onChange={change} required  /></label>

    <button disabled={busy}>{busy ? 'Please wait...' : 'Login'}</button>
  </form>
}

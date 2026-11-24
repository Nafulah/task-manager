import { useEffect, useState } from 'react'
import Register from './components/Register'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { api, clearSession, initialSession, isExpired, IDLE_MS, IDLE_MESSAGE } from './session'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(initialSession)
  const [message, setMessage] = useState(() => sessionStorage.getItem('logoutMessage') || '')
  function logout(reason = '') {
    const token = localStorage.getItem('token')
    clearSession()
    if (token) fetch('/api/auth/logout', { method: 'POST', headers: { 'x-auth-token': token }, keepalive: true }).catch(() => {})
    sessionStorage.setItem('logoutMessage', reason)
    setMessage(reason)
    setIsLoggedIn(false)
  }
  useEffect(() => {
    if (!isLoggedIn) return
    let timer, syncTimer
    const check = () => {
      clearTimeout(timer)
      if (!localStorage.getItem('token')) return logout(IDLE_MESSAGE)
      const last = localStorage.getItem('lastActivity')
      if (isExpired(last)) return logout(IDLE_MESSAGE)
      timer = setTimeout(check, IDLE_MS - (Date.now() - Number(last)))
    }
    const activity = () => {
      if (document.visibilityState === 'hidden') return
      if (isExpired(localStorage.getItem('lastActivity'))) return check()
      localStorage.setItem('lastActivity', String(Date.now()))
      check()
      if (!syncTimer) {
        const sentAt = Number(localStorage.getItem('lastActivity'))
        const sync = lastActivity => api('/api/auth/activity', { method: 'POST', body: JSON.stringify({ lastActivity }) }).catch(() => {})
        // Send the first interaction immediately, including near the expiry boundary.
        sync(sentAt)
        syncTimer = setTimeout(() => {
          syncTimer = null
          const latest = Number(localStorage.getItem('lastActivity'))
          if (latest > sentAt) sync(latest)
        }, 500)
      }
    }
    const ended = e => logout(e.detail)
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => window.addEventListener(event, activity, { passive: true, capture: true }))
    window.addEventListener('session-ended', ended)
    window.addEventListener('storage', check)
    window.addEventListener('pageshow', check)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    check()
    api('/api/auth/user').catch(() => {})
    return () => {
      clearTimeout(timer); clearTimeout(syncTimer)
      events.forEach(event => window.removeEventListener(event, activity, true))
      window.removeEventListener('session-ended', ended)
      window.removeEventListener('storage', check)
      window.removeEventListener('pageshow', check)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [isLoggedIn])
  return <main className="app-shell">
    {isLoggedIn ? <Dashboard onLogout={() => logout()} /> : <>
      <h1>Task Manager MVP</h1><p className="welcome">Welcome to my Task List</p>
      <Register /><hr />
      {message && <p id="logout-message" className="notice" role="status">{message}</p>}
      <Login focusLogin={!!message} onLogin={() => { sessionStorage.removeItem('logoutMessage'); setMessage(''); setIsLoggedIn(true) }} />
    </>}
  </main>
}

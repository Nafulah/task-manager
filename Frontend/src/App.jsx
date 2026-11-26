import { useCallback, useEffect, useState } from 'react'
import Register from './components/Register'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { api, clearSession, initialSession, isExpired, IDLE_MS, IDLE_MESSAGE } from './session'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(initialSession)
  const [message, setMessage] = useState(() => sessionStorage.getItem('logoutMessage') || '')
  const [page, setPage] = useState(() => window.location.pathname)
  useEffect(() => {
    const onPopState = () => setPage(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  useEffect(() => {
    const destination = isLoggedIn ? '/dashboard' : page === '/register' ? '/register' : '/login'
    if (window.location.pathname !== destination) window.history.replaceState(null, '', destination)
  }, [isLoggedIn, page])
  const navigate = useCallback(destination => {
    window.history.pushState(null, '', destination)
    setPage(destination)
  }, [])
  function followLink(event, destination) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(destination)
  }
  const logout = useCallback((reason = '') => {
    const token = localStorage.getItem('token')
    clearSession()
    if (token) fetch('/api/auth/logout', { method: 'POST', headers: { 'x-auth-token': token }, keepalive: true }).catch(() => {})
    sessionStorage.setItem('logoutMessage', reason)
    setMessage(reason)
    setIsLoggedIn(false)
    navigate('/login')
  }, [navigate])
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
  }, [isLoggedIn, logout])
  return <main className="app-shell">
    {isLoggedIn ? <Dashboard onLogout={() => logout()} /> : <>
      <h1>Task Manager MVP</h1><p className="welcome">Welcome to my Task List</p>
      {page === '/register' ? <>
        <Register onRegistered={notice => {
          sessionStorage.setItem('logoutMessage', notice)
          setMessage(notice)
          navigate('/login')
        }} />
        <p className="auth-navigation">Already have an account? <a href="/login" onClick={event => followLink(event, '/login')}>Log in</a></p>
      </> : <>
      {message && <p id="logout-message" className="notice" role="status">{message}</p>}
      <Login focusLogin={!!message} onLogin={() => { sessionStorage.removeItem('logoutMessage'); setMessage(''); setIsLoggedIn(true); navigate('/dashboard') }} />
      <p className="auth-navigation">Don’t have an account? <a href="/register" onClick={event => followLink(event, '/register')}>Create one</a></p>
      </>}
    </>}
  </main>
}

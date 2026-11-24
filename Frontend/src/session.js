export const IDLE_MS = 120000;
export const IDLE_MESSAGE = 'You were logged out due to inactivity.';
export function isExpired(lastActivity, now = Date.now()) {
  return !Number.isFinite(Number(lastActivity)) || Number(lastActivity) <= 0 || now - Number(lastActivity) >= IDLE_MS || Number(lastActivity) > now;
}
export function clearSession() {
  for (const key of ['token', 'userName', 'userEmail', 'lastActivity']) localStorage.removeItem(key);
}
export function initialSession() {
  if (!localStorage.getItem('token')) return false;
  if (isExpired(localStorage.getItem('lastActivity'))) {
    clearSession();
    sessionStorage.setItem('logoutMessage', IDLE_MESSAGE);
    return false;
  }
  return true;
}
export async function api(path, options = {}) {
  const token = localStorage.getItem('token');
  if (token && isExpired(localStorage.getItem('lastActivity'))) {
    window.dispatchEvent(new CustomEvent('session-ended', { detail: IDLE_MESSAGE }));
    throw new Error(IDLE_MESSAGE);
  }
  let res;
  try { res = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { 'x-auth-token': token } : {}), ...options.headers } }); }
  catch { throw new Error('Could not connect. Check your connection and try again.'); }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.msg || data?.error || 'Something went wrong. Please try again.';
    if (res.status === 401 && token && token === localStorage.getItem('token')) window.dispatchEvent(new CustomEvent('session-ended', { detail: message }));
    throw new Error(message);
  }
  return data;
}

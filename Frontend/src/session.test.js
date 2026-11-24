import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { initialSession, isExpired, clearSession, api, IDLE_MESSAGE } from './session.js';
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
};
beforeEach(() => {
  globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
});
test('expires exactly at two minutes, rejects missing and invalid timestamps', () => {
  assert.equal(isExpired(1000, 120999), false);
  assert.equal(isExpired(1000, 121000), true);
  for (const value of [null, '', 'bad', 200000]) assert.equal(isExpired(value, 121000), true);
});
test('refresh/reopen cannot restore an expired session and preserves timeout message', () => {
  localStorage.setItem('token', 'old'); localStorage.setItem('userName', 'Test');
  localStorage.setItem('lastActivity', Date.now() - 120000);
  assert.equal(initialSession(), false);
  assert.equal(localStorage.getItem('token'), null);
  assert.equal(localStorage.getItem('userName'), null);
  assert.equal(sessionStorage.getItem('logoutMessage'), IDLE_MESSAGE);
});
test('recent activity restores a session; explicit logout clears it', () => {
  localStorage.setItem('token', 'valid'); localStorage.setItem('lastActivity', Date.now());
  assert.equal(initialSession(), true); clearSession(); assert.equal(initialSession(), false);
});
test('expired sessions never send a protected request', async () => {
  localStorage.setItem('token', 'expired');
  let requests = 0, message;
  globalThis.fetch = async () => { requests++; };
  globalThis.window = { dispatchEvent: event => { message = event.detail; } };
  await assert.rejects(api('/api/tasks'), { message: IDLE_MESSAGE });
  assert.equal(requests, 0); assert.equal(message, IDLE_MESSAGE);
});
test('network and non-JSON server errors are readable', async () => {
  globalThis.fetch = async () => { throw new Error('fetch failed'); };
  await assert.rejects(api('/api/auth/login'), /Check your connection/);
  globalThis.fetch = async () => new Response('upstream failure', { status: 502 });
  await assert.rejects(api('/api/auth/login'), /Please try again/);
});

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const Session = require('./models/Session');
const Task = require('./models/Task');
process.env.JWT_SECRET = 'test-only-session-signing-key';
let session;
Session.findOne = async query => session && query._id === session.id && query.user === session.user && session.expiresAt > query.expiresAt.$gt ? session : null;
Session.findOneAndUpdate = async (query, update) => {
  if (!session || session.expiresAt <= query.expiresAt.$gt) return null;
  session.expiresAt = new Date(Math.max(+session.expiresAt, +update.$max.expiresAt)); return session;
};
Session.deleteOne = async () => { session = null; };
Task.find = () => ({ sort: async () => [] });
Task.findOne = async query => query.user === 'other-user' ? { title: 'Private' } : null;
Task.findOneAndDelete = async query => query.user === 'other-user' ? {} : null;
const app = express(); app.use(express.json());
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
const server = app.listen(0, '127.0.0.1');
after(() => server.close());
const token = jwt.sign({ id: 'test-user', sid: 'test-session' }, process.env.JWT_SECRET);
async function request(path, method = 'GET', body, authToken = token) {
  if (!server.listening) await new Promise(resolve => server.once('listening', resolve));
  return fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken }, body: body ? JSON.stringify(body) : undefined });
}
function active() { session = { id: 'test-session', user: 'test-user', expiresAt: new Date(Date.now() + 120000) }; }
test('valid sessions can read tasks; polling does not renew inactivity', async () => {
  active(); const expiry = +session.expiresAt;
  assert.equal((await request('/api/tasks')).status, 200);
  assert.equal(+session.expiresAt, expiry);
});
test('expired session is rejected even before MongoDB TTL cleanup', async () => {
  active(); session.expiresAt = new Date(Date.now() - 1);
  const response = await request('/api/tasks'); assert.equal(response.status, 401);
  assert.equal((await response.json()).msg, 'You were logged out due to inactivity.');
  assert.equal((await request('/api/auth/activity', 'POST', { lastActivity: Date.now() })).status, 401);
});
test('activity renews active sessions, logout revokes token reuse', async () => {
  active(); session.expiresAt = new Date(Date.now() + 1000);
  assert.equal((await request('/api/auth/activity', 'POST', { lastActivity: Date.now() })).status, 204);
  assert.ok(+session.expiresAt > Date.now() + 118000);
  assert.equal((await request('/api/auth/logout', 'POST')).status, 204);
  assert.equal((await request('/api/tasks')).status, 401);
});
test('legacy JWTs without persistent sessions are rejected', async () => {
  active(); const legacy = jwt.sign({ id: 'test-user' }, process.env.JWT_SECRET);
  assert.equal((await request('/api/tasks', 'GET', null, legacy)).status, 401);
});
test('invalid forms return useful validation errors', async () => {
  active();
  for (const body of [{ title: ' ' }, { title: 'Task', status: 'wrong' }, { title: 'Task', deadline: '2026-02-30' }]) {
    const response = await request('/api/tasks', 'POST', body); assert.equal(response.status, 400); assert.ok((await response.json()).msg);
  }
  assert.equal((await request('/api/auth/register', 'POST', { name: ' ', email: 'bad', password: 'x' })).status, 400);
});
test('users cannot edit or delete tasks belonging to another user', async () => {
  active();
  const path = '/api/tasks/507f1f77bcf86cd799439011';
  assert.equal((await request(path, 'PUT', { title: 'Changed', user: 'test-user' })).status, 404);
  assert.equal((await request(path, 'DELETE')).status, 404);
});

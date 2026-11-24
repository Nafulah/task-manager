const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
router.use(auth);
function validate(body) {
  const { title, description = '', status = 'Pending', deadline = null } = body;
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) return 'Enter a task title of 1-200 characters.';
  if (typeof description !== 'string' || description.length > 5000) return 'Description must be at most 5,000 characters.';
  if (!['Pending', 'In Progress', 'Completed'].includes(status)) return 'Choose a valid task status.';
  if (deadline && (typeof deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(deadline) || !Number.isFinite(Date.parse(deadline)) || new Date(deadline).toISOString().slice(0, 10) !== deadline)) return 'Enter a valid deadline.';
  return null;
}
router.get('/', async (req, res) => {
  try { res.json(await Task.find({ user: req.user.id }).sort({ createdAt: -1 })); }
  catch { res.status(503).json({ msg: 'Unable to load tasks. Please try again.' }); }
});
router.post('/', async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ msg: error });
  try {
    const { title, description, status, deadline } = req.body;
    res.status(201).json(await Task.create({ title: title.trim(), description, status, deadline: deadline || null, user: req.user.id }));
  } catch { res.status(503).json({ msg: 'Unable to add task. Please try again.' }); }
});
router.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ msg: 'Invalid task ID.' });
  next();
});
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ msg: 'Task not found.' });
    const update = {};
    for (const key of ['title', 'description', 'status', 'deadline', 'completed']) if (Object.hasOwn(req.body, key)) update[key] = req.body[key];
    const candidate = { title: task.title, description: task.description || '', status: task.status, deadline: task.deadline ? task.deadline.toISOString().slice(0, 10) : null, ...update };
    const error = validate(candidate);
    if (error) return res.status(400).json({ msg: error });
    if ('title' in update) update.title = update.title.trim();
    if ('deadline' in update) update.deadline = update.deadline || null;
    res.json(await Task.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { $set: update }, { new: true, runValidators: true }));
  } catch { res.status(503).json({ msg: 'Unable to save task. Please try again.' }); }
});
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ msg: 'Task not found.' });
    res.json({ msg: 'Deleted' });
  } catch { res.status(503).json({ msg: 'Unable to delete task. Please try again.' }); }
});
module.exports = router;

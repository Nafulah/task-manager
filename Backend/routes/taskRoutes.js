const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Task = require("../models/Task");

// GET tasks
router.get("/", auth, async (req, res) => {
  try {
   const tasks = await Task.find({ user: req.user.id || req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
// POST task
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, deadline, status } = req.body;
    const newTask = new Task({
      title,
      description,
      deadline: deadline || null,
      status: status || "Pending",
      user: req.user.id || req.user._id,
      completed: false
    });
    const task = await newTask.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// PUT - toggle complete
router.put("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    task.completed = !task.completed;
    task.status = task.completed ? "Completed" : "Pending";
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// DELETE
router.delete("/:id", auth, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: "Deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Task = require("../models/Task");

router.get("/", auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.log("GET ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    console.log("POST body:", req.body);
    const { title, description, status, deadline } = req.body;
    
    const newTask = new Task({
      title,
      description: description || "",
      status: status || "Pending",
      deadline: deadline ? new Date(deadline) : null,
      user: req.user.id
    });
    
    const task = await newTask.save();
    console.log("SAVED OK:", task.title);
    res.json(task);
  } catch (err) {
    console.log("SAVE FAILED:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    let update = { ...req.body };
    if (update.deadline === "" || update.deadline === null) update.deadline = null;
    else if (update.deadline) update.deadline = new Date(update.deadline);
    
    const task = await Task.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
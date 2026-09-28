const mongoose = require('mongoose')

// Task Schema - Each task belongs to a user (Requirement 4)
const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String},
  status: {type: String, default: "pending"},
  deadline: {type: Date},
  completed: {type: Boolean, default: "false"}, 
  // This field links task to the user who created it
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

module.exports = mongoose.model('Task', TaskSchema)
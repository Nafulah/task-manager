// Main Server - Entry Point
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()

// Middleware - Allow Frontend to talk to Backend
app.use(cors())
app.use(express.json()) // Parse JSON body

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(()=> console.log("MongoDB Connected"))
  .catch(err=> console.log(err))

// Routes
app.use('/api/auth', require('./routes/authRoutes')) //  Auth routes
app.use('/api/tasks', require('./routes/taskRoutes')) //  Protected task routes

// Start server
app.listen(process.env.PORT, ()=> console.log(`Server running on port ${process.env.PORT}`))
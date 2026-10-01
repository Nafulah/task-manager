const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const router = express.Router()

// @route POST /api/auth/register - Requirement 1 & 2
router.post('/register', async(req,res)=>{
  const {name,email,password} = req.body
  try {
    let user = await User.findOne({email})
    if(user) return res.status(400).json({msg: "User already exists"})

    // Hash password for security
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    user = new User({name,email,password:hashedPassword})
    await user.save()

    // Create JWT token (Requirement 2)
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '1h'})
    res.json({token, user: {id: user._id, name: user.name, email: user.email}})
  } catch(err){
    res.status(500).json({msg: err.message})
  }
})

// @route POST /api/auth/login - Requirement 1 & 2
router.post('/login', async(req,res)=>{
  const {email,password} = req.body
  try {
    const user = await User.findOne({email})
    if(!user) return res.status(400).json({msg: "User not found"})

    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch) return res.status(400).json({msg: "Invalid credentials"})

    // Create JWT token (Requirement 2)
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '1h'})
   res.json({ 
  token, 
  user: { 
    id: user.id, 
    name: user.name, 
    email: user.email 
  } 
});
  } catch(err){
    res.status(500).json({msg: err.message})
  }
})

// Get logged user
router.get("/user", async (req, res) => {
  try {
    const token = req.headers["x-auth-token"];
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const User = require("../models/User");
    const user = await User.findById(decoded.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router
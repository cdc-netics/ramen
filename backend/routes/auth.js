const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

router.post('/login', async (req,res)=>{
  try{
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if(!user) return res.status(401).json({msg:'invalid credentials'});
    const ok = await bcrypt.compare(password, user.passwordHash);
    if(!ok) return res.status(401).json({msg:'invalid credentials'});
    const token = jwt.sign({ sub:user._id, username:user.username, roles:user.roles }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  }catch(err){
    res.status(500).json({error: ''+err});
  }
});

module.exports = router;

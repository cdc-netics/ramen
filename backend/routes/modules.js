const express = require('express');
const router = express.Router();
const Module = require('../models/module.model');

router.get('/', async (req,res)=>{
  const all = await Module.find({});
  res.json(all);
});

router.post('/', async (req,res)=>{
  const p = req.body;
  const m = new Module(p);
  await m.save();
  res.status(201).json(m);
});

module.exports = router;

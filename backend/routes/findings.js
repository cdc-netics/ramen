const express = require('express');
const router = express.Router();
const Finding = require('../models/finding.model');

router.get('/', async (req,res)=>{
  const items = await Finding.find({}).limit(200);
  res.json(items);
});

router.post('/', async (req,res)=>{
  const f = new Finding(req.body);
  await f.save();
  res.status(201).json(f);
});

module.exports = router;

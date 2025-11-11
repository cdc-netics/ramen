const express = require('express');
const router = express.Router();
const Leaked = require('../models/leakedPassword.model');

router.get('/', async (req,res)=>{
  const q = req.query.q || '';
  const docs = await Leaked.find(q ? { $text: { $search: q } } : {}).limit(200);
  res.json(docs);
});

router.post('/bulk', async (req,res)=>{
  const items = req.body.items || [];
  if(!Array.isArray(items)) return res.status(400).json({msg:'items array required'});
  const created = await Leaked.insertMany(items.map(i=>({ ...i, firstSeen: i.firstSeen || new Date() })));
  res.json({ inserted: created.length });
});

module.exports = router;


const express = require('express');
const pool = require('../../config/db');
const router = express.Router();

router.post('/add', async (req,res)=>{
  const {creator_id,name,email,status} = req.body;
  await pool.query(
    "INSERT INTO leads(creator_id,name,email,status) VALUES($1,$2,$3,$4)",
    [creator_id,name,email,status || 'new']
  );
  res.json({msg:"Lead added"});
});

router.get('/:creator_id', async (req,res)=>{
  const data = await pool.query("SELECT * FROM leads WHERE creator_id=$1",[req.params.creator_id]);
  res.json(data.rows);
});

module.exports = router;

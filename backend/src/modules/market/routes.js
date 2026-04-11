
const express = require('express');
const pool = require('../../config/db');
const router = express.Router();

router.post('/campaign', async (req,res)=>{
  const {brand_name,title,description,budget} = req.body;
  const data = await pool.query(
    "INSERT INTO campaigns(brand_name,title,description,budget) VALUES($1,$2,$3,$4) RETURNING *",
    [brand_name,title,description,budget]
  );
  res.json(data.rows[0]);
});

router.get('/campaigns', async (req,res)=>{
  const data = await pool.query("SELECT * FROM campaigns");
  res.json(data.rows);
});

module.exports = router;

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// માસ્ટર સ્પૂલ ડેટા (બંને કેસ હેન્ડલિંગ સાથે)
app.get('/api/master-spools', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE("Drawing_no", drawing_no) as drawing_no,
        COALESCE("Spool_number", spool_number) as spool_number,
        COALESCE("Spool_size", spool_size) as spool_size,
        COALESCE("Rev_no", rev_no) as rev_no
      FROM master_spools 
      ORDER BY 1, 2
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// View All Data
app.get('/api/all-joints', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM piping_joints ORDER BY id DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fit-up સેવ કરવો
app.post('/api/fitup', async (req, res) => {
  try {
    const { line_no, spool_id, joint_no, joint_type, joint_size, fitup_date } = req.body;
    const result = await pool.query(
      `INSERT INTO piping_joints (line_no, spool_id, joint_no, joint_type, joint_size, fitup_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Fit-Up Completed') RETURNING *`,
      [line_no, spool_id, joint_no, joint_type, joint_size, fitup_date]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fit-up થયેલા જોઈન્ટ્સ Welding માટે
app.get('/api/fitup-joints', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM piping_joints WHERE status = 'Fit-Up Completed' ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Welding સેવ કરવો
app.post('/api/welding', async (req, res) => {
  try {
    const { joint_id, welder_no, wps, weld_date } = req.body;
    const result = await pool.query(
      `UPDATE piping_joints 
       SET welder_no = $1, wps = $2, weld_date = $3, status = 'Welding Completed'
       WHERE id = $4 RETURNING *`,
      [welder_no, wps, weld_date, joint_id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

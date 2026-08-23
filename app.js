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

// ૧. Master Spools Data
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

// ૨. View All Data API
app.get('/api/all-joints', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM piping_joints ORDER BY id DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ૩. Fit-up Data Save
app.post('/api/fitup', async (req, res) => {
  try {
    const { drawing_no, spool_number, spool_size, rev_no, joint_no, type_of_joint, joint_size, fit_up_date } = req.body;
    const result = await pool.query(
      `INSERT INTO piping_joints 
       ("Drawing_no", "Spool_number", "Spool_size", "Rev_no", "Joint_no", "Type_of_joint", "Joint_size", "Fit_up_date", status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Fit-Up Completed') RETURNING *`,
      [drawing_no, spool_number, spool_size, rev_no, joint_no, type_of_joint, joint_size, fit_up_date]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Fitup Insert Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ૪. Fit-up થયેલા Joints Welding માટે
app.get('/api/fitup-joints', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM piping_joints WHERE status = 'Fit-Up Completed' ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ૫. Welding Data Save
app.post('/api/welding', async (req, res) => {
  try {
    const { joint_id, welder_no, wps, weld_visual_date } = req.body;
    const result = await pool.query(
      `UPDATE piping_joints 
       SET "Welder_no" = $1, "Wps" = $2, "Weld_visual_date" = $3, status = 'Welding Completed'
       WHERE id = $4 RETURNING *`,
      [welder_no, wps, weld_visual_date, joint_id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Welding Update Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

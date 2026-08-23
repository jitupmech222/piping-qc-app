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
    const result = await pool.query('SELECT * FROM master_spools');
    const normalized = result.rows.map(r => {
      const keys = Object.keys(r);
      const findKey = (name) => keys.find(k => k.toLowerCase() === name.toLowerCase());
      return {
        drawing_no: String(r[findKey('drawing_no')] || ''),
        spool_number: String(r[findKey('spool_number')] || ''),
        spool_size: String(r[findKey('spool_size')] || ''),
        rev_no: String(r[findKey('rev_no')] || '0')
      };
    }).filter(item => item.drawing_no.trim() !== '');

    res.json({ success: true, data: normalized });
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

// ૩. Fit-up Bulk Insert
app.post('/api/fitup-bulk', async (req, res) => {
  const client = await pool.connect();
  try {
    const { drawing_no, spool_number, spool_size, rev_no, fit_up_date, joints } = req.body;
    await client.query('BEGIN');
    const inserted = [];
    for (const j of joints) {
      const result = await client.query(
        `INSERT INTO piping_joints 
         ("Drawing_no", "Spool_number", "Spool_size", "Rev_no", "Joint_no", "Type_of_joint", "Joint_size", "Fit_up_date", status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Fit-Up Completed') RETURNING *`,
        [drawing_no, spool_number, spool_size, rev_no, j.joint_no, j.type_of_joint, j.joint_size, fit_up_date]
      );
      inserted.push(result.rows[0]);
    }
    await client.query('COMMIT');
    res.json({ success: true, count: inserted.length });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// ૪. Welding માટે Fit-up થયેલા Joints
app.get('/api/fitup-joints', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM piping_joints WHERE status = 'Fit-Up Completed' ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ૫. Welding Bulk Update
app.post('/api/welding-bulk', async (req, res) => {
  const client = await pool.connect();
  try {
    const { weld_visual_date, updates } = req.body;
    await client.query('BEGIN');
    for (const u of updates) {
      await client.query(
        `UPDATE piping_joints 
         SET "Welder_no" = $1, "Wps" = $2, "Weld_visual_date" = $3, status = 'Welding Completed'
         WHERE id = $4`,
        [u.welder_no, u.wps, weld_visual_date, u.joint_id]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true, count: updates.length });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

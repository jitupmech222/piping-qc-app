const express = require('express');
const { Pool } = require('pg');
const PDFDocument = require('pdfkit');
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

app.post('/api/joints', async (req, res) => {
  try {
    const { line_no, spool_no, joint_no, status } = req.body;
    const result = await pool.query(
      'INSERT INTO piping_joints (line_no, spool_no, joint_no, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [line_no, spool_no, joint_no, status]
    );
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/report', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM piping_joints ORDER BY id DESC');
    const doc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=inspection_report.pdf');
    doc.pipe(res);
    doc.fontSize(18).text('Piping Inspection Daily Report', { align: 'center' });
    doc.moveDown();
    result.rows.forEach((row, i) => {
      doc.fontSize(11).text(`${i + 1}. Line: ${row.line_no} | Spool: ${row.spool_no} | Joint: ${row.joint_no} | Status: ${row.status}`);
    });
    doc.end();
  } catch (err) {
    res.status(500).send('Error generating PDF');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

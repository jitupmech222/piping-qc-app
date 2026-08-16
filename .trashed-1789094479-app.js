const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Piping QC Backend & PDF Generator Running!');
});

// PDF Generator Route
app.get('/api/piping/generate-pdf', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM piping_joints ORDER BY id ASC;');
        const joints = result.rows;

        const doc = new PDFDocument({ margin: 30 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Piping_Report.pdf');

        doc.pipe(res);

        doc.fontSize(18).text('DAILY PIPING INSPECTION REPORT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        doc.fontSize(12).fillColor('blue').text('ID   | Line No   | Spool ID   | Joint No   | Status');
        doc.fillColor('black').text('------------------------------------------------------------------');
        doc.moveDown(0.5);

        joints.forEach(j => {
            doc.fontSize(10).text(`${j.id}   | ${j.line_no}   | ${j.spool_id}   | ${j.joint_no}   | ${j.status}`);
        });

        doc.moveDown(2);
        doc.text('Inspector Signature: _________________', { align: 'left' });

        doc.end();

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "PDF Error", details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



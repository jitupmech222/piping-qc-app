const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const PDFDocument = require('pdfkit'); // PDFKit ઉમેર્યું
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase ડેટાબેઝ કનેક્શન સેટઅપ
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// ૧. હોમ રૂટ (Home Route)
app.get('/', (req, res) => {
    res.send('Piping QC Backend & PDF Generator Running!');
});

// ૨. જોઈન્ટ ડેટાબેઝમાં સેવ કરવા માટેની POST API
app.post('/api/piping/entry', async (req, res) => {
    const { line_no, spool_id, joint_no, status } = req.body;

    try {
        const queryText = `
            INSERT INTO piping_joints (line_no, spool_id, joint_no, status) 
            VALUES ($1, $2, $3, $4) RETURNING *;
        `;
        const values = [line_no, spool_id, joint_no, status || 'Pending'];
        
        const result = await pool.query(queryText, values);

        res.status(201).json({
            message: "ડેટાબેઝમાં જોઈન્ટ સેવ થઈ ગયો!",
            data: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "ડેટા સેવ કરવામાં ભૂલ થઈ", details: err.message });
    }
});

// ૩. બધા જોઈન્ટ્સ મેળવવાની GET API
app.get('/api/piping/joints', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM piping_joints ORDER BY id DESC;');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ૪. ઓટોમેટિક PDF રિપોર્ટ ડાઉનલોડ કરવાની API (NEW)
app.get('/api/piping/generate-pdf', async (req, res) => {
    try {
        // ડેટાબેઝમાંથી બધા જ જોઈન્ટ્સ મેળવો
        const result = await pool.query('SELECT * FROM piping_joints ORDER BY id ASC;');
        const joints = result.rows;

        // નવું PDF ડોક્યુમેન્ટ બનાવો
        const doc = new PDFDocument({ margin: 30 });

        // રિસ્પોન્સ હેડર સેટ કરો જેથી PDF ડાઉનલોડ થાય
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Piping_Inspection_Report.pdf');

        doc.pipe(res);

        // PDF હેડર (ટાઇટલ)
        doc.fontSize(18).text('DAILY PIPING INSPECTION REPORT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        // ટેબલ હેડર
        doc.fontSize(12).fillColor('blue').text('ID   | Line No   | Spool ID   | Joint No   | Status');
        doc.fillColor('black').text('------------------------------------------------------------------');
        doc.moveDown(0.5);

        // દરેક જોઈન્ટનો ડેટા ટેબલમાં ઉમેરો
        joints.forEach(j => {
            doc.fontSize(10).text(`${j.id}   | ${j.line_no}   | ${j.spool_id}   | ${j.joint_no}   | ${j.status}`);
        });

        doc.moveDown(2);
        doc.text('Inspector Signature: _________________', { align: 'left' });

        // PDF ફાઇનલાઇઝ કરો
        doc.end();

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "PDF જનરેટ કરવામાં ભૂલ થઈ", details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


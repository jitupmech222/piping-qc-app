const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ૧. સર્વર ચાલુ છે કે નહીં તે ચકાસવા માટે Home Route
app.get('/', (req, res) => {
    res.send('Piping QC App Backend is Running!');
});

// ૨. પાઇપિંગ ડેટા એન્ટ્રી માટે ટેસ્ટ API
app.post('/api/piping/entry', (req, res) => {
    const { line_no, spool_id, joint_no, status } = req.body;

    console.log("મળેલ ડેટા:", req.body);

    res.status(200).json({
        message: "ડેટા સફળતાપૂર્વક મળ્યો!",
        data: { line_no, spool_id, joint_no, status }
    });
});

// સર્વર સ્ટાર્ટ કરો
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

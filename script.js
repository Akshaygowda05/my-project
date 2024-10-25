const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path=require('path')
const app = express();
const PORT = 3000; // or any available port

// Enable CORS
app.use(cors());
app.use(express.json())

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Proxy endpoint
app.post('/motor-control', async (req, res) => {
    try {
        const response = await axios.post('http://192.168.0.200/motor-control', req.body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Error forwarding request' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

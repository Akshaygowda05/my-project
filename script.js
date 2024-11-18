const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000; // Port for your Node.js server

// Enable CORS to allow cross-origin requests (necessary for frontend requests)
app.use(cors({
  origin: '*'  // Allow requests from any origin
}));

// Parse incoming JSON requests
app.use(express.json());

// Serve static files (for the frontend dashboard) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route to serve the HTML page (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Proxy endpoint for fetching sensor data from the ESP32
app.get('/api/sensor-data', async (req, res) => {
    try {
        // Forward the GET request to the ESP32 API to fetch sensor data
        const response = await axios.get('http://103.161.75.85:5000/api/sensor-data'); // Update this to the public IP
        res.json(response.data); // Forward the sensor data to the frontend
    } catch (error) {
        console.error('Error fetching sensor data from ESP32:', error.message);
        res.status(500).json({ error: 'Error fetching sensor data from ESP32' });
    }
});

// Proxy endpoint for controlling motors
app.post('/motor-control', async (req, res) => {
    try {
        // Forward the motor control request to the ESP32
        const response = await axios.post('http://103.161.75.85:5000/motor-control', req.body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Forward the response from ESP32 to the frontend
         console.log("Motor control response from ESP32:", response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error forwarding motor control request:', error.message);
        res.status(500).json({ error: 'Error forwarding motor control request' });
    }
});

// Start the server on the specified port
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

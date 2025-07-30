// Simple test server to verify networking
const express = require('express');
const app = express();
const port = 8081;

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

app.post('/test-login', (req, res) => {
  console.log('Received login request:', req.body);
  res.json({ success: true, message: 'Login test successful' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on http://localhost:${port}`);
});
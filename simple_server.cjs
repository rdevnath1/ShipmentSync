const express = require('express');
const path = require('path');

const app = express();
const port = 8080;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Simple routes
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', message: 'Server is working!' });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  const { email, password } = req.body;
  
  if ((email === 'demo@client.com' || email === 'rajan@quikpik.io') && password === 'demo123') {
    res.json({
      success: true,
      user: {
        id: 1,
        email: email,
        firstName: 'Demo',
        lastName: 'User',
        role: 'client'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/auth/user', (req, res) => {
  res.json({
    user: {
      id: 1,
      email: 'demo@client.com',
      firstName: 'Demo',
      lastName: 'User',
      role: 'client'
    }
  });
});

app.get('/api/orders', (req, res) => {
  res.json({ orders: [], pendingCount: 0, shippedCount: 0 });
});

app.get('/api/rate-comparisons', (req, res) => {
  res.json({
    comparisons: [],
    stats: { totalSavings: 0, quikpikWinRate: 0, totalComparisons: 0 }
  });
});

// Catch all for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'), (err) => {
    if (err) {
      res.send(`
        <html>
          <body>
            <h1>Quikpik Server Running!</h1>
            <p>Server is working on port ${port}</p>
            <p>Frontend build not found, but APIs are working.</p>
            <h2>Test APIs:</h2>
            <ul>
              <li><a href="/api/health">/api/health</a></li>
              <li>POST /api/auth/login (use: demo@client.com / demo123)</li>
            </ul>
          </body>
        </html>
      `);
    }
  });
});

app.listen(port, () => {
  console.log('=================================');
  console.log('🚀 Quikpik Server Started!');
  console.log('=================================');
  console.log(`📍 URL: http://localhost:${port}`);
  console.log(`🔧 Health: http://localhost:${port}/api/health`);
  console.log('');
  console.log('Login credentials:');
  console.log('  📧 Email: demo@client.com');
  console.log('  🔑 Password: demo123');
  console.log('=================================');
});

// Handle server errors
app.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGINT', () => {
  console.log('\\nServer shutting down...');
  process.exit(0);
});
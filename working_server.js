// Working server configuration for debugging
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Server is working!'
  });
});

// Mock login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  
  const { email, password } = req.body;
  
  // Demo credentials
  if ((email === 'demo@client.com' || email === 'rajan@quikpik.io') && password === 'demo123') {
    const user = {
      id: email === 'rajan@quikpik.io' ? 1 : 2,
      email: email,
      firstName: email === 'rajan@quikpik.io' ? 'Master' : 'Demo',
      lastName: email === 'rajan@quikpik.io' ? 'Admin' : 'User',
      role: email === 'rajan@quikpik.io' ? 'master' : 'client',
      organizationId: email === 'rajan@quikpik.io' ? null : 1
    };
    
    res.json({
      success: true,
      user: user,
      message: 'Login successful'
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// Mock user endpoint
app.get('/api/auth/user', (req, res) => {
  // For now, return a mock user
  res.json({
    user: {
      id: 2,
      email: 'demo@client.com',
      firstName: 'Demo',
      lastName: 'User',
      role: 'client',
      organizationId: 1
    }
  });
});

// Mock orders endpoint
app.get('/api/orders', (req, res) => {
  res.json({
    orders: [],
    pendingCount: 0,
    shippedCount: 0
  });
});

// Mock rate comparisons endpoint
app.get('/api/rate-comparisons', (req, res) => {
  res.json({
    comparisons: [],
    stats: {
      totalSavings: 0,
      quikpikWinRate: 0,
      totalComparisons: 0
    }
  });
});

// Serve static files from client dist (if exists)
const clientDistPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDistPath));

// Catch-all handler for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Frontend not built. Run: cd client && npm run build');
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, '127.0.0.1', () => {
  console.log(`🚀 Working server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🔐 Login API: http://localhost:${port}/api/auth/login`);
  console.log('');
  console.log('Demo credentials:');
  console.log('  Email: demo@client.com');
  console.log('  Password: demo123');
});
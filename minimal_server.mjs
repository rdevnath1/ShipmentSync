import express from 'express';

const app = express();
const port = 3002;

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Minimal server working!', timestamp: new Date().toISOString() });
});

app.post('/test-login', (req, res) => {
  console.log('Login request:', req.body);
  res.json({ success: true, message: 'Login test successful', user: { email: req.body.email } });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Minimal test server running on http://localhost:${port}`);
});
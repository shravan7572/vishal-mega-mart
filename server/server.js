const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5050;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route for Render keepalive
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: states[dbState] || 'Unknown',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);

// Serve Frontend Static Files from /client
const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir));

// Fallback for HTML pages or 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(clientDir, '404.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server with automatic fallback for port conflicts
function startServer(port) {
  const currentPort = Number(port);
  const server = app.listen(currentPort, () => {
    console.log(`===============================================`);
    console.log(`[INFO] Vishal Mega Mart Server is running on port ${currentPort}`);
    console.log(`[INFO] Local URL:   http://localhost:${currentPort}`);
    console.log(`[INFO] Health Check: http://localhost:${currentPort}/health`);
    console.log(`===============================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[WARN] Port ${currentPort} is already in use. Retrying on port ${currentPort + 1}...`);
      startServer(currentPort + 1);
    } else {
      console.error('Server listen error:', err);
    }
  });

  return server;
}

startServer(PORT);

module.exports = app;

const express = require('express');
const cors = require('cors');
const path = require('path');

const dashboardRouter = require('./routes/dashboard');
const flatsRouter = require('./routes/flats');
const tenantsRouter = require('./routes/tenants');
const paymentsRouter = require('./routes/payments');
const expensesRouter = require('./routes/expenses');
const customersRouter = require('./routes/customers');
const authRouter = require('./routes/auth');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), app: 'NEST Backend API' });
});

// Mount Public Auth Routes
app.use('/api/auth', authRouter);

// Apply Auth Middleware to Protected API Routes
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/flats', requireAuth, flatsRouter);
app.use('/api/tenants', requireAuth, tenantsRouter);
app.use('/api/payments', requireAuth, paymentsRouter);
app.use('/api/expenses', requireAuth, expensesRouter);
app.use('/api/customers', requireAuth, customersRouter);

// Serve Web Dashboard (Desktop Website) and Mobile App (Frontend)
const fs = require('fs');
const frontendDist = path.join(__dirname, '../frontend/dist');
const webdashboardOut = path.join(__dirname, '../webdashboard/out');

// 1. Mobile App endpoints
if (fs.existsSync(frontendDist)) {
  app.use('/app', express.static(frontendDist));
  app.use('/mobile', express.static(frontendDist));
  app.get(['/app', '/app/*', '/mobile', '/mobile/*'], (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 2. Executive Web Dashboard (Desktop Website) at root
if (fs.existsSync(webdashboardOut)) {
  app.use(express.static(webdashboardOut));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api/') || req.url.startsWith('/images/')) {
      return next();
    }
    const cleanPath = req.path.replace(/\/+$/, '') || '/index';
    const candidateHtml = path.join(webdashboardOut, `${cleanPath}.html`);
    if (fs.existsSync(candidateHtml)) {
      return res.sendFile(candidateHtml);
    }
    const nestedIndex = path.join(webdashboardOut, cleanPath, 'index.html');
    if (fs.existsSync(nestedIndex)) {
      return res.sendFile(nestedIndex);
    }
    res.sendFile(path.join(webdashboardOut, 'index.html'));
  });
} else if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api/') || req.url.startsWith('/images/')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NEST Backend Server running at http://0.0.0.0:${PORT} (http://127.0.0.1:${PORT})`);
});

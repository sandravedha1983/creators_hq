const path = require('path');
// Load .env from current directory or backend folder
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');

const cors = require('cors');
const connectDB = require('./config/db');


const passport = require('./modules/auth/passport');

const app = express();
console.log("App Initializing...");
connectDB();

console.log("OAuth Config - Google Callback:", process.env.GOOGLE_CALLBACK_URL);
console.log("OAuth Config - LinkedIn Callback:", process.env.LINKEDIN_CALLBACK_URL);

app.use(passport.initialize());

// CORS: Use specific origin instead of wildcard when credentials are enabled
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Dynamically reflect the request origin to allow any client domain (Vercel, localhost, etc.)
        // while still supporting credentials: true
        callback(null, origin || '*');
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json());

app.use((req, res, next) => {
    console.log("API HIT:", req.method, req.url);
    next();
});

// ============================================================
// Health Check
// ============================================================
app.get('/health', (req, res) => {
    res.json({ 
        success: true, 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ============================================================
// Module Routes
// ============================================================
app.use('/api/auth', require('./modules/auth/routes'));
app.use('/api/verify', require('./modules/verification/routes'));
app.use('/api/dashboard', require('./modules/dashboard/routes'));
app.use('/api/integrations', require('./modules/integrations/routes'));
app.use('/api/ai', require('./modules/ai/routes'));
app.use('/api/admin', require('./modules/admin/routes'));

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend working' });
});

// OAuth routes moved to modules/auth/routes.js

app.use('/api/creators', require('./modules/creators/routes'));
app.use('/api/collaborations', require('./modules/collaborations/routes'));
app.use('/api/market', require('./modules/market/routes'));
app.use('/api/leads', require('./modules/leads/routes'));
app.use('/api/analytics', require('./modules/analytics/routes'));
app.use('/api/billing', require('./modules/billing/routes'));
app.use('/uploads', express.static('uploads'));
// app.use('/automation', require('./modules/automation/routes')); // Disable if Redis is not running

// ============================================================
// Convenience API Aliases (Phase 7 — API Audit)
// ============================================================
const { authenticate } = require('./middleware/auth');

// GET /api/profile → proxy to /api/auth/profile
app.get('/api/profile', authenticate, async (req, res, next) => {
    try {
        const authService = require('./modules/auth/services');
        const user = await authService.getProfile(req.user.id);
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// POST /api/login → proxy to /api/auth/login
app.post('/api/login', (req, res, next) => {
    req.url = '/login';
    require('./modules/auth/routes').handle(req, res, next);
});

// POST /api/signup → proxy to /api/auth/register
app.post('/api/signup', (req, res, next) => {
    req.url = '/register';
    require('./modules/auth/routes').handle(req, res, next);
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
    // JWT is stateless — client removes the token. Server acknowledges.
    res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/forgot-password → proxy to auth module
app.post('/api/forgot-password', (req, res, next) => {
    const authController = require('./modules/auth/controllers');
    authController.forgotPassword(req, res, next);
});

// POST /api/reset-password → proxy to auth module
app.post('/api/reset-password', (req, res, next) => {
    const authController = require('./modules/auth/controllers');
    authController.resetPassword(req, res, next);
});

// GET /api/dashboard → auto-route by role
app.get('/api/dashboard', authenticate, async (req, res, next) => {
    try {
        const dashboardModel = require('./modules/dashboard/models');
        const role = req.user.role;
        let stats;
        if (role === 'brand' || role === 'admin') {
            stats = await dashboardModel.getBrandStats(req.user.id);
        } else {
            stats = await dashboardModel.getCreatorStats(req.user.id);
        }
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
});


app.get("/", (req, res) => {
    res.send("CreatorsHQ Backend is running 🚀");
});

app.get("/test", (req, res) => {
    res.send("Server working");
});

// No frontend static serving - Frontend is deployed separately on a Static Site


// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error("ERROR:", err.message);
  
  // Handle Zod Validation Errors
  if (err.name === 'ZodError' || err.errors) {
    return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: err.errors || err.message 
    });
  }

  // Handle Auth Errors
  if (err.message.includes('Invalid email or password') || err.message.includes('User not found')) {
    return res.status(401).json({ success: false, message: err.message });
  }

  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal Server Error' 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
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
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.includes(origin) || 
                          origin.startsWith('http://localhost:') || 
                          origin.endsWith('.vercel.app');
                          
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json());

app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log("API HIT:", req.method, req.url);
    }
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
const authController = require('./modules/auth/controllers');

// GET /api/profile → proxy to /api/auth/profile
app.get('/api/profile', authenticate, authController.getProfile);

// POST /api/login → proxy to /api/auth/login
app.post('/api/login', authController.login);

// POST /api/signup → proxy to /api/auth/register
app.post('/api/signup', authController.register);

// POST /api/logout
app.post('/api/logout', (req, res) => {
    // JWT is stateless — client removes the token. Server acknowledges.
    res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/forgot-password → proxy to auth module
app.post('/api/forgot-password', authController.forgotPassword);

// POST /api/reset-password → proxy to auth module
app.post('/api/reset-password', authController.resetPassword);

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
  console.error("ERROR:", err.message || err);
  
  // Handle Zod Validation Errors
  if (err.name === 'ZodError' || err.errors) {
    return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: err.errors || err.message 
    });
  }

  // Handle Auth Errors
  if (err.message && (err.message.includes('Invalid email or password') || err.message.includes('User not found'))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password. Please check your credentials and try again.' });
  }

  if (err.message && err.message.includes('User already exists')) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  // Handle OTP errors
  if (err.message && (err.message.includes('Invalid OTP') || err.message.includes('OTP Expired'))) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Handle rate limit errors
  if (err.status === 429) {
    return res.status(429).json({ success: false, message: err.message });
  }

  // Sanitize generic internal server errors for production
  const isProduction = process.env.NODE_ENV === 'production';
  const status = err.status || 500;
  const message = isProduction ? 'An unexpected error occurred. Please try again.' : (err.message || 'Internal Server Error');

  res.status(status).json({ 
    success: false, 
    message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
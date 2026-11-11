const path = require('path');
// Load .env from current directory or backend folder
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');

const cors = require('cors');

const app = express();
console.log("App Initializing...");

// CORS: Use specific origin instead of wildcard when credentials are enabled
const localDevelopmentOrigins = process.env.NODE_ENV === 'development' ? [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000'
] : [];
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    ...(process.env.CORS_ALLOWED_ORIGINS || '').split(','),
    ...localDevelopmentOrigins
].filter(Boolean);
const normalizedAllowedOrigins = new Set(allowedOrigins.map(origin => {
    try {
        return new URL(origin.trim()).origin;
    } catch {
        return null;
    }
}).filter(Boolean));

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);

        if (normalizedAllowedOrigins.has(origin)) {
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

app.use('/api/creators', require('./modules/creators/routes'));
app.use('/api/collaborations', require('./modules/collaborations/routes'));
app.use('/api/market', require('./modules/market/routes'));
app.use('/api/leads', require('./modules/leads/routes'));
app.use('/api/notifications', require('./modules/notifications/routes'));
app.use('/api/feedback', require('./modules/feedback/routes'));
app.use('/api/analytics', require('./modules/analytics/routes'));
app.use('/api/billing', require('./modules/billing/routes'));
app.use('/api/waitlist', require('./modules/waitlist/routes'));
app.use('/uploads', express.static('uploads'));
// app.use('/automation', require('./modules/automation/routes')); // Disable if Redis is not running

// ============================================================
// Convenience API Aliases (Phase 7 — API Audit)
// ============================================================
const { authenticate } = require('./middleware/auth');
const authController = require('./modules/auth/controllers');

// GET /api/profile → proxy to /api/auth/profile
app.get('/api/profile', authenticate, authController.getProfile);

// GET /api/dashboard → auto-route by role
app.get('/api/dashboard', authenticate, async (req, res, next) => {
    try {
        const dashboardModel = require('./modules/dashboard/models');
        const role = req.user.role;
        let stats;
        if (role === 'brand' || role === 'admin') {
            stats = await dashboardModel.getBrandStats(req.user.id, req.supabase);
        } else {
            stats = await dashboardModel.getCreatorStats(req.user.id, req.supabase);
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
  const validationErrors = err.issues || err.errors;
  if (err.name === 'ZodError' || validationErrors) {
    return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validationErrors || err.message
    });
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
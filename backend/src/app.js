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

app.use(cors({
    origin: "*",
    credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
    console.log("API HIT:", req.method, req.url);
    next();
});

app.use('/api/auth', require('./modules/auth/routes'));
app.use('/api/verify', require('./modules/verification/routes'));
app.use('/api/dashboard', require('./modules/dashboard/routes'));
app.use('/api/integrations', require('./modules/integrations/routes'));
app.use('/api/ai', require('./modules/ai/routes'));
app.use('/api/admin', require('./modules/admin/routes'));

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend working' });
});

// Google OAuth
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = req.user.token;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${FRONTEND_URL}/dashboard-redirect?token=${token}`);
  }
);

// LinkedIn OAuth
app.get("/auth/linkedin",
  passport.authenticate("linkedin", { scope: ["openid", "profile", "email"], state: 'SOME_STATE' })
);

app.get("/auth/linkedin/callback",
  passport.authenticate("linkedin", { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = req.user.token;
    const frontendURL = (process.env.FRONTEND_URL || 'https://creators-hq.onrender.com').replace(/\/$/, '');
    res.redirect(`${frontendURL}/dashboard-redirect?token=${token}`);
  }
);

app.use('/api/creators', require('./modules/creators/routes'));
app.use('/api/collaborations', require('./modules/collaborations/routes'));
app.use('/api/market', require('./modules/market/routes'));
app.use('/api/leads', require('./modules/leads/routes'));
app.use('/api/analytics', require('./modules/analytics/routes'));
app.use('/api/billing', require('./modules/billing/routes'));
app.use('/uploads', express.static('uploads'));
// app.use('/automation', require('./modules/automation/routes')); // Disable if Redis is not running


app.get("/", (req, res) => {
    res.send("CreatorsHQ Backend is running 🚀");
});

app.get("/test", (req, res) => {
    res.send("Server working");
});

// No frontend static serving - Frontend is deployed separately on a Static Site


app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
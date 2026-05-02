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

// OAuth routes moved to modules/auth/routes.js

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
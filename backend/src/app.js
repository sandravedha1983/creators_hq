require('dotenv').config();
const express = require('express');

const cors = require('cors');
const connectDB = require('./config/db');

const session = require('express-session');
const passport = require('./modules/auth/passport');

const app = express();
console.log("App Initializing...");
connectDB();

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
    origin: "*",
    credentials: true
}));

app.use(express.json());

app.use('/auth', require('./modules/auth/routes'));
app.use('/api/verify', require('./modules/verification/routes'));
app.use('/api/dashboard', require('./modules/dashboard/routes'));
app.use('/api/integrations', require('./modules/integrations/routes'));

app.use('/creators', require('./modules/creators/routes'));
app.use('/collaborations', require('./modules/collaborations/routes'));
app.use('/market', require('./modules/market/routes'));
app.use('/leads', require('./modules/leads/routes'));
app.use('/analytics', require('./modules/analytics/routes'));
app.use("/api/ai", require('./modules/ai/routes'));
app.use('/billing', require('./modules/billing/routes'));
app.use('/uploads', express.static('uploads'));
// app.use('/automation', require('./modules/automation/routes')); // Disable if Redis is not running


app.get("/", (req, res) => {
    res.send("CreatorsHQ Backend is running 🚀");
});

app.get("/test", (req, res) => {
    res.send("Server working");
});


app.use(require('./middleware/error'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
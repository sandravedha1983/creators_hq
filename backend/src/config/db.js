const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = (process.env.MONGO_URI || "").trim();
    if (!uri) {
      console.error("CRITICAL: MONGO_URI is missing. If you are on Render, add it to Environment Variables.");
      throw new Error("MONGO_URI is missing");
    }
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected Successfully ✅");
  } catch (err) {
    console.error("Database Connection Failed ❌:", err.message);
    process.exit(1);
  }
};


module.exports = connectDB;

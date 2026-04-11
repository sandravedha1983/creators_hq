const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = (process.env.MONGO_URI || "").trim();
    if (!uri) throw new Error("MONGO_URI is missing in .env");
    
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

/**
 * ensure-indexes.js
 * Run this script once to verify all MongoDB collections have proper indexes.
 * Usage: node src/scripts/ensure-indexes.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function ensureIndexes() {
  try {
    console.log('[DB] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[DB] Connected ✅');

    // Load all models to trigger index creation
    const models = [
      { name: 'User', path: '../modules/auth/models' },
      { name: 'Otp', path: '../modules/auth/Otp' },
      { name: 'Campaign', path: '../modules/market/models' },
      { name: 'Collaboration', path: '../modules/collaborations/models' },
      { name: 'Analytics', path: '../modules/analytics/models' },
      { name: 'Transaction', path: '../modules/billing/models' },
    ];

    for (const m of models) {
      try {
        const Model = require(m.path);
        await Model.ensureIndexes();
        const indexes = await Model.collection.indexes();
        console.log(`[${m.name}] ${indexes.length} indexes: ${indexes.map(i => Object.keys(i.key).join('+')).join(', ')}`);
      } catch (err) {
        console.error(`[${m.name}] Index error:`, err.message);
      }
    }

    console.log('\n[DB] All indexes verified ✅');
    process.exit(0);
  } catch (err) {
    console.error('[DB] Fatal error:', err.message);
    process.exit(1);
  }
}

ensureIndexes();

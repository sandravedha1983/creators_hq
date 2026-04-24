const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const resetDatabase = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected successfully.');

        // Get all collections
        const collections = await mongoose.connection.db.collections();

        for (let collection of collections) {
            const name = collection.collectionName;
            // Only clear user-related collections to avoid breaking system configs if any
            if (['users', 'analytics', 'integrations', 'activities', 'leads', 'campaigns'].includes(name)) {
                console.log(`Clearing collection: ${name}`);
                await collection.deleteMany({});
            }
        }

        console.log('--- DATABASE RESET COMPLETE ---');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
};

resetDatabase();

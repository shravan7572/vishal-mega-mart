const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vishal_mega_mart';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[INFO] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Auto-seed grocery catalog if collection is empty
    const Product = require('../models/Product');
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log(`[INFO] Empty database detected. Auto-seeding grocery catalog categories and products...`);
      const { seedData } = require('./seedHelper');
      await seedData();
    }

    return true;
  } catch (error) {
    console.warn(`[WARN] Could not connect to external MongoDB at "${mongoUri}": ${error.message}`);
    console.log(`[INFO] Launching embedded MongoMemoryServer fallback for seamless development...`);

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const inMemoryUri = mongodInstance.getUri();

      await mongoose.connect(inMemoryUri);
      console.log(`[INFO] Embedded MongoDB Memory Server started successfully at ${inMemoryUri}`);

      // Auto seed in-memory grocery catalog if empty
      const Product = require('../models/Product');
      const productCount = await Product.countDocuments();
      if (productCount === 0) {
        console.log(`[INFO] Auto-seeding grocery catalog categories and products into in-memory database...`);
        const { seedData } = require('./seedHelper');
        await seedData();
      }

      return true;
    } catch (memError) {
      console.error(`[ERROR] Failed to start in-memory MongoDB fallback:`, memError.message);
      return false;
    }
  }
};

module.exports = connectDB;

const mongoose = require('mongoose');

let isConnected = false;

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected — will retry');
  isConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
  isConnected = true;
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Race the connect against our own timeout: on Railway's private network the
// initial DNS/socket can hang and never resolve *or* reject, which would block
// boot forever. The guard turns that hang into a retryable error.
function connectOnce(uri) {
  return Promise.race([
    mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, socketTimeoutMS: 45000 }),
    sleep(15000).then(() => { throw new Error('connect timed out after 15s'); }),
  ]);
}

// Connect in the background, retrying forever. Never exits the process, so the
// HTTP server stays up (and the health check keeps passing) even while Mongo
// is briefly unreachable at cold start.
async function connectDB() {
  if (isConnected) return;

  // Railway injects MONGODB_URL automatically from the MongoDB plugin.
  // Fallback to local for development.
  const uri = process.env.MONGODB_URL || 'mongodb://localhost:27017/auranet';

  for (let attempt = 1; !isConnected; attempt++) {
    try {
      console.log(`⏳ Connecting to MongoDB (attempt ${attempt})…`);
      await connectOnce(uri);
      isConnected = true;
      console.log('✅ MongoDB connected:', uri.replace(/\/\/.*@/, '//***@'));
    } catch (err) {
      console.error(`❌ MongoDB connection failed (attempt ${attempt}):`, err.message);
      try { await mongoose.disconnect(); } catch {}
      await sleep(5000);
    }
  }
}

module.exports = { connectDB };

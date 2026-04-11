import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const MAX_MONGODB_RETRIES = Number(process.env.MONGODB_CONNECT_RETRIES ?? 3);
const MONGODB_RETRY_DELAY_MS = Number(process.env.MONGODB_RETRY_DELAY_MS ?? 2000);

async function connectWithRetry(attempt = 1) {
  const opts = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    const connection = await mongoose.connect(MONGODB_URI, opts);
    console.log('Connected to MongoDB');
    return connection;
  } catch (error) {
    if (attempt >= MAX_MONGODB_RETRIES) {
      console.error(`MongoDB connection failed after ${attempt} attempts`, error);
      throw error;
    }

    console.warn(`MongoDB connection attempt ${attempt} failed. Retrying in ${MONGODB_RETRY_DELAY_MS}ms...`, error.message);
    await new Promise((resolve) => setTimeout(resolve, MONGODB_RETRY_DELAY_MS));
    return connectWithRetry(attempt + 1);
  }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = connectWithRetry();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('Failed to connect to MongoDB:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;

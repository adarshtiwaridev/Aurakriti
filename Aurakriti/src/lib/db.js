import mongoose from "mongoose";
import { createLogger } from "@/lib/logger";

const logger = createLogger("db");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const MAX_MONGODB_RETRIES = Number(process.env.MONGODB_CONNECT_RETRIES ?? 3);
const MONGODB_RETRY_DELAY_MS = Number(process.env.MONGODB_RETRY_DELAY_MS ?? 2000);

async function connectWithRetry(attempt = 1) {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI in .env.local");
  }

  // ✅ Correct options object
  const opts = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    const connection = await mongoose.connect(MONGODB_URI, opts);
    logger.info("MongoDB connected successfully");
    return connection;
  } catch (error) {
    if (attempt >= MAX_MONGODB_RETRIES) {
      logger.error(`MongoDB failed after ${attempt} attempts`, error);
      throw error;
    }

    logger.warn(`Retrying MongoDB connection, attempt ${attempt}`);

    await new Promise((resolve) =>
      setTimeout(resolve, MONGODB_RETRY_DELAY_MS)
    );

    return connectWithRetry(attempt + 1);
  }
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = connectWithRetry();
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectDB;

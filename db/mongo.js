// db/mongo.js
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

// ✅ ADD THIS CHECK
if (!MONGO_URI) {
  console.error("❌ MONGODB_URI is not defined in environment variables!");
  console.error("Please set MONGODB_URI in your .env file or Render dashboard");
  process.exit(1);
}

let db;
let client;

export async function connectToDatabase() {
  if (db) {
    return db;
  }

  try {
    console.log("🔗 Connecting to MongoDB...");
    
    client = new MongoClient(MONGO_URI);
    await client.connect();
    
    db = client.db();
    
    console.log("✅ Connected to MongoDB: tokicard_offramp");
    
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

// ✅ ADD THIS FUNCTION (THIS IS WHAT'S MISSING!)
export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connectToDatabase first.");
  }
  return db;
}

// ✅ ALSO ADD THIS (for graceful shutdown)
export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    console.log("✅ MongoDB connection closed");
  }
}

// ✅ ADD THIS FUNCTION TOO (for creating indexes)
async function createIndexes() {
  try {
    // Users collection indexes
    await db.collection("users").createIndex({ phone: 1 }, { unique: true });
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    
    // Sessions collection indexes
    await db.collection("sessions").createIndex({ phone: 1 }, { unique: true });
    await db.collection("sessions").createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );
    
    console.log("✅ Database indexes created");
  } catch (error) {
    console.log("ℹ️ Indexes may already exist");
  }
}
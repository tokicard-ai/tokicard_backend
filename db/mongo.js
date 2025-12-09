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

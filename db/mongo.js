// db/mongo.js - MongoDB connection for bot
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let db = null;
let client = null;

export async function connectToMongo() {
  try {
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      throw new Error("MONGO_URI not found in .env file");
    }

    client = new MongoClient(uri);
    await client.connect();
    
    // Use the same database as your website backend
    db = client.db("tokicard");
    
    console.log("✅ MongoDB connected successfully");
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connectToMongo() first");
  }
  return db;
}

export async function closeConnection() {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

// import { MongoClient } from "mongodb";
// import dotenv from "dotenv";

// dotenv.config();

// let db = null;
// let client = null;

// export async function connectToMongo() {
//   try {
//     const uri = process.env.MONGO_URI;
    
//     if (!uri) {
//       throw new Error("MONGO_URI not found in .env file");
//     }

//     client = new MongoClient(uri);
//     await client.connect();
    
//     db = client.db("tokicard");
    
//     console.log("✅ MongoDB connected successfully");
//     return db;
//   } catch (error) {
//     console.error("❌ MongoDB connection failed:", error);
//     process.exit(1);
//   }
// }

// export function getDb() {
//   if (!db) {
//     throw new Error("Database not initialized. Call connectToMongo() first");
//   }
//   return db;
// }

// export async function closeConnection() {
//   if (client) {
//     await client.close();
//     console.log("MongoDB connection closed");
//   }
// }
// db/mongo.js

// db/mongo.js
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

let db;
let client;

export async function connectToDatabase() {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    
    db = client.db();
    
    console.log("✅ Connected to MongoDB: tokicard_offramp");
    
    // Create indexes for better performance
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connectToDatabase first.");
  }
  return db;
}

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

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    console.log("✅ MongoDB connection closed");
  }
}
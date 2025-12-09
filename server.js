// import express from "express";
// import bodyParser from "body-parser";
// import dotenv from "dotenv";
// import whatsappRoutes from "./routes/whatsapp.js";
// import webhookRoutes from "./routes/webhooks.js";
// import { connectToMongo } from "./db/mongo.js";
// import { startStatusChecker } from "./services/statusChecker.js";

// dotenv.config();

// const app = express();
// app.use(bodyParser.json());
// app.use("/whatsapp", whatsappRoutes);
// app.use("/webhooks", webhookRoutes);

// app.get("/", (req, res) => {
//   res.send("✅ Toki bot server is working!");
// });

// const PORT = process.env.PORT || 5000;

// async function startServer() {
//   try {
//     await connectToMongo();
//     console.log("✅ MongoDB ready");
    
//     app.listen(PORT, () => {
//       console.log(`🚀 Toki bot running on port ${PORT}`);
//     });
    
//     setTimeout(() => {
//       console.log("🤖 Starting status checker...");
//       startStatusChecker(30);
//     }, 5000);
    
//   } catch (error) {
//     console.error("❌ Failed to start server:", error);
//     process.exit(1);
//   }
// }

// startServer();

// server.js
import express from "express";
import dotenv from "dotenv";
import { connectToDatabase, closeDatabaseConnection } from "./db/mongo.js";
import whatsappRoutes from "./routes/whatsapp.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({ 
    status: "🚀 Tokicard AI Off-Ramp Bot is running!",
    timestamp: new Date().toISOString()
  });
});

// WhatsApp webhook routes
// app.use("/webhook", whatsappRoutes);
app.use("/whatsapp", whatsappRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("❌ Server error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Start Express server
    app.listen(PORT, () => {
   console.log(`✅ Server running on port ${PORT}`);
console.log(`📱 WhatsApp webhook: https://tokicard-backend-wvkv.onrender.com/webhook`);
    });
    
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏹️  Shutting down gracefully...");
  await closeDatabaseConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⏹️  Shutting down gracefully...");
  await closeDatabaseConnection();
  process.exit(0);
});

// Start the server
startServer();
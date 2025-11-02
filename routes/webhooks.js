import express from "express";
import axios from "axios";
import { db } from "../firebase.js";
import { sendMessage } from "../utils/sendMessage.js";

const router = express.Router();

// ✅ WhatsApp webhook verification (required by Meta)
router.get("/", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ WhatsApp Webhook verified successfully!");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// ✅ WhatsApp webhook message receiver + auto-reply
router.post("/", async (req, res) => {
  console.log("📩 WhatsApp webhook event:", JSON.stringify(req.body, null, 2));

  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (message && message.text) {
      const from = message.from; // sender's WhatsApp number
      const userText = message.text.body.toLowerCase();

      console.log("💬 Message received from:", from, "→", userText);

      // ✅ Basic reply logic
      let reply;
      if (userText.includes("hi") || userText.includes("hello")) {
        reply = "👋 Hi there! I’m Toki  , your virtual assistant. How can I help you today?";
      } else if (userText.includes("help")) {
        reply = "🧾 You can ask me about your card, KYC, or payments. Try typing 'card' or 'kyc'.";
      } else if (userText.includes("card")) {
        reply = "💳 Your card service is active! You can type 'kyc' to check verification status.";
      } else if (userText.includes("kyc")) {
        reply = "🔍 Your KYC verification is in progress. You’ll get notified once it’s approved.";
      } else {
        reply = "🤖 Sorry, I didn’t get that. Type 'help' to see what I can do!";
      }

      // ✅ Send reply via WhatsApp Cloud API
      await axios.post(
        `https://graph.facebook.com/v17.0/${process.env.PHONE_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: reply },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Reply sent successfully to:", from);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error handling webhook:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});

// ✅ KYC webhook (from Sumsub / IdentityPass)
router.post("/kyc", async (req, res) => {
  const { userId, status } = req.body;

  if (status === "approved") {
    await db.collection("users").doc(userId).update({ kycStatus: "approved" });

    const user = await db.collection("users").doc(userId).get();
    await sendMessage(user.data().phone, "✅ KYC approved! Type 'activate' to continue.");
  }

  res.sendStatus(200);
});

// ✅ Payment webhook (from Paystack / NOWPayments)
router.post("/payment", async (req, res) => {
  const { userId, amount, status } = req.body;

  if (status === "confirmed") {
    const userRef = db.collection("users").doc(userId);
    const user = await userRef.get();

    await userRef.update({
      cardActive: true,
      annualFeePaid: true,
    });

    await sendMessage(
      user.data().phone,
      `💳 Payment of $${amount} confirmed! Your card is now active.`
    );
  }

  res.sendStatus(200);
});

export default router;

import express from "express";
import natural from "natural";
import { sendMessage } from "../utils/sendMessage.js";
import { db } from "../firebase.js";

const router = express.Router();

/* ------------------------------------------------------
   🔐 WEBHOOK VERIFICATION (REQUIRED BY META)
------------------------------------------------------- */
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

/* ------------------------------------------------------
   🔢 RANDOM CARD GENERATOR
------------------------------------------------------- */
function generateCard() {
  return {
    number: Array(16)
      .fill(0)
      .map(() => Math.floor(Math.random() * 10))
      .join("")
      .match(/.{1,4}/g)
      .join(" "),
    expiry:
      String(Math.floor(Math.random() * 12) + 1).padStart(2, "0") +
      "/" +
      (Math.floor(Math.random() * 5) + 26), // 2026–2031
    cvv: Math.floor(100 + Math.random() * 900).toString(),
    billingAddress: `${Math.floor(100 + Math.random() * 900)} Pine Street, San Francisco, CA`,
    createdAt: new Date(),
  };
}

/* ------------------------------------------------------
   📩 HANDLE INCOMING WHATSAPP MESSAGES
------------------------------------------------------- */
router.post("/", async (req, res) => {
  try {
    console.log("📦 Incoming webhook:", JSON.stringify(req.body, null, 2));

    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.sendStatus(200);

    const from = message.from;

    const text =
      message.text?.body?.trim().toLowerCase() ||
      message.interactive?.button_reply?.title?.toLowerCase() ||
      "";

    console.log("📩 Message received:", from, text);

    /* ------------------------------------------------------
       🧠 NLP SETUP
    ------------------------------------------------------- */
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text.toLowerCase());

    const intents = {
      register: [
        "register",
        "signup",
        "sign up",
        "create",
        "join",
        "get started",
        "start",
        "open registration",
      ],
      kyc: ["kyc", "verify", "verification", "identity", "id", "verify id", "confirm identity"],
      activate: ["activate", "activate card", "enable card", "card activation"],
      fund: ["fund", "deposit", "add money", "recharge", "add funds", "fund wallet"],
      balance: ["balance", "check balance", "remaining"],
      help: ["help", "support", "assist"],
      about: [
        "what is toki",
        "what is toki card",
        "toki card",
        "about",
        "toki info",
        "tell me about toki",
      ],
      how: ["how", "how it works", "how does it work"],
      security: ["safe", "secure", "security", "fraud", "scam", "legit"],
      fees: ["fee", "price", "charges", "payment"],
      features: ["features", "benefits", "advantages"],
      referral: ["refer", "referral", "invite"],
      crypto: ["crypto", "bitcoin", "usdt"],
      fiat: ["bank", "transfer", "fiat"],
      acknowledge: ["ok", "okay", "alright", "cool", "thanks"],
      followup: ["what next", "continue", "proceed"],
      card: ["card", "card details", "show card", "virtual card"],
    };

    let userIntent = null;

    for (const [intent, keywords] of Object.entries(intents)) {
      if (
        keywords.some(
          (keyword) => text.includes(keyword) || tokens.some((t) => keyword.includes(t))
        )
      ) {
        userIntent = intent;
        break;
      }
    }

    if (!userIntent) {
      let bestMatch = { intent: null, score: 0 };

      for (const [intent, keywords] of Object.entries(intents)) {
        for (const keyword of keywords) {
          const score = natural.JaroWinklerDistance(text, keyword);
          if (score > bestMatch.score) bestMatch = { intent, score };
        }
      }

      if (bestMatch.score > 0.85) userIntent = bestMatch.intent;
    }

    console.log("🎯 Detected intent:", userIntent);

    /* ------------------------------------------------------
       👋 GREETING
    ------------------------------------------------------- */
    if (["hi", "hello", "hey", "hi toki"].some((g) => text.includes(g))) {
      await sendMessage(
        from,
        "👋 Welcome to *Toki Card*! What would you like to do?",
        [{ label: "Fund" }, { label: "Balance" }, { label: "About" }]
      );
      return res.sendStatus(200);
    }

    /* ------------------------------------------------------
       🧠 INTENT: CARD DETAILS (NEW)
    ------------------------------------------------------- */
    if (userIntent === "card") {
      const userRef = db.collection("users").doc(from);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        await sendMessage(
          from,
          "⚠️ Please *register first* before accessing your virtual card.\n\nType *register* to continue.",
          [{ label: "Register" }]
        );
        return res.sendStatus(200);
      }

      let card = userDoc.data().card;

      if (!card) {
        card = generateCard();
        await userRef.update({ card });
      }

      // Message 1: expiry, cvv, billing address
      await sendMessage(
        from,
        `💳 *Your Toki USD Virtual Card*\n\n` +
          `▪️ *Expiry:* ${card.expiry}\n` +
          `▪️ *CVV:* ${card.cvv}\n` +
          `▪️ *Billing Address:* ${card.billingAddress}\n\n` +
          `👉 *Card number will be sent next.*`,
        [{ label: "Fund" }, { label: "Balance" }, { label: "Help" }]
      );

      // Message 2: card number only
      await sendMessage(
        from,
        `🔢 *Card Number*\n${card.number}\n\n👉 Tap & hold to copy.`,
        []
      );

      return res.sendStatus(200);
    }

    /* ------------------------------------------------------
       📧 HANDLE EMAIL INPUT
    ------------------------------------------------------- */
    if (text.includes("@")) {
      const email = text.trim().toLowerCase();
      const waitlistSnapshot = await db.collection("waitlist").orderBy("timestamp", "asc").get();

      const waitlistEntries = waitlistSnapshot.docs.map((doc) => doc.data());
      const userIndex = waitlistEntries.findIndex((entry) => entry.email.toLowerCase() === email);

      const isWaitlisted = userIndex !== -1;

      await db.collection("users").doc(from).set({
        phone: from,
        email,
        kycStatus: "pending",
        cardActive: false,
        annualFeePaid: false,
        isWaitlisted,
        createdAt: new Date(),
      });

      if (isWaitlisted) {
        await sendMessage(
          from,
          `🎉 Welcome back, ${
            waitlistEntries[userIndex].fullName || "Toki user"
          }!\nYou're on our waitlist — your Toki Card activation details will be shared soon.`,
          [{ label: "KYC" }]
        );
      } else {
        await sendMessage(from, "✅ Account created successfully!", [{ label: "KYC" }]);
      }

      return res.sendStatus(200);
    }

    /* ------------------------------------------------------
       DEFAULT FALLBACK
    ------------------------------------------------------- */
    await sendMessage(
      from,
      "🤖 I didn’t quite understand that.\nTry typing *help* or choose an option 👇",
      [{ label: "Help" }, { label: "Register" }]
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error("❌ WhatsApp route error:", error);
    res.sendStatus(500);
  }
});

export default router;

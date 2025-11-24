// routes/whatsapp.js → FINAL VERSION WITH EVERYTHING YOU WANT
import express from "express";
import axios from "axios";
import natural from "natural";
import { sendMessage, sendButtons } from "../utils/sendMessage.js";

const router = express.Router();
const tokenizer = new natural.WordTokenizer();

const API_BASE = process.env.API_BASE || "https://tokicard-backendatabase.onrender.com/auth";
const WEBAPP = "https://tokicard-onboardingform.onrender.com";

const userCache = new Map();

async function getUser(phone) {
  if (userCache.has(phone)) return userCache.get(phone);
  try {
    const res = await axios.get(`${API_BASE}/user`, { params: { email: phone }, timeout: 8000 });
    const user = res.data;
    userCache.set(phone, user);
    return user;
  } catch (err) {
    userCache.set(phone, null);
    return null;
  }
}

function clearCache(phone) {
  userCache.delete(phone);
}

// ====================== WEBHOOK ======================
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ====================== MAIN HANDLER ======================
router.post("/", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = (message.text?.body || "").trim().toLowerCase();
    const buttonId = message.interactive?.button_reply?.id;

    const user = await getUser(from);

    // ====================== BUTTON ACTIONS ======================
    if (buttonId === "OPEN_WEB") {
      const link = user?.fundingCompleted ? `${WEBAPP}/dashboard?phone=${from}`
        : user?.kycBasicCompleted ? `${WEBAPP}/funding?phone=${from}`
        : `${WEBAPP}/?phone=${from}`;
      await sendMessage(from, `Opening your dashboard...\n${link}`);
      return res.sendStatus(200);
    }

    // ====================== NATURAL LANGUAGE ======================
    const words = tokenizer.tokenize(text) || [];
    const intents = {
      greeting: ["hi", "hello", "hey", "start", "good morning", "gm", "helo"],
      about: ["about", "what is toki", "what is this", "explain", "wetin be this"],
      how: ["how", "how it works", "how do i", "how to get card", "abeg how"],
      balance: ["balance", "wallet", "money"],
      card: ["card", "my card", "show card", "view card"],
      activate: ["activate card", "activate", "i paid", "paid", "done", "i have paid", "abeg activate"],
      support: ["support", "help me", "problem", "issue", "contact"],
      menu: ["menu", "options", "what can i do"]
    };

    let intent = null;
    for (const [key, keywords] of Object.entries(intents)) {
      if (keywords.some(k => words.includes(k))) { intent = key; break; }
    }

    // ====================== ABOUT TOKI CARD ======================
    if (intent === "about") {
      await sendMessage(from,
        `*Toki Card – Your USD Virtual Card from Nigeria*\n\n` +
        `• Spend online worldwide\n` +
        `• Pay Netflix, Amazon, Apple, etc.\n` +
        `• No bank account needed\n` +
        `• $5 one-time activation\n` +
        `• Get card in 2 minutes via WhatsApp\n\n` +
        `Over 5,000 Nigerians already using it!`
      );
      await sendButtons(from, "Ready to get yours?", [
        { id: "OPEN_WEB", title: "Get My Card Now" }
      ]);
      return res.sendStatus(200);
    }

    // ====================== HOW IT WORKS ======================
    if (intent === "how") {
      await sendMessage(from,
        `*How Toki Card Works (2 Minutes)*\n\n` +
        `1️⃣ Say *hi* → complete profile\n` +
        `2️⃣ Pay $5 (₦7,500) one-time\n` +
        `3️⃣ Type *activate card*\n` +
        `4️⃣ Type *card* → get your USD card instantly\n\n` +
        `That’s all. No stories.`
      );
      await sendButtons(from, "Start now?", [
        { id: "OPEN_WEB", title: "Yes, Get My Card" }
      ]);
      return res.sendStatus(200);
    }

    // ====================== SUPPORT ======================
    if (intent === "support") {
      await sendMessage(from,
        `Need help?\n\n` +
        `We're here 24/7!\n` +
        `Just type your issue and we'll reply fast.\n\n` +
        `Or message @tokicard_support on WhatsApp`
      );
      return res.sendStatus(200);
    }

    // ====================== MAIN MENU (RICH & FULL) ======================
    if (intent === "menu" || intent === "greeting" || !text) {
      const name = user?.firstName ? ` ${user.firstName.split(" ")[0]}!` : "!";

      await sendMessage(from, `Hey${name} Welcome to *Toki Card*`);

      const buttons = [
        { id: "OPEN_WEB", title: user?.fundingCompleted ? "Open Dashboard" : user?.kycBasicCompleted ? "Activate Card ($5)" : "Get Started" },
        { title: "About Toki Card", id: "about" },
        { title: "How It Works", id: "how" },
        { title: "Support", id: "support" }
      ];

      if (user?.kycBasicCompleted) buttons.splice(1, 0, { title: "Check Balance", id: "balance" });
      if (user?.fundingCompleted) buttons.splice(1, 0, { title: "View My Card", id: "card" });

      await sendButtons(from, "Choose an option:", buttons);
      return res.sendStatus(200);
    }

    // ====================== ACTIVATE CARD ======================
    if (intent === "activate") {
      if (!user) { await sendMessage(from, "Say *hi* first"); return res.sendStatus(200); }
      if (!user.kycBasicCompleted) { await sendMessage(from, "Complete your profile first! Say *hi*"); return res.sendStatus(200); }
      if (user.fundingCompleted) { await sendMessage(from, "Already activated! Type *card*"); return res.sendStatus(200); }

      await axios.post(`${API_BASE}/kyc-funding`, { email: user.email || from, amount: 5 });
      clearCache(from);

      await sendMessage(from, `*Congratulations!* Your Toki Card is now active!\nType *card* to see it`);
      return res.sendStatus(200);
    }

    // ====================== CARD & BALANCE (same as before) ======================
    if (intent === "card") {
      if (!user?.fundingCompleted) { await sendMessage(from, "Activate first! Type *activate card*"); return res.sendStatus(200); }
      if (!user.card?.number) { await sendMessage(from, "Card generating... wait 30 secs"); return res.sendStatus(200); }

      const card = user.card;
      await sendMessage(from,
        `*Your Toki USD Card*\n\n` +
        `Number: \`${card.number}\`\n` +
        `Expiry: ${card.expiry} • CVV: ${card.cvv}\n\n` +
        `_Tap & hold to copy_`
      );
      return res.sendStatus(200);
    }

    if (intent === "balance") {
      await sendMessage(from, `Balance: *$${user?.fundedAmount || 0}.00 USD*`);
      return res.sendStatus(200);
    }

    // ====================== DEFAULT ======================
    await sendButtons(from, "Main Menu:", [
      { id: "OPEN_WEB", title: "Continue →" },
      { title: "About", id: "about" },
      { title: "How It Works", id: "how" }
    ]);

    return res.sendStatus(200);

  } catch (err) {
    console.error("Bot error:", err.message);
    await sendMessage(from, "Small wahala. Try again");
    res.sendStatus(500);
  }
});

export default router;
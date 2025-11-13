import express from "express";
import natural from "natural";
import { sendMessage } from "../utils/sendMessage.js";
import { db } from "../firebase.js";

const router = express.Router();

/* --------------------------- CARD GENERATOR --------------------------- */
function generateCard() {
  const zeroWidth = "\u200B"; // ZERO-WIDTH JOINER

  const randomNumber = () => {
    const raw = Array(4)
      .fill(0)
      .map(() => Math.floor(1000 + Math.random() * 9000).toString());

    // join using zero-width to stop WhatsApp auto-formatting
    return raw.join(zeroWidth);
  };

  const expiryMonth = ("0" + Math.floor(1 + Math.random() * 12)).slice(-2);
  const expiryYear = 26 + Math.floor(Math.random() * 6);

  const cvv = Math.floor(100 + Math.random() * 900);

  const addresses = [
    "55 Madison Ave, New York, NY",
    "1208 Sunset Blvd, Los Angeles, CA",
    "322 Park Ave, Miami, FL",
    "44 Wall Street, New York, NY",
    "270 Pine St, San Francisco, CA",
  ];

  return {
    number: randomNumber(), // zero-width protected number
    expiry: `${expiryMonth}/${expiryYear}`,
    cvv: cvv.toString(),
    billingAddress: addresses[Math.floor(Math.random() * addresses.length)],
  };
}

/* ---------------------- META WEBHOOK VERIFICATION --------------------- */
router.get("/", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ WhatsApp Webhook verified successfully!");
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
  return res.sendStatus(400);
});

/* ----------------------------- MAIN ROUTER ----------------------------- */
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

    /* ----------------------------- INTENTS ----------------------------- */
    const intents = {
      register: ["register", "signup", "create", "start"],
      kyc: ["kyc", "verify", "identity"],
      activate: ["activate"],
      fund: ["fund", "top up", "deposit"],
      balance: ["balance", "wallet"],
      help: ["help", "support"],
      about: ["toki", "about", "what is"],
      how: ["how", "how it works"],
      security: ["safe", "secure"],
      fees: ["fee", "cost"],
      features: ["features", "benefits"],
      referral: ["refer", "invite"],
      crypto: ["crypto", "usdt"],
      fiat: ["bank", "fiat"],

      // ⭐ new card intent
      card: [
        "show card",
        "card details",
        "show card details",
        "my card",
        "virtual card",
        "card info",
        "show my card",
      ],
    };

    let userIntent = null;
    for (const [intent, list] of Object.entries(intents)) {
      if (list.some((kw) => text.includes(kw))) {
        userIntent = intent;
        break;
      }
    }

    console.log("🎯 Intent =", userIntent);

    /* ----------------------------------------------------------------------
       ⭐⭐⭐ CARD DETAILS — 2 MESSAGES — ZERO-WIDTH PROTECTED NUMBER
    ---------------------------------------------------------------------- */
    if (userIntent === "card") {
      const ref = db.collection("users").doc(from);
      const doc = await ref.get();

      if (!doc.exists) {
        await sendMessage(
          from,
          "⚠️ Please *register* first to get a Toki virtual card.",
          [{ label: "Register" }]
        );
        return res.sendStatus(200);
      }

      let card = doc.data().card;

      if (!card) {
        card = generateCard();
        await ref.update({ card });
      }

      // FIRST MESSAGE (no card number)
      await sendMessage(
        from,
        `💳 *Your Toki USD Virtual Card*\n\n` +
          `▪️ *Expiry:* ${card.expiry}\n` +
          `▪️ *CVV:* ${card.cvv}\n` +
          `▪️ *Billing Address:* ${card.billingAddress}\n\n` +
          `👉 Your *card number* will be sent next.`,
        [{ label: "Fund" }, { label: "Help" }]
      );

      // SECOND MESSAGE — zero-width protected number, wrapped in block
      await sendMessage(
        from,
        `🔢 *Card Number*\n\`\`\`\n${card.number}\n\`\`\`\n👉 Tap & hold to copy.`,
        []
      );

      return res.sendStatus(200);
    }

    /* ----------------------------------------------------------------------
       OTHER EXISTING INTENTS
    ---------------------------------------------------------------------- */

    if (userIntent === "register") {
      const link = `https://tokicard-onboardingform.onrender.com?phone=${from}`;
      await sendMessage(
        from,
        `📝 Begin your registration:\n👉 ${link}`,
        [{ label: "KYC" }, { label: "Help" }]
      );
      return res.sendStatus(200);
    }

    if (userIntent === "kyc") {
      const kyc = `https://kyc.tokicard.com/session?user=${from}`;
      await sendMessage(from, `🪪 Complete your KYC:\n${kyc}`, [{ label: "Fund" }]);
      return res.sendStatus(200);
    }

    if (userIntent === "fund") {
      const ref = db.collection("users").doc(from);
      const doc = await ref.get();

      if (!doc.exists) {
        await sendMessage(from, "⚠️ Please *register* first.", [{ label: "Register" }]);
        return res.sendStatus(200);
      }

      if (!doc.data().cardActive) {
        await sendMessage(from, "⚠️ Complete *KYC* first.", [{ label: "KYC" }]);
        return res.sendStatus(200);
      }

      await sendMessage(
        from,
        "💰 Choose your funding option:",
        [{ label: "Crypto" }, { label: "Fiat" }]
      );

      return res.sendStatus(200);
    }

    if (userIntent === "crypto") {
      await sendMessage(from, "💎 We support *USDT (TRC20)* and *BTC*.");
      return res.sendStatus(200);
    }

    if (userIntent === "fiat") {
      await sendMessage(from, "🏦 Bank transfer option is coming soon.");
      return res.sendStatus(200);
    }

    /* -------------------------- EMAIL REGISTER --------------------------- */
    if (text.includes("@")) {
      const email = text.trim().toLowerCase();

      const waitlistSnapshot = await db.collection("waitlist").orderBy("timestamp", "asc").get();
      const waitlist = waitlistSnapshot.docs.map((d) => d.data());
      const exists = waitlist.some((w) => w.email === email);

      await db.collection("users").doc(from).set({
        phone: from,
        email,
        kycStatus: "pending",
        cardActive: false,
        annualFeePaid: false,
        isWaitlisted: exists,
        createdAt: new Date(),
      });

      if (exists) {
        await sendMessage(from, "🎉 You are already on our waitlist!", [
          { label: "KYC" },
        ]);
      } else {
        await sendMessage(from, "✅ Registration successful!", [
          { label: "KYC" },
        ]);
      }

      return res.sendStatus(200);
    }

    /* ------------------------------ DEFAULT ------------------------------ */
    await sendMessage(from, "🤖 I didn’t understand that. Type *help*.", [
      { label: "Help" },
    ]);
    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ WhatsApp route error:", err);
    return res.sendStatus(500);
  }
});

export default router;

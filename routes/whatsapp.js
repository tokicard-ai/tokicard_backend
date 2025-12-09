// routes/whatsapp.js - UPDATED FOR OFF-RAMP PROJECT (IAB FIX APPLIED)
import express from "express";
// 1. IMPORT THE NEW IAB-GUARANTEED FUNCTION
import { sendMessage, sendMessageWithButtons, sendTemplateMessageWithIAB } from "../utils/sendMessage.js"; 
import { getDb } from "../db/mongo.js";

const router = express.Router();

/* ====================== WEBHOOK VERIFICATION ====================== */
router.get("/", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ WhatsApp webhook verified successfully!");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

/* ====================== MAIN MESSAGE HANDLER ====================== */
router.post("/", async (req, res) => {
  try {
    console.log("📩 Webhook received:", JSON.stringify(req.body, null, 2));

    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (!message) {
      console.log("⚠️ No message found in webhook");
      return res.sendStatus(200);
    }

    const from = message.from;
    
    // Extract text from different message types
    let text = "";
    if (message.text?.body) {
      text = message.text.body.trim().toLowerCase();
    } else if (message.interactive?.button_reply?.title) {
      text = message.interactive.button_reply.title.toLowerCase();
    } else if (message.interactive?.list_reply?.title) {
      text = message.interactive.list_reply.title.toLowerCase();
    }
    
    console.log(`📱 Message from ${from}: "${text}"`);
    
    if (!text) {
      console.log("⚠️ No text content");
      return res.sendStatus(200);
    }

    const db = getDb();
    
    // Check if user exists
    let user = await db.collection("users").findOne({ phone: from });
    console.log(`👤 User ${from}: ${user ? "Registered ✅" : "New ❌"}`);

    /* ====================== GET SESSION STATE ====================== */
    let session = await db.collection("sessions").findOne({ phone: from });
    if (!session) {
      session = { phone: from, state: "idle", data: {} };
      await db.collection("sessions").insertOne(session);
    }

    /* ====================== GREETING ====================== */
    if (!text || /^(hi|hello|hey|start|menu)$/i.test(text)) {
      await db.collection("sessions").updateOne(
        { phone: from },
        { $set: { state: "idle", data: {} } }
      );

      await sendMessageWithButtons(
        from,
        `👋 *Welcome to Tokicard AI!*\n\n` +
        `Your trusted partner for crypto off-ramping.\n\n` +
        `Select an option below to get started:`,
        [
          { id: "sell", label: "💰 Sell Crypto" },
          { id: "balance", label: "📊 Check Balance" },
          { id: "rates", label: "💱 View Rates" },
        ]
      );
      return res.sendStatus(200);
    }

    /* ====================== SELL CRYPTO ====================== */
 // routes/whatsapp.js - inside the SELL CRYPTO block
// ...

    /* ====================== SELL CRYPTO ====================== */
    if (text.includes("sell") || text.includes("💰")) {
      if (!user) {
        // 1. USE THE APPROVED TEMPLATE NAME AND EXTRACT SUFFIX
        const TEMPLATE_NAME = "toki_card_activation"; // <--- Confirmed Marketing Template Name
        const registrationUrlSuffix = `register?phone=${from}`;
        
        // 2. USE THE IAB-GUARANTEED TEMPLATE FUNCTION
        await sendTemplateMessageWithIAB(
          from,
          TEMPLATE_NAME, 
          null, // <--- **FINAL CHANGE HERE:** Passing 'null' to skip the body variable in the API payload
          registrationUrlSuffix 
        );
        return res.sendStatus(200);
      }

// ... (rest of the code is unchanged)

    /* ====================== CHECK BALANCE ====================== */
    if (text.includes("balance") || text.includes("📊")) {
      if (!user) {
        await sendMessage(
          from,
          `⚠️ Please register first to check your balance.\n\n` +
          `Type *sell* to get started.`
        );
        return res.sendStatus(200);
      }

      const balance = user.balance || { usdt: 0, btc: 0, ngn: 0 };
      const limitRemaining = (user.dailyLimit || 5000000) - (user.dailyLimitUsed || 0);
      
      await sendMessageWithButtons(
        from,
        `💰 *Your Balances*\n\n` +
        `USDT: ${balance.usdt.toFixed(2)}\n` +
        `BTC: ${balance.btc.toFixed(8)}\n` +
        `NGN: ₦${balance.ngn.toLocaleString()}\n\n` +
        `📊 *Daily Limit*\n` +
        `Remaining: ₦${limitRemaining.toLocaleString()}\n` +
        `Total: ₦${(user.dailyLimit || 5000000).toLocaleString()}`,
        [
          { id: "sell", label: "💰 Sell Crypto" },
          { id: "rates", label: "💱 View Rates" },
        ]
      );
      return res.sendStatus(200);
    }

    /* ====================== VIEW RATES ====================== */
    if (text.includes("rate") || text.includes("💱") || text.includes("price")) {
      // Mock rates (we'll add real API later)
      const usdtRate = 1455;
      const btcRate = 78000000;
      
      await sendMessageWithButtons(
        from,
        `💱 *Tokicard AI Live Rates*\n\n` +
        `_(Updated 60s ago)_\n\n` +
        `1 USDT = ₦${usdtRate.toLocaleString()} _(You Receive)_\n` +
        `1 BTC = ₦${btcRate.toLocaleString()} _(You Receive)_\n\n` +
        `💡 Rates include our processing fee`,
        [
          { id: "sell", label: "💰 Sell Now" },
          { id: "menu", label: "🏠 Main Menu" },
        ]
      );
      return res.sendStatus(200);
    }

    /* ====================== HELP / SUPPORT ====================== */
    if (text.includes("help") || text.includes("support") || text.includes("❓")) {
      await sendMessageWithButtons(
        from,
        `❓ *Need Help?*\n\n` +
        `*Common Commands:*\n` +
        `• Type *sell* to sell crypto\n` +
        `• Type *balance* to check balance\n` +
        `• Type *rates* to view rates\n` +
        `• Type *menu* for main menu\n\n` +
        `*Need Human Support?*\n` +
        `Contact us for assistance.`,
        [
          { id: "menu", label: "🏠 Main Menu" },
        ]
      );
      return res.sendStatus(200);
    }

    /* ====================== DEFAULT ====================== */
    await sendMessageWithButtons(
      from,
      `🤔 I didn't understand that.\n\n` +
      `Type *menu* to see what I can do.`,
      [
        { id: "sell", label: "💰 Sell Crypto" },
        { id: "rates", label: "💱 View Rates" },
        { id: "help", label: "❓ Help" },
      ]
    );
    return res.sendStatus(200);

  } catch (error) {
    console.error("❌ Webhook error:", error);
    console.error("Stack:", error.stack);
    res.sendStatus(500);
  }
});

/* ====================== BANK TRANSFER WEBHOOK ====================== */
// This will be called by Paystack when we send NGN to user's bank
router.post("/bank-transfer", async (req, res) => {
  try {
    console.log("💸 Bank transfer webhook:", req.body);

    // Verify Paystack signature (important for security!)
    // Note: 'crypto' library must be imported or available globally for this to work
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");
    
    if (hash !== req.headers["x-paystack-signature"]) {
      console.log("⚠️ Invalid Paystack signature");
      return res.sendStatus(400);
    }

    const { event, data } = req.body;

    if (event === "transfer.success") {
      const db = getDb();
      
      // Find transaction by reference
      const transaction = await db.collection("transactions").findOne({
        payoutReference: data.reference,
      });

      if (transaction) {
        // Update transaction status
        await db.collection("transactions").updateOne(
          { _id: transaction._id },
          {
            $set: {
              status: "completed",
              completedAt: new Date(),
            },
          }
        );

        // Notify user
        const user = await db.collection("users").findOne({ _id: transaction.userId });
        if (user) {
          await sendMessage(
            user.phone,
            `✅ *Payment Sent!*\n\n` +
            `₦${transaction.ngnAmount.toLocaleString()} has been sent to your bank account.\n\n` +
            `Bank: ${transaction.bankAccount.bankName}\n` +
            `Account: ${transaction.bankAccount.accountNumber}\n\n` +
            `Transaction ID: ${transaction._id}`
          );
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Bank transfer webhook error:", error);
    res.sendStatus(500);
  }
});

/* ====================== CRYPTO DEPOSIT WEBHOOK ====================== */
// This will be called when we detect crypto on blockchain
router.post("/crypto-deposit", async (req, res) => {
  try {
    console.log("🪙 Crypto deposit webhook:", req.body);

    const { transactionId, txHash, amount, status } = req.body;

    if (status === "confirmed") {
      const db = getDb();
      
      const transaction = await db.collection("transactions").findOne({
        _id: transactionId,
      });

      if (transaction) {
        // Update transaction
        await db.collection("transactions").updateOne(
          { _id: transactionId },
          {
            $set: {
              status: "processing_payout",
              depositTxHash: txHash,
              depositConfirmedAt: new Date(),
            },
          }
        );

        // Notify user
        const user = await db.collection("users").findOne({ _id: transaction.userId });
        if (user) {
          await sendMessage(
            user.phone,
            `✅ *Crypto Received!*\n\n` +
            `We received ${amount} ${transaction.coin}.\n\n` +
            `Sending ₦${transaction.ngnAmount.toLocaleString()} to your bank account now...\n\n` +
            `Transaction ID: ${transactionId}`
          );
        }

        // TODO: Trigger bank transfer here
        // await sendBankTransfer(transaction);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Crypto deposit webhook error:", error);
    res.sendStatus(500);
  }
});

export default router;
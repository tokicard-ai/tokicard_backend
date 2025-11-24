// utils/sendMessage.js → FINAL PRODUCTION VERSION WITH URL BUTTONS
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_ID;

// Simulate typing indicator
async function sendTypingIndicator(to, duration = 1500) {
  try {
    await axios.post(
      `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "typing_on",
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    await new Promise((resolve) => setTimeout(resolve, duration));
  } catch (error) {
    console.error("Typing indicator failed:", error.response?.data || error.message);
  }
}

/**
 * Send WhatsApp message with optional buttons, URL button & typing indicator
 * @param {string} to - Recipient phone number
 * @param {string} text - Message text
 * @param {Array} buttons - Quick reply buttons (max 3): [{ label: "Help" }]
 * @param {boolean} withTyping - Show typing indicator
 * @param {number} typingDuration - Typing duration in ms
 * @param {Object} urlButton - URL button: { text: "Open Link", url: "https://..." }
 */
export async function sendMessage(
  to,
  text,
  buttons = [],
  withTyping = true,
  typingDuration = 1200,
  urlButton = null  // NEW: URL button parameter
) {
  try {
    if (withTyping) {
      await sendTypingIndicator(to, typingDuration);
    }

    let payload;

    // PRIORITY 1: URL Button (Call-to-Action) - Opens in WhatsApp
    if (urlButton && urlButton.url) {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
          type: "cta_url",
          body: { text },
          action: {
            name: "cta_url",
            parameters: {
              display_text: urlButton.text || "Open Link",
              url: urlButton.url
            }
          }
        }
      };
    }
    // PRIORITY 2: Quick Reply Buttons
    else if (buttons.length > 0) {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text },
          action: {
            buttons: buttons.slice(0, 3).map((btn, i) => ({
              type: "reply",
              reply: {
                id: `btn_${i + 1}`,
                title: btn.label.substring(0, 20), // WhatsApp max 20 chars
              },
            })),
          },
        },
      };
    }
    // PRIORITY 3: Plain text
    else {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body: text },
      };
    }

    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Message sent to ${to}`);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Failed to send WhatsApp message:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Send message with URL button AND follow-up quick reply buttons
 * (WhatsApp doesn't support mixing them in one message)
 */
export async function sendMessageWithUrlAndButtons(to, text, urlButton, followUpButtons = []) {
  try {
    // Send URL button message first
    await sendMessage(to, text, [], true, 1200, urlButton);
    
    // Send follow-up with quick reply buttons (optional)
    if (followUpButtons.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
      await sendMessage(to, "Quick actions:", followUpButtons, false);
    }
  } catch (error) {
    console.error("Failed to send combined message:", error);
    throw error;
  }
}
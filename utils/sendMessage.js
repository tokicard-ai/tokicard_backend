// utils/sendMessage.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_ID;
const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`;

async function sendTypingIndicator(to, duration = 1200) {
  try {
    await axios.post(
      WHATSAPP_API_URL,
      { messaging_product: "whatsapp", to, type: "typing_on" },
      { 
        headers: { 
          Authorization: `Bearer ${TOKEN}`, 
          "Content-Type": "application/json" 
        } 
      }
    );
    await new Promise((resolve) => setTimeout(resolve, duration));
  } catch (error) {
    console.error("⚠️ Typing indicator failed:", error.response?.data || error.message);
  }
}

/**
 * Send a text message (opens in WhatsApp browser for most users)
 */
export async function sendMessage(to, text, websiteUrl = null) {
  try {
    await sendTypingIndicator(to, 1200);
    
    let messageText = text;
    
    if (websiteUrl) {
      messageText += `\n\n${websiteUrl}`;
    }
    
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { 
        body: messageText,
        preview_url: true
      }
    };
    
    const response = await axios.post(
      WHATSAPP_API_URL,
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
    console.error("❌ Failed to send message:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Sends a pre-approved template message - GUARANTEED In-App Browser (IAB)
 * @param {string} to - Recipient's phone number
 * @param {string} templateName - Template name (e.g., 'toki_card_activation')
 * @param {string} urlSuffix - Dynamic URL parameter (e.g., phone number)
 */
export async function sendTemplateMessageWithIAB(to, templateName, urlSuffix) {
    try {
        await sendTypingIndicator(to, 1200);

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "template",
            template: {
                name: templateName,
                language: {
                    code: "en_US" // Match "English (US)" from Meta
                },
                components: [
                    {
                        type: "button",
                        sub_type: "url",
                        index: 0,
                        parameters: [
                            {
                                type: "text",
                                text: urlSuffix // The {{1}} variable in button URL
                            }
                        ]
                    }
                ]
            }
        };

        console.log("📤 Sending template:", JSON.stringify(payload, null, 2));

        const response = await axios.post(
            WHATSAPP_API_URL,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );
        
        console.log(`✅ IAB Template sent successfully: ${templateName} to ${to}`);
        return response.data;
        
    } catch (error) {
        console.error("❌ Failed to send IAB Template:");
        console.error("Response:", JSON.stringify(error.response?.data, null, 2));
        throw error;
    }
}

/**
 * Send a message with interactive buttons (Quick Reply buttons)
 */
export async function sendMessageWithButtons(to, text, buttons = []) {
  try {
    await sendTypingIndicator(to, 1200); 
    
    const payload = {
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
              id: btn.id || `btn_${i + 1}`,
              title: btn.label.substring(0, 20),
            },
          })),
        },
      },
    };
    
    const response = await axios.post(
      WHATSAPP_API_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    console.log(`✅ Message with buttons sent to ${to}`);
    return response.data;
    
  } catch (error) {
    console.error("❌ Failed to send message:", error.response?.data || error.message);
    throw error;
  }
}
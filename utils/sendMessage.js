// utils/sendMessage.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_ID;
const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`; // Base URL definition

async function sendTypingIndicator(to, duration = 1200) {
  try {
    await axios.post(
      WHATSAPP_API_URL, // Use the defined URL
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
 * Send a text message (WARNING: Link opens external browser and is NOT recommended for registration links)
 */
export async function sendMessage(to, text, websiteUrl = null) {
  try {
    await sendTypingIndicator(to, 1200);
    
    let messageText = text;
    
    // If URL provided, add it (NOTE: This uses type: 'text' which is unreliable for IAB)
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
      WHATSAPP_API_URL, // Use the defined URL
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
 * Sends a pre-approved template message, which is the ONLY way to GUARANTEE the In-App Browser (IAB).
 * This function uses the 'template' message type and 'button' components for the CTA link.
 * It is now updated to conditionally include the body component only if a bodyTextVariable is provided.
 * * @param {string} to - Recipient's phone number.
 * @param {string} templateName - The EXACT name of your approved CTA template (e.g., 'toki_card_activation').
 * @param {string | null} bodyTextVariable - The text for the {{1}} variable in the template body (pass null if static body).
 * @param {string} urlSuffix - The unique, dynamic part of the URL for the CTA button (e.g., 'register?user=123').
 */
export async function sendTemplateMessageWithIAB(to, templateName, bodyTextVariable, urlSuffix) {
    try {
        await sendTypingIndicator(to, 1200);

        // 1. Build the components array conditionally
        const templateComponents = [];

        // If a body variable is provided (i.e., not null/undefined), include the body component.
        if (bodyTextVariable) {
            templateComponents.push({
                type: "body", 
                parameters: [
                    {
                        type: "text",
                        text: bodyTextVariable // Fills the template's body variable (e.g., {{1}})
                    }
                ]
            });
        }

        // 2. The button component is always included for the IAB link.
        templateComponents.push({
            type: "button", 
            sub_type: "url", 
            index: 0, 
            parameters: [
                {
                    type: "text",
                    text: urlSuffix // Fills the dynamic URL part (e.g., {{1}} in toki_card_activation)
                }
            ]
        });

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "template", // <--- THE CRITICAL IAB CHANGE
            template: {
                name: templateName, // Must match your approved name ('toki_card_activation')
                language: {
                    code: "en" 
                },
                components: templateComponents // <--- NOW USES THE CONDITIONAL ARRAY
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
        
        console.log(`✅ IAB Template sent successfully: ${templateName} to ${to}`);
        return response.data;
    } catch (error) {
        console.error("❌ Failed to send IAB Template:", error.response?.data || error.message);
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
      WHATSAPP_API_URL, // Use the defined URL
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
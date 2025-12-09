
// import axios from "axios";
// import dotenv from "dotenv";
// dotenv.config();

// const TOKEN = process.env.WHATSAPP_TOKEN;
// const PHONE_ID = process.env.PHONE_ID;

// async function sendTypingIndicator(to, duration = 1500) {
//   try {
//     await axios.post(
//       `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
//       { messaging_product: "whatsapp", to, type: "typing_on" },
//       { headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" } }
//     );
//     await new Promise((resolve) => setTimeout(resolve, duration));
//   } catch (error) {
//     console.error("Typing indicator failed:", error.response?.data || error.message);
//   }
// }


// export async function sendMessage(to, text, websiteUrl = null, buttonText = "Open Link") {
//   try {
//     await sendTypingIndicator(to, 1200);

//     let payload;

//     if (websiteUrl) {
//       payload = {
//         messaging_product: "whatsapp",
//         recipient_type: "individual",
//         to,
//         type: "interactive",
//         interactive: {
//           type: "cta_url",
//           body: {
//             text: text
//           },
//           action: {
//             name: "cta_url",
//             parameters: {
//               display_text: buttonText, 
//               url: websiteUrl 
//             }
//           }
//         }
//       };
//     } else {
//       payload = {
//         messaging_product: "whatsapp",
//         recipient_type: "individual",
//         to,
//         type: "text",
//         text: { body: text }
//       };
//     }

//     const response = await axios.post(
//       `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
//       payload,
//       {
//         headers: {
//           Authorization: `Bearer ${TOKEN}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log(`✅ Message sent to ${to}`);
//     return response.data;
//   } catch (error) {
//     console.error("❌ Failed to send message:", error.response?.data || error.message);
//     throw error;
//   }
// }


// export async function sendMessageWithButtons(to, text, buttons = []) {
//   try {
//     await sendTypingIndicator(to, 1200);

//     const payload = {
//       messaging_product: "whatsapp",
//       recipient_type: "individual",
//       to,
//       type: "interactive",
//       interactive: {
//         type: "button",
//         body: { text },
//         action: {
//           buttons: buttons.slice(0, 3).map((btn, i) => ({
//             type: "reply",
//             reply: {
//               id: btn.id || `btn_${i + 1}`,
//               title: btn.label.substring(0, 20),
//             },
//           })),
//         },
//       },
//     };

//     const response = await axios.post(
//       `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
//       payload,
//       {
//         headers: {
//           Authorization: `Bearer ${TOKEN}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log(`✅ Message with buttons sent to ${to}`);
//     return response.data;
//   } catch (error) {
//     console.error("❌ Failed to send message:", error.response?.data || error.message);
//     throw error;
//   }
// }

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
 * * @param {string} to - Recipient's phone number.
 * @param {string} templateName - The EXACT name of your approved CTA template (e.g., 'activate_your_tokicard').
 * @param {string} bodyTextVariable - The text for the {{1}} variable in the template body.
 * @param {string} urlSuffix - The unique, dynamic part of the URL for the CTA button (e.g., 'register?user=123').
 */
export async function sendTemplateMessageWithIAB(to, templateName, bodyTextVariable, urlSuffix) {
    try {
        await sendTypingIndicator(to, 1200);

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "template", // <--- THE CRITICAL IAB CHANGE
            template: {
                name: templateName, // Must match your approved name
                language: {
                    code: "en" 
                },
                components: [
                    {
                        type: "body", 
                        parameters: [
                            {
                                type: "text",
                                text: bodyTextVariable // Fills the template's body variable (e.g., {{1}})
                            }
                        ]
                    },
                    {
                        type: "button", 
                        sub_type: "url", // Specific type for the CTA button
                        index: 0, 
                        parameters: [
                            {
                                type: "text",
                                text: urlSuffix // Fills the dynamic URL part (e.g., {{2}})
                            }
                        ]
                    }
                ]
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
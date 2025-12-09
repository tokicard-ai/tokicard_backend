
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

async function sendTypingIndicator(to, duration = 1200) {
  try {
    await axios.post(
      `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
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
 * Send a text message (opens in WhatsApp browser)
 */
export async function sendMessage(to, text, websiteUrl = null) {
  try {
    await sendTypingIndicator(to, 1200);
    
    let messageText = text;
    
    // If URL provided, add it (opens IN WhatsApp browser)
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
    console.error("❌ Failed to send message:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send a message with interactive buttons
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
      `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
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
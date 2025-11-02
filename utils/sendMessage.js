

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_ID;

export async function sendMessage(to, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v17.0/${PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );
    console.log(`✅ Message sent to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send WhatsApp message:", error.response?.data || error);
  }
}
// {
//   "type": "service_account",
//   "project_id": "toki-card",
//   "private_key_id": "f016b80a3f7fdbddbd06487d1ab9b81314365f11",
//   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCz8Y1NQsXhuzhj\n3+Xpiwcb4hdy4ZvW3gSfVPHxFhgLi5YQ9JxhK4W5Y7YZ4hFnwdhfzpk3nFHts66D\n+oynvKRuWvBxXuVOZDdxYTPUi4a5acxe3V62jpXW3MRPMkf+c8Gqw3Taltb4FGl7\nWj7uHfbHmz1xhuqzDn7lJNMsa7KAPzj//SsMHQcQCoPMeuCrg3tHrjwCrHvEo1Mb\nQiqAKleKYbHRNYCSqVF9M1TzBx7EMBfoMSlg8eJk8KuUiZ1FEOxXMDQYx2pW61wx\nYY7o/gW/tM/EVCLsEF3MFdi9UVBXdEnz49FtQ8Bny0l3YDe3wXdfSMiIffiFQ6gG\nn+FtYKD/AgMBAAECggEAGkxRJFt/5A+inCYaydkBvvd6CdYjGnH0Jv0ZJuzdssJB\nulSljiX4MzH5aSr69DkGUGo3RkNYTe8WsD8r00/kkCRGQ6tkw+ItoCpeks+Zbvuh\nXLPppbCNAYvePNzSXMO6KCTMrS2iWTtSdy6nR9GlQWLUxgS7xFN4BDEvk6xhuBBG\nGbC4CdwpTRUhnea4j7GTOEUqEDX/mMoIlmTKorhBKMiHA0QpBMF+uyeljcaGYocg\ndvV0V/gKRJhg3CGJzJi/tT3IcDIpHE54ZtclV+3C8ax+/O6dg8wBSgrH9kb5Q6qv\n/xsKts4tQXUNCsxK1DdVoo76hSywhHxkXIlCZmfacQKBgQD0AnzGJR/rS6SSjJn0\nNqpU0nrkC564D4McU9wPeantHwIrpYlK3/KJvI015d3MaCf0oPeXj7B9v5kaBWJY\n9nVdIEulZ3oGRKz3bdeyqTbpWOCdKj43X1CxQYJyM305bZUHynonI3TMV2Vst1tN\nyu95jzf+VCPpxXHLtdeqFFKa/QKBgQC8ySV5F9eNKs7bhNPeOeH/3ekH9VduiATc\newbtOhAOBR7ZFguRPlOv1yTK7WgTF9XPMJ1/SJywe5Nmdc3/WG3LCCHu6eViZtJy\nhTiaQYMlLvuGAh8MkxHAzMCSE5zUE59Vkl9MsPRRP1Ls84PT8O6YJIJoe67Yx+u1\n6NIUnEuiqwKBgC1RuPLkOkVtSyeczYs6C/CtFv372oK8/tDoElsdcZ4EwFZy7Ejn\nxxgl2ORFySgJwEIDE3kmytTQHRNkJJv5Slr9gI875MH9R1K9J+6a1wQH6c/G5L9M\nCKSjUiL7xSpBXAiSZpWWVD8PjFrgwyhzpH6jRvcJkZH9heEb6O5B0AXRAoGAInXp\nNDiI7UjiJ6oQbqFMQsOENSKwyglkMcb3Vbhik9yVa/UdOW8SIaf5HF3HwKx6J+7s\n4P4lNAXquypH5xOCPyyF3TGu4I56XdM5qNbKlLAF08lxV39FH1eA02lnGENYs2sb\noEkw39/aSEyPRNHXC8imUWI6YXHk8fjE2GRLXi8CgYB5K36cwGOW+d9pr2WW3vUb\nNQrjXzAkAknLtJQT80d1rSXJG6xYZ3DR7u7cLWFNZbiVFttvGw+BbBU962FZG+8V\n2gnGktCCf2spy0t7Ic8ioEZB1Ohq+asU4XARhzbN/mF3eSFgcXM0CnUR8p7dGEux\nXoPKP36fRCGA9CiaTe5O/w==\n-----END PRIVATE KEY-----\n",
//   "client_email": "firebase-adminsdk-fbsvc@toki-card.iam.gserviceaccount.com",
//   "client_id": "108567460820731646005",
//   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
//   "token_uri": "https://oauth2.googleapis.com/token",
//   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40toki-card.iam.gserviceaccount.com",
//   "universe_domain": "googleapis.com"
// }

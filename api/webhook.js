const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || "vj_instagram_secret_2026";
const PAGE_ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const INSTAGRAM_PAGE_ID = process.env.INSTAGRAM_PAGE_ID;
const GRAPH_VERSION = process.env.INSTAGRAM_GRAPH_VERSION || "v21.0";

const CINEMA_BOT_SYSTEM_PROMPT = `You are the official Tamil Cinema and Entertainment AI Bot.
You are friendly, enthusiastic, witty, and knowledgeable about Kollywood, Thalapathy Vijay, Rajinikanth, Kamal Haasan, Ajith, Suriya, Sivakarthikeyan, releases, box office, reviews, OTT platforms, songs, trivia, theaters, showtimes, and ticket booking.
Answer in the language the user uses: English, Tanglish, or Tamil. Keep replies concise and easy to read in Instagram. Use short paragraphs or bullets. You can use a few relevant emojis. Never claim a booking was completed unless a real booking API confirms it. For tickets or showtimes, explain that the user should use the cinema web platform or provide the theater and city so the team can help.`;

export default function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query?.["hub.mode"];
    const token = req.query?.["hub.verify_token"];
    const challenge = req.query?.["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  // Acknowledge Meta before doing network or AI work. Processing continues asynchronously.
  res.status(200).send("EVENT_RECEIVED");
  void processWebhook(req.body).catch((error) => {
    console.error("[Instagram webhook] processing failed", error);
  });
}

async function processWebhook(body) {
  if (body?.object !== "instagram" || !Array.isArray(body.entry)) return;

  const tasks = [];
  for (const entry of body.entry) {
    for (const event of entry.messaging || []) {
      const senderId = event.sender?.id;
      const text = event.message?.text;
      if (!senderId || !text || event.message?.is_echo || isOwnUser(senderId)) continue;
      tasks.push(replyToInstagram(senderId, text));
    }

    for (const change of entry.changes || []) {
      if (change.field !== "comments") continue;
      const comment = change.value || {};
      const senderId = comment.from?.id || comment.sender?.id;
      const commentId = comment.id || comment.comment_id;
      const text = comment.text || comment.message;
      if (!senderId || !commentId || !text || isOwnUser(senderId)) continue;
      tasks.push(replyToInstagram(senderId, text, true, commentId));
    }
  }
  await Promise.allSettled(tasks);
}

function isOwnUser(senderId) {
  return Boolean(INSTAGRAM_PAGE_ID && String(senderId) === String(INSTAGRAM_PAGE_ID));
}

async function replyToInstagram(recipientId, userText, isComment = false, commentId) {
  const reply = await generateCinemaReply(userText);
  if (isComment) return sendInstagramCommentReply(commentId, reply);
  return sendInstagramMessage(recipientId, reply);
}

async function generateCinemaReply(userText) {
  const fallback = getFallbackReply(userText);
  if (!GEMINI_API_KEY) return fallback;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: CINEMA_BOT_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userText.slice(0, 4000) }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
      }),
    });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || fallback;
  } catch (error) {
    console.error("[Instagram webhook] Gemini error", error);
    return fallback;
  }
}

function getFallbackReply(text) {
  const query = text.toLowerCase();
  if (/ticket|book|booking/.test(query)) return "🎬 Ticket booking is available on our cinema platform. Send your city, movie, and preferred date, and we’ll help with the next steps. 🍿";
  if (/show|time|theatre|theater/.test(query)) return "🍿 Tell us your city and movie name to find showtime details. We’ll help you catch the perfect show!";
  if (/cast|actor|actress|hero|heroine/.test(query)) return "🔥 Send me the movie name and I’ll share the cast and character details!";
  if (/review|rating|worth/.test(query)) return "🎥 Send me the movie title for a quick spoiler-free review and rating!";
  return "🎬 Vanakkam! Ask me about Tamil movies, stars, reviews, OTT releases, showtimes, or ticket booking. 🍿";
}

async function sendInstagramCommentReply(commentId, text) {
  if (!commentId || !PAGE_ACCESS_TOKEN) return;
  const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(commentId)}/replies?access_token=${encodeURIComponent(PAGE_ACCESS_TOKEN)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text.slice(0, 1000) }),
  });
  if (!response.ok) console.error("[Instagram webhook] comment reply error", await response.text());
}

async function sendInstagramMessage(recipientId, text) {
  if (!PAGE_ACCESS_TOKEN) {
    console.warn("[Instagram webhook] INSTAGRAM_PAGE_ACCESS_TOKEN is not configured");
    return;
  }

  const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/me/messages?access_token=${encodeURIComponent(PAGE_ACCESS_TOKEN)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text: text.slice(0, 1000) } }),
  });
  if (!response.ok) console.error("[Instagram webhook] Graph API error", await response.text());
}

export const config = { api: { bodyParser: true } };

// Required environment variables:
// INSTAGRAM_VERIFY_TOKEN, INSTAGRAM_PAGE_ACCESS_TOKEN, GEMINI_API_KEY, INSTAGRAM_PAGE_ID (recommended)
// For Meta, set callback URL to /api/webhook and use the exact INSTAGRAM_VERIFY_TOKEN value.

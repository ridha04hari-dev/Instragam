// api/webhook.js
export default async function handler(req, res) {
  // 1. Meta Handshake Challenge (GET)
  if (req.method === "GET") {
    const challenge = req.query["hub.challenge"] || req.query["challenge"];
    if (challenge) {
      res.setHeader("Content-Type", "text/plain");
      return res.status(200).send(challenge);
    }
    return res.status(200).send("Gateway Active");
  }

  // 2. Forward incoming Instagram POST events to your main app
  if (req.method === "POST") {
    try {
      // Forward to your AI Studio / Cloud Run app backend
      await fetch("https://ais-dev-ua2podlm6e7j4me4bzanor-1034075808682.asia-southeast1.run.app/api/instagram/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
    } catch (e) {
      console.log("Forward error:", e);
    }

    // Always acknowledge Meta immediately with 200 OK
    return res.status(200).send("EVENT_RECEIVED");
  }

  return res.status(200).send("OK");
}

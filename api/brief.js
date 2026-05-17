// api/brief.js
// Vercel serverless function — proxies requests to Claude.
// The API key never leaves the server; the browser never sees it.

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Basic rate limit by IP — prevents anyone burning through your credits
  // by hammering the endpoint. Simple in-memory counter resets on cold start.
  // For a production app you'd use Vercel KV or Upstash Redis; for a demo this is fine.
  const ip = req.headers["x-forwarded-for"] || "unknown";
  globalThis.__rate = globalThis.__rate || new Map();
  const now = Date.now();
  const window_ms = 60 * 1000; // 1 minute
  const max_requests = 6;       // 6 briefs per minute per IP
  const entry = globalThis.__rate.get(ip) || { count: 0, start: now };
  if (now - entry.start > window_ms) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  globalThis.__rate.set(ip, entry);
  if (entry.count > max_requests) {
    return res.status(429).json({
      error: "Rate limit. Try again in a minute.",
    });
  }

  const { input } = req.body || {};
  if (!input || typeof input !== "string" || input.length > 4000) {
    return res.status(400).json({ error: "Invalid input." });
  }

  const SYSTEM_PROMPT = `You are a senior marketing strategist at a professional services firm. Turn rough campaign ideas into structured creative briefs.

Before the brief, work through these in a <thinking> block:
1. What outcome does the stakeholder actually want? (Not just the activity.)
2. Who is the audience and what do they currently believe/do?
3. What single thing must this campaign shift?
4. What's missing that I need to flag?
5. What would make this fail downstream?

After </thinking>, return ONE JSON object. No markdown, no fences. Schema:
{
  "status": "complete"|"needs_clarification"|"out_of_scope",
  "campaign_name": string,
  "objective": string,
  "audience": {"who": string, "current_state": string, "desired_state": string},
  "single_minded_proposition": string,
  "tone_of_voice": string,
  "deliverables": [string],
  "mandatories": [string],
  "success_metrics": [string],
  "timeline": {"brief_approved": string, "assets_delivered": string, "in_market": string, "review": string},
  "unknowns": [string],
  "compliance_flag": boolean,
  "clarifying_questions": [string],
  "out_of_scope_reason": string
}

Guardrails:
- Not a marketing request -> status "out_of_scope" + one-line reason.
- Field can't be inferred -> "TO CONFIRM: [specific question]". Never invent budgets, dates, metrics.
- 3+ fields would be TO CONFIRM -> status "needs_clarification", up to 3 questions, skip brief fields.
- Plain professional English. No jargon (synergise, unlock, leverage). No AI tells.
- Regulated topic (financial advice, tax, audit opinions) -> compliance_flag: true.
- tone_of_voice: three adjectives + one sentence on what to avoid.

Return ONLY <thinking>...</thinking> then the JSON.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: input }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return res.status(502).json({ error: "Upstream API error" });
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    return res.status(200).json({ raw: text });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

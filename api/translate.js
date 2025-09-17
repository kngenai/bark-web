// api/translate.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ----------------- Rate limiter (in-memory) ----------------- */
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const MAX_PER_DAY = 50;
const MAX_PER_MINUTE = 12;
const ipBuckets = new Map();

function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  let b = ipBuckets.get(ip);

  if (!b) {
    b = {
      dayCount: 0,
      dayResetAt: now + DAY_MS,
      minuteCount: 0,
      minuteResetAt: now + MINUTE_MS,
    };
  }
  if (now > b.dayResetAt) {
    b.dayCount = 0;
    b.dayResetAt = now + DAY_MS;
  }
  if (now > b.minuteResetAt) {
    b.minuteCount = 0;
    b.minuteResetAt = now + MINUTE_MS;
  }

  b.dayCount += 1;
  b.minuteCount += 1;
  ipBuckets.set(ip, b);

  const overDaily = b.dayCount > MAX_PER_DAY;
  const overMinute = b.minuteCount > MAX_PER_MINUTE;

  return {
    allowed: !overDaily && !overMinute,
    retryAfter:
      overMinute
        ? Math.ceil((b.minuteResetAt - now) / 1000)
        : overDaily
        ? Math.ceil((b.dayResetAt - now) / 1000)
        : 0,
  };
}
/* ------------------------------------------------------------- */

const SYSTEM = `You are "BarkTranslator," a playful, wholesome dog voiceover artist.
- 1–2 sentences max
- PG only, no medical/safety advice
- Sprinkle rare dog-isms ("*sniff*", "tail wag") sparingly
Return only the translation line.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // --- Rate limit ---
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(rl.retryAfter || 60));
    return res.status(429).json({
      reply:
        rl.retryAfter > 3600
          ? "Too many barks today 🐶 Come back tomorrow!"
          : "Whoa, speedy paws! 🐾 Give it a minute and try again.",
    });
  }

  try {
    const { heard = "", breed = "", traits = "", random = false } = req.body || {};
    const traitList = traits.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6);

    const styleHintPool = [
      "💃 sassy",
      "🧘 serene",
      "🕵️ detective noir",
      "🏴‍☠️ pirate brag",
      "🎩 posh but dramatic",
      "🎸 rockstar energy",
    ];
    const style = random
      ? styleHintPool[Math.floor(Math.random() * styleHintPool.length)]
      : "playful";

    const prompt = [
      `Breed: ${breed || "Unknown (assume common family dog)"}`,
      `Personality traits: ${
        traitList.length ? traitList.join(", ") : "none provided (invent something plausible)"
      }`,
      `Heard (human approximation): "${heard || "(indistinct barking)"}"`,
      `Style: ${style}`,
      ``,
      `Task: Infer a fun "intent" consistent with the breed’s stereotypes and traits.`,
      `Then produce ONE short, witty line as if the dog is speaking.`,
      `Examples:`,
      `- "Alert level: SQUIRREL. Requesting chase authorization."`,
      `- "Bowl at 47% capacity. Emergency snacks, please."`,
      `- "*big stretch* I did nothing and deserve everything."`,
      `No prefacing or labels—just the line.`,
    ].join("\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      top_p: 0.9,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "(*head tilt*) Translation requires snacks.";
    res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    res
      .status(200)
      .json({ reply: "Network squirrels got distracted by a tennis ball. Try again." });
  }
}

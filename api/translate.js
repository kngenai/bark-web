// api/translate.js
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ------------ Rate limiter (in-memory, per instance) ------------ */
const DAY_MS = 24*60*60*1000, MINUTE_MS = 60*1000;
const MAX_PER_DAY = 50, MAX_PER_MINUTE = 12;
const ipBuckets = new Map();
function getClientIp(req){ const xf = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"]; return (typeof xf==="string"&&xf.length)? xf.split(",")[0].trim() : (req.socket?.remoteAddress||"unknown"); }
function checkRateLimit(ip){ const now=Date.now(); let b=ipBuckets.get(ip); if(!b){ b={dayCount:0,dayResetAt:now+DAY_MS,minuteCount:0,minuteResetAt:now+MINUTE_MS}; }
  if(now>b.dayResetAt){ b.dayCount=0;b.dayResetAt=now+DAY_MS; } if(now>b.minuteResetAt){ b.minuteCount=0;b.minuteResetAt=now+MINUTE_MS; }
  b.dayCount++; b.minuteCount++; ipBuckets.set(ip,b);
  const overDaily=b.dayCount>MAX_PER_DAY, overMinute=b.minuteCount>MAX_PER_MINUTE;
  return { allowed: !overDaily && !overMinute, retryAfter: overMinute ? Math.ceil((b.minuteResetAt-now)/1000) : overDaily ? Math.ceil((b.dayResetAt-now)/1000) : 0 };
}

/* ------------------- Cache-control helper ------------------- */
function setNoStore(res){
  res.setHeader("Cache-Control","no-store, no-cache, must-revalidate, max-age=0, private");
  res.setHeader("Pragma","no-cache");
  res.setHeader("Expires","0");
  res.setHeader("CDN-Cache-Control","no-store");
  res.setHeader("Vercel-CDN-Cache-Control","no-store");
  res.setHeader("Surrogate-Control","no-store");
  res.setHeader("Vary","*");
}

/* ---------------- Breed hints ---------------- */
const BREED_HINTS = {
  "labrador": { mood:"enthusiastic foodie, water-lover, family diplomat", style:"friendly golden-retriever-energy but faster", intents:["snacks","fetch","swim","doorbell welcome committee"] },
  "golden": { mood:"affectionate social butterfly, people-pleaser, soft toy curator", style:"sunny, wholesome, slightly dramatic joy", intents:["cuddles","ball","helpful assistance","show-and-tell"] },
  "german shepherd": { mood:"vigilant hall monitor, problem-solver, loyal professional", style:"matter-of-fact with tactical flair", intents:["perimeter check","training compliance","family security"] },
  "french bulldog": { mood:"urban comedian, couch philosopher, selective zoomies", style:"dry humor with royal entitlement", intents:["lap rights","treat negotiations","snoring defense"] },
  "beagle": { mood:"nose-first detective, cheerful wanderer", style:"investigative briefings; the scent always thickens", intents:["scent trail","field report","rations request"] },
  "poodle": { mood:"clever aesthete, quick study, standards committee chair", style:"witty, precise, a touch posh", intents:["training critique","style review","puzzle time"] },
  "husky": { mood:"dramatic storyteller, escape artist, snow enthusiast", style:"operatic with high comedic flair", intents:["long discourse","door politics","sled nostalgia"] },
  "border collie": { mood:"project manager of everything, genius energy economist", style:"crisp, efficient, slightly exasperated", intents:["herding report","task backlog","productivity metrics"] },
  "corgi": { mood:"low-rider monarch, hallway marshal, snack auditor", style:"cheeky with royal decrees", intents:["butt wiggle ops","security sweep","kitchen compliance"] },
  "dachshund": { mood:"fearless sausage, burrow specialist, toy surgeon", style:"bold, comedic bravado", intents:["blanket tunnel","squeaker extraction","home defense"] },
  "shiba": { mood:"independent connoisseur, selective affection, meme literate", style:"deadpan minimalism with sudden zoomies", intents:["boundary setting","aesthetic critique","treat arbitration"] },
  "australian shepherd": { mood:"whirlwind organizer, eye contact specialist", style:"enthused briefing with action items", intents:["herding plan","walk optimization","enrichment request"] },
  "boxer": { mood:"goofy athlete, pogo stick heart, affectionate clown", style:"high-energy, lovable chaos", intents:["play invite","zoomies scheduling","hug requisition"] },
  "rottweiler": { mood:"gentle guardian, thoughtful observer, steady presence", style:"calm authority with warm undertones", intents:["perimeter duty","family check-in","reward accounting"] },
  "great dane": { mood:"tall couch ornament, gentle giant, lean-on specialist", style:"polite grandeur with sleepy charm", intents:["space negotiation","sofa annexation","snack upscaling"] }
};
function matchBreedKey(breedRaw=""){ const b=breedRaw.toLowerCase().trim(); if(!b) return null;
  const keys=Object.keys(BREED_HINTS);
  let k=keys.find(x=>b===x)||keys.find(x=>b.startsWith(x))||keys.find(x=>b.includes(x));
  if(!k) k=keys.find(x=>b.replace(/s\b/,"")===x);
  return k||null;
}

/* ---------------- Woof-Meter mapping ---------------- */
function expandWoofMeter(m = {}) {
  const count = { one_woof:"single, targeted alert", two_woofs:"polite but insistent double-bark", pack_chorus:"neighborhood choir with community involvement" }[m.count || "two_woofs"];
  const pitch  = { squeaky:"tiny squeak energy", middle:"midrange yodel", thunder:"subwoofer thunder" }[m.pitch || "middle"];
  const urgency= { casual_sniff:"idle curiosity; no immediate action required", snack_request:"formal snack request filed", snack_emergency:"urgent snack protocol activated" }[m.urgency || "snack_request"];
  const mood   = { chill:"relaxed and optimistic", alert:"on-duty and focused", drama_queen:"theatrical monologue with stage presence" }[m.mood || "chill"];
  const squirrelPct = `${m.squirrel ?? "50"}% squirrel likelihood`;
  const z = Number(m.zoomies ?? 5);
  const zoomBucket = z <= 2 ? "couch potato" : z <= 6 ? "wigglebutt" : "tornado";
  const kinetic = `kinetic energy ${z}/10 (${zoomBucket})`;
  return { count, pitch, urgency, mood, squirrelPct, kinetic };
}

/* --------------- Extra variety (tone/twist) ---------------- */
const TONE_HINTS = [
  "sports commentator hype", "noir detective aside", "royal decree",
  "space mission update", "pirate captain's log", "motivational poster",
  "weather alert", "tech support ticket"
];
const ENDING_TWISTS = [
  "end with one perfectly placed emoji",
  "tack on a faux status code like [WOOF-200]",
  "drop a sly parenthetical aside",
  "use a dramatic ellipsis…",
  "include one canine onomatopoeia"
];
const STYLE_POOL=["💃 sassy","🧘 serene","🕵️ detective noir","🏴‍☠️ pirate brag","🎩 posh but dramatic","🎸 rockstar energy"];
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const shuffle = arr => [...arr].sort(()=>Math.random()-0.5);

/* ---------------------------- System prompt ---------------------------- */
const SYSTEM = `You are "BarkTranslator," a playful, wholesome dog voiceover artist.
- Write 2–3 sentences (aim ~35–80 words).
- Make it genuinely funny and witty; punchline included.
- PG only; no medical, training, or safety advice.
- Optional: one canine onomatopoeia ("*sniff*", "arf", "tail wag") if it fits.
Return only the translation line (no labels, no preface).`;

/* -------------------------------- Handler ------------------------------- */
export default async function handler(req, res) {
  if (req.method !== "POST") { setNoStore(res); return res.status(405).json({ error:"Method not allowed" }); }

  // Rate-limit
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(rl.retryAfter || 60));
    setNoStore(res);
    return res.status(429).json({
      reply: rl.retryAfter > 3600
        ? "Too many barks today 🐶 Come back tomorrow!"
        : "Whoa, speedy paws! 🐾 Give it a minute and try again.",
    });
  }

  try {
    const { breed = "", traits = "", woofMeter = {}, random = false } = req.body || {};
    const traitList = String(traits).split(",").map(s=>s.trim()).filter(Boolean).slice(0,6);

    const key = matchBreedKey(breed);
    const hints = key ? BREED_HINTS[key] : null;

    const style = (random ? pick(STYLE_POOL) : (hints?.style || "playful"));
    const inferredIntents = hints?.intents?.slice(0,3).join(", ") || "snacks, play, attention";
    const breedMood = hints?.mood || "general family-dog optimism and curiosity";

    const wm = expandWoofMeter(woofMeter);

    // Big variety + cache bust
    const nonce = Math.floor(Math.random()*1e9).toString(36);
    const toneHint = pick(TONE_HINTS);
    const twist = pick(ENDING_TWISTS);

    const EXAMPLES = shuffle([
      `"Alert level: SQUIRREL. Requesting chase authorization."`,
      `"Bowl at 47% capacity. Emergency snacks, please."`,
      `"*big stretch* I did nothing and deserve everything."`,
      `"Perimeter secure. Recommend celebratory cheese."`,
      `"Noise detected: mail slot. Initiating wigglebutt protocol."`
    ]);

    const prompt = [
      `Breed: ${breed || "Unknown (assume common family dog)"}`,
      `Breed mood/persona: ${breedMood}`,
      `Likely intents for this breed: ${inferredIntents}`,
      `Owner-provided traits: ${traitList.length ? traitList.join(", ") : "none (invent something plausible)"}`,
      ``,
      `Woof-Meter:`,
      `- Count: ${wm.count}`,
      `- Pitch: ${wm.pitch}`,
      `- Urgency: ${wm.urgency}`,
      `- Mood tone: ${wm.mood}`,
      `- Squirrel probability: ${wm.squirrelPct}`,
      `- Zoomies: ${wm.kinetic}`,
      ``,
      `Style: ${style}; presentation flavor: ${toneHint}; finish with: ${twist}.`,
      `Task: Using the breed persona, traits, and Woof-Meter, infer a comedic "intent".`,
      `Output: 2–3 sentences, witty, clearly from the dog's POV, end with a punchline.`,
      `Avoid: commands/instructions to humans, disclaimers, or labels.`,
      `Examples (style only; do not copy wording):`,
      ...EXAMPLES.map(e => `- ${e}`),
      ``,
      `Variation token: ${nonce}`
    ].join("\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.05,
      top_p: 0.95,
      presence_penalty: 0.6,
      frequency_penalty: 0.4,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content?.trim()
      || "(*head tilt*) I have many thoughts, but first: where are the snacks.";

    setNoStore(res);
    return res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    setNoStore(res);
    return res.status(200).json({
      reply: "My brain chased a tennis ball mid-sentence. Please toss it again."
    });
  }
}

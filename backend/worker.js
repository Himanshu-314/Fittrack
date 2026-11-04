/* FITTRACK 12 - optional AI meal-analysis service (Cloudflare Worker).
   Your API key lives ONLY here as an encrypted secret - never in the app, never on GitHub.

   Environment (set in the Cloudflare dashboard, see README.md):
     API_KEY         (secret)  your Gemini or Anthropic key
     PROVIDER        "gemini" (default) or "anthropic"
     MODEL           model id, e.g. a current Gemini Flash model from Google AI Studio,
                     or "claude-haiku-5-5" for Anthropic
     ALLOWED_ORIGIN  your site origin, e.g. https://himanshu-314.github.io  (no path, no trailing slash)
*/
const MAX_BODY=3_000_000;      // ~3 MB (the app sends a ~1024px JPEG, usually 100-300 KB)
const hits=new Map();          // best-effort per-instance rate limit
const LIMIT=20, WINDOW=60_000; // 20 requests / minute / IP

const SYSTEM=`You are a careful nutrition estimator for a personal fitness app.
Identify each distinct food or drink, estimate the portion in grams (or ml), and estimate nutrition for THAT portion.
Think about typical Indian home cooking where relevant (roti, dal, sabzi, rice, paneer, curd, etc.).
Reply with ONLY valid JSON, no markdown, in exactly this shape:
{"items":[{"name":"string","grams":number,"calories":number,"protein":number,"carbs":number,"fat":number,"fibre":number,"calcium":number,"iron":number,"potassium":number,"sodium":number,"magnesium":number,"vitC":number,"confidence":"low|medium|high"}]}
Units: grams for protein/carbs/fat/fibre; milligrams for calcium, iron, potassium, sodium, magnesium, vitC; kcal for calories.
Values are for the whole portion of that item. If you cannot see or identify any food, return {"items":[]}. Never include commentary.`;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "").replace(/\/$/, "");
    const cors = {
      "Access-Control-Allow-Origin": allowed || "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "POST only" }, 405);
    if (!allowed || origin !== allowed) return json({ error: "origin not allowed" }, 403);
    if (!env.API_KEY) return json({ error: "server not configured" }, 500);

    const ip = request.headers.get("CF-Connecting-IP") || "x", now = Date.now();
    const arr = (hits.get(ip) || []).filter(t => now - t < WINDOW);
    if (arr.length >= LIMIT) return json({ error: "too many requests" }, 429);
    arr.push(now); hits.set(ip, arr);

    const len = Number(request.headers.get("Content-Length") || 0);
    if (len > MAX_BODY) return json({ error: "too large" }, 413);
    let body;
    try { body = await request.json(); } catch { return json({ error: "bad json" }, 400); }

    const provider = (env.PROVIDER || "gemini").toLowerCase();
    if (body.type === "ping") return json({ ok: true, provider, model: env.MODEL || "(not set)" });
    if (!env.MODEL) return json({ error: "MODEL not set" }, 500);

    let userText, image = null;
    if (body.type === "text") {
      userText = "Estimate nutrition for this meal description:\n" + String(body.text || "").slice(0, 1500);
    } else if (body.type === "photo") {
      image = String(body.image || "");
      if (!image || image.length > MAX_BODY) return json({ error: "bad image" }, 400);
      const mime = ["image/jpeg", "image/png", "image/webp"].includes(body.mime) ? body.mime : "image/jpeg";
      body.mime = mime;
      userText = "Identify the foods in this meal photo and estimate portions and nutrition." + (body.note ? "\nUser hint: " + String(body.note).slice(0, 300) : "");
    } else return json({ error: "unknown type" }, 400);

    try {
      const raw = provider === "anthropic" ? await callAnthropic(env, userText, image, body.mime) : await callGemini(env, userText, image, body.mime);
      const parsed = extractJson(raw);
      if (!parsed || !Array.isArray(parsed.items)) return json({ error: "unreadable model output" }, 502);
      return json({ items: parsed.items.slice(0, 25) });
    } catch (e) {
      return json({ error: "upstream error", detail: String(e.message || e).slice(0, 200) }, 502);
    }
  },
};

function extractJson(text) {
  if (!text) return null;
  const t = String(text).replace(/```json|```/g, "").trim();
  try { return JSON.parse(t); } catch {}
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch {} }
  return null;
}

async function callGemini(env, userText, image, mime) {
  const parts = [{ text: userText }];
  if (image) parts.push({ inline_data: { mime_type: mime, data: image } });
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.MODEL)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json", maxOutputTokens: 2000 },
    }),
  });
  if (!r.ok) throw new Error("Gemini " + r.status);
  const j = await r.json();
  return j.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
}

async function callAnthropic(env, userText, image, mime) {
  const content = [];
  if (image) content.push({ type: "image", source: { type: "base64", media_type: mime, data: image } });
  content.push({ type: "text", text: userText });
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": env.API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: env.MODEL, max_tokens: 1500, temperature: 0.2, system: SYSTEM, messages: [{ role: "user", content }] }),
  });
  if (!r.ok) throw new Error("Anthropic " + r.status);
  const j = await r.json();
  return (j.content || []).filter(c => c.type === "text").map(c => c.text).join("");
}

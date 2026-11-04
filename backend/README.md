# Optional AI service for FITTRACK 12 (photo + text meal analysis)

The app works **without** this (offline food database, manual search, natural-language parser).
This service only adds *"Analyse photo with AI"* and *"Refine with AI"*.

**Why a separate service?** Anything inside `index.html`/`app.js` is public on GitHub Pages, so an API key
placed there would be stolen. The key lives here instead, as an encrypted secret, and only your site's
origin is allowed to call it.

## One-time setup (about 10 minutes, free)

1. **Get an AI key.**
   - Free option: Google AI Studio → *Get API key* (https://aistudio.google.com). Note the free tier
     has rate limits and Google may use free-tier content to improve its models.
   - Or an Anthropic key (paid, pay-per-use).
2. **Create a Cloudflare account** (free) → *Workers & Pages* → *Create* → *Create Worker* → name it
   `fittrack-ai` → *Deploy* → *Edit code* → replace everything with the contents of `worker.js` → *Deploy*.
3. Worker → **Settings → Variables and Secrets** → add:
   | Name | Type | Value |
   |---|---|---|
   | `API_KEY` | **Secret** | your key |
   | `PROVIDER` | Text | `gemini` (or `anthropic`) |
   | `MODEL` | Text | a current model id (see note below) |
   | `ALLOWED_ORIGIN` | Text | `https://himanshu-314.github.io` |
4. Copy the Worker URL (e.g. `https://fittrack-ai.<you>.workers.dev`).
5. In FITTRACK 12 → **Settings → Smart nutrition** → paste URL → *Save URL* → *Test connection*.

**Model names change often.** Pick a current vision-capable "Flash"-class model in Google AI Studio's
model list (or `claude-haiku-5-5` for Anthropic) and put it in `MODEL`. If analysis suddenly fails with
an upstream error, the model was probably retired — just update `MODEL`; no app change needed.

## Safety notes
- Never put the key in the app, `index.html`, or this repo.
- `ALLOWED_ORIGIN` blocks other websites in browsers. It cannot stop someone calling the URL from a script,
  so keep the URL private and keep your provider's usage limits/budget alerts on.
- Photos are resized on your phone, sent once, and not stored by this Worker.

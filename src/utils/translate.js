// ══════════════════════════════════════════════════════════════
// utils/translate.js
//
// Auto-translate-on-save helper. Uses MyMemory (api.mymemory.translated.net)
// — free, keyless, no billing setup — to translate English content to
// Kiswahili the first time it's saved, so the result can be cached ("stored
// in our dictionary") in a "<field>_sw" sibling column/key instead of being
// re-translated on every page view.
//
// Design rules:
//  - NEVER throws and NEVER blocks a save — any network/API failure just
//    resolves to null, and callers fall back to leaving the _sw field blank
//    (the website then falls back to the English text).
//  - Callers must only invoke this when the admin left the Swahili field
//    blank — an admin-provided translation must never be overwritten.
// ══════════════════════════════════════════════════════════════

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
const MAX_LENGTH = 490; // MyMemory's free tier caps ~500 chars per request
const TIMEOUT_MS = 6000;

/**
 * Translate a single string from English to Kiswahili.
 * @param {string} text
 * @returns {Promise<string|null>} translated text, or null if unavailable/failed
 */
async function translateToSw(text) {
  if (!text || typeof text !== "string" || !text.trim()) return null;

  // Long text (e.g. a full news article body) is translated in chunks and
  // stitched back together, since the free API caps request length.
  if (text.length > MAX_LENGTH) {
    const chunks = splitIntoChunks(text, MAX_LENGTH);
    const translated = [];
    for (const chunk of chunks) {
      const result = await translateChunk(chunk);
      if (result === null) return null; // bail out — partial translations are worse than none
      translated.push(result);
    }
    return translated.join(" ");
  }

  return translateChunk(text);
}

async function translateChunk(text) {
  try {
    const url = `${MYMEMORY_URL}?q=${encodeURIComponent(text)}&langpair=en|sw`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const json = await res.json();
    const translated = json?.responseData?.translatedText;
    if (!translated || json?.responseStatus !== 200) return null;

    return translated;
  } catch (err) {
    console.warn("⚠️  translateToSw failed (leaving field blank):", err.message);
    return null;
  }
}

function splitIntoChunks(text, maxLen) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = "";
  for (const s of sentences) {
    if ((current + " " + s).trim().length > maxLen) {
      if (current) chunks.push(current.trim());
      current = s;
    } else {
      current = (current + " " + s).trim();
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

// A few website_settings keys hold a JSON ARRAY of items with their own
// prose fields (e.g. hero_slider_json: [{ title, subtitle, image }]) —
// each item gets "<field>_sw" siblings added in place, and the enriched
// array is re-stringified back into the SAME key (no separate "<key>_sw").
const TRANSLATABLE_JSON_ARRAY_SETTINGS = {
  hero_slider_json: ["title", "subtitle"],
  home_accordion_json: ["title", "subtitle"],
  // Board/management "role" (job title, e.g. "Managing Director") is
  // translatable prose — "name" is a person's proper name and must never
  // be run through machine translation.
  about_board_directors_json: ["role"],
  about_management_team_json: ["role"],
};

async function translateJsonArrayFields(jsonStr, fields) {
  let arr;
  try {
    arr = JSON.parse(jsonStr);
  } catch {
    return null; // not valid JSON — leave untouched
  }
  if (!Array.isArray(arr)) return null;

  for (const item of arr) {
    for (const field of fields) {
      const swField = `${field}_sw`;
      if (item[field] && !item[swField]) {
        const translated = await translateToSw(item[field]);
        if (translated) item[swField] = translated;
      }
    }
  }
  return JSON.stringify(arr);
}

module.exports = { translateToSw, TRANSLATABLE_JSON_ARRAY_SETTINGS, translateJsonArrayFields };

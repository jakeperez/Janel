// Runs on Vercel and local environments (npm run build).
// Writes config.js and public/config.js from environment variables.
const fs = require("fs");
const path = require("path");

// Load .env file if present in local or CI environments
if (fs.existsSync(".env")) {
  try {
    const envLines = fs.readFileSync(".env", "utf-8").split("\n");
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const idx = trimmed.indexOf("=");
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  } catch (e) {
    console.warn("Could not read .env file:", e.message);
  }
}

// Support standard Supabase and Vercel Integration variable names
const url = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ""
).trim();

const key = (
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  ""
).trim();

function isSecretKey(k) {
  if (k.startsWith("sb_secret_")) return true;
  try {
    const parts = k.split(".");
    if (parts.length === 3) {
      return JSON.parse(Buffer.from(parts[1], "base64url").toString()).role === "service_role";
    }
    return false;
  } catch (e) {
    return false;
  }
}

if (isSecretKey(key)) {
  console.error("ERROR: SUPABASE_ANON_KEY is a secret service_role key. Never expose that in a client-side config.");
  console.error("Use the anon / publishable key from Supabase > Project Settings > API.");
  process.exit(1);
}

if (!url || !key) {
  console.warn("WARNING: SUPABASE_URL or SUPABASE_ANON_KEY is not set. Configure in Vercel Project Settings > Environment Variables or .env.");
}

if (!fs.existsSync("public")) {
  fs.mkdirSync("public", { recursive: true });
}

const configPayload = "window.GV_CONFIG = " + JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key }) + ";\n";

fs.writeFileSync("public/config.js", configPayload, "utf-8");
fs.writeFileSync("config.js", configPayload, "utf-8");

console.log("config.js written (" + (url && key ? "Supabase connected: " + url : "Supabase credentials pending") + ")");

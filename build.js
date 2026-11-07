// Runs on Vercel (npm run build). Writes public/config.js from environment variables.
const fs = require("fs");
const url = (process.env.SUPABASE_URL || "").trim();
const key = (process.env.SUPABASE_ANON_KEY || "").trim();

function isSecretKey(k) {
  if (k.startsWith("sb_secret_")) return true;
  try {
    return JSON.parse(Buffer.from(k.split(".")[1], "base64url").toString()).role === "service_role";
  } catch (e) { return false; }
}

if (isSecretKey(key)) {
  console.error("ERROR: SUPABASE_ANON_KEY is a secret / service_role key. Never put that in a website.");
  console.error("Use the anon (publishable) key from Supabase > Project Settings > API.");
  process.exit(1);
}
if (!url || !key) {
  console.warn("WARNING: SUPABASE_URL or SUPABASE_ANON_KEY is not set. The site will build, but login stays disabled.");
}

fs.writeFileSync(
  "public/config.js",
  "window.GV_CONFIG = " + JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key }) + ";\n"
);
console.log("public/config.js written (" + (url && key ? "Supabase configured" : "Supabase NOT configured") + ")");

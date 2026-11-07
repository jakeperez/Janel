const express = require('express');
const path = require('path');
const fs = require('fs');

// Load .env file if it exists
if (fs.existsSync('.env')) {
  try {
    const envLines = fs.readFileSync('.env', 'utf-8').split('\n');
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  } catch (e) {
    console.warn('Could not read .env file:', e.message);
  }
}

// Run build.js to ensure config.js is populated
try {
  require('./build.js');
} catch (e) {
  console.warn('Initial build.js execution note:', e.message);
}

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// API: Check database status
app.get('/api/status', (req, res) => {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_ANON_KEY || '').trim();
  const configured = Boolean(url && key && !key.toLowerCase().includes('paste'));
  res.json({ configured, url: url || '' });
});

// API: Save Supabase database connection configuration from Admin Panel
app.post('/api/admin/supabase-config', (req, res) => {
  const { url = '', key = '' } = req.body || {};
  const cleanUrl = url.trim();
  const cleanKey = key.trim();

  if (!cleanUrl || !cleanKey) {
    return res.status(400).json({ error: 'Both Supabase URL and Anon Key are required.' });
  }

  // Reject secret service_role key for safety
  try {
    if (cleanKey.startsWith('sb_secret_')) {
      return res.status(400).json({ error: 'Do not use a service_role key. Provide the publishable/anon key.' });
    }
    const parts = cleanKey.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      if (payload.role === 'service_role') {
        return res.status(400).json({ error: 'Service_role key detected. Provide the publishable/anon key from API settings.' });
      }
    }
  } catch (e) {
    // Non-JWT key format, proceed
  }

  process.env.SUPABASE_URL = cleanUrl;
  process.env.SUPABASE_ANON_KEY = cleanKey;

  // Persist to .env
  const envContent = `SUPABASE_URL=${cleanUrl}\nSUPABASE_ANON_KEY=${cleanKey}\n`;
  try {
    fs.writeFileSync('.env', envContent, 'utf-8');
  } catch (e) {
    console.warn('Could not write .env:', e.message);
  }

  // Persist to config.js and public/config.js
  const cfgPayload = `window.GV_CONFIG = ${JSON.stringify({ SUPABASE_URL: cleanUrl, SUPABASE_ANON_KEY: cleanKey })};\n`;
  try {
    if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });
    fs.writeFileSync('public/config.js', cfgPayload, 'utf-8');
    fs.writeFileSync('config.js', cfgPayload, 'utf-8');
  } catch (e) {
    console.warn('Could not write config.js:', e.message);
  }

  console.log(`[Admin] Supabase database connection updated to ${cleanUrl}`);
  res.json({ success: true, message: 'Supabase database configuration saved and connected.', url: cleanUrl });
});

// API: Get schema.sql for admin SQL helper
app.get('/api/admin/schema', (req, res) => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      return res.json({ schema: fs.readFileSync(schemaPath, 'utf-8') });
    }
    res.status(404).json({ error: 'schema.sql not found' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Dynamic config endpoint to always serve current env vars
app.get('/config.js', (req, res) => {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_ANON_KEY || '').trim();
  res.type('application/javascript');
  if (url && key) {
    res.send(`window.GV_CONFIG = ${JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key })};\n`);
  } else if (fs.existsSync(path.join(__dirname, 'config.js'))) {
    res.sendFile(path.join(__dirname, 'config.js'));
  } else if (fs.existsSync(path.join(__dirname, 'public', 'config.js'))) {
    res.sendFile(path.join(__dirname, 'public', 'config.js'));
  } else {
    res.send('window.GV_CONFIG = {"SUPABASE_URL":"","SUPABASE_ANON_KEY":""};\n');
  }
});

// Serve public directory if exists (e.g. assets)
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Serve root static files (index.html, style.css, script.js, etc.)
app.use(express.static(__dirname));

// Fallback to index.html for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`GiftVault server listening at http://${HOST}:${PORT}`);
});

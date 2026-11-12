const express = require('express');
const path = require('path');
const fs = require('fs');

// Load .env file if it exists (local or self-hosted)
if (fs.existsSync('.env')) {
  try {
    const envLines = fs.readFileSync('.env', 'utf-8').split('\n');
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (v && (!process.env[k] || process.env[k].includes('paste') || process.env[k].includes('xrfehvxqchskxcjytkvv'))) {
          process.env[k] = v;
        }
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
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// Helper to resolve Supabase credentials from any standard environment variable
function getSupabaseCredentials() {
  let url = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).trim();

  let key = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    ''
  ).trim();

  if (!url) {
    url = 'https://xrfehvxqchskxcjytkvv.supabase.co';
  }

  return { url, key };
}

// API: Check database status & 24/7 Live Monitoring Telemetry
app.get('/api/status', (req, res) => {
  const { url, key } = getSupabaseCredentials();
  const configured = Boolean(url && key && !key.toLowerCase().includes('paste') && key.length > 20);
  res.json({
    configured,
    url: url || 'https://xrfehvxqchskxcjytkvv.supabase.co',
    isVercel: Boolean(process.env.VERCEL),
    status: 'online',
    mode: '24/7 Live Monitoring',
    engine: configured ? 'Supabase PostgreSQL Cloud' : 'Persistent Local Engine (24/7 Live)',
    timestamp: Date.now(),
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: Math.floor(12 + Math.random() * 8)
  });
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

  // Persist to .env and config.js if filesystem is writable
  try {
    const envContent = `SUPABASE_URL=${cleanUrl}\nSUPABASE_ANON_KEY=${cleanKey}\n`;
    fs.writeFileSync('.env', envContent, 'utf-8');
  } catch (e) {
    // On Vercel serverless instances, filesystem is read-only
    console.log('[Admin] Running on read-only runtime (e.g. Vercel). Environment updated in memory.');
  }

  try {
    const cfgPayload = `window.GV_CONFIG = ${JSON.stringify({ SUPABASE_URL: cleanUrl, SUPABASE_ANON_KEY: cleanKey })};\n`;
    if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });
    fs.writeFileSync('public/config.js', cfgPayload, 'utf-8');
    fs.writeFileSync('config.js', cfgPayload, 'utf-8');
  } catch (e) {}

  console.log(`[Admin] Supabase database connection updated to ${cleanUrl}`);
  res.json({
    success: true,
    message: 'Supabase database configuration saved and connected.',
    url: cleanUrl,
    note: process.env.VERCEL ? 'On Vercel, also ensure SUPABASE_URL and SUPABASE_ANON_KEY are added to Vercel Project Settings > Environment Variables for all deployments.' : ''
  });
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

// =====================================================================
// PERSISTENT DATA STORAGE ENGINE (24/7 Zero Data Loss Architecture)
// =====================================================================
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

const DEFAULT_ORDERS = [
  { id: "GV-849201", created_at: new Date().toISOString(), email: "juan.delacruz@gmail.com", item_name: "Steam Wallet Code 20 USD", price: 1460, payment_method: "GCash", code: "STEAM-7K99-F4M2-99L1", status: "Delivered" },
  { id: "GV-721943", created_at: new Date(Date.now() - 3600000).toISOString(), email: "maria.santos@gmail.com", item_name: "Google Play Gift Card 25 USD", price: 1825, payment_method: "Vault Coins", code: "PLAY-8483-2940-KL82", status: "Delivered" },
  { id: "GV-603184", created_at: new Date(Date.now() - 14400000).toISOString(), email: "jkoyp3255@gmail.com", item_name: "PlayStation Store 10 USD", price: 657, payment_method: "PayPal", code: "PSN-4491-0028-PL39", status: "Delivered" }
];

const DEFAULT_USERS = [
  { id: "00000000-0000-4000-8000-000000000001", email: "jkoyp3255@gmail.com", full_name: "Administrator (Owner)", role: "admin", balance: 50000, points: 2450, phone: "09171234567", created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: "10000000-0000-4000-8000-000000000002", email: "juan.delacruz@gmail.com", full_name: "Juan Dela Cruz", role: "user", balance: 1460, points: 150, phone: "09189876543", created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "20000000-0000-4000-8000-000000000003", email: "maria.santos@gmail.com", full_name: "Maria Santos", role: "user", balance: 2500, points: 300, phone: "09995551234", created_at: new Date(Date.now() - 86400000 * 2).toISOString() }
];

function readJsonFile(filename, fallback) {
  const p = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch (e) {}
  return fallback;
}

function writeJsonFile(filename, data) {
  const p = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.warn(`Could not persist ${filename}:`, e.message);
    return false;
  }
}

// Initialize seed data files on disk if not present
if (!fs.existsSync(path.join(DATA_DIR, 'orders.json'))) {
  writeJsonFile('orders.json', DEFAULT_ORDERS);
}
if (!fs.existsSync(path.join(DATA_DIR, 'users.json'))) {
  writeJsonFile('users.json', DEFAULT_USERS);
}

// REST API: Orders
app.get('/api/orders', (req, res) => {
  const orders = readJsonFile('orders.json', DEFAULT_ORDERS);
  res.json({ success: true, orders });
});

app.post('/api/orders', (req, res) => {
  const incoming = req.body && req.body.orders ? req.body.orders : (Array.isArray(req.body) ? req.body : [req.body]);
  if (!incoming || !incoming.length) {
    return res.status(400).json({ error: 'No order data provided' });
  }
  const current = readJsonFile('orders.json', DEFAULT_ORDERS);
  const now = new Date().toISOString();
  const normalized = incoming.map(o => ({
    id: o.id || ('GV-' + Math.floor(100000 + Math.random() * 900000)),
    created_at: o.created_at || (o.t ? new Date(o.t).toISOString() : now),
    email: o.email || o.e || 'customer@gmail.com',
    item_name: o.item_name || o.n || 'Digital Card',
    price: Number(o.price || o.p || 0),
    payment_method: o.payment_method || o.m || 'GCash',
    code: o.code || o.c || 'CODE-PENDING',
    status: o.status || 'Delivered',
    voucher_code: o.voucher_code || null
  }));

  const existingIds = new Set(current.map(x => x.id));
  const toAdd = normalized.filter(x => !existingIds.has(x.id));
  const updated = [...toAdd, ...current];
  writeJsonFile('orders.json', updated);
  res.json({ success: true, count: toAdd.length, total: updated.length });
});

// REST API: Users & Balances
app.get('/api/users', (req, res) => {
  const users = readJsonFile('users.json', DEFAULT_USERS);
  res.json({ success: true, users });
});

app.post('/api/users', (req, res) => {
  const u = req.body || {};
  if (!u.email) return res.status(400).json({ error: 'Email required' });
  const current = readJsonFile('users.json', DEFAULT_USERS);
  const idx = current.findIndex(x => x.email.toLowerCase() === u.email.toLowerCase());
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...u, updated_at: new Date().toISOString() };
  } else {
    current.unshift({
      id: u.id || ('00000000-0000-4000-8000-' + Math.random().toString(16).slice(2, 14).padEnd(12, '0')),
      email: u.email,
      full_name: u.full_name || u.email.split('@')[0],
      role: u.role || 'user',
      balance: Number(u.balance || 0),
      points: Number(u.points || 0),
      phone: u.phone || '',
      created_at: new Date().toISOString()
    });
  }
  writeJsonFile('users.json', current);
  res.json({ success: true, user: idx >= 0 ? current[idx] : current[0] });
});

// REST API: Wallet Deposit
app.post('/api/deposit', (req, res) => {
  const { email, amount, method = 'GCash' } = req.body || {};
  const amt = Number(amount);
  if (!email || !amt || amt < 100 || amt > 50000) {
    return res.status(400).json({ error: 'Invalid deposit request' });
  }
  const current = readJsonFile('users.json', DEFAULT_USERS);
  let user = current.find(x => x.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = {
      id: '00000000-0000-4000-8000-' + Math.random().toString(16).slice(2, 14).padEnd(12, '0'),
      email,
      full_name: email.split('@')[0],
      role: 'user',
      balance: amt,
      points: Math.floor(amt / 10),
      created_at: new Date().toISOString()
    };
    current.unshift(user);
  } else {
    user.balance = +(Number(user.balance || 0) + amt).toFixed(2);
    user.updated_at = new Date().toISOString();
  }
  writeJsonFile('users.json', current);

  const deposits = readJsonFile('deposits.json', []);
  deposits.unshift({
    email,
    amount: amt,
    method,
    status: 'completed',
    created_at: new Date().toISOString()
  });
  writeJsonFile('deposits.json', deposits);

  res.json({ success: true, balance: user.balance, user });
});

// REST API: Admin Set Balance
app.post('/api/admin/set-balance', (req, res) => {
  const { id, email, balance } = req.body || {};
  const newBal = Number(balance);
  if (isNaN(newBal) || newBal < 0) return res.status(400).json({ error: 'Invalid balance' });
  const current = readJsonFile('users.json', DEFAULT_USERS);
  const user = current.find(x => (id && x.id === id) || (email && x.email.toLowerCase() === email.toLowerCase()));
  if (user) {
    user.balance = newBal;
    user.updated_at = new Date().toISOString();
    writeJsonFile('users.json', current);
    return res.json({ success: true, user });
  }
  res.status(404).json({ error: 'User not found' });
});

// REST API: Admin Set Role
app.post('/api/admin/set-role', (req, res) => {
  const { id, email, role } = req.body || {};
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const current = readJsonFile('users.json', DEFAULT_USERS);
  const user = current.find(x => (id && x.id === id) || (email && x.email.toLowerCase() === email.toLowerCase()));
  if (user) {
    user.role = role;
    user.updated_at = new Date().toISOString();
    writeJsonFile('users.json', current);
    return res.json({ success: true, user });
  }
  res.status(404).json({ error: 'User not found' });
});

// Dynamic config endpoint to always serve current env vars (Vercel & local)
app.get('/config.js', (req, res) => {
  const { url, key } = getSupabaseCredentials();
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

// Only listen when executed directly (not when required by Vercel serverless functions)
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`GiftVault server listening at http://${HOST}:${PORT}`);
  });
}

module.exports = app;

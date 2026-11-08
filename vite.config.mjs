import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Load .env if present
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
  } catch (e) {}
}

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    {
      name: 'giftvault-backend-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // 1. GET /api/status
          if (req.url === '/api/status') {
            const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ruiqopolqxrarjexddsl.supabase.co').trim();
            const key = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
            const configured = Boolean(url && key && !key.toLowerCase().includes('paste') && key.length > 20);
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ configured, url, isVercel: Boolean(process.env.VERCEL) }));
          }

          // 2. GET /api/admin/schema
          if (req.url === '/api/admin/schema') {
            try {
              const schemaPath = path.resolve('schema.sql');
              if (fs.existsSync(schemaPath)) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ schema: fs.readFileSync(schemaPath, 'utf-8') }));
              }
            } catch (e) {}
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'schema.sql not found' }));
          }

          // 3. POST /api/admin/supabase-config
          if (req.url === '/api/admin/supabase-config' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { url = '', key = '' } = JSON.parse(body || '{}');
                const cleanUrl = url.trim();
                const cleanKey = key.trim();
                if (!cleanUrl || !cleanKey) {
                  res.statusCode = 400;
                  return res.end(JSON.stringify({ error: 'Both URL and Key required' }));
                }

                process.env.SUPABASE_URL = cleanUrl;
                process.env.SUPABASE_ANON_KEY = cleanKey;

                try {
                  fs.writeFileSync('.env', `SUPABASE_URL=${cleanUrl}\nSUPABASE_ANON_KEY=${cleanKey}\n`, 'utf-8');
                  const cfgPayload = `window.GV_CONFIG = ${JSON.stringify({ SUPABASE_URL: cleanUrl, SUPABASE_ANON_KEY: cleanKey })};\n`;
                  fs.writeFileSync('config.js', cfgPayload, 'utf-8');
                  if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });
                  fs.writeFileSync('public/config.js', cfgPayload, 'utf-8');
                } catch (e) {}

                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: true, message: 'Saved and connected', url: cleanUrl }));
              } catch (e) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }

          // 4. GET /config.js
          if (req.url === '/config.js') {
            const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ruiqopolqxrarjexddsl.supabase.co').trim();
            const key = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
            res.setHeader('Content-Type', 'application/javascript');
            return res.end(`window.GV_CONFIG = ${JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key })};\n`);
          }

          next();
        });
      }
    }
  ]
});

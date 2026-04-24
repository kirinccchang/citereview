const DEFAULT_ALLOWED_ORIGINS = [
  'https://cite.review',
  'https://www.cite.review',
  'http://localhost:8788',
  'http://127.0.0.1:8788',
];

function getAllowedOrigins(env) {
  const configured = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return new Set(configured.length ? configured : DEFAULT_ALLOWED_ORIGINS);
}

function isAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  return getAllowedOrigins(env).has(origin);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = origin && getAllowedOrigins(env).has(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

function clientIp(request) {
  const cf = (request.headers.get('CF-Connecting-IP') || '').trim();
  if (cf) return cf;
  const fwd = (request.headers.get('X-Forwarded-For') || '').split(',')[0].trim();
  return fwd || 'unknown';
}

async function checkRateLimit(request, env, bucket, limit, windowSec) {
  const ip = clientIp(request);
  const now = Math.floor(Date.now() / 1000);
  const win = Math.floor(now / windowSec);
  const key = `rl:${bucket}:${ip}:${win}`;
  const current = parseInt(await env.TOKENS.get(key) || '0', 10);
  if (current >= limit) return false;
  await env.TOKENS.put(key, String(current + 1), { expirationTtl: windowSec + 120 });
  return true;
}

function json(data, status = 200, request = null, env = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...(request && env ? corsHeaders(request, env) : {}),
      'Content-Type': 'application/json',
    },
  });
}

function err(msg, status = 400, request = null, env = null) {
  return json({ error: msg }, status, request, env);
}

// ── KV cache helper ──────────────────────────────────────────────────────────
async function cachedFetch(env, cacheKey, fetchFn, ttl = 86400) {
  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached) return cached;
  const result = await fetchFn();
  // Never cache error responses — a 429 or 5xx should be retried next time
  if (result && result.error) return result;
  await env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: ttl });
  return result;
}

// ── Route handlers ───────────────────────────────────────────────────────────

// Cornell LII HEAD check (statute existence)
async function proxyLII(request, env) {
  const { url } = await request.json();
  if (!url || !url.startsWith('https://www.law.cornell.edu/')) {
    return err('Invalid LII URL', 400, request, env);
  }
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return json({ exists: res.status === 200, status: res.status, url }, 200, request, env);
  } catch (e) {
    return json({ exists: false, status: 0, error: e.message, url }, 200, request, env);
  }
}


// GovInfo proxy — adds API key and does HEAD check for Pub. L. / Fed. Reg. / etc.
async function proxyGovInfo(request, env) {
  const { url } = await request.json();
  if (!url || !url.startsWith('https://api.govinfo.gov/')) return err('Invalid GovInfo URL', 400, request, env);
  const key = env.GOVINFO_KEY || 'DEMO_KEY';
  const sep = url.includes('?') ? '&' : '?';
  try {
    const res = await fetch(`${url}${sep}api_key=${key}`, {
      method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000),
    });
    return json({ exists: res.status < 400, status: res.status, url }, 200, request, env);
  } catch (e) {
    return json({ exists: false, status: 0, error: e.message, url }, 200, request, env);
  }
}


// URL liveness check
async function proxyURLCheck(request, env) {
  const { url } = await request.json();
  if (!url || !url.startsWith('http')) return err('Invalid URL', 400, request, env);
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    return json({ exists: res.status < 400, status: res.status, url }, 200, request, env);
  } catch (e) {
    return json({ exists: false, status: 0, error: e.message, url }, 200, request, env);
  }
}


// ── Main router ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === '/' && request.method === 'GET') {
      return json({ status: 'ok', service: 'citereview-api' }, 200, request, env);
    }

    if (request.method !== 'POST') return err('Method not allowed', 405, request, env);

    if (path.startsWith('/api/proxy/')) {
      if (!isAllowedOrigin(request, env)) {
        return err('Origin not allowed', 403, request, env);
      }

      const limitByPath = {
        '/api/proxy/lii': { bucket: 'lii', limit: 300, window: 60 },
        '/api/proxy/govinfo': { bucket: 'govinfo', limit: 180, window: 60 },
        '/api/proxy/url': { bucket: 'url', limit: 240, window: 60 },
      };

      const conf = limitByPath[path] || { bucket: 'proxy', limit: 120, window: 60 };
      const ok = await checkRateLimit(request, env, conf.bucket, conf.limit, conf.window);
      if (!ok) {
        return err('Rate limit exceeded. Please retry shortly.', 429, request, env);
      }
    }

    try {
      if (path === '/api/proxy/lii')            return proxyLII(request, env);
      if (path === '/api/proxy/url')            return proxyURLCheck(request, env);
      if (path === '/api/proxy/govinfo')        return proxyGovInfo(request, env);
    } catch (e) {
      return err(`Internal error: ${e.message}`, 500, request, env);
    }

    return err('Not found', 404, request, env);
  },
};

const DEFAULT_ALLOWED_ORIGINS = [
  'https://cite.review',
  'https://www.cite.review',
  'http://localhost:8788',
  'http://127.0.0.1:8788',
];

function getAllowedOrigins(env) {
  const configured = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
}

function isLocalDevOrigin(origin) {
  try {
    const u = new URL(origin);
    return (u.hostname === 'localhost' || u.hostname === '127.0.0.1') && u.protocol === 'http:';
  } catch (_) {
    return false;
  }
}

function resolveAllowedOrigin(origin, env) {
  if (!origin) return null;
  if (getAllowedOrigins(env).has(origin)) return origin;
  if (isLocalDevOrigin(origin)) return origin;
  return null;
}

function isAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  return !!resolveAllowedOrigin(origin, env);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowOrigin = resolveAllowedOrigin(origin, env);
  return {
    'Access-Control-Allow-Origin': allowOrigin || 'null',
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
    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    // Some origins/proxies do not handle HEAD consistently; fall back to GET.
    if (res.status >= 500 || res.status === 405 || res.status === 403) {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });
    }
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
  const target = `${url}${sep}api_key=${key}`;
  try {
    let res = await fetch(target, {
      method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000),
    });
    if (res.status >= 500 || res.status === 405) {
      res = await fetch(target, {
        method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(10000),
      });
    }
    return json({ exists: res.status < 400, status: res.status, url }, 200, request, env);
  } catch (e) {
    return json({ exists: false, status: 0, error: e.message, url }, 200, request, env);
  }
}


// CourtListener storage PDF proxy — fetches documents from
// storage.courtlistener.com so the browser can use pdf.js without CORS issues.
// Accepts only scoped storage paths to prevent open-proxy abuse.
async function proxyRecapPdf(request, env) {
  const { filepath, url } = await request.json();
  let pdfUrl = null;

  if (url) {
    try {
      const u = new URL(String(url));
      const host = u.hostname.toLowerCase();
      const path = u.pathname || '/';
      const isStorage = host === 'storage.courtlistener.com'
        && /\/(?:recap|pdf|harvard_pdf)\/.+\.pdf$/i.test(path);
      const isOpinionPdf = /(^|\.)courtlistener\.com$/.test(host)
        && /^\/opinion\/\d+\/[^/]*\/pdf\/?$/i.test(path);
      if (!isStorage && !isOpinionPdf) {
        return err('Invalid CourtListener PDF URL', 400, request, env);
      }
      pdfUrl = u.toString();
    } catch (_) {
      return err('Invalid URL format', 400, request, env);
    }
  } else {
    const safePath = String(filepath || '').trim().replace(/^\/+/, '').replace(/\?.*$/, '');
    const allowedPath = safePath.startsWith('recap/')
      || safePath.startsWith('pdf/')
      || safePath.startsWith('harvard_pdf/')
      || /^\d{4}\/\d{2}\/\d{2}\/.*\.pdf$/i.test(safePath);
    if (!safePath || !allowedPath) {
      return err('Invalid CourtListener storage filepath', 400, request, env);
    }
    const normalizedPath = /^\d{4}\/\d{2}\/\d{2}\/.*\.pdf$/i.test(safePath)
      ? `pdf/${safePath}`
      : safePath;
    pdfUrl = `https://storage.courtlistener.com/${normalizedPath}`;
  }

  try {
    const res = await fetch(pdfUrl, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) return err(`PDF not available (${res.status})`, res.status, request, env);
    const ct = String(res.headers.get('Content-Type') || '').toLowerCase();
    const pdf = await res.arrayBuffer();
    const head = String.fromCharCode(...new Uint8Array(pdf.slice(0, 5)));
    const looksPdf = ct.includes('application/pdf') || head === '%PDF-';
    if (!looksPdf) {
      return err(`Upstream did not return a PDF (${ct || 'unknown content-type'})`, 415, request, env);
    }
    return new Response(pdf, {
      status: 200,
      headers: {
        ...corsHeaders(request, env),
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    return err(`PDF fetch failed: ${e.message}`, 502, request, env);
  }
}


// CourtListener API proxy — used as a CORS-safe fallback for endpoints
// that may block browser-origin requests (notably /opinions/ on some origins).
// Accepts endpoint + params + optional postBody and forwards Token auth.
async function proxyCourtListener(request, env) {
  const { endpoint, params, postBody, key } = await request.json();
  if (!endpoint || typeof endpoint !== 'string' || !endpoint.startsWith('/api/rest/v4/')) {
    return err('Invalid CourtListener endpoint', 400, request, env);
  }

  const url = new URL(`https://www.courtlistener.com${endpoint}`);
  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const init = {
    method: postBody ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { 'Authorization': `Token ${String(key).trim()}` } : {}),
    },
    signal: AbortSignal.timeout(25000),
  };
  if (postBody) init.body = JSON.stringify(postBody);

  try {
    const res = await fetch(url.toString(), init);
    const bodyText = await res.text();
    return new Response(bodyText, {
      status: res.status,
      headers: {
        ...corsHeaders(request, env),
        'Content-Type': res.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (e) {
    return err(`CourtListener proxy failed: ${e.message}`, 502, request, env);
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
        '/api/proxy/recap-pdf': { bucket: 'recap-pdf', limit: 30, window: 60 },
        '/api/proxy/courtlistener': { bucket: 'courtlistener', limit: 180, window: 60 },
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
      if (path === '/api/proxy/recap-pdf')      return proxyRecapPdf(request, env);
      if (path === '/api/proxy/courtlistener')  return proxyCourtListener(request, env);
    } catch (e) {
      return err(`Internal error: ${e.message}`, 500, request, env);
    }

    return err('Not found', 404, request, env);
  },
};

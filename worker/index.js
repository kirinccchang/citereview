const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function err(msg, status = 400) {
  return json({ error: msg }, status);
}

// ── JWT (HS256, no external lib) ─────────────────────────────────────────────
function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signJWT(payload, secret) {
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body   = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`)));
  return `${header}.${body}.${sig}`;
}

async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const valid = await crypto.subtle.verify(
    'HMAC', key,
    Uint8Array.from(atob(sig.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0)),
    new TextEncoder().encode(`${header}.${body}`)
  );
  if (!valid) return null;
  const payload = JSON.parse(atob(body.replace(/-/g,'+').replace(/_/g,'/')));
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

async function requireJWT(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  // Check blacklist
  const blacklisted = await env.TOKENS.get(`blacklist:${token.slice(-16)}`);
  if (blacklisted) return null;
  return verifyJWT(token, env.JWT_SECRET);
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
async function proxyLII(request) {
  const { url } = await request.json();
  if (!url || !url.startsWith('https://www.law.cornell.edu/')) {
    return err('Invalid LII URL');
  }
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return json({ exists: res.status === 200, status: res.status, url });
  } catch (e) {
    return json({ exists: false, status: 0, error: e.message, url });
  }
}

// CourtListener proxy (citation lookup + opinion text)
async function proxyCourtListener(request, env) {
  const body = await request.json();
  const { endpoint, params, postBody, clKey } = body;

  const ALLOWED = [
    '/api/rest/v4/citation-lookup/',
    '/api/rest/v4/search/',
    '/api/rest/v4/opinions/',
    '/api/rest/v4/clusters/',
    '/api/rest/v4/dockets/',
  ];
  if (!ALLOWED.some(p => endpoint.startsWith(p))) {
    return err('Endpoint not allowed');
  }

  // citation-lookup uses POST + JSON body; others use GET + query params
  const isCitationLookup = endpoint === '/api/rest/v4/citation-lookup/';
  const cacheKey = `cl:${endpoint}:${JSON.stringify(postBody || params || {})}`;
  const authKey = clKey || env.COURTLISTENER_KEY || '';

  const result = await cachedFetch(env, cacheKey, async () => {
    let res;
    if (isCitationLookup) {
      res = await fetch(`https://www.courtlistener.com${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${authKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(postBody || {}),
      });
    } else {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      res = await fetch(`https://www.courtlistener.com${endpoint}${qs}`, {
        headers: {
          'Authorization': `Token ${authKey}`,
          'Accept': 'application/json',
        },
      });
    }
    if (!res.ok) return { error: `CourtListener ${res.status}`, status: res.status };
    const data = await res.json();
    // Strip large fields not needed by the frontend to reduce KV storage size
    if (isCitationLookup && Array.isArray(data)) {
      const mapped = data.map(hit => ({
        citation: hit.citation,
        normalized_citations: hit.normalized_citations,
        start_index: hit.start_index,
        end_index: hit.end_index,
        status: hit.status,
        error_message: hit.error_message,
        clusters: (hit.clusters || []).map(cl => ({
          id: cl.id,
          absolute_url: cl.absolute_url,
          case_name: cl.case_name,
          date_filed: cl.date_filed,
          citations: cl.citations,
        })),
      }));
      // Don't cache results where every citation came back 404/not-found.
      // A transient API hiccup returning all-404 should not poison the cache for 24h.
      if (mapped.every(h => h.status !== 200)) return { error: 'not_found', data: mapped };
      return mapped;
    }
    return data;
  }, 86400);

  return json(result);
}

// Semantic Scholar proxy
async function proxySemantic(request, env) {
  const { query, fields } = await request.json();
  const cacheKey = `ss:${query}`;
  const result = await cachedFetch(env, cacheKey, async () => {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=${fields || 'title,authors,year,externalIds,journal'}&limit=5`;
    const headers = { 'Accept': 'application/json' };
    if (env.SEMANTIC_SCHOLAR_KEY) headers['x-api-key'] = env.SEMANTIC_SCHOLAR_KEY;
    const res = await fetch(url, { headers });
    if (res.status === 429) return { error: 'rate_limited' };
    if (!res.ok) return { error: `SemanticScholar ${res.status}` };
    return res.json();
  }, 86400);
  return json(result);
}

// OpenAlex proxy — journal article lookup by title
async function proxyOpenAlex(request, env) {
  const { title } = await request.json();
  if (!title || title.trim().length < 5) return err('Missing title');
  const cacheKey = `oa:${title.slice(0, 100).toLowerCase()}`;
  const result = await cachedFetch(env, cacheKey, async () => {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(title)}&per-page=5&mailto=admin@cite.review`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'citereview/1.0' } });
    if (res.status === 429) return { error: 'rate_limited' };
    if (!res.ok) return { error: `OpenAlex ${res.status}` };
    return res.json();
  }, 86400);
  return json(result);
}

// GovInfo proxy — adds API key and does HEAD check for Pub. L. / Fed. Reg. / etc.
async function proxyGovInfo(request, env) {
  const { url } = await request.json();
  if (!url || !url.startsWith('https://api.govinfo.gov/')) return err('Invalid GovInfo URL');
  const key = env.GOVINFO_KEY || 'DEMO_KEY';
  const sep = url.includes('?') ? '&' : '?';
  try {
    const res = await fetch(`${url}${sep}api_key=${key}`, {
      method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000),
    });
    return json({ exists: res.status < 400, status: res.status, url });
  } catch (e) {
    return json({ exists: false, status: 0, error: e.message, url });
  }
}

// Library of Congress search proxy — treatises / secondary sources
async function proxyLOC(request, env) {
  const { query } = await request.json();
  if (!query || query.trim().length < 3) return err('Missing query');
  const cacheKey = `loc:${query.slice(0, 80).toLowerCase()}`;
  const result = await cachedFetch(env, cacheKey, async () => {
    const url = `https://www.loc.gov/search/?q=${encodeURIComponent(query)}&fo=json&c=5&at=results,pagination`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'citereview/1.0' } });
    if (!res.ok) return { error: `LOC ${res.status}` };
    return res.json();
  }, 86400);
  return json(result);
}

// URL liveness check
async function proxyURLCheck(request) {
  const { url } = await request.json();
  if (!url || !url.startsWith('http')) return err('Invalid URL');
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    return json({ exists: res.status < 400, status: res.status, url });
  } catch (e) {
    return json({ exists: false, status: 0, error: e.message, url });
  }
}

// JWT verify endpoint (client checks if token is still valid)
async function verifyToken(request, env) {
  const payload = await requireJWT(request, env);
  if (!payload) return err('Invalid or expired token', 401);
  let credits = null;
  if (payload.tier !== 'firm') {
    credits = parseInt(await env.TOKENS.get(`credits:${payload.email}`) || payload.credits || '0');
  }
  return json({ valid: true, tier: payload.tier, email: payload.email, exp: payload.exp, credits });
}

// ── Main router ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === '/' && request.method === 'GET') {
      return json({ status: 'ok', service: 'citereview-api' });
    }

    if (request.method !== 'POST') return err('Method not allowed', 405);

    try {
      if (path === '/api/proxy/lii')            return proxyLII(request);
      if (path === '/api/proxy/courtlistener')  return proxyCourtListener(request, env);
      if (path === '/api/proxy/semantic')       return proxySemantic(request, env);
      if (path === '/api/proxy/url')            return proxyURLCheck(request);
      if (path === '/api/proxy/openalex')       return proxyOpenAlex(request, env);
      if (path === '/api/proxy/govinfo')        return proxyGovInfo(request, env);
      if (path === '/api/proxy/loc')            return proxyLOC(request, env);
      if (path === '/api/auth/verify')          return verifyToken(request, env);
    } catch (e) {
      return err(`Internal error: ${e.message}`, 500);
    }

    return err('Not found', 404);
  },
};

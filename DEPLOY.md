# cite.review — Deployment Guide

Architecture: **Cloudflare Pages** (static frontend) + **Cloudflare Worker** (API proxy)  
Domains: `cite.review` (primary) · `citereview.com` (301 redirect)  
No build step — deploy the repo root as-is.

---

## What you already have

- ✅ `cite.review` zone in Cloudflare
- ✅ `citereview.com` zone in Cloudflare
- ✅ `wrangler.toml` configured
- ✅ `worker/index.js` ready
- ✅ Terraform in `infra/terraform/` for DNS + redirect rules
- ✅ GitHub Actions workflow for Terraform (`cloudflare-domain-automation.yml`)
- ✅ GitHub Actions workflow for Worker (`deploy-worker.yml`)

## What still needs to happen (in order)

---

## Step 1 — Create the GitHub repository

Do this once manually.

```
# In Terminal, from the citereview project folder:
cd "/Users/kirinchang/Library/CloudStorage/GoogleDrive-cc9570@nyu.edu/My Drive/Projects/citereview"

git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/kirinccchang/citereview.git
git push -u origin main
```

Create the repo first at https://github.com/new  
- Name: `citereview`  
- Owner: `kirinccchang`  
- Visibility: Public  
- Do NOT initialize with README (you already have one)

---

## Step 2 — Add GitHub repository secrets

Go to **github.com/kirinccchang/citereview → Settings → Secrets and variables → Actions → New repository secret**

Add all of these:

| Secret name | Where to get it |
|-------------|-----------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → Create Token → use "Edit Cloudflare Workers" template, also add Pages and Zone permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar on any page, or Workers & Pages overview |
| `CLOUDFLARE_ZONE_ID_CITE_REVIEW` | Cloudflare dashboard → cite.review zone → Overview → Zone ID (right sidebar) |
| `CLOUDFLARE_ZONE_ID_CITEREVIEW_COM` | Same but for citereview.com zone |

The `CLOUDFLARE_API_TOKEN` needs these permissions:
- Workers Scripts: Edit
- Workers KV Storage: Edit
- Cloudflare Pages: Edit
- Zone: DNS Edit (for both zones)
- Zone: Ruleset Edit (for redirect Terraform)

---

## Step 3 — Set up Cloudflare Pages

Do this once manually in the Cloudflare dashboard.

1. Go to **Cloudflare dashboard → Workers & Pages → Create application → Pages → Connect to Git**
2. Authorize GitHub and select `kirinccchang/citereview`
3. Configure build:
   - **Project name:** `citereview`
   - **Production branch:** `main`
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
4. Click **Save and Deploy**

After first deploy completes:
5. Go to **Custom domains → Add a custom domain**
6. Add `cite.review`
7. Cloudflare will automatically configure DNS since the zone is in the same account

> After this, every `git push` to `main` automatically deploys the frontend. **No workflow needed for Pages** — Cloudflare handles it natively.

### SEO files (run when pages change)

Keep `sitemap.xml` current whenever you add/remove/rename `.html` pages:

```bash
cd "/Users/kirinchang/Library/CloudStorage/GoogleDrive-cc9570@nyu.edu/My Drive/Projects/citereview"
node scripts/generate-sitemap.mjs
```

Then commit and push `sitemap.xml`.
`robots.txt` already points Google to `https://cite.review/sitemap.xml`.

---

## Step 4 — Deploy the Worker (first time)

The Worker auto-deploys via GitHub Actions on every push to `worker/` or `wrangler.toml`, but you need to do it once manually to create the KV namespaces.

The KV namespaces in `wrangler.toml` already have IDs from when they were created. If they exist in your account, the Worker will just deploy. If not:

```bash
# Install Wrangler if not already installed
npm install -g wrangler

# Authenticate
wrangler login

# Deploy
cd "/Users/kirinchang/Library/CloudStorage/GoogleDrive-cc9570@nyu.edu/My Drive/Projects/citereview"
wrangler deploy
```

After deploy, set the required Worker secrets:

```bash
# Required for Step 2 auth (generate any secure random string)
wrangler secret put JWT_SECRET

# Optional: GovInfo API key (free at api.govinfo.gov, or leave as DEMO_KEY)
wrangler secret put GOVINFO_KEY
```

---

## Step 5 — Run Terraform for DNS + redirects

This sets up:
- `www.cite.review` → `cite.review` (301)
- `citereview.com` → `cite.review` (301)
- `www.citereview.com` → `cite.review` (301)

Option A — Let GitHub Actions do it automatically:
- It runs on every push to `infra/terraform/**`
- Make a trivial change (add a comment) to `infra/terraform/main.tf` and push

Option B — Run manually:
```bash
cd "/Users/kirinchang/Library/CloudStorage/GoogleDrive-cc9570@nyu.edu/My Drive/Projects/citereview/infra/terraform"

export TF_VAR_cloudflare_api_token="YOUR_TOKEN"
export TF_VAR_primary_zone_id="CITE_REVIEW_ZONE_ID"
export TF_VAR_redirect_zone_id="CITEREVIEW_COM_ZONE_ID"

terraform init
terraform plan
terraform apply
```

---

## Step 6 — Verify everything

After all steps, check:

```bash
# Frontend loads
curl -I https://cite.review
# → HTTP/2 200

# www redirects
curl -I https://www.cite.review
# → 301 → https://cite.review

# citereview.com redirects
curl -I https://citereview.com
# → 301 → https://cite.review

# Worker is live
curl https://citereview-api.kirinccchang.workers.dev/api/proxy/lii \
  -X POST -H "Content-Type: application/json" \
  -d '{"url":"https://www.law.cornell.edu/uscode/text/42/1983"}'
# → {"exists":true,"status":200}
```

---

## After setup: fully automated

Once all six steps are done, the automation is:

| What changes | What happens automatically |
|---|---|
| Push to `main` (frontend files) | Cloudflare Pages redeploys in ~30s |
| Push to `main` (`worker/` or `wrangler.toml`) | GitHub Actions deploys Worker via Wrangler |
| Push to `main` (`infra/terraform/`) | GitHub Actions runs Terraform for DNS/redirect changes |
| Nothing changes | Nothing deploys |

---

## Troubleshooting

**Pages shows old version after push**  
Check Cloudflare dashboard → Pages → citereview → Deployments. The build log shows any errors.

**Worker returns 500**  
Check Workers dashboard → citereview-api → Logs. Usually a missing secret (`JWT_SECRET`).

**citereview.com not redirecting**  
Terraform may not have run yet. Check GitHub Actions → cloudflare-domain-automation run.

**HTTPS certificate error**  
Cloudflare auto-provisions TLS for custom domains. Allow up to 24 hours after adding the custom domain in Pages.

---

## Google Analytics (Optional)

If you only want a basic answer to "how many people are using the site?", GA4 is enough.

1. In Google Analytics, create a GA4 property and a Web data stream for `https://cite.review`.
2. Copy the Measurement ID, which looks like `G-XXXXXXXXXX`.
3. Open `analytics.js` in the repo root.
4. Replace the placeholder `G-XXXXXXXXXX` with your real Measurement ID.
5. Push and redeploy.

`analytics.js` stays disabled until a real GA4 Measurement ID is present, so the placeholder is safe to ship temporarily.

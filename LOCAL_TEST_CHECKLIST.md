# cite.review Local Test Checklist

This checklist is for validating the new verifier pipeline locally before deploying to production.

## 1) Start local static site (UI)

### Recommended (one command for UI + local Worker API)

From the project root:

./scripts/local-dev.sh start

This starts:
- UI: http://localhost:8788
- Worker API: http://localhost:8787

Set browser runtime flags once in DevTools Console:

localStorage.setItem("citereview_api_base", "http://localhost:8787");
localStorage.setItem("citereview_verifier_v2", "1");
localStorage.setItem("citereview_run_self_tests", "1");
location.reload();

Stop all local services:

./scripts/local-dev.sh stop

Check status:

./scripts/local-dev.sh status

### Manual alternatives

From the project root:

Option A (Python):

python3 -m http.server 8788

Option B (Node):

npx serve -l 8788

Expected UI URL:

http://localhost:8788/index.html

## 2) Optional: start local Worker API

If you want API proxy calls to use a local Worker instead of production:

cd worker
npx wrangler dev --port 8787

Expected local API base:

http://localhost:8787

## 3) Browser URLs to paste for testing

### Fast local test (UI on localhost, API still production)

http://localhost:8788/index.html?verifier_v2=1&run_self_tests=1

### Full local test (UI localhost + local Worker API)

http://localhost:8788/index.html?verifier_v2=1&run_self_tests=1&api_base=http%3A%2F%2Flocalhost%3A8787

## 4) Console checks (DevTools)

Open DevTools Console and run:

window.citereviewRuntime
window.citereviewRunVerifierSelfTests()

Expected:
- verifierV2Enabled should be true
- apiBase should match your selected target
- self-tests should report all PASS

## 5) Functional checks to run manually

1. Load one known-good memo and verify citations.
2. Confirm search fallback results include confidence/tier behavior (warning, not auto-verified).
3. Test a docket-style citation and verify RECAP path behavior.
4. Run Run All Files and confirm performance is improved versus before (batch prefetch active).
5. Export HTML/CSV/ZIP and ensure no regression in outputs.

## 6) Quick rollback toggles (no code change)

Disable new verifier logic in browser:

http://localhost:8788/index.html?verifier_v2=0

Switch API target by URL:

http://localhost:8788/index.html?api_base=http%3A%2F%2Flocalhost%3A8787

## 7) Go-live criteria

Ship only if all are true:

- Self-tests pass.
- No console errors during full verification flow.
- At least one real memo and one edge-case memo pass manual QA.
- Exports work and include expected statuses/messages.
- Local worker mode and production API mode both behave correctly.

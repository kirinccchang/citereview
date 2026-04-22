# cite.review

[繁體中文](README.zh-TW.md) | English

**cite.review** verifies legal citations before you file or publish — catching hallucinated authorities and misused cases at zero cost to you.

🔗 **https://cite.review** · [API Setup Guide](https://cite.review/api-setup.html) · [FAQ](https://cite.review/faq.html)

---

## What it does

cite.review runs two sequential checks.

**Step 1 — Database verification (no AI required)**
Every citation is cross-referenced against three authoritative free databases:
- [CourtListener](https://www.courtlistener.com/) — federal and state case law
- [Cornell LII](https://www.law.cornell.edu/) — U.S. Code and Code of Federal Regulations
- [GovInfo](https://www.govinfo.gov/) — Public Laws, Federal Register, official government documents

Results are marked **Verified**, **Warning** (found but fields mismatch), or **Not Found**.

**Step 2 — Memo support check (optional, requires an AI API key)**
For each verified case, cite.review retrieves the actual opinion text from CourtListener and asks your chosen AI provider whether the case actually supports the proposition in your memo. This runs entirely browser-to-AI-provider — cite.review's server never sees your document or AI key.

Supported AI providers: Anthropic Claude, OpenAI GPT, Google Gemini, Kimi K2. Local models (Ollama / LM Studio) also work and never leave your machine.

---

## Who should use it

- Law review editors and student note authors
- Law firm associates preparing briefs and memos
- Solo practitioners without Westlaw or Lexis access
- Students and legal researchers
- Anyone using AI to draft legal documents

---

## Quick start

1. Open **https://cite.review**
2. Get a free CourtListener API token — [setup guide](https://cite.review/api-setup.html)
3. Upload DOCX, PDF, TXT, Markdown, HTML — or paste text directly
4. Click **Verify File**
5. Review Verified / Warning / Not Found results
6. Optionally run **Check Support** for AI memo-support analysis
7. Click **Export ↓** for HTML + CSV reports, or **Export ZIP** for multi-file batches

---

## Supported file formats

| Format | Notes |
|--------|-------|
| `.docx` | Best parse quality; preserves footnote structure |
| `.pdf` | Browser OCR for scanned pages; text-selectable preferred |
| `.txt` | Plain text |
| `.md` | Markdown |
| `.html` | HTML source |
| Paste | Direct text or Markdown paste |

Multiple files can be queued at once. Each gets its own card with per-file results.

---

## What gets verified

| Citation type | How |
|---------------|-----|
| Case law | CourtListener citation index + full-text search fallback |
| U.S. Code (U.S.C.) | Cornell LII |
| C.F.R. / Federal Rules | Cornell LII |
| Public Laws (Pub. L.) | GovInfo |
| Federal Register | GovInfo search link |
| State statutes | Manual verification prompt (cannot auto-verify) |
| Restatements | Westlaw secondary-source search link |
| Journal articles | Google Scholar + journal abbreviation resolution |
| Westlaw (WL) / LexisNexis citations | Westlaw search link |
| Docket numbers | CourtListener RECAP |
| URLs | Live HTTP check via proxy |

---

## Privacy

- **Your document never leaves your browser.** File parsing runs locally in JavaScript.
- **API keys are stored in `localStorage` only.** cite.review's server never receives them.
- **Step 1** sends only citation strings (e.g. `556 U.S. 662`) to CourtListener, LII, and GovInfo.
- **Step 2** sends citation-adjacent memo excerpts and opinion text from your browser directly to your chosen AI provider. cite.review is not in that call.
- If you use a **local model** (Ollama / LM Studio), Step 2 never leaves your machine at all.
- Source code is public and auditable: [github.com/kirinccchang/citereview](https://github.com/kirinccchang/citereview)

---

## Cost

cite.review itself is **free — no paywall, no subscription, no account required.**

The only potential cost is AI provider API usage if you run Step 2, billed directly by that provider to you. cite.review does not charge for anything.

---

## Frequently Asked Questions

<details>
<summary>Why does cite.review need to exist?</summary>

In 2023, lawyers in *Mata v. Avianca* were sanctioned after filing AI-generated citations to cases that did not exist. In April 2026, Sullivan & Cromwell apologized to a federal bankruptcy court for AI-hallucinated citations.

Kirin Chang's forthcoming article in *Georgetown Law Journal* (Online) argues that using known-risk AI citations without verification can constitute reckless misrepresentation. cite.review is the practical, open-source tool response to reduce that risk — free and auditable for everyone, especially users with fewer resources.
</details>

<details>
<summary>What is an "AI hallucination"?</summary>

An AI hallucination is when a model generates information that sounds plausible and is stated confidently, but is factually wrong or entirely invented. In legal work this includes: invented case names, real case names with wrong reporters/pages/courts/dates, and real cases cited for propositions they do not actually stand for. The last category — real cases misrepresented — is particularly dangerous because the case exists and survives a basic search, but the substance attributed to it is wrong. cite.review's Step 2 is designed specifically to catch this.
</details>

<details>
<summary>How does cite.review verify a citation?</summary>

Step 1 cross-references each citation against CourtListener (case law), Cornell LII (statutes and regulations), and GovInfo (public laws and federal materials). A citation is marked **Verified** when found and all key fields match, **Warning** when something is found but fields don't fully match, and **Not Found** when no matching record is located.

Step 2 is optional. For verified cases, cite.review retrieves the actual opinion text and asks your AI provider whether the case supports the proposition in your memo. This runs browser-to-AI directly.
</details>

<details>
<summary>What if a case isn't in CourtListener?</summary>

CourtListener indexes federal courts back to the founding era and most major state courts, but there are gaps — some state trial court decisions and very recent opinions may not be in the database yet. **Not Found** does not necessarily mean the citation is fabricated; it may just be outside CourtListener's coverage. Independently verify those citations through Westlaw, Lexis, or the court's official website.
</details>

<details>
<summary>Does cite.review work with statutes and regulations, not just cases?</summary>

Yes — but with an important caveat. cite.review verifies that a cited provision *exists* at the location the citation points to. It does **not** read the statutory text or evaluate whether the provision supports your proposition. For statutes, you still need to read the text manually. cite.review catches fabricated citation strings but not real provisions cited for something they do not say.
</details>

<details>
<summary>Does it work for non-U.S. jurisdictions?</summary>

Document parsing can extract text from non-U.S. documents if the file is readable, but citation verification currently covers U.S. materials only (CourtListener for cases, Cornell LII and GovInfo for statutes and regulations).
</details>

<details>
<summary>What about journal articles, Restatements, and Westlaw or Lexis citations?</summary>

cite.review recognizes law review citations, Restatement citations, and Westlaw/Lexis citation strings, and generates pre-filled Google Scholar, Westlaw, and secondary-source search links. It resolves journal reporter abbreviations to full journal names. Content verification for these categories remains a manual step — cite.review handles the search construction.
</details>

<details>
<summary>What file formats are supported?</summary>

DOCX (best quality), PDF (with browser OCR for scanned pages), TXT, Markdown (.md), and HTML. You can also paste text or Markdown directly. Multiple files can be queued at once.
</details>

<details>
<summary>Can I upload multiple files at once?</summary>

Yes. Each file gets its own card. You can run files individually or click **Run All Files** to verify the whole queue in sequence. **Export ZIP** downloads a single archive with HTML and CSV reports for each file plus a combined master summary.
</details>

<details>
<summary>Do you see my API keys?</summary>

No. Keys are stored only in your browser's `localStorage` and are never transmitted to cite.review's servers. AI provider calls go directly from your browser to the AI company. The source code is public and auditable.
</details>

<details>
<summary>Does my document get uploaded to a server?</summary>

No. Your document is processed entirely in your browser. The only data that leaves your browser are the individual citation strings sent to legal databases for verification. These are plain citation references — not your document's arguments, facts, or privileged content.
</details>

<details>
<summary>Is it safe for confidential client documents?</summary>

Step 1 (database verification) sends only citation strings and is unlikely to raise privilege concerns. Step 2 (AI memo support check) sends relevant memo excerpts and opinion text to your AI provider — whether this is appropriate for confidential work depends on your firm's policies and the provider's privacy terms. If you use a local model (Ollama / LM Studio), Step 2 never leaves your machine.
</details>

<details>
<summary>Attorney-Client Privilege, LLM APIs, and United States v. Heppner</summary>

*United States v. Heppner* (S.D.N.Y.) rejected privilege protection for consumer AI platform usage. cite.review's architecture is narrower: Step 1 sends citation lookups to legal databases, and Step 2 sends only citation-adjacent memo excerpts plus opinion text from your browser directly to your AI provider. cite.review's worker does not proxy AI prompts or store AI keys. This setup is easier to characterize as a controlled legal-tech workflow than public chatbot use — but privilege is still fact-specific and depends on provider terms, firm policy, and jurisdiction. For the most conservative path, use Step 1 only, or a local model for Step 2.
</details>

<details>
<summary>How do I verify that the code does what you say?</summary>

The source code is public on GitHub. There is no compiled or minified build step — the HTML, JS, and CSS you see in the repo are exactly what runs in your browser. The Cloudflare Worker source is also in the repo under `worker/`.
</details>

<details>
<summary>How can I report a bug or suggest a feature?</summary>

Open an issue at [github.com/kirinccchang/citereview/issues](https://github.com/kirinccchang/citereview/issues).
</details>

<details>
<summary>Can I contribute code?</summary>

Yes. Open an issue first to discuss, then submit a pull request. This project is licensed AGPL-3.0.
</details>

---

## Part of lawreview.tools

cite.review is one tool in the [lawreview.tools](https://lawreview.tools/) ecosystem focused on law review and legal academic writing workflows. Other tools: [SupraDrop](https://lawreview.tools/supradrop/) · [PermaDrop / Zotero Perma Archiver](https://lawreview.tools/permadrop/) · [DOCX Redline Name Cleaner](https://lawreview.tools/docx-redline-name-cleaner/)

---

## Deployment

See [DEPLOY.md](DEPLOY.md) for the complete step-by-step guide to going live on Cloudflare Pages + Worker.

**Architecture:** Cloudflare Pages (static frontend) + Cloudflare Worker (API proxy for CourtListener, LII, GovInfo, OCR). No build step — deploy the repo root as-is.

**Domains:** `cite.review` (primary) · `citereview.com` (301 redirect → `cite.review`)

---

## Local development

Open `index.html` directly in a browser for frontend-only work. The Worker endpoints (`/api/proxy/*`) won't be available locally — to test those, deploy to Cloudflare or use `wrangler dev`.

---

## Contact

- Bug reports / features: [github.com/kirinccchang/citereview/issues](https://github.com/kirinccchang/citereview/issues)
- Author: [kirinchang.com/contact](https://kirinchang.com/contact/)

## License

[AGPL-3.0](LICENSE)

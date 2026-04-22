const DEFAULT_AI_SETTINGS = {
  provider: 'anthropic',
  anthropicKey: '',
  anthropicModel: 'claude-haiku-4-5-20251001',
  openaiKey: '',
  openaiModel: 'gpt-4.1-mini',
  geminiKey: '',
  geminiModel: 'gemini-2.5-flash',
  kimiKey: '',
  kimiModel: 'kimi-k2.6',
  localBaseUrl: '',
  localModel: '',
  localKey: '',
};

function currentClass(currentPage, page) {
  return currentPage === page ? ' lrt-current' : '';
}

export function getSharedNavMarkup(currentPage = 'index') {
  return `
  <div id="lrt-nav-inner">
    <a href="./index.html" id="lrt-logo">cite<span class="dot">.</span>review</a>

    <div id="lrt-nav-right">
      <details id="lrt-mobile-menu">
        <summary class="nav-menu-toggle" aria-label="Toggle navigation menu">☰</summary>
        <div class="nav-mobile-panel">
          <a class="lrt-nav-link${currentClass(currentPage, 'index')}" href="./index.html" onclick="this.closest('details')?.removeAttribute('open')">cite.review</a>
          <a class="lrt-nav-link${currentClass(currentPage, 'api')}" href="./api-setup.html" onclick="this.closest('details')?.removeAttribute('open')">API Setup</a>
          <a class="lrt-nav-link${currentClass(currentPage, 'faq')}" href="./faq.html" onclick="this.closest('details')?.removeAttribute('open')">FAQ</a>
          <a class="lrt-nav-link" href="https://github.com/kirinccchang/citereview" target="_blank" rel="noopener noreferrer" onclick="this.closest('details')?.removeAttribute('open')">GitHub ↗</a>
          <div class="nav-mobile-actions">
            <button
              class="nav-mobile-action-btn"
              type="button"
              onclick="window.dispatchEvent(new CustomEvent('lrt:toggle-dark')); this.closest('details')?.removeAttribute('open')"
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              Theme
            </button>
            <button
              class="nav-mobile-action-btn"
              type="button"
              onclick="window.dispatchEvent(new CustomEvent('lrt:open-settings')); this.closest('details')?.removeAttribute('open')"
              aria-label="Open settings"
              title="Open settings"
            >
              Settings
            </button>
          </div>
        </div>
      </details>

      <div id="lrt-nav-links">
        <a class="lrt-nav-link${currentClass(currentPage, 'index')}" href="./index.html">cite.review</a>
        <a class="lrt-nav-link${currentClass(currentPage, 'api')}" href="./api-setup.html">API Setup</a>
        <a class="lrt-nav-link${currentClass(currentPage, 'faq')}" href="./faq.html">FAQ</a>
      </div>

      <a href="https://github.com/kirinccchang/citereview" target="_blank" rel="noopener noreferrer" class="lrt-nav-link lrt-gh-link" aria-label="GitHub">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
      </a>

      <div x-data="authBar()" class="nav-auth">
        <button class="dark-toggle" @click="toggleDark()" :title="darkMode ? 'Switch to light mode' : 'Switch to dark mode'" aria-label="Toggle dark mode">
          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>

        <button class="btn-sm" @click="openSettings()" title="Settings" style="padding:5px 9px;font-size:15px">⚙</button>

        <template x-if="showSettings">
          <div class="modal-overlay" @click.self="showSettings = false" @keydown.escape.window="showSettings = false">
            <div class="modal settings-modal">
              <h3 style="margin-bottom:5px">Settings</h3>
              <p class="modal-subtitle" style="margin-bottom:20px">API keys are stored only in your browser's localStorage. Citation verification uses no AI. Need help? <a href="./api-setup.html" style="color:var(--accent);text-decoration:none">Open setup guide →</a></p>

              <div class="settings-section">
                <h4>CourtListener API Token</h4>
                <input type="text" class="settings-key-input" x-model="clKeyInput" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="Paste your CourtListener token">
                <p class="settings-hint">
                  Get a free token at <a href="https://www.courtlistener.com/profile/api/" target="_blank">courtlistener.com/profile/api</a>.
                  Required for citation verification. Free accounts: 5,000 requests/hour.
                </p>
                <p class="settings-hint" x-show="hasStoredClKey" style="margin-top:-4px">This field shows the token currently saved in this browser. Edit it and click <strong>Save Settings</strong> to replace it, or clear it and save to remove it.</p>
                <button type="button" class="btn-sm" x-show="hasStoredClKey" @click="clearClKey()" style="margin-top:4px">Clear saved token</button>
                <button type="button" class="btn-sm" x-show="canCheckClKey" @click="checkClKeyNow()" style="margin-top:4px" :disabled="clStatus==='checking'" x-text="clStatus==='checking' ? 'Checking…' : 'Check token'"></button>
                <p class="settings-hint" style="margin-top:6px">Status checks run when you click <strong>Check token</strong> or when verification starts.</p>
                <div class="settings-cl-status" :class="clStatusClass">
                  <span class="settings-cl-status-dot"></span>
                  <span>CourtListener token status:</span>
                  <strong x-text="clStatusLabel"></strong>
                </div>
              </div>

              <div class="settings-section">
                <h4>AI Provider for Memo Analysis</h4>
                <p class="settings-hint" style="margin-top:-2px;margin-bottom:10px">The citation-verification step above uses no AI. Pick one provider here only for support review. Most users should keep the default model.</p>
                <div class="provider-grid">
                  <button class="provider-btn" :class="{active: aiSettings.provider==='anthropic'}" @click="aiSettings.provider='anthropic'">Anthropic Claude</button>
                  <button class="provider-btn" :class="{active: aiSettings.provider==='openai'}" @click="aiSettings.provider='openai'">OpenAI</button>
                  <button class="provider-btn" :class="{active: aiSettings.provider==='gemini'}" @click="aiSettings.provider='gemini'">Google Gemini</button>
                  <button class="provider-btn" :class="{active: aiSettings.provider==='kimi'}" @click="aiSettings.provider='kimi'">Kimi (Moonshot)</button>
                  <button class="provider-btn" :class="{active: aiSettings.provider==='local'}" @click="aiSettings.provider='local'">Local (Ollama / LM Studio)</button>
                </div>

                <template x-if="aiSettings.provider==='anthropic'">
                  <div x-data="{ helpOpen: false }">
                    <label class="settings-label">Anthropic API Key</label>
                    <input type="password" class="settings-key-input" x-model="aiSettings.anthropicKey" placeholder="sk-ant-…">
                    <p class="settings-hint">Recommended for most users. Default model is pre-selected.</p>
                    <details style="margin-top:6px">
                      <summary class="help-toggle" style="cursor:pointer;list-style:none;display:flex;align-items:center;gap:4px"><span class="chevron">›</span> Advanced (model selection)</summary>
                      <div style="margin-top:8px;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px">
                        <label class="settings-label">Model</label>
                        <select class="settings-key-input" x-model="aiSettings.anthropicModel" style="font-family:var(--font-sans)">
                          <option value="claude-haiku-4-5-20251001">claude-haiku-4-5-20251001 (recommended)</option>
                          <option value="claude-sonnet-4-5-20250929">claude-sonnet-4-5-20250929 (stronger, slower)</option>
                        </select>
                        <p class="settings-hint" style="margin-top:4px">Use the default unless you need stronger reasoning and accept higher latency.</p>
                      </div>
                    </details>
                    <button type="button" class="help-toggle" :class="{open: helpOpen}" @click="helpOpen=!helpOpen">
                      <span class="chevron">›</span> How to get this key
                    </button>
                    <div x-show="helpOpen" class="help-panel">
                      <ol>
                        <li>Go to <a href="https://platform.claude.com/settings/keys" target="_blank">platform.claude.com/settings/keys</a> and sign in</li>
                        <li>Open <strong>API Keys</strong> and create a new key</li>
                        <li>Copy the key and paste it above</li>
                      </ol>
                      <p style="margin-top:6px;font-size:11px">Use the default unless you have a reason to prefer the stronger Sonnet model.</p>
                    </div>
                  </div>
                </template>
                <template x-if="aiSettings.provider==='openai'">
                  <div x-data="{ helpOpen: false }">
                    <label class="settings-label">OpenAI API Key</label>
                    <input type="password" class="settings-key-input" x-model="aiSettings.openaiKey" placeholder="sk-…">
                    <p class="settings-hint">Recommended for most users. Default model is pre-selected.</p>
                    <details style="margin-top:6px">
                      <summary class="help-toggle" style="cursor:pointer;list-style:none;display:flex;align-items:center;gap:4px"><span class="chevron">›</span> Advanced (model selection)</summary>
                      <div style="margin-top:8px;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px">
                        <label class="settings-label">Model</label>
                        <select class="settings-key-input" x-model="aiSettings.openaiModel" style="font-family:var(--font-sans)">
                          <option value="gpt-4.1-mini">gpt-4.1-mini (recommended)</option>
                          <option value="gpt-4.1">gpt-4.1 (stronger, slower)</option>
                          <option value="gpt-4o-mini">gpt-4o-mini (older mini option)</option>
                        </select>
                        <p class="settings-hint" style="margin-top:4px">Use the default unless you need a stronger model and accept higher cost.</p>
                      </div>
                    </details>
                    <button type="button" class="help-toggle" :class="{open: helpOpen}" @click="helpOpen=!helpOpen">
                      <span class="chevron">›</span> How to get this key
                    </button>
                    <div x-show="helpOpen" class="help-panel">
                      <ol>
                        <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com/api-keys</a></li>
                        <li>Click <strong>Create new secret key</strong></li>
                        <li>Copy the key and paste it above</li>
                      </ol>
                      <p style="margin-top:6px;font-size:11px">This app uses a conservative default for compatibility and cost.</p>
                    </div>
                  </div>
                </template>
                <template x-if="aiSettings.provider==='gemini'">
                  <div x-data="{ helpOpen: false }">
                    <label class="settings-label">Google Gemini API Key</label>
                    <input type="password" class="settings-key-input" x-model="aiSettings.geminiKey" placeholder="AIza…">
                    <p class="settings-hint">Recommended for most users. Default model is pre-selected.</p>
                    <details style="margin-top:6px">
                      <summary class="help-toggle" style="cursor:pointer;list-style:none;display:flex;align-items:center;gap:4px"><span class="chevron">›</span> Advanced (model selection)</summary>
                      <div style="margin-top:8px;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px">
                        <label class="settings-label">Model</label>
                        <select class="settings-key-input" x-model="aiSettings.geminiModel" style="font-family:var(--font-sans)">
                          <option value="gemini-2.5-flash">gemini-2.5-flash (recommended)</option>
                          <option value="gemini-2.5-pro">gemini-2.5-pro (stronger, slower)</option>
                        </select>
                        <p class="settings-hint" style="margin-top:4px">2.0 Flash is deprecated. Keep 2.5 Flash unless you need the stronger Pro tier.</p>
                      </div>
                    </details>
                    <button type="button" class="help-toggle" :class="{open: helpOpen}" @click="helpOpen=!helpOpen">
                      <span class="chevron">›</span> How to get this key
                    </button>
                    <div x-show="helpOpen" class="help-panel">
                      <ol>
                        <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank">aistudio.google.com/app/apikey</a></li>
                        <li>Click <strong>Get API key</strong> and create a key</li>
                        <li>Copy the key and paste it above</li>
                      </ol>
                      <p style="margin-top:6px;font-size:11px">Use 2.5 Flash for the simplest balance of speed, cost, and reasoning.</p>
                    </div>
                  </div>
                </template>
                <template x-if="aiSettings.provider==='kimi'">
                  <div x-data="{ helpOpen: false }">
                    <label class="settings-label">Kimi API Key</label>
                    <input type="password" class="settings-key-input" x-model="aiSettings.kimiKey" placeholder="sk-…">
                    <p class="settings-hint">Recommended for most users. Default model is pre-selected.</p>
                    <details style="margin-top:6px">
                      <summary class="help-toggle" style="cursor:pointer;list-style:none;display:flex;align-items:center;gap:4px"><span class="chevron">›</span> Advanced (model selection)</summary>
                      <div style="margin-top:8px;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px">
                        <label class="settings-label">Model</label>
                        <select class="settings-key-input" x-model="aiSettings.kimiModel" style="font-family:var(--font-sans)">
                          <option value="kimi-k2.6">kimi-k2.6 (recommended)</option>
                          <option value="kimi-k2.5">kimi-k2.5</option>
                          <option value="kimi-k2-thinking">kimi-k2-thinking (reasoning, slower)</option>
                        </select>
                        <p class="settings-hint" style="margin-top:4px">Keep K2.6 unless you specifically need K2.5 or the thinking variant.</p>
                      </div>
                    </details>
                    <button type="button" class="help-toggle" :class="{open: helpOpen}" @click="helpOpen=!helpOpen">
                      <span class="chevron">›</span> How to get this key
                    </button>
                    <div x-show="helpOpen" class="help-panel">
                      <ol>
                        <li>Go to <a href="https://platform.kimi.com/console/api-keys" target="_blank">platform.kimi.com/console/api-keys</a></li>
                        <li>Create an API key</li>
                        <li>Copy the key and paste it above</li>
                      </ol>
                      <p style="margin-top:6px;font-size:11px">The Kimi API is OpenAI-compatible and uses <code>https://api.moonshot.cn/v1</code>.</p>
                    </div>
                  </div>
                </template>
                <template x-if="aiSettings.provider==='local'">
                  <div x-data="{ helpOpen: false }" style="display:flex;flex-direction:column;gap:10px">
                    <div style="background:#fff3cd;border:1px solid #f0ad4e;border-radius:6px;padding:10px 12px;font-size:12.5px;line-height:1.5;color:#7a4f00">
                      <strong>⚠️ Warning: Model quality matters enormously.</strong><br>
                      Small models capable of running on a standard MacBook M1 Air (≤16 GB RAM, e.g. 3B–7B parameter models) perform <em>very poorly</em> at legal citation analysis — expect frequent misidentifications, hallucinated reasoning, and missed errors. For reliable results, use a high-capability model (≥32B parameters) — <strong>note that models of this size require high-end workstation hardware and cannot run on typical laptops</strong>. If you don't have such hardware, use a cloud provider such as Claude, OpenAI, or Gemini instead.
                    </div>
                    <div>
                      <label class="settings-label">Base URL</label>
                      <input type="text" class="settings-key-input" x-model="aiSettings.localBaseUrl" placeholder="http://localhost:11434/v1">
                    </div>
                    <div>
                      <label class="settings-label">Model name</label>
                      <input type="text" class="settings-key-input" x-model="aiSettings.localModel" placeholder="qwen3:14b">
                    </div>
                    <div>
                      <label class="settings-label">API Key <span style="font-weight:400;opacity:0.6">(optional — leave blank for Ollama)</span></label>
                      <input type="password" class="settings-key-input" x-model="aiSettings.localKey" placeholder="Leave blank for Ollama">
                    </div>
                    <div>
                      <button type="button" class="help-toggle" :class="{open: helpOpen}" @click="helpOpen=!helpOpen">
                        <span class="chevron">›</span> Setup guide (Ollama / LM Studio)
                      </button>
                      <div x-show="helpOpen" class="help-panel">
                        <p style="font-weight:600;margin-bottom:6px">Option A — LM Studio <span style="font-weight:400;opacity:0.7">(recommended for Mac)</span></p>
                        <ol>
                          <li>Download <a href="https://lmstudio.ai" target="_blank">LM Studio</a> and open it</li>
                          <li>Click the search icon, search for your model:<br>
                            • 8 GB RAM: <code>qwen2.5-3b-instruct-mlx</code> or <code>llama-3.2-3b-instruct-mlx</code> (~2 GB — gemma-4-e4b is 6.86 GB and will not fit)<br>
                            • 16 GB RAM: <code>gemma-4-e4b-it-mlx</code> or <code>qwen3-14b-mlx</code><br>
                            Download the MLX version (Apple Silicon only — 2–3× faster than Ollama)</li>
                          <li>In the left sidebar click <strong>Developer</strong> → toggle <strong>Enable local server</strong> on</li>
                          <li>Note the server address shown (usually <code>http://127.0.0.1:1234/v1</code>)</li>
                          <li>Back here: set Base URL to <code>http://127.0.0.1:1234/v1</code>, leave API Key blank</li>
                          <li>Set Model to the exact API identifier shown in LM Studio's server tab (e.g. <code>qwen2.5-3b-instruct-mlx</code>)</li>
                        </ol>
                        <p style="font-weight:600;margin:10px 0 6px">Option B — Ollama <span style="font-weight:400;opacity:0.7">(Windows / Linux / Mac)</span></p>
                        <ol>
                          <li>Download <a href="https://ollama.com" target="_blank">Ollama</a> and install it</li>
                          <li>Open Terminal and run:<br>
                            • 8 GB RAM: <code>ollama pull gemma4:e4b</code><br>
                            • 16 GB RAM: <code>ollama pull qwen3:14b</code></li>
                          <li>Ollama starts automatically — no API key needed</li>
                          <li>Set Base URL to <code>http://localhost:11434/v1</code>, leave API Key blank</li>
                          <li>Set Model to the model name you pulled (e.g. <code>qwen3:14b</code>)</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </template>

                <div class="settings-key-check-row">
                  <button
                    type="button"
                    class="btn btn-ghost settings-check-btn"
                    @click="checkProviderKey(aiSettings.provider)"
                    :disabled="aiCheckingProvider===aiSettings.provider"
                  >
                    <span x-text="aiCheckingProvider===aiSettings.provider ? 'Checking…' : 'Check ' + providerDisplayName(aiSettings.provider) + ' key'"></span>
                  </button>
                  <div class="settings-cl-status" :class="providerStatusClass(aiSettings.provider)">
                    <span class="settings-cl-status-dot"></span>
                    <span x-text="providerDisplayName(aiSettings.provider) + ' key status:'"></span>
                    <strong x-text="providerStatusLabel(aiSettings.provider)"></strong>
                  </div>
                </div>
              </div>

              <div class="modal-actions">
                <button class="btn btn-ghost" style="font-size:13px;padding:7px 14px" @click="showSettings=false">Cancel</button>
                <button class="btn btn-primary" style="font-size:13px;padding:7px 16px" @click="saveSettings()">Save Settings</button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>`;
}

export function mountSharedNav({ currentPage = 'index', navId = 'lrt-nav' } = {}) {
  const nav = document.getElementById(navId);
  if (!nav) return;
  nav.innerHTML = getSharedNavMarkup(currentPage);
}

export function getSharedAuthorMarkup() {
  return `
  <div class="container">
    <div class="section-divider"></div>
    <div class="author-inner">
      <img src="./avatar.jpeg" alt="Kirin Chang" class="author-avatar" width="80" height="80" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
      <div class="author-avatar-fallback" style="display:none" aria-hidden="true">KC</div>
      <div class="author-body">
        <h2 class="author-name">Built by Kirin Chang</h2>
        <p class="author-roles">Research Fellow, U.S.-Asia Law Institute · NYU School of Law<br>Affiliate Research Fellow, AI &amp; the Future of Work · Emory Law<br>Member of the New York and Texas Bars</p>
        <p class="author-pubs">Appeared or is forthcoming in print and online journals and books with the <em>NYU Law Review</em>, <em>UCLA Law Review</em>, <em>Georgetown Law Journal</em>, <em>Minnesota Law Review</em>, <em>University of Illinois Law Review</em>, <em>Wisconsin Law Review</em>, <em>University of Pennsylvania Journal of International Law</em>, among others.</p>
        <div class="author-links">
          <a href="https://kirinchang.com" target="_blank" rel="noopener" class="author-link">kirinchang.com</a>
          <span class="author-link-sep">·</span>
          <a href="https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=5438024" target="_blank" rel="noopener" class="author-link">SSRN</a>
          <span class="author-link-sep">·</span>
          <a href="https://scholar.google.com/citations?user=D-z05L0AAAAJ&hl=en" target="_blank" rel="noopener" class="author-link">Google Scholar</a>
          <span class="author-link-sep">·</span>
          <a href="https://github.com/kirinccchang" target="_blank" rel="noopener" class="author-link">GitHub</a>
          <span class="author-link-sep">·</span>
          <a href="https://twitter.com/chengchi_chang" target="_blank" rel="noopener" class="author-link">@chengchi_chang</a>
        </div>
      </div>
    </div>
  </div>`;
}

export function mountSharedAuthor({ authorId = 'lrt-author' } = {}) {
  const author = document.getElementById(authorId);
  if (!author) return;
  author.innerHTML = getSharedAuthorMarkup();
}

export function getSharedFooterMarkup() {
  return `
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="./index.html" class="footer-logo"><span aria-hidden="true">§</span> cite.review</a>
        <p class="footer-tagline">Verify citations before filing or publication.<br>Reduce hallucinated authority risk in legal writing.</p>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Product</div>
        <a href="./index.html" class="footer-link">Verifier</a>
        <a href="./api-setup.html" class="footer-link">API Setup Guide</a>
        <a href="./faq.html" class="footer-link">FAQ</a>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Brand</div>
        <a href="https://lawreview.tools/" target="_blank" rel="noopener" class="footer-link">lawreview.tools</a>
        <a href="https://github.com/kirinccchang/citereview" target="_blank" rel="noopener" class="footer-link">Source Code</a>
        <a href="https://github.com/kirinccchang/citereview/issues" target="_blank" rel="noopener" class="footer-link">Report a Bug</a>
      </div>
    </div>
    <div class="footer-bottom">
      © 2026 <a href="https://kirinchang.com/" target="_blank" rel="noopener">Kirin Chang</a> · <a href="https://lawreview.tools/" target="_blank" rel="noopener">lawreview.tools</a>
      <div style="margin-top:6px; font-size:11px; color:var(--text-faint, var(--text-subtle)); opacity:0.65;">cite.review is an independent product and is not affiliated with or endorsed by CourtListener.</div>
    </div>
  </div>`;
}

export function mountSharedFooter({ footerId = 'lrt-footer' } = {}) {
  const footer = document.getElementById(footerId);
  if (!footer) return;
  footer.innerHTML = getSharedFooterMarkup();
}

export function createAuthBar({ getAISettings, saveAISettings, showToast }) {
  const showError = (message) => {
    if (typeof window !== 'undefined' && typeof window.showError === 'function') {
      window.showError(message);
      return;
    }
    showToast(message);
  };

  function normalizeClKey(raw) {
    let token = String(raw || '').trim();
    if (!token) return '';
    token = token.replace(/^token\s+/i, '').trim();
    token = token.replace(/^['"]+|['"]+$/g, '').trim();
    return token;
  }

  function getStoredClKey() {
    const raw = (localStorage.getItem('citereview_cl_key') || '').trim();
    const normalized = normalizeClKey(raw);
    if (normalized !== raw) {
      if (normalized) localStorage.setItem('citereview_cl_key', normalized);
      else localStorage.removeItem('citereview_cl_key');
    }
    return normalized;
  }

  function providerDisplayName(provider) {
    return ({
      anthropic: 'Anthropic',
      openai: 'OpenAI',
      gemini: 'Gemini',
      kimi: 'Kimi',
      local: 'Local',
    })[provider] || 'Provider';
  }

  function normalizeBaseUrl(base) {
    return String(base || '').trim().replace(/\/+$/, '');
  }

  async function validateClKeyAgainstCourtListener(token) {
    const key = normalizeClKey(token);
    if (!key) return 'not-checked';
    if (/[•●·]/.test(key) || /\s/.test(key)) return 'invalid';

    try {
      const res = await fetch('https://www.courtlistener.com/api/rest/v4/search/?q=test&page_size=1', {
        headers: { 'Authorization': `Token ${key}` },
        signal: AbortSignal.timeout(9000),
      });
      if (res.ok) return 'valid';
      if (res.status === 401 || res.status === 403) return 'invalid';
      return 'not-checked';
    } catch (_) {
      return 'not-checked';
    }
  }

  async function validateProviderKey(provider, settings) {
    const timeoutSignal = AbortSignal.timeout(10000);

    if (provider === 'anthropic') {
      const key = String(settings.anthropicKey || '').trim();
      if (!key) return { ok: false, reason: 'missing' };
      const model = String(settings.anthropicModel || 'claude-haiku-4-5-20251001');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
        signal: timeoutSignal,
      });
      return { ok: res.ok, status: res.status };
    }

    if (provider === 'openai') {
      const key = String(settings.openaiKey || '').trim();
      if (!key) return { ok: false, reason: 'missing' };
      const res = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${key}` },
        signal: timeoutSignal,
      });
      return { ok: res.ok, status: res.status };
    }

    if (provider === 'gemini') {
      const key = String(settings.geminiKey || '').trim();
      if (!key) return { ok: false, reason: 'missing' };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`, {
        method: 'GET',
        signal: timeoutSignal,
      });
      return { ok: res.ok, status: res.status };
    }

    if (provider === 'kimi') {
      const key = String(settings.kimiKey || '').trim();
      if (!key) return { ok: false, reason: 'missing' };
      const res = await fetch('https://api.moonshot.cn/v1/models', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${key}` },
        signal: timeoutSignal,
      });
      return { ok: res.ok, status: res.status };
    }

    if (provider === 'local') {
      const base = normalizeBaseUrl(settings.localBaseUrl) || 'http://localhost:11434/v1';
      const key = String(settings.localKey || '').trim();
      const url = `${base}/models`;
      const headers = key ? { 'Authorization': `Bearer ${key}` } : {};
      const res = await fetch(url, {
        method: 'GET',
        headers,
        signal: timeoutSignal,
      });
      return { ok: res.ok, status: res.status };
    }

    return { ok: false, reason: 'unsupported' };
  }

  return function authBar() {
    return {
      showSettings: false,
      darkMode: false,
      clStatus: 'not-checked',
      aiStatus: {
        anthropic: 'not-checked',
        openai: 'not-checked',
        gemini: 'not-checked',
        kimi: 'not-checked',
        local: 'not-checked',
      },
      aiCheckingProvider: '',
      clKeyInput: '',
      hasStoredClKey: !!getStoredClKey(),
      aiSettings: Object.assign({}, DEFAULT_AI_SETTINGS, getAISettings()),

      get clStatusClass() {
        return this.clStatus === 'valid' ? 'valid' : this.clStatus === 'invalid' ? 'invalid' : '';
      },

      get clStatusLabel() {
        return this.clStatus === 'valid'
          ? 'Valid'
          : this.clStatus === 'invalid'
            ? 'Invalid'
            : this.clStatus === 'checking'
              ? 'Checking'
              : 'Not Checked';
      },

      get canCheckClKey() {
        const typed = normalizeClKey(this.clKeyInput || '');
        return !!typed || this.hasStoredClKey;
      },

      providerStatusClass(provider) {
        const st = this.aiStatus[provider];
        return st === 'valid' ? 'valid' : st === 'invalid' ? 'invalid' : '';
      },

      providerStatusLabel(provider) {
        const st = this.aiStatus[provider];
        return st === 'valid' ? 'Valid' : st === 'invalid' ? 'Invalid' : 'Not Checked';
      },

      providerDisplayName(provider) {
        return providerDisplayName(provider);
      },

      openSettings() {
        const stored = getStoredClKey();
        this.clKeyInput = stored;
        this.hasStoredClKey = !!stored;
        this.clStatus = 'not-checked';
        this.showSettings = true;
      },

      async checkProviderKey(provider) {
        if (!provider) return;
        this.aiCheckingProvider = provider;
        try {
          const result = await validateProviderKey(provider, this.aiSettings);
          this.aiStatus[provider] = result.ok ? 'valid' : (result.reason === 'network' ? 'not-checked' : 'invalid');
          if (!result.ok && result.reason === 'missing') {
            showToast(`Enter ${providerDisplayName(provider)} key first`);
          }
        } catch (_) {
          this.aiStatus[provider] = 'not-checked';
          showToast(`${providerDisplayName(provider)} key check unavailable (network or CORS)`);
        } finally {
          this.aiCheckingProvider = '';
        }
      },

      async refreshClStatus() {
        const key = getStoredClKey();
        this.hasStoredClKey = !!key;
        if (!key) {
          this.clStatus = 'not-checked';
          return;
        }
        this.clStatus = 'checking';
        this.clStatus = await validateClKeyAgainstCourtListener(key);
      },

      async checkClKeyNow() {
        const typed = normalizeClKey(this.clKeyInput || '');
        const stored = getStoredClKey();
        const keyToCheck = typed || stored;
        if (!keyToCheck) {
          this.clStatus = 'not-checked';
          showToast('Enter a CourtListener token first.');
          return;
        }

        this.clStatus = 'checking';
        this.clStatus = await validateClKeyAgainstCourtListener(keyToCheck);

        if (this.clStatus === 'valid') showToast('CourtListener token check: valid');
        else if (this.clStatus === 'invalid') showError('CourtListener token check: invalid');
        else showToast('CourtListener token check could not complete (network/rate limit).');
      },

      clearClKey() {
        localStorage.removeItem('citereview_cl_key');
        this.clKeyInput = '';
        this.hasStoredClKey = false;
        this.clStatus = 'not-checked';
        window.dispatchEvent(new CustomEvent('citereview:cl-key-changed', { detail: { hasKey: false } }));
        showToast('CourtListener token removed');
      },

      async saveSettings() {
        const raw = this.clKeyInput.trim();
        const normalizedRaw = normalizeClKey(raw);
        const looksMasked = /[•●·]/.test(raw);
        if (raw && looksMasked) {
          this.clStatus = 'invalid';
          showError('CourtListener token format looks invalid. Paste the full raw token (not a masked value).');
          return;
        }
        if (raw && /\s/.test(normalizedRaw)) {
          this.clStatus = 'invalid';
          showError('CourtListener token should not include spaces or line breaks.');
          return;
        }

        const finalKey = normalizedRaw;
        if (finalKey) localStorage.setItem('citereview_cl_key', finalKey);
        else localStorage.removeItem('citereview_cl_key');
        this.hasStoredClKey = !!finalKey;
        this.clKeyInput = finalKey;
        this.clStatus = 'not-checked';

        window.dispatchEvent(new CustomEvent('citereview:cl-key-changed', { detail: { hasKey: !!finalKey } }));
        saveAISettings({
          provider: this.aiSettings.provider,
          anthropicKey: this.aiSettings.anthropicKey,
          anthropicModel: this.aiSettings.anthropicModel,
          openaiKey: this.aiSettings.openaiKey,
          openaiModel: this.aiSettings.openaiModel,
          geminiKey: this.aiSettings.geminiKey,
          geminiModel: this.aiSettings.geminiModel,
          kimiKey: this.aiSettings.kimiKey,
          kimiModel: this.aiSettings.kimiModel,
          localBaseUrl: this.aiSettings.localBaseUrl,
          localModel: this.aiSettings.localModel,
          localKey: this.aiSettings.localKey,
        });
        this.showSettings = false;
        showToast('Settings saved');
      },

      toggleDark() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('citereview_dark', this.darkMode ? '1' : '0');
        document.body.classList.toggle('dark', this.darkMode);
        if (this.darkMode) document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
      },

      init() {
        window.addEventListener('lrt:open-settings', () => {
          this.openSettings();
        });
        window.addEventListener('lrt:toggle-dark', () => {
          this.toggleDark();
        });
        window.addEventListener('citereview:cl-key-changed', () => {
          const stored = getStoredClKey();
          this.hasStoredClKey = !!stored;
          if (this.showSettings) this.clKeyInput = stored;
          this.clStatus = 'not-checked';
        });
        const saved = localStorage.getItem('citereview_dark');
        if (saved !== null) {
          this.darkMode = saved === '1';
        } else {
          this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
          window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', event => {
              this.darkMode = event.matches;
              document.body.classList.toggle('dark', event.matches);
              if (event.matches) document.documentElement.setAttribute('data-theme', 'dark');
              else document.documentElement.removeAttribute('data-theme');
            });
        }
        document.body.classList.toggle('dark', this.darkMode);
        if (this.darkMode) document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');

        this.clStatus = 'not-checked';
      },
    };
  };
}
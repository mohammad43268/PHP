/**
 * DevForge AI – Settings Module
 * Full settings UI: theme, AI providers, voice, security, workspace
 */

'use strict';

const Settings = {
  settings: {},

  async render() {
    return `
      <div class="module-header">
        <h1 class="title gradient-text">⚙️ Settings</h1>
        <p class="subtitle">Configure DevForge AI — AI providers, themes, security, and workspace</p>
      </div>

      <div style="display:flex;gap:var(--space-6);align-items:flex-start">
        <!-- Settings Nav -->
        <div style="width:200px;flex-shrink:0">
          <div class="card" style="padding:var(--space-2)">
            ${['appearance','ai-providers','voice','security','workspace','storage','about'].map((s, i) => {
              const labels = { appearance:'🎨 Appearance', 'ai-providers':'🤖 AI Providers', voice:'🎙️ Voice', security:'🔐 Security', workspace:'🗂️ Workspace', storage:'💾 Storage', about:'ℹ️ About' };
              return `<div class="nav-item ${i===0?'active':''}" onclick="Settings.showSection('${s}',this)">${labels[s]}</div>`;
            }).join('')}
          </div>
        </div>

        <!-- Settings Content -->
        <div style="flex:1" id="settings-content">
          <div class="skeleton skeleton-card"></div>
        </div>
      </div>
    `;
  },

  async init() {
    try {
      const res = await API.getSettings();
      this.settings = res.success ? res.data : {};
    } catch {}
    this.showSection('appearance', document.querySelector('#settings-content')?.parentElement?.querySelector('.nav-item'));
  },

  showSection(section, navEl) {
    document.querySelectorAll('#settings-content')?.forEach?.(() => {});
    document.querySelectorAll('.nav-item[onclick*="Settings.showSection"]').forEach(el => el.classList.remove('active'));
    navEl?.classList.add('active');

    const container = document.getElementById('settings-content');
    if (!container) return;

    const sections = {
      appearance: this.renderAppearance(),
      'ai-providers': this.renderAIProviders(),
      voice: this.renderVoice(),
      security: this.renderSecurity(),
      workspace: this.renderWorkspace(),
      storage: this.renderStorage(),
      about: this.renderAbout(),
    };

    container.innerHTML = sections[section] || '';
  },

  renderAppearance() {
    const ai = this.settings;
    return `
      <div class="card">
        <div class="card-header"><h3 class="card-title">Appearance</h3></div>

        <div class="form-group">
          <label class="form-label">Theme</label>
          <div class="tabs" style="max-width:300px">
            <div class="tab ${ai.theme !== 'light' ? 'active' : ''}" onclick="Settings.applyTheme('dark',this)">🌙 Dark</div>
            <div class="tab ${ai.theme === 'light' ? 'active' : ''}" onclick="Settings.applyTheme('light',this)">☀️ Light</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Accent Color</label>
          <div class="flex gap-3 items-center">
            ${['#00D4FF','#7B2FBE','#00E5A0','#FF4757','#FFB020','#FF69B4'].map(c => `
              <div onclick="Settings.applyAccent('${c}')"
                   style="width:32px;height:32px;background:${c};border-radius:50%;cursor:pointer;border:2px solid ${c === (ai.accent_color||'#00D4FF') ? 'white' : 'transparent'};box-shadow:0 0 8px ${c}66;transition:transform 0.2s"
                   onmouseenter="this.style.transform='scale(1.2)'" onmouseleave="this.style.transform=''"
                   data-tooltip="${c}">
              </div>
            `).join('')}
            <input type="color" id="custom-accent" value="${ai.accent_color||'#00D4FF'}" style="width:32px;height:32px;border-radius:50%;cursor:pointer;border:none;background:none" onchange="Settings.applyAccent(this.value)">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Font Size</label>
          <div class="flex items-center gap-3">
            <input type="range" id="font-size" min="12" max="18" value="${ai.font_size||14}" style="flex:1;accent-color:var(--accent)">
            <span id="font-size-label" class="text-sm text-secondary">${ai.font_size||14}px</span>
          </div>
        </div>

        <button class="btn btn-primary" onclick="Settings.saveAppearance()">💾 Save Appearance</button>
      </div>
    `;
  },

  renderAIProviders() {
    const ai = this.settings.ai || {};
    return `
      <div class="card">
        <div class="card-header"><h3 class="card-title">AI Provider Configuration</h3></div>

        <div class="form-group">
          <label class="form-label">Default Provider</label>
          <select class="form-select" id="ai-provider" style="max-width:250px">
            <option value="ollama"    ${ai.provider==='ollama'?'selected':''}>🦙 Ollama (Local)</option>
            <option value="openai"    ${ai.provider==='openai'?'selected':''}>🔮 OpenAI</option>
            <option value="gemini"    ${ai.provider==='gemini'?'selected':''}>✨ Gemini</option>
            <option value="anthropic" ${ai.provider==='anthropic'?'selected':''}>🌀 Anthropic</option>
          </select>
        </div>

        <div class="separator"></div>

        <h4 style="margin-bottom:var(--space-3);font-size:var(--text-sm)">🦙 Ollama (Local)</h4>
        <div class="form-group">
          <label class="form-label">Ollama URL</label>
          <input type="url" class="form-input" id="ollama-url" value="${ai.ollama_url||'http://localhost:11434'}" placeholder="http://localhost:11434">
        </div>
        <div class="form-group">
          <label class="form-label">Default Model</label>
          <input type="text" class="form-input" id="ollama-model" value="${ai.ollama_model||'llama3.2'}" placeholder="llama3.2">
        </div>

        <div class="separator"></div>

        <h4 style="margin-bottom:var(--space-3);font-size:var(--text-sm)">🔮 OpenAI</h4>
        <div class="form-group">
          <label class="form-label">API Key</label>
          <input type="password" class="form-input" id="openai-key" value="${ai.openai_key||''}" placeholder="sk-...">
        </div>
        <div class="form-group">
          <label class="form-label">Model</label>
          <input type="text" class="form-input" id="openai-model" value="${ai.openai_model||'gpt-4o'}">
        </div>

        <div class="separator"></div>

        <h4 style="margin-bottom:var(--space-3);font-size:var(--text-sm)">✨ Gemini</h4>
        <div class="form-group">
          <label class="form-label">API Key</label>
          <input type="password" class="form-input" id="gemini-key" value="${ai.gemini_key||''}" placeholder="AIza...">
        </div>

        <div class="separator"></div>

        <h4 style="margin-bottom:var(--space-3);font-size:var(--text-sm)">🌀 Anthropic</h4>
        <div class="form-group">
          <label class="form-label">API Key</label>
          <input type="password" class="form-input" id="anthropic-key" value="${ai.anthropic_key||''}" placeholder="sk-ant-...">
        </div>

        <div class="separator"></div>

        <div class="form-group">
          <label class="form-label">Temperature (0.0 – 1.0)</label>
          <input type="range" min="0" max="1" step="0.1" class="form-input" id="ai-temp" value="${ai.temperature||0.7}" style="padding:0;height:auto">
        </div>

        <button class="btn btn-primary" onclick="Settings.saveAI()">💾 Save AI Settings</button>
      </div>
    `;
  },

  renderVoice() {
    const v = this.settings.voice || {};
    return `
      <div class="card">
        <div class="card-header"><h3 class="card-title">Voice Settings</h3></div>
        <div class="form-group">
          <label class="form-label">Language</label>
          <select class="form-select" id="voice-lang">
            <option value="en-US" ${v.language==='en-US'?'selected':''}>English (US)</option>
            <option value="en-GB" ${v.language==='en-GB'?'selected':''}>English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="ar-SA">Arabic</option>
          </select>
        </div>
        <div class="toggle-wrap" onclick="document.getElementById('tts-toggle').classList.toggle('on')">
          <div class="toggle ${v.tts_enabled?'on':''}" id="tts-toggle"></div>
          <span class="toggle-label">Enable Text-to-Speech responses</span>
        </div>
        <button class="btn btn-primary" style="margin-top:var(--space-4)" onclick="Settings.saveVoice()">💾 Save</button>
      </div>
    `;
  },

  renderSecurity() {
    return `
      <div class="card">
        <div class="card-header"><h3 class="card-title">Security Settings</h3></div>
        <div class="form-group">
          <label class="form-label">Vault Master Password</label>
          <input type="password" class="form-input" id="vault-master-pass" placeholder="Set a master password for the vault...">
          <div class="form-hint">Used to encrypt all files in the vault (default key if no per-file password)</div>
        </div>
        <div class="toggle-wrap" onclick="document.getElementById('req-pass-toggle').classList.toggle('on')">
          <div class="toggle" id="req-pass-toggle"></div>
          <span class="toggle-label">Require password to access DevForge</span>
        </div>
        <button class="btn btn-primary" style="margin-top:var(--space-4)" onclick="Settings.saveSecurity()">💾 Save</button>
      </div>
    `;
  },

  renderWorkspace() {
    const w = this.settings.workspace || {};
    return `
      <div class="card">
        <div class="card-header"><h3 class="card-title">Workspace Settings</h3></div>
        <div class="form-group">
          <label class="form-label">Workspace Name</label>
          <input type="text" class="form-input" id="ws-name" value="${w.name||'DevForge AI'}">
        </div>
        <div class="form-group">
          <label class="form-label">Author Name</label>
          <input type="text" class="form-input" id="ws-author" value="${w.author||'Developer'}">
        </div>
        <div class="form-group">
          <label class="form-label">Python Path</label>
          <input type="text" class="form-input" id="ws-python" value="${w.python_path||'python3'}" placeholder="python3">
        </div>
        <div class="form-group">
          <label class="form-label">Editor Theme</label>
          <select class="form-select" id="ws-editor-theme">
            <option value="vs-dark" ${w.editor_theme==='vs-dark'?'selected':''}>VS Dark</option>
            <option value="vs-light" ${w.editor_theme==='vs-light'?'selected':''}>VS Light</option>
            <option value="hc-black" ${w.editor_theme==='hc-black'?'selected':''}>High Contrast Dark</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="Settings.saveWorkspace()">💾 Save</button>
      </div>
    `;
  },

  renderStorage() {
    return `
      <div class="card">
        <div class="card-header"><h3 class="card-title">Storage Management</h3></div>
        <div class="grid-2" style="margin-bottom:var(--space-4)">
          <button class="btn btn-danger" onclick="Settings.clearData('chat-history','chats')">🗑 Clear Chat History</button>
          <button class="btn btn-danger" onclick="Settings.clearData('api-history','requests')">🗑 Clear API History</button>
          <button class="btn btn-danger" onclick="Settings.clearData('seo-history','analyses')">🗑 Clear SEO History</button>
          <button class="btn btn-secondary" onclick="Settings.exportAllData()">📦 Export All Data</button>
        </div>
        <div class="form-hint">Note: Vault files and shared files are not cleared by these actions.</div>
      </div>
    `;
  },

  renderAbout() {
    return `
      <div class="card" style="text-align:center;padding:var(--space-8)">
        <div style="font-size:64px;margin-bottom:var(--space-4)">⚡</div>
        <h2 class="gradient-text" style="margin-bottom:var(--space-2)">DevForge AI</h2>
        <p class="text-secondary">Version 1.0.0 · Build 2025.07</p>
        <p class="text-tertiary text-sm" style="margin-top:var(--space-4);max-width:400px;margin-left:auto;margin-right:auto">
          Self-hosted AI-powered developer workspace with PHP 8.4, Python FastAPI, and C++ performance modules.
        </p>
        <div class="flex gap-2 justify-center" style="margin-top:var(--space-6)">
          <span class="badge badge-accent">PHP 8.4</span>
          <span class="badge badge-purple">Python FastAPI</span>
          <span class="badge badge-default">C++ Modules</span>
          <span class="badge badge-success">JSON Storage</span>
        </div>
      </div>
    `;
  },

  applyTheme(theme, el) {
    document.querySelectorAll('.tab[onclick*="applyTheme"]').forEach(t => t.classList.remove('active'));
    el?.classList.add('active');
    App.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
  },

  applyAccent(color) {
    document.querySelectorAll('[onclick*="applyAccent"]').forEach(el => {
      el.style.border = '2px solid transparent';
    });
    document.documentElement.style.setProperty('--accent', color);
  },

  async saveAppearance() {
    const theme  = document.getElementById('ai-provider') ? App.theme : document.documentElement.getAttribute('data-theme');
    const accent = document.documentElement.style.getPropertyValue('--accent') || '#00D4FF';
    const font   = document.getElementById('font-size')?.value || '14';
    await this.save({ theme, accent_color: accent, font_size: parseInt(font) });
  },

  async saveAI() {
    await this.save({ ai: {
      provider:      document.getElementById('ai-provider')?.value,
      ollama_url:    document.getElementById('ollama-url')?.value,
      ollama_model:  document.getElementById('ollama-model')?.value,
      openai_key:    document.getElementById('openai-key')?.value,
      openai_model:  document.getElementById('openai-model')?.value,
      gemini_key:    document.getElementById('gemini-key')?.value,
      anthropic_key: document.getElementById('anthropic-key')?.value,
      temperature:   parseFloat(document.getElementById('ai-temp')?.value || '0.7'),
    }});
  },

  async saveVoice() {
    await this.save({ voice: {
      language:    document.getElementById('voice-lang')?.value,
      tts_enabled: document.getElementById('tts-toggle')?.classList.contains('on'),
    }});
  },

  async saveSecurity() {
    const pass = document.getElementById('vault-master-pass')?.value;
    if (pass) await this.save({ security: { vault_password: pass } });
    else await this.save({});
    Toast.success('Saved', 'Security settings updated');
  },

  async saveWorkspace() {
    await this.save({ workspace: {
      name:         document.getElementById('ws-name')?.value,
      author:       document.getElementById('ws-author')?.value,
      python_path:  document.getElementById('ws-python')?.value,
      editor_theme: document.getElementById('ws-editor-theme')?.value,
    }});
  },

  async clearData(file, key) {
    if (!confirm(`Clear all ${key}? This cannot be undone.`)) return;
    try {
      await API.post('/PHP/project-2/api/settings.php', { _clear: { file, key } });
      Toast.success('Cleared', `${key} cleared`);
    } catch { Toast.error('Error', 'Could not clear data'); }
  },

  exportAllData() {
    Toast.info('Coming Soon', 'Data export will be available soon');
  },

  async save(data) {
    try {
      const res = await API.saveSettings(data);
      if (res.success) Toast.success('Saved!', 'Settings updated');
      else Toast.error('Error', res.error || 'Failed to save');
    } catch (err) {
      Toast.error('Error', err.message);
    }
  },

  destroy() {},
};

export default Settings;

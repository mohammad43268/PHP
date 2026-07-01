/**
 * DevForge AI – API Testing Studio Module
 * Full REST client: GET/POST/PUT/PATCH/DELETE, headers, auth, response viewer
 */

'use strict';

const APIStudio = {
  collections: [],
  currentTab: 'body',

  async render() {
    return `
      <div class="module-header">
        <h1 class="title gradient-text">API Testing Studio</h1>
        <p class="subtitle">Test REST APIs with full header, auth, and body support</p>
      </div>

      <div style="display:flex;gap:var(--space-4);height:calc(100vh - 220px)">

        <!-- Left: Collections -->
        <div style="width:220px;flex-shrink:0">
          <div class="card" style="height:100%;overflow-y:auto">
            <div class="card-header">
              <h3 class="card-title text-sm">📁 Collections</h3>
              <button class="btn btn-ghost btn-xs" onclick="APIStudio.saveCollection()">+</button>
            </div>
            <div id="api-collections">
              ${this.renderCollectionStarters()}
            </div>
          </div>
        </div>

        <!-- Right: Request + Response -->
        <div style="flex:1;display:flex;flex-direction:column;gap:var(--space-4)">

          <!-- URL Bar -->
          <div class="card" style="padding:var(--space-3)">
            <div class="form-input-group">
              <select class="form-select" id="api-method" style="width:120px;flex-shrink:0;border-radius:var(--radius-md) 0 0 var(--radius-md);border:none;border-right:1px solid var(--border)">
                <option value="GET"    style="color:#00E5A0">GET</option>
                <option value="POST"   style="color:#00D4FF">POST</option>
                <option value="PUT"    style="color:#FFB020">PUT</option>
                <option value="PATCH"  style="color:#7B2FBE">PATCH</option>
                <option value="DELETE" style="color:#FF4757">DELETE</option>
              </select>
              <input type="url" id="api-url" class="form-input" placeholder="https://api.example.com/endpoint"
                     style="border-radius:0;border:none"
                     onkeydown="if(event.key==='Enter')APIStudio.send()">
              <button class="btn btn-primary" onclick="APIStudio.send()" id="api-send-btn" style="border-radius:0 var(--radius-md) var(--radius-md) 0;padding:0 20px">
                Send ▶
              </button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="card" style="flex:1;display:flex;flex-direction:column;overflow:hidden;padding:0">
            <div style="display:flex;border-bottom:1px solid var(--border)">
              <div class="tabs-underline" style="border:none;flex:1">
                ${['Params','Headers','Body','Auth'].map(t => `
                  <div class="tab ${t === 'Params' ? 'active' : ''}" onclick="APIStudio.switchTab('${t.toLowerCase()}','${t}')" id="tab-${t.toLowerCase()}">${t}</div>
                `).join('')}
              </div>
            </div>

            <!-- Params Tab -->
            <div id="tab-content-params" class="tab-content active" style="padding:var(--space-4);flex:1;overflow-y:auto">
              <div id="params-rows">
                ${this.kvRow('', '', 'params')}
              </div>
              <button class="btn btn-ghost btn-xs" onclick="APIStudio.addKvRow('params')">+ Add Param</button>
            </div>

            <!-- Headers Tab -->
            <div id="tab-content-headers" class="tab-content" style="padding:var(--space-4);flex:1;overflow-y:auto">
              <div id="headers-rows">
                ${this.kvRow('Content-Type', 'application/json', 'headers')}
              </div>
              <button class="btn btn-ghost btn-xs" onclick="APIStudio.addKvRow('headers')">+ Add Header</button>
            </div>

            <!-- Body Tab -->
            <div id="tab-content-body" class="tab-content" style="padding:var(--space-4);flex:1;overflow-y:auto">
              <div class="form-group">
                <label class="form-label">Body Type</label>
                <select class="form-select" id="body-type" style="max-width:200px" onchange="APIStudio.switchBodyType(this.value)">
                  <option value="json">JSON</option>
                  <option value="form">Form Data</option>
                  <option value="raw">Raw Text</option>
                </select>
              </div>
              <textarea id="api-body" class="form-input" rows="8" placeholder='{"key": "value"}' style="font-family:var(--font-mono);font-size:13px"></textarea>
            </div>

            <!-- Auth Tab -->
            <div id="tab-content-auth" class="tab-content" style="padding:var(--space-4);flex:1;overflow-y:auto">
              <div class="form-group">
                <label class="form-label">Auth Type</label>
                <select class="form-select" id="auth-type" style="max-width:200px" onchange="APIStudio.switchAuth(this.value)">
                  <option value="none">No Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="api_key">API Key</option>
                  <option value="basic">Basic Auth</option>
                </select>
              </div>
              <div id="auth-fields"></div>
            </div>
          </div>

          <!-- Response Panel -->
          <div class="card" id="response-panel" style="flex:1;display:flex;flex-direction:column;overflow:hidden;padding:0">
            <div class="card-header" style="padding:var(--space-3) var(--space-4)">
              <div class="flex items-center gap-3">
                <span class="text-sm font-semibold">Response</span>
                <span class="badge" id="res-status" style="display:none"></span>
                <span class="badge badge-default" id="res-time" style="display:none"></span>
                <span class="badge badge-default" id="res-size" style="display:none"></span>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-ghost btn-xs" onclick="APIStudio.copyResponse()">📋 Copy</button>
                <button class="btn btn-ghost btn-xs" onclick="APIStudio.saveResponse()">💾 Save</button>
              </div>
            </div>
            <div id="response-body" style="flex:1;overflow:auto;padding:var(--space-4)">
              <div class="empty-state" style="padding:2rem">
                <div style="font-size:36px;opacity:0.3">📭</div>
                <p class="text-xs text-tertiary">Send a request to see the response</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    document.getElementById('api-url').focus();
  },

  kvRow(key, val, type) {
    return `
      <div class="flex gap-2" style="margin-bottom:var(--space-2)" data-kv="${type}">
        <input type="checkbox" checked style="margin-top:10px;accent-color:var(--accent)">
        <input type="text" class="form-input kv-key" placeholder="Key" value="${Utils.escapeHtml(key)}" style="flex:1">
        <input type="text" class="form-input kv-val" placeholder="Value" value="${Utils.escapeHtml(val)}" style="flex:2">
        <button class="btn btn-ghost btn-xs" onclick="this.parentElement.remove()">✕</button>
      </div>
    `;
  },

  addKvRow(type) {
    const container = document.getElementById(`${type}-rows`);
    if (container) container.insertAdjacentHTML('beforeend', this.kvRow('', '', type));
  },

  getKvData(type) {
    const obj = {};
    document.querySelectorAll(`[data-kv="${type}"]`).forEach(row => {
      const cb  = row.querySelector('input[type=checkbox]');
      const key = row.querySelector('.kv-key')?.value.trim();
      const val = row.querySelector('.kv-val')?.value.trim();
      if (cb?.checked && key) obj[key] = val;
    });
    return obj;
  },

  switchTab(id, label) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${id}`)?.classList.add('active');
    document.getElementById(`tab-content-${id}`)?.classList.add('active');
  },

  switchBodyType(type) {
    const ta = document.getElementById('api-body');
    if (type === 'json') ta.placeholder = '{\n  "key": "value"\n}';
    if (type === 'raw') ta.placeholder = 'Raw text body...';
  },

  switchAuth(type) {
    const container = document.getElementById('auth-fields');
    const fields = {
      none:   '',
      bearer: `<div class="form-group"><label class="form-label">Token</label><input type="text" class="form-input" id="auth-token" placeholder="Bearer token..."></div>`,
      api_key:`<div class="form-group"><label class="form-label">Header Name</label><input type="text" class="form-input" id="auth-key-header" value="X-API-Key" style="margin-bottom:var(--space-2)"><label class="form-label">Key</label><input type="text" class="form-input" id="auth-key-val" placeholder="API key..."></div>`,
      basic:  `<div class="form-group"><label class="form-label">Username</label><input type="text" class="form-input" id="auth-user" style="margin-bottom:var(--space-2)"><label class="form-label">Password</label><input type="password" class="form-input" id="auth-pass"></div>`,
    };
    container.innerHTML = fields[type] || '';
  },

  async send() {
    const url    = document.getElementById('api-url')?.value.trim();
    const method = document.getElementById('api-method')?.value || 'GET';
    if (!url) return Toast.warning('URL Required', 'Enter a URL to send');

    const btn = document.getElementById('api-send-btn');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    // Collect params / headers / auth
    const params  = this.getKvData('params');
    const headers = this.getKvData('headers');

    const authType  = document.getElementById('auth-type')?.value || 'none';
    const auth = {
      type:   authType,
      token:  document.getElementById('auth-token')?.value,
      key:    document.getElementById('auth-key-val')?.value,
      header: document.getElementById('auth-key-header')?.value,
      user:   document.getElementById('auth-user')?.value,
      pass:   document.getElementById('auth-pass')?.value,
    };

    let bodyStr = document.getElementById('api-body')?.value.trim() || '';
    let bodyData = null;
    if (bodyStr && method !== 'GET') {
      try { bodyData = JSON.parse(bodyStr); } catch { bodyData = bodyStr; }
    }

    try {
      const res = await API.post('/PHP/project-2/api/proxy.php', { url, method, headers, params, body: bodyData, auth });

      if (res.success) {
        this.showResponse(res.data);
      } else {
        Toast.error('Request Failed', res.error);
      }
    } catch (err) {
      Toast.error('Error', err.message);
    } finally {
      btn.textContent = 'Send ▶';
      btn.disabled = false;
    }
  },

  showResponse(data) {
    const statusEl = document.getElementById('res-status');
    const timeEl   = document.getElementById('res-time');
    const sizeEl   = document.getElementById('res-size');
    const bodyEl   = document.getElementById('response-body');

    statusEl.style.display = '';
    timeEl.style.display   = '';
    sizeEl.style.display   = '';

    const s = data.status;
    statusEl.textContent = s;
    statusEl.className   = `badge ${s >= 200 && s < 300 ? 'badge-success' : s >= 400 ? 'badge-error' : 'badge-warning'}`;
    timeEl.textContent   = `${data.time_ms}ms`;
    sizeEl.textContent   = Utils.formatBytes(data.size);

    this._lastResponse = data.raw;

    const content = data.is_json
      ? `<pre style="color:var(--text-primary);font-size:13px;white-space:pre-wrap;word-break:break-word">${JSON.stringify(data.body, null, 2)}</pre>`
      : `<pre style="font-size:13px;white-space:pre-wrap">${Utils.escapeHtml(String(data.raw))}</pre>`;

    bodyEl.innerHTML = content;
    if (typeof hljs !== 'undefined') {
      bodyEl.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));
    }
  },

  copyResponse() {
    if (this._lastResponse) Utils.copyToClipboard(this._lastResponse);
  },

  saveResponse() {
    if (!this._lastResponse) return;
    const blob = new Blob([this._lastResponse], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `response-${Date.now()}.json`;
    a.click();
    Toast.success('Saved!', 'Response downloaded');
  },

  saveCollection() {
    Toast.info('Collections', 'Save current request to a collection (coming soon)');
  },

  renderCollectionStarters() {
    const starters = [
      { name: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com/posts', method: 'GET' },
      { name: 'GitHub API',      url: 'https://api.github.com/users/octocat',        method: 'GET' },
      { name: 'HTTP Bin',        url: 'https://httpbin.org/get',                      method: 'GET' },
    ];
    return starters.map(s => `
      <div class="nav-item" onclick="APIStudio.loadStarter('${s.url}','${s.method}')">
        <span class="nav-item-icon">📡</span>
        <span class="nav-item-label text-xs">${s.name}</span>
      </div>
    `).join('');
  },

  loadStarter(url, method) {
    document.getElementById('api-url').value = url;
    document.getElementById('api-method').value = method;
  },

  destroy() {},
};

export default APIStudio;

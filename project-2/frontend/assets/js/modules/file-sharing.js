/**
 * DevForge AI – File Sharing Module
 * Upload files → generate secure share links + QR codes
 */

'use strict';

const FileSharing = {
  async render() {
    return `
      <div class="module-header">
        <h1 class="title gradient-text">🔗 Local File Sharing</h1>
        <p class="subtitle">Upload files and share them with secure links, QR codes, and access controls</p>
      </div>

      <div class="grid-2" style="margin-bottom:var(--space-6)">
        <!-- Upload Card -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Share a File</h3>
          </div>

          <div class="dropzone" id="share-drop" onclick="document.getElementById('share-file').click()">
            <div class="dropzone-icon">📤</div>
            <div class="dropzone-text" id="share-drop-text">Drop file here or click to select</div>
            <div class="dropzone-hint">Max 50MB. Link will be generated instantly.</div>
          </div>
          <input type="file" id="share-file" style="display:none" onchange="FileSharing.handleFile(this.files[0])">

          <div style="margin-top:var(--space-4)" class="flex flex-col gap-3">
            <div class="form-group" style="margin:0">
              <label class="form-label">Password (optional)</label>
              <input type="password" id="share-password" class="form-input" placeholder="Protect with password...">
            </div>

            <div class="grid-2" style="gap:var(--space-3)">
              <div class="form-group" style="margin:0">
                <label class="form-label">Expiry (hours, 0 = never)</label>
                <input type="number" id="share-expiry" class="form-input" value="24" min="0">
              </div>
              <div class="form-group" style="margin:0">
                <label class="form-label">Max Downloads (0 = ∞)</label>
                <input type="number" id="share-max-dl" class="form-input" value="0" min="0">
              </div>
            </div>

            <div class="toggle-wrap" onclick="document.getElementById('auto-delete-toggle').classList.toggle('on')">
              <div class="toggle" id="auto-delete-toggle"></div>
              <span class="toggle-label">Auto-delete after last download</span>
            </div>

            <button class="btn btn-primary btn-block" onclick="FileSharing.upload()" id="share-btn">
              🔗 Generate Share Link
            </button>
          </div>
        </div>

        <!-- Result Card -->
        <div class="card" id="share-result-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-4)">
          <div style="font-size:48px;opacity:0.2">🔗</div>
          <p class="text-tertiary text-sm">Your share link will appear here</p>
        </div>
      </div>

      <!-- Active Shares -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Active Shares</h3>
          <button class="btn btn-ghost btn-xs" onclick="FileSharing.loadShares()">↻ Refresh</button>
        </div>
        <div id="shares-list">
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
      </div>
    `;
  },

  async init() {
    this.setupDrop();
    await this.loadShares();
  },

  setupDrop() {
    const drop = document.getElementById('share-drop');
    if (!drop) return;
    drop.addEventListener('dragover',  (e) => { e.preventDefault(); drop.classList.add('drag-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) this.handleFile(e.dataTransfer.files[0]);
    });
  },

  handleFile(file) {
    if (!file) return;
    this._file = file;
    document.getElementById('share-drop-text').textContent = `Selected: ${file.name} (${Utils.formatBytes(file.size)})`;
  },

  async upload() {
    if (!this._file) return Toast.warning('No File', 'Select a file first');

    const btn      = document.getElementById('share-btn');
    const password = document.getElementById('share-password')?.value || '';
    const expiry   = document.getElementById('share-expiry')?.value || '24';
    const maxDl    = document.getElementById('share-max-dl')?.value || '0';
    const autoDel  = document.getElementById('auto-delete-toggle')?.classList.contains('on') ? '1' : '0';

    btn.textContent = 'Uploading...';
    btn.disabled = true;

    const fd = new FormData();
    fd.append('file',         this._file);
    fd.append('password',     password);
    fd.append('expiry',       expiry);
    fd.append('max_downloads', maxDl);
    fd.append('auto_delete',  autoDel);

    try {
      const res = await API.upload('/PHP/project-2/api/sharing.php', fd);
      if (res.success) {
        this.showResult(res.data);
        Toast.success('Link Created!', 'Share link generated successfully');
        await this.loadShares();
      } else {
        Toast.error('Upload Failed', res.error);
      }
    } catch (err) {
      Toast.error('Error', err.message);
    } finally {
      btn.textContent = '🔗 Generate Share Link';
      btn.disabled = false;
    }
  },

  showResult(data) {
    const card = document.getElementById('share-result-card');
    if (!card) return;

    card.innerHTML = `
      <h3 class="card-title" style="margin-bottom:var(--space-4)">✅ Link Created!</h3>

      <!-- QR Code -->
      <div id="qr-container" style="margin-bottom:var(--space-4);background:white;padding:12px;border-radius:var(--radius-lg)"></div>

      <!-- URL -->
      <div class="form-input-group" style="width:100%">
        <input type="text" class="form-input" value="${Utils.escapeHtml(data.share_url)}" readonly id="share-url-input" style="font-size:var(--text-xs);border-radius:var(--radius-md) 0 0 var(--radius-md);border:none">
        <button class="btn btn-primary" onclick="Utils.copyToClipboard('${Utils.escapeHtml(data.share_url)}')" style="border-radius:0 var(--radius-md) var(--radius-md) 0;padding:0 16px">📋</button>
      </div>

      <div class="flex gap-3" style="margin-top:var(--space-3)">
        ${data.expiry ? `<span class="badge badge-warning">Expires: ${Utils.formatDate(data.expiry)}</span>` : '<span class="badge badge-default">No expiry</span>'}
        <span class="badge badge-accent">${Utils.formatBytes(data.size)}</span>
      </div>
    `;

    // Generate QR Code
    if (typeof QRCode !== 'undefined') {
      new QRCode(document.getElementById('qr-container'), {
        text:   data.share_url,
        width:  160,
        height: 160,
        colorDark: '#000000',
        colorLight: '#ffffff',
      });
    }
  },

  async loadShares() {
    try {
      const res = await API.getShares();
      const container = document.getElementById('shares-list');
      if (!container) return;
      const shares = res.success ? res.data : [];
      if (!shares.length) {
        container.innerHTML = `<div class="empty-state" style="padding:2rem"><p class="text-xs text-tertiary">No active shares</p></div>`;
        return;
      }
      container.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead><tr><th>File</th><th>Downloads</th><th>Expiry</th><th>Actions</th></tr></thead>
            <tbody>
              ${shares.map(s => `
                <tr>
                  <td>
                    <div class="text-sm font-semibold">${Utils.escapeHtml(s.name)}</div>
                    <div class="text-xs text-tertiary">${Utils.formatBytes(s.size)}</div>
                  </td>
                  <td><span class="badge badge-default">${s.downloads} / ${s.max_downloads || '∞'}</span></td>
                  <td class="text-xs text-secondary">${s.expiry ? Utils.formatDate(s.expiry) : 'Never'}</td>
                  <td>
                    <div class="flex gap-2">
                      <button class="btn btn-secondary btn-xs" onclick="Utils.copyToClipboard('${Utils.escapeHtml(s.share_url)}')">📋 Copy</button>
                      <button class="btn btn-danger btn-xs" onclick="FileSharing.deleteShare('${s.id}')">🗑</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch {}
  },

  async deleteShare(id) {
    if (!confirm('Delete this share link?')) return;
    try {
      const res = await API.deleteShare(id);
      if (res.success) { Toast.success('Deleted', 'Share removed'); await this.loadShares(); }
    } catch (err) { Toast.error('Error', err.message); }
  },

  destroy() {},
};

export default FileSharing;

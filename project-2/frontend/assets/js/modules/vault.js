/**
 * DevForge AI – Secure File Vault Module
 * AES-256 encrypted file storage with upload, preview, download
 */

'use strict';

const Vault = {
  async render() {
    return `
      <div class="module-header">
        <h1 class="title gradient-text">🔐 Secure File Vault</h1>
        <p class="subtitle">AES-256 encrypted file storage with SHA256 verification</p>
      </div>

      <!-- Upload Card -->
      <div class="card" style="margin-bottom:var(--space-6)">
        <div class="card-header">
          <h3 class="card-title">Upload & Encrypt</h3>
        </div>
        <div class="dropzone" id="vault-drop" onclick="document.getElementById('vault-file-input').click()">
          <div class="dropzone-icon">🔐</div>
          <div class="dropzone-text">Drop files here or click to upload</div>
          <div class="dropzone-hint">Files are encrypted with AES-256 before storage</div>
        </div>
        <input type="file" id="vault-file-input" style="display:none" multiple onchange="Vault.handleFiles(this.files)">
        <div style="margin-top:var(--space-4)">
          <label class="form-label">Password (optional, overrides master key)</label>
          <div class="form-input-group">
            <input type="password" id="vault-password" class="form-input" placeholder="Leave empty to use master key..." style="border-radius:var(--radius-md) 0 0 var(--radius-md);border:none">
            <button class="btn btn-primary" onclick="Vault.uploadFromInput()" style="border-radius:0 var(--radius-md) var(--radius-md) 0;padding:0 20px">
              🔐 Encrypt & Upload
            </button>
          </div>
        </div>
        <div id="upload-progress" style="margin-top:var(--space-3);display:none">
          <div class="progress">
            <div class="progress-bar progress-bar-animated" id="upload-progress-bar" style="width:0%"></div>
          </div>
          <div class="text-xs text-tertiary" style="margin-top:4px" id="upload-progress-label">Encrypting...</div>
        </div>
      </div>

      <!-- File Grid -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Encrypted Files</h3>
          <div class="flex gap-2">
            <input type="text" class="form-input" placeholder="Search files..." id="vault-search"
                   oninput="Vault.filterFiles(this.value)" style="width:200px;padding:6px 12px">
            <span class="badge badge-accent" id="vault-count">0 files</span>
          </div>
        </div>
        <div id="vault-files" class="stagger-children">
          <div class="skeleton skeleton-card"></div>
          <div class="skeleton skeleton-card" style="margin-top:8px"></div>
        </div>
      </div>
    `;
  },

  async init() {
    this.setupDrop();
    await this.loadFiles();
  },

  setupDrop() {
    const drop = document.getElementById('vault-drop');
    if (!drop) return;
    drop.addEventListener('dragover',  (e) => { e.preventDefault(); drop.classList.add('drag-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('drag-over');
      this.handleFiles(e.dataTransfer.files);
    });
  },

  handleFiles(files) {
    if (!files?.length) return;
    // Preview selected file names
    const names = Array.from(files).map(f => f.name).join(', ');
    document.querySelector('.dropzone-text').textContent = `Selected: ${names}`;
    this._selectedFiles = files;
  },

  async uploadFromInput() {
    const files = this._selectedFiles || document.getElementById('vault-file-input')?.files;
    if (!files?.length) return Toast.warning('No File', 'Select a file first');

    const password = document.getElementById('vault-password')?.value || '';
    const progress = document.getElementById('upload-progress');
    const bar      = document.getElementById('upload-progress-bar');
    const label    = document.getElementById('upload-progress-label');

    progress.style.display = '';
    bar.style.width = '10%';
    label.textContent = 'Encrypting...';

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      if (password) fd.append('password', password);

      try {
        bar.style.width = '50%';
        label.textContent = `Uploading ${file.name}...`;
        const res = await API.vaultUpload(fd);
        if (res.success) {
          Toast.success('Encrypted!', `${file.name} stored securely`);
          bar.style.width = '100%';
          label.textContent = 'Done!';
        } else {
          Toast.error('Upload Failed', res.error);
        }
      } catch (err) {
        Toast.error('Error', err.message);
      }
    }

    setTimeout(() => { progress.style.display = 'none'; bar.style.width = '0%'; }, 2000);
    this._selectedFiles = null;
    document.querySelector('.dropzone-text').textContent = 'Drop files here or click to upload';
    await this.loadFiles();
  },

  async loadFiles() {
    const res = await API.getVault();
    this._allFiles = res.success ? res.data : [];
    this.renderFiles(this._allFiles);
    document.getElementById('vault-count').textContent = `${this._allFiles.length} files`;
  },

  filterFiles(query) {
    const filtered = this._allFiles.filter(f =>
      f.name.toLowerCase().includes(query.toLowerCase())
    );
    this.renderFiles(filtered);
  },

  renderFiles(files) {
    const container = document.getElementById('vault-files');
    if (!container) return;
    if (!files.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔐</div><p class="empty-state-desc">No encrypted files yet. Upload something!</p></div>`;
      return;
    }
    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>File</th>
              <th>Size</th>
              <th>SHA256</th>
              <th>Encrypted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${files.map(f => `
              <tr>
                <td>
                  <div class="flex items-center gap-2">
                    <span>${this.fileIcon(f.mime)}</span>
                    <div>
                      <div class="text-sm font-semibold">${Utils.escapeHtml(f.name)}</div>
                      ${f.password_protected ? '<span class="badge badge-warning" style="font-size:10px">🔑 Password</span>' : ''}
                    </div>
                  </div>
                </td>
                <td class="text-xs text-secondary">${Utils.formatBytes(f.size)}</td>
                <td>
                  <code class="text-xs" style="max-width:120px;display:block;overflow:hidden;text-overflow:ellipsis"
                        data-tooltip="${f.sha256}">${f.sha256?.substring(0, 12)}...</code>
                </td>
                <td class="text-xs text-secondary">${Utils.formatDate(f.uploaded)}</td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn btn-secondary btn-xs" onclick="Vault.download('${f.id}','${Utils.escapeHtml(f.name)}')">⬇ Download</button>
                    <button class="btn btn-danger btn-xs" onclick="Vault.deleteFile('${f.id}')">🗑</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  async download(id, name) {
    const password = await this.promptPassword();
    try {
      const res = await API.post('/PHP/project-2/api/vault.php', { action: 'download', id, password });
      // Response is binary — use fetch directly
      const response = await fetch('/PHP/project-2/api/vault.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': document.querySelector('meta[name=csrf-token]').content, 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ action: 'download', id, password }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        Toast.success('Decrypted!', `${name} downloaded`);
      } else {
        Toast.error('Decryption Failed', 'Wrong password or file corrupted');
      }
    } catch (err) {
      Toast.error('Error', err.message);
    }
  },

  async deleteFile(id) {
    if (!confirm('Delete this encrypted file permanently?')) return;
    try {
      const res = await API.delete(`/PHP/project-2/api/vault.php?id=${id}`);
      if (res.success) { Toast.success('Deleted', 'File removed from vault'); await this.loadFiles(); }
      else Toast.error('Delete Failed', res.error);
    } catch (err) { Toast.error('Error', err.message); }
  },

  promptPassword() {
    return new Promise(resolve => {
      const pass = prompt('Enter decryption password (leave empty for master key):');
      resolve(pass || '');
    });
  },

  fileIcon(mime = '') {
    if (mime.startsWith('image/')) return '🖼️';
    if (mime.includes('pdf'))       return '📄';
    if (mime.includes('zip') || mime.includes('tar')) return '📦';
    if (mime.includes('video'))     return '🎬';
    if (mime.includes('audio'))     return '🎵';
    if (mime.startsWith('text/'))   return '📝';
    return '📁';
  },

  destroy() {},
};

export default Vault;

/**
 * DevForge AI – Smart File Explorer Module
 */
'use strict';

const FileExplorer = {
  async render() {
    return `
      <div class="module-header">
        <h1 class="title gradient-text">📁 Smart File Explorer</h1>
        <p class="subtitle">AI-powered file search, duplicate detection, metadata, and favorites</p>
      </div>
      <div class="card" style="margin-bottom:var(--space-4)">
        <div class="form-input-group">
          <span class="input-prefix">🔍</span>
          <input type="text" class="form-input" id="file-search-input" placeholder="Search files by name, type, or content... (uses C++ backend if available)"
                 style="border-radius:0;border:none" oninput="FileExplorer.search(this.value)">
          <select class="form-select" id="search-type" style="width:150px;border-radius:0 var(--radius-md) var(--radius-md) 0;border:none;border-left:1px solid var(--border)">
            <option value="name">By Name</option>
            <option value="ext">By Extension</option>
            <option value="size">By Size</option>
          </select>
        </div>
      </div>
      <div class="grid-4" style="margin-bottom:var(--space-4)">
        <button class="btn btn-secondary" onclick="FileExplorer.findDuplicates()">🔁 Find Duplicates</button>
        <button class="btn btn-secondary" onclick="FileExplorer.scanLargeFiles()">📏 Large Files</button>
        <button class="btn btn-secondary" onclick="FileExplorer.indexFolder()">📇 Index Folder</button>
        <button class="btn btn-secondary" onclick="FileExplorer.showUploads()">📤 Show Uploads</button>
      </div>
      <div class="card" id="explorer-results">
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <h3 class="empty-state-title">Smart File Explorer</h3>
          <p class="empty-state-desc">Search files or click an action to explore your workspace</p>
        </div>
      </div>
    `;
  },

  async init() { await this.showUploads(); },

  async search(query) {
    if (!query || query.length < 2) return;
    const results = document.getElementById('explorer-results');
    results.innerHTML = '<div class="spinner" style="margin:2rem auto;display:block"></div>';
    try {
      const res = await API.post('/PHP/project-2/api/files.php', { action: 'search', query });
      this.renderFiles(res.success ? res.data : []);
    } catch { this.renderFiles([]); }
  },

  async showUploads() {
    const results = document.getElementById('explorer-results');
    results.innerHTML = '<div class="spinner" style="margin:2rem auto;display:block"></div>';
    try {
      const res = await API.getFiles();
      const files = res.success ? res.data : [];
      if (!files.length) {
        results.innerHTML = '<div class="empty-state" style="padding:2rem"><div class="empty-state-icon">📂</div><p class="empty-state-desc">No uploaded files yet</p></div>';
        return;
      }
      this.renderFiles(files);
    } catch { results.innerHTML = '<p class="text-error p-4">Could not load files</p>'; }
  },

  renderFiles(files) {
    const el = document.getElementById('explorer-results');
    if (!el) return;
    if (!files.length) { el.innerHTML = '<div class="empty-state" style="padding:2rem"><p class="text-xs text-tertiary">No files found</p></div>'; return; }
    el.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${files.map(f => `
              <tr>
                <td><div class="flex items-center gap-2"><span>${this.fileIcon(f.mime||f.name)}</span><span class="text-sm">${Utils.escapeHtml(f.name)}</span></div></td>
                <td><span class="badge badge-default">${(f.mime||'').split('/')[1]||'file'}</span></td>
                <td class="text-xs">${Utils.formatBytes(f.size||0)}</td>
                <td class="text-xs text-tertiary">${Utils.formatDate(f.created||f.uploaded||0)}</td>
                <td><div class="flex gap-2">
                  <button class="btn btn-secondary btn-xs" onclick="FileExplorer.download('${f.token||f.id}','${Utils.escapeHtml(f.name)}')">⬇</button>
                  <button class="btn btn-ghost btn-xs" onclick="Utils.copyToClipboard('${Utils.escapeHtml(f.sha256||'')}')">🔑</button>
                </div></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  download(token, name) { window.open(`/PHP/project-2/api/sharing.php?token=${token}`, '_blank'); },

  fileIcon(mime = '') {
    if (mime.startsWith('image')) return '🖼️';
    if (mime.includes('pdf'))    return '📄';
    if (mime.includes('zip'))    return '📦';
    if (mime.startsWith('text')) return '📝';
    return '📁';
  },

  findDuplicates() { Toast.info('Duplicates', 'Duplicate detection uses C++ hash_generator. Compile backend/cpp/ first.'); },
  scanLargeFiles() { Toast.info('Large Files', 'Large file scanner uses C++ large_file_scanner binary.'); },
  indexFolder()   { Toast.info('Indexing', 'Folder indexer uses C++ folder_indexer binary.'); },
  destroy() {},
};

export default FileExplorer;

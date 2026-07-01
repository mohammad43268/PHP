/**
 * DevForge AI – Git Dashboard Module
 */

'use strict';

const GitDashboard = {
  chart: null,

  async render() {
    return `
      <div class="module-header">
        <h1 class="title gradient-text">🌿 Git Dashboard</h1>
        <p class="subtitle">Commit history, branches, diff viewer, and repository statistics</p>
      </div>

      <div class="grid-3" style="margin-bottom:var(--space-6)" id="git-stats">
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
      </div>

      <div class="grid-2" style="gap:var(--space-4)">
        <!-- Commits -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📝 Recent Commits</h3>
            <select class="form-select" id="branch-select" style="width:auto;padding:4px 8px" onchange="GitDashboard.loadCommits()">
              <option>Loading...</option>
            </select>
          </div>
          <div id="commits-list">
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
          </div>
        </div>

        <!-- Diff Viewer -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📋 Diff Viewer</h3>
            <span class="text-xs text-tertiary">Click a commit to view diff</span>
          </div>
          <div id="diff-viewer">
            <div class="empty-state" style="padding:2rem">
              <div class="empty-state-icon">📋</div>
              <p class="empty-state-desc">Select a commit to view its changes</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    await Promise.all([this.loadStats(), this.loadBranches(), this.loadCommits()]);
  },

  async loadStats() {
    try {
      const res = await API.post('/PHP/project-2/api/git.php', { action: 'stats' });
      const el = document.getElementById('git-stats');
      if (!el) return;
      if (!res.success) { el.innerHTML = `<div class="card"><p class="text-sm text-error">${res.error}</p></div>`; return; }
      const d = res.data;
      el.innerHTML = `
        <div class="stat-card">
          <div class="stat-label">Total Commits</div>
          <div class="stat-value gradient-text">${d.total_commits}</div>
          <div class="stat-desc">All branches</div>
          <div class="stat-icon">📝</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Tracked Files</div>
          <div class="stat-value" style="color:var(--success)">${d.tracked_files}</div>
          <div class="stat-desc">In repository</div>
          <div class="stat-icon">📁</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">First Commit</div>
          <div class="stat-value" style="font-size:var(--text-xl)">${d.first_commit ? d.first_commit.substring(0, 10) : 'N/A'}</div>
          <div class="stat-desc">Repository start</div>
          <div class="stat-icon">🕐</div>
        </div>
      `;
    } catch {}
  },

  async loadBranches() {
    try {
      const res = await API.post('/PHP/project-2/api/git.php', { action: 'branches' });
      const sel = document.getElementById('branch-select');
      if (!sel || !res.success) return;
      this._current = res.data.current;
      sel.innerHTML = res.data.branches.map(b =>
        `<option value="${Utils.escapeHtml(b.name)}" ${b.name === this._current ? 'selected' : ''}>${b.name}</option>`
      ).join('');
    } catch {}
  },

  async loadCommits() {
    const container = document.getElementById('commits-list');
    if (!container) return;
    container.innerHTML = '<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div>';

    try {
      const res = await API.post('/PHP/project-2/api/git.php', { action: 'log', limit: 30 });
      if (!res.success) { container.innerHTML = `<p class="text-sm text-error p-4">${res.error}</p>`; return; }

      const commits = res.data.commits;
      if (!commits.length) { container.innerHTML = `<div class="empty-state" style="padding:1rem"><p class="text-xs">No commits found</p></div>`; return; }

      container.innerHTML = commits.map(c => `
        <div class="flex items-start gap-3" style="padding:var(--space-3) 0;border-bottom:1px solid var(--border);cursor:pointer"
             onclick="GitDashboard.loadDiff('${c.hash}')">
          <div style="width:8px;height:8px;background:var(--accent);border-radius:50%;margin-top:6px;flex-shrink:0;box-shadow:0 0 6px var(--accent)"></div>
          <div style="flex:1;min-width:0">
            <div class="text-sm font-semibold truncate">${Utils.escapeHtml(c.subject)}</div>
            <div class="flex gap-2" style="margin-top:2px">
              <code class="text-xs" style="color:var(--accent)">${c.short}</code>
              <span class="text-xs text-tertiary">${Utils.escapeHtml(c.author)}</span>
              <span class="text-xs text-tertiary">${c.date?.substring(0, 10)}</span>
            </div>
            ${c.refs ? `<div class="flex gap-1" style="margin-top:4px">${c.refs.split(',').filter(Boolean).map(r => `<span class="badge badge-accent" style="font-size:10px">${r.trim()}</span>`).join('')}</div>` : ''}
          </div>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<p class="text-sm text-error p-4">Git unavailable: ${err.message}</p>`;
    }
  },

  async loadDiff(hash) {
    const container = document.getElementById('diff-viewer');
    if (!container) return;
    container.innerHTML = '<div class="spinner" style="margin:2rem auto;display:block"></div>';

    try {
      const res = await API.post('/PHP/project-2/api/git.php', { action: 'diff', hash });
      if (!res.success) { container.innerHTML = `<p class="text-sm text-error p-4">${res.error}</p>`; return; }

      const lines = res.data.diff.split('\n');
      const highlighted = lines.map(l => {
        let color = 'var(--text-secondary)';
        if (l.startsWith('+'))  color = 'var(--success)';
        if (l.startsWith('-'))  color = 'var(--error)';
        if (l.startsWith('@@')) color = 'var(--accent)';
        return `<div style="color:${color};white-space:pre-wrap;word-break:break-all;font-size:12px">${Utils.escapeHtml(l)}</div>`;
      }).join('');

      container.innerHTML = `
        <div style="overflow:auto;max-height:400px;background:var(--bg-surface);border-radius:var(--radius-lg);padding:var(--space-3);font-family:var(--font-mono)">
          ${highlighted || '<p class="text-xs text-tertiary">Empty diff</p>'}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p class="text-sm text-error p-4">${err.message}</p>`;
    }
  },

  destroy() { this.chart?.destroy(); },
};

export default GitDashboard;

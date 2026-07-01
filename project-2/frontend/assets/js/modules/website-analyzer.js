/**
 * DevForge AI – Website SEO Analyzer Module
 */

'use strict';

const WebsiteAnalyzer = {
  chart: null,

  async render() {
    return `
      <div class="module-header">
        <h1 class="title gradient-text">Website Analyzer</h1>
        <p class="subtitle">SEO, meta tags, performance hints, security headers, and link analysis</p>
      </div>

      <!-- URL Input -->
      <div class="card" style="margin-bottom:var(--space-6)">
        <div class="form-input-group">
          <span class="input-prefix">🌐</span>
          <input type="url" id="seo-url" class="form-input" placeholder="https://example.com"
                 style="border-radius:0;border:none"
                 onkeydown="if(event.key==='Enter')WebsiteAnalyzer.analyze()">
          <button class="btn btn-primary" onclick="WebsiteAnalyzer.analyze()" id="seo-btn" style="border-radius:0 var(--radius-md) var(--radius-md) 0;padding:0 24px">
            Analyze 🔍
          </button>
        </div>
      </div>

      <!-- Results -->
      <div id="seo-results">
        <!-- History -->
        <div id="seo-history-panel">
          <h3 style="margin-bottom:var(--space-4);font-size:var(--text-base);font-weight:600">Recent Analyses</h3>
          <div id="seo-history-list" class="grid-3">
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    await this.loadHistory();
    document.getElementById('seo-url')?.focus();
  },

  async loadHistory() {
    try {
      const res = await API.get('/PHP/project-2/api/seo.php');
      const list = document.getElementById('seo-history-list');
      if (!list) return;
      if (!res.success || !res.data?.length) {
        list.innerHTML = `<div class="empty-state" style="padding:2rem;grid-column:1/-1"><p class="text-xs text-tertiary">No analyses yet. Enter a URL above to start.</p></div>`;
        return;
      }
      list.innerHTML = res.data.slice(-9).reverse().map(a => `
        <div class="glass-card" style="cursor:pointer" onclick="WebsiteAnalyzer.showResult(${JSON.stringify(a).replace(/"/g, '&quot;')})">
          <div class="flex items-center justify-between" style="margin-bottom:var(--space-2)">
            <span class="badge ${this.scoreBadge(a.seo_score)}">${a.seo_score}/100</span>
            <span class="text-xs text-tertiary">${Utils.timeAgo(a.analyzed_at)}</span>
          </div>
          <div class="text-sm font-semibold truncate">${Utils.escapeHtml(a.url)}</div>
          <div class="text-xs text-tertiary" style="margin-top:4px">Status: ${a.status_code} · ${a.links?.internal || 0} internal links</div>
        </div>
      `).join('');
    } catch {}
  },

  async analyze() {
    const url = document.getElementById('seo-url')?.value.trim();
    if (!url) return Toast.warning('URL Required', 'Enter a URL to analyze');

    const btn = document.getElementById('seo-btn');
    btn.textContent = 'Analyzing...';
    btn.disabled = true;

    try {
      const res = await API.analyzeSeo(url);
      if (res.success) {
        this.showResult(res.data);
        Toast.success('Analysis Complete', `SEO Score: ${res.data.seo_score}/100`);
      } else {
        Toast.error('Analysis Failed', res.error);
      }
    } catch (err) {
      Toast.error('Error', err.message);
    } finally {
      btn.textContent = 'Analyze 🔍';
      btn.disabled = false;
    }
  },

  showResult(a) {
    const container = document.getElementById('seo-results');
    if (!container) return;
    this.chart?.destroy();

    container.innerHTML = `
      <div class="grid-3" style="margin-bottom:var(--space-6)">
        <div class="stat-card">
          <div class="stat-label">SEO Score</div>
          <div class="stat-value" style="color:${a.seo_score >= 80 ? 'var(--success)' : a.seo_score >= 50 ? 'var(--warning)' : 'var(--error)'}">${a.seo_score}<span style="font-size:1rem">/100</span></div>
          <div class="stat-desc">${a.seo_score >= 80 ? 'Great!' : a.seo_score >= 50 ? 'Needs work' : 'Poor'}</div>
          <div class="stat-icon">🎯</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Status Code</div>
          <div class="stat-value" style="color:${a.status_code === 200 ? 'var(--success)' : 'var(--error)'}">${a.status_code}</div>
          <div class="stat-desc">${a.status_code === 200 ? 'OK' : 'Error'}</div>
          <div class="stat-icon">📡</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Page Size</div>
          <div class="stat-value">${Utils.formatBytes(a.html_size)}</div>
          <div class="stat-desc">${a.links?.internal || 0} internal · ${a.links?.external || 0} external links</div>
          <div class="stat-icon">📄</div>
        </div>
      </div>

      <!-- Meta -->
      <div class="grid-2" style="margin-bottom:var(--space-6)">
        <div class="card">
          <div class="card-header"><h3 class="card-title">📝 Meta Information</h3></div>
          ${this.metaRow('Title', a.title, `${a.title_length} chars`, a.title_length >= 10 && a.title_length <= 60)}
          ${this.metaRow('Description', a.meta_desc || '—', `${a.meta_desc_length || 0} chars`, a.meta_desc_length >= 50 && a.meta_desc_length <= 160)}
          ${this.metaRow('H1 Tags', (a.headings?.h1 || []).join(', ') || '—', `${(a.headings?.h1 || []).length} found`, (a.headings?.h1 || []).length === 1)}
          ${this.metaRow('Images', `${a.images?.total || 0} total`, `${a.images?.missing_alt || 0} missing alt`, (a.images?.missing_alt || 0) === 0)}
        </div>

        <div class="card">
          <div class="card-header"><h3 class="card-title">🔒 Security Headers</h3></div>
          ${Object.entries(a.security_headers || {}).map(([k, v]) =>
            `<div class="flex items-center justify-between" style="padding:8px 0;border-bottom:1px solid var(--border)">
              <span class="text-xs font-mono">${k}</span>
              <span class="badge ${v ? 'badge-success' : 'badge-error'}">${v ? '✓ Present' : '✗ Missing'}</span>
            </div>`
          ).join('')}
        </div>
      </div>

      <!-- Open Graph + Hints -->
      <div class="grid-2" style="margin-bottom:var(--space-6)">
        <div class="card">
          <div class="card-header"><h3 class="card-title">📊 Open Graph</h3></div>
          ${Object.entries(a.open_graph || {}).length
            ? Object.entries(a.open_graph).map(([k, v]) => `
                <div style="padding:6px 0;border-bottom:1px solid var(--border)">
                  <div class="text-xs text-tertiary font-mono">${k}</div>
                  <div class="text-sm truncate">${Utils.escapeHtml(v)}</div>
                </div>
              `).join('')
            : '<p class="text-sm text-tertiary">No Open Graph tags found</p>'
          }
        </div>

        <div class="card">
          <div class="card-header"><h3 class="card-title">⚠️ Issues & Hints</h3></div>
          ${(a.performance_hints || []).length
            ? a.performance_hints.map(h => `
                <div class="flex items-center gap-2" style="padding:6px 0;border-bottom:1px solid var(--border)">
                  <span style="color:var(--warning)">⚠</span>
                  <span class="text-sm">${Utils.escapeHtml(h)}</span>
                </div>
              `).join('')
            : '<div class="flex items-center gap-2"><span style="color:var(--success)">✓</span><span class="text-sm">No issues found!</span></div>'
          }
        </div>
      </div>

      <!-- Chart -->
      <div class="card" style="margin-bottom:var(--space-4)">
        <div class="card-header"><h3 class="card-title">📈 SEO Score Breakdown</h3></div>
        <canvas id="seo-chart" height="100"></canvas>
      </div>

      <button class="btn btn-secondary" onclick="WebsiteAnalyzer.init()">← Back to History</button>
    `;

    // Chart
    const ctx = document.getElementById('seo-chart')?.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Title', 'Meta Desc', 'H1 Tag', 'Alt Text', 'OG Tags', 'Security'],
          datasets: [{
            label: 'Score',
            data: [
              a.title_length >= 10 && a.title_length <= 60 ? 20 : 10,
              a.meta_desc_length >= 50 && a.meta_desc_length <= 160 ? 20 : 5,
              (a.headings?.h1 || []).length === 1 ? 15 : 5,
              (a.images?.missing_alt || 0) === 0 ? 15 : 5,
              Object.keys(a.open_graph || {}).length > 0 ? 15 : 5,
              Object.values(a.security_headers || {}).filter(Boolean).length * 2,
            ],
            backgroundColor: 'rgba(0,212,255,0.6)',
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: 'rgba(240,240,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: 'rgba(240,240,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          },
        },
      });
    }
  },

  metaRow(label, val, meta, ok) {
    return `
      <div style="padding:var(--space-2) 0;border-bottom:1px solid var(--border)">
        <div class="flex items-center justify-between">
          <span class="text-xs text-tertiary">${label}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs text-tertiary">${meta}</span>
            <span style="color:${ok ? 'var(--success)' : 'var(--error)'};font-size:14px">${ok ? '✓' : '✗'}</span>
          </div>
        </div>
        <div class="text-sm truncate" style="margin-top:2px;max-width:300px" title="${Utils.escapeHtml(val)}">${Utils.escapeHtml(val) || '—'}</div>
      </div>
    `;
  },

  scoreBadge(score) {
    if (score >= 80) return 'badge-success';
    if (score >= 50) return 'badge-warning';
    return 'badge-error';
  },

  destroy() { this.chart?.destroy(); },
};

export default WebsiteAnalyzer;

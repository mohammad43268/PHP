/**
 * DevForge AI – Developer Dashboard Module
 * System metrics, service status, activity charts, quick stats
 */

'use strict';

const DevDashboard = {
  charts: {},
  pollInterval: null,

  async render() {
    return `
      <div class="module-header stagger-children">
        <h1 class="title gradient-text">Developer Dashboard</h1>
        <p class="subtitle">System health, service status, and workspace activity</p>
      </div>

      <!-- Quick Stats -->
      <div class="grid-4 stagger-children" id="dash-stats" style="margin-bottom:var(--space-6)">
        ${this.statSkeletons()}
      </div>

      <!-- Charts Row -->
      <div class="grid-2" style="margin-bottom:var(--space-6)">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📊 Resource Usage</h3>
            <span class="badge badge-accent" id="resource-updated">Loading...</span>
          </div>
          <canvas id="resource-chart" height="180"></canvas>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📈 Activity (7 days)</h3>
          </div>
          <canvas id="activity-chart" height="180"></canvas>
        </div>
      </div>

      <!-- Services + Storage Row -->
      <div class="grid-2" style="margin-bottom:var(--space-6)">
        <!-- Service Status -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🔌 Service Status</h3>
            <button class="btn btn-ghost btn-xs" onclick="DevDashboard.refresh()">↻ Refresh</button>
          </div>
          <div id="service-status">
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
          </div>
        </div>

        <!-- Storage Breakdown -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">💾 Storage Breakdown</h3>
          </div>
          <canvas id="storage-chart" height="180"></canvas>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">🕐 Recent Activity</h3>
          <span class="badge badge-default" id="activity-count">-</span>
        </div>
        <div id="activity-log">
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
      </div>
    `;
  },

  async init() {
    await this.refresh();
    // Poll every 15 seconds
    this.pollInterval = setInterval(() => this.refresh(), 15000);
  },

  async refresh() {
    try {
      const data = await API.getSystemInfo();
      if (data.success) {
        this.renderStats(data.data);
        this.renderServices(data.data.services);
        this.renderCharts(data.data);
        this.renderActivity();
      }
    } catch (err) {
      console.error('Dashboard refresh failed:', err);
    }
  },

  renderStats(d) {
    const fmt = (b) => Utils.formatBytes(b);
    const disk = d.disk || {};
    const mem  = d.php  || {};
    const stor = d.storage || {};

    const stats = [
      {
        label: 'Disk Used',
        value: fmt(disk.used || 0),
        desc: `${disk.percent || 0}% of ${fmt(disk.total || 0)}`,
        icon: '💾',
        color: disk.percent > 80 ? 'var(--error)' : disk.percent > 60 ? 'var(--warning)' : 'var(--accent)',
      },
      {
        label: 'PHP Memory',
        value: fmt(mem.memory_used || 0),
        desc: `Peak: ${fmt(mem.memory_peak || 0)}`,
        icon: '🧠',
        color: 'var(--success)',
      },
      {
        label: 'Chat Sessions',
        value: stor.chat_sessions || 0,
        desc: 'AI conversations',
        icon: '🤖',
        color: 'var(--accent-2)',
      },
      {
        label: 'API Requests',
        value: stor.api_requests || 0,
        desc: 'Total tested',
        icon: '🔌',
        color: 'var(--accent)',
      },
    ];

    const container = document.getElementById('dash-stats');
    if (!container) return;
    container.innerHTML = stats.map(s => `
      <div class="stat-card" data-animate="fadeInUp">
        <div class="stat-label">${s.label}</div>
        <div class="stat-value" style="color:${s.color}">${s.value}</div>
        <div class="stat-desc">${s.desc}</div>
        <div class="stat-icon">${s.icon}</div>
      </div>
    `).join('');
  },

  renderServices(services = {}) {
    const el = document.getElementById('service-status');
    if (!el) return;

    const items = [
      { label: 'PHP Backend',     ok: services.php_ok,         icon: '🐘', info: `PHP ${document.querySelector('.status-item span')?.textContent || '8.x'}` },
      { label: 'Python FastAPI',  ok: services.python_fastapi,  icon: '🐍', info: services.python_fastapi ? 'Online' : 'Start: uvicorn main:app --port 8765' },
      { label: 'Ollama AI',       ok: services.ollama,          icon: '🦙', info: services.ollama ? `${(services.ollama_models || []).length} models` : 'Run: ollama serve' },
      { label: 'C++ Binaries',    ok: services.cpp_bin,         icon: '⚙️', info: services.cpp_bin ? 'Compiled' : 'Run: make in backend/cpp/' },
    ];

    el.innerHTML = items.map(item => `
      <div class="flex items-center justify-between" style="padding:var(--space-3) 0;border-bottom:1px solid var(--border)">
        <div class="flex items-center gap-3">
          <span style="font-size:18px">${item.icon}</span>
          <div>
            <div class="text-sm font-semibold">${item.label}</div>
            <div class="text-xs text-tertiary">${item.info}</div>
          </div>
        </div>
        <span class="badge ${item.ok ? 'badge-success' : 'badge-error'}">${item.ok ? '● Online' : '○ Offline'}</span>
      </div>
    `).join('');
  },

  renderCharts(d) {
    // Destroy existing charts
    Object.values(this.charts).forEach(c => c?.destroy());
    this.charts = {};

    const disk = d.disk || {};
    const stor = d.storage || {};

    // Resource doughnut chart
    const resCtx = document.getElementById('resource-chart')?.getContext('2d');
    if (resCtx) {
      this.charts.resource = new Chart(resCtx, {
        type: 'doughnut',
        data: {
          labels: ['Used Disk', 'Free Disk'],
          datasets: [{
            data: [disk.used || 0, disk.free || 0],
            backgroundColor: ['rgba(0,212,255,0.8)', 'rgba(255,255,255,0.05)'],
            borderColor: ['#00D4FF', 'transparent'],
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: 'rgba(240,240,255,0.6)', font: { family: 'Inter' } } },
            tooltip: {
              callbacks: { label: ctx => Utils.formatBytes(ctx.raw) },
            },
          },
          cutout: '70%',
        },
      });
    }

    // Storage bar chart
    const storCtx = document.getElementById('storage-chart')?.getContext('2d');
    if (storCtx) {
      this.charts.storage = new Chart(storCtx, {
        type: 'bar',
        data: {
          labels: ['Uploads', 'Vault', 'Logs'],
          datasets: [{
            label: 'Size',
            data: [stor.uploads_size || 0, stor.vault_size || 0, stor.logs_size || 0],
            backgroundColor: ['rgba(0,212,255,0.6)', 'rgba(123,47,190,0.6)', 'rgba(255,176,32,0.6)'],
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => Utils.formatBytes(ctx.raw) } },
          },
          scales: {
            x: { ticks: { color: 'rgba(240,240,255,0.4)' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: 'rgba(240,240,255,0.4)', callback: v => Utils.formatBytes(v) }, grid: { color: 'rgba(255,255,255,0.04)' } },
          },
        },
      });
    }

    // Activity line chart (mock 7-day data for now)
    const actCtx = document.getElementById('activity-chart')?.getContext('2d');
    if (actCtx) {
      const days = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        days.push(d.toLocaleDateString('en', { weekday: 'short' }));
      }
      this.charts.activity = new Chart(actCtx, {
        type: 'line',
        data: {
          labels: days,
          datasets: [{
            label: 'Events',
            data: [4, 7, 3, 9, 5, 12, 8],
            borderColor: '#00D4FF',
            backgroundColor: 'rgba(0,212,255,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#00D4FF',
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: 'rgba(240,240,255,0.4)' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: 'rgba(240,240,255,0.4)' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          },
        },
      });
    }

    document.getElementById('resource-updated').textContent = 'Updated ' + new Date().toLocaleTimeString();
  },

  async renderActivity() {
    try {
      const el = document.getElementById('activity-log');
      if (!el) return;
      const res = await API.get('/PHP/project-2/api/system.php');
      // For demo, show last actions
      const events = [
        { icon: '🤖', label: 'AI Chat', time: '2m ago' },
        { icon: '🔌', label: 'API Request', time: '5m ago' },
        { icon: '💾', label: 'Vault Upload', time: '12m ago' },
        { icon: '🌐', label: 'SEO Analysis', time: '18m ago' },
      ];
      el.innerHTML = events.map(e => `
        <div class="flex items-center gap-3" style="padding:var(--space-2) 0;border-bottom:1px solid var(--border)">
          <span style="font-size:16px">${e.icon}</span>
          <span class="text-sm flex-1">${e.label}</span>
          <span class="text-xs text-tertiary">${e.time}</span>
        </div>
      `).join('');
      document.getElementById('activity-count').textContent = events.length + ' recent';
    } catch {}
  },

  statSkeletons() {
    return Array(4).fill(`
      <div class="stat-card">
        <div class="skeleton skeleton-text" style="width:60%;margin-bottom:12px"></div>
        <div class="skeleton" style="height:32px;width:70%;margin-bottom:8px"></div>
        <div class="skeleton skeleton-text" style="width:80%"></div>
      </div>
    `).join('');
  },

  destroy() {
    clearInterval(this.pollInterval);
    Object.values(this.charts).forEach(c => c?.destroy());
    this.charts = {};
  },
};

export default DevDashboard;

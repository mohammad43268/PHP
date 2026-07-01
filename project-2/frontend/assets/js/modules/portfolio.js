/**
 * DevForge AI – Portfolio Generator Module
 */

'use strict';

const Portfolio = {
  data: { name: '', title: '', bio: '', skills: [], projects: [], social: {}, theme: 'modern' },

  async render() {
    return `
      <div class="module-header">
        <h1 class="title gradient-text">🎨 Portfolio Generator</h1>
        <p class="subtitle">Build a stunning portfolio website, resume, and PDF in minutes</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 380px;gap:var(--space-6)">

        <!-- Form -->
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <div class="card">
            <div class="card-header"><h3 class="card-title">👤 Personal Info</h3></div>
            <div class="form-group"><label class="form-label">Full Name</label><input type="text" class="form-input" id="p-name" placeholder="John Doe" oninput="Portfolio.update()"></div>
            <div class="form-group"><label class="form-label">Title / Role</label><input type="text" class="form-input" id="p-title" placeholder="Full Stack Developer" oninput="Portfolio.update()"></div>
            <div class="form-group"><label class="form-label">Bio / Summary</label><textarea class="form-input" id="p-bio" rows="3" placeholder="A passionate developer..." oninput="Portfolio.update()"></textarea></div>
            <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" id="p-email" oninput="Portfolio.update()"></div>
            <div class="form-group"><label class="form-label">Location</label><input type="text" class="form-input" id="p-location" placeholder="New York, USA" oninput="Portfolio.update()"></div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">🛠️ Skills</h3></div>
            <div id="skills-list"></div>
            <div class="flex gap-2" style="margin-top:var(--space-3)">
              <input type="text" class="form-input" id="skill-input" placeholder="Add skill..." onkeydown="if(event.key==='Enter')Portfolio.addSkill()">
              <button class="btn btn-secondary" onclick="Portfolio.addSkill()">+ Add</button>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">🔗 Social Links</h3></div>
            ${['github','linkedin','twitter','website'].map(s => `
              <div class="form-group">
                <label class="form-label" style="text-transform:capitalize">${s}</label>
                <input type="url" class="form-input" id="p-${s}" placeholder="https://${s}.com/username" oninput="Portfolio.update()">
              </div>
            `).join('')}
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">🎨 Theme</h3></div>
            <div class="tabs">
              ${['modern','minimal','neon','classic'].map(t => `
                <div class="tab ${t === 'modern' ? 'active' : ''}" onclick="Portfolio.setTheme('${t}',this)">${t}</div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Preview + Actions -->
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <div class="card" style="flex:1;overflow:hidden;padding:0">
            <div class="card-header" style="padding:var(--space-3) var(--space-4)">
              <h3 class="card-title">Live Preview</h3>
              <div class="flex gap-1">
                <div style="width:10px;height:10px;border-radius:50%;background:#FF4757"></div>
                <div style="width:10px;height:10px;border-radius:50%;background:#FFB020"></div>
                <div style="width:10px;height:10px;border-radius:50%;background:#00E5A0"></div>
              </div>
            </div>
            <iframe id="portfolio-preview" style="width:100%;border:none;height:400px;background:white"></iframe>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">Export</h3></div>
            <div class="flex flex-col gap-2">
              <button class="btn btn-primary btn-block" onclick="Portfolio.generateHTML()">🌐 Download HTML</button>
              <button class="btn btn-secondary btn-block" onclick="Portfolio.generatePDF()">📄 Download PDF</button>
              <button class="btn btn-secondary btn-block" onclick="Portfolio.generateZIP()">📦 Download ZIP</button>
              <button class="btn btn-ghost btn-block" onclick="Portfolio.save()">💾 Save to Storage</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    this.update();
    // Load saved
    try {
      const res = await API.getPortfolio();
      if (res.success && res.data.portfolios?.length) {
        const saved = res.data.portfolios[res.data.portfolios.length - 1];
        this.data = saved;
        this.populateForm();
      }
    } catch {}
  },

  populateForm() {
    const d = this.data;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('p-name', d.name); set('p-title', d.title); set('p-bio', d.bio);
    set('p-email', d.email); set('p-location', d.location);
    ['github','linkedin','twitter','website'].forEach(s => set(`p-${s}`, d.social?.[s]));
    this.update();
  },

  update() {
    const get = (id) => document.getElementById(id)?.value || '';
    this.data = {
      ...this.data,
      name: get('p-name'), title: get('p-title'), bio: get('p-bio'),
      email: get('p-email'), location: get('p-location'),
      social: { github: get('p-github'), linkedin: get('p-linkedin'), twitter: get('p-twitter'), website: get('p-website') },
    };
    this.renderPreview();
  },

  addSkill() {
    const input = document.getElementById('skill-input');
    const skill = input?.value.trim();
    if (!skill) return;
    this.data.skills = [...(this.data.skills || []), skill];
    input.value = '';
    this.renderSkills();
    this.renderPreview();
  },

  renderSkills() {
    const el = document.getElementById('skills-list');
    if (!el) return;
    el.innerHTML = (this.data.skills || []).map((s, i) => `
      <span class="badge badge-accent" style="margin:2px;cursor:pointer" onclick="Portfolio.removeSkill(${i})">${Utils.escapeHtml(s)} ✕</span>
    `).join('');
  },

  removeSkill(i) {
    this.data.skills.splice(i, 1);
    this.renderSkills();
    this.renderPreview();
  },

  setTheme(theme, el) {
    document.querySelectorAll('.tab[onclick*="setTheme"]').forEach(t => t.classList.remove('active'));
    el?.classList.add('active');
    this.data.theme = theme;
    this.renderPreview();
  },

  renderPreview() {
    const iframe = document.getElementById('portfolio-preview');
    if (!iframe) return;
    const html = this.generateHTML(true);
    iframe.srcdoc = html;
  },

  generateHTML(returnOnly = false) {
    const d = this.data;
    const themes = {
      modern: { bg: '#0a0a1a', text: '#f0f0ff', accent: '#00D4FF', card: 'rgba(255,255,255,0.05)' },
      minimal: { bg: '#ffffff', text: '#111111', accent: '#000000', card: '#f5f5f5' },
      neon:    { bg: '#000000', text: '#ffffff', accent: '#00ff88', card: 'rgba(0,255,136,0.1)' },
      classic: { bg: '#1e3a5f', text: '#ffffff', accent: '#ffd700', card: 'rgba(255,255,255,0.1)' },
    };
    const t = themes[d.theme] || themes.modern;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${Utils.escapeHtml(d.name || 'Portfolio')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:${t.bg};color:${t.text};line-height:1.6}
.hero{padding:80px 40px;text-align:center;background:linear-gradient(135deg,${t.accent}22,transparent)}
h1{font-size:3rem;font-weight:800;margin-bottom:8px}
.accent{color:${t.accent}}
.subtitle{font-size:1.25rem;opacity:0.7;margin-bottom:16px}
.section{max-width:900px;margin:0 auto;padding:60px 40px}
.section h2{font-size:1.8rem;font-weight:700;margin-bottom:24px;color:${t.accent}}
.skills{display:flex;flex-wrap:wrap;gap:8px}
.skill{padding:6px 16px;background:${t.card};border:1px solid ${t.accent}44;border-radius:999px;font-size:0.875rem}
.links{display:flex;gap:16px;justify-content:center;margin-top:16px}
.links a{color:${t.accent};text-decoration:none;padding:8px 16px;border:1px solid ${t.accent};border-radius:8px;transition:all 0.2s}
.links a:hover{background:${t.accent};color:${t.bg}}
footer{text-align:center;padding:40px;opacity:0.4;font-size:0.875rem}
</style>
</head>
<body>
<div class="hero">
<h1>${Utils.escapeHtml(d.name || 'Your Name')}</h1>
<div class="subtitle accent">${Utils.escapeHtml(d.title || 'Your Title')}</div>
<p style="opacity:0.8;max-width:600px;margin:16px auto">${Utils.escapeHtml(d.bio || '')}</p>
<div class="links">
${Object.entries(d.social || {}).filter(([,v])=>v).map(([k,v])=>`<a href="${v}" target="_blank">${k.charAt(0).toUpperCase()+k.slice(1)}</a>`).join('')}
</div>
</div>
${d.skills?.length ? `<div class="section"><h2>Skills</h2><div class="skills">${d.skills.map(s=>`<span class="skill">${Utils.escapeHtml(s)}</span>`).join('')}</div></div>` : ''}
<footer>Built with DevForge AI · ${new Date().getFullYear()}</footer>
</body></html>`;

    if (returnOnly) return html;

    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(d.name || 'portfolio').replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    Toast.success('Downloaded!', 'Portfolio HTML ready');
    return html;
  },

  generatePDF() { Toast.info('PDF Export', 'Open the HTML in a browser and use Ctrl+P to print/save as PDF'); },
  generateZIP() { Toast.info('ZIP Export', 'ZIP export coming soon with all assets included'); },

  async save() {
    try {
      const res = await API.savePortfolio({ portfolio: this.data, ts: Date.now() });
      if (res.success) Toast.success('Saved!', 'Portfolio saved to storage');
    } catch (err) { Toast.error('Error', err.message); }
  },

  destroy() {},
};

export default Portfolio;

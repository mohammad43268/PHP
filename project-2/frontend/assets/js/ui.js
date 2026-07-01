/**
 * DevForge AI – UI Engine
 * Sidebar rendering, Command Palette Logic, Notifications
 */

'use strict';

const UI = {
  init() {
    this.renderSidebar();
    this.initCommandPalette();
  },

  renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    // Linear-style slim rail groups
    const groups = {
      Core: ['dashboard', 'ai-assistant', 'ai-coding', 'api-studio'],
      Tools: ['file-explorer', 'web-analyzer', 'pdf-toolkit', 'image-studio', 'doc-studio'],
      Secure: ['vault', 'file-sharing', 'git-dashboard', 'portfolio', 'voice']
    };

    let html = '';
    for (const [group, modIds] of Object.entries(groups)) {
      html += `<div class="nav-section-label" style="display:none">${group}</div>`;
      for (const id of modIds) {
        if (!window.MODULES[id]) continue;
        const mod = window.MODULES[id];
        html += `
          <div class="nav-item" data-module="${id}" data-label="${mod.label}" onclick="App.navigate('${id}')">
            <span class="nav-item-icon">${mod.icon}</span>
            <span class="nav-item-label" style="display:none">${mod.label}</span>
          </div>
        `;
      }
      html += `<div class="separator" style="width: 24px; margin: 12px 0;"></div>`;
    }
    nav.innerHTML = html;
  },

  initCommandPalette() {
    const backdrop = document.getElementById('cmd-palette-backdrop');
    const input = document.getElementById('cmd-input');
    const results = document.getElementById('cmd-results');
    if (!backdrop || !input || !results) return;

    // Build command list from modules
    const cmds = [];
    for (const [id, mod] of Object.entries(window.MODULES)) {
      cmds.push({ id: `nav-${id}`, title: mod.label, icon: mod.icon, action: () => App.navigate(id), group: 'Navigation' });
    }
    cmds.push({ id: 'theme-toggle', title: 'Toggle Theme', icon: '🌗', action: () => App.toggleTheme(), group: 'System' });
    
    // Add custom commands globally registered in COMMANDS array if any
    if (window.COMMANDS && Array.isArray(window.COMMANDS)) {
      cmds.push(...window.COMMANDS.filter(c => !cmds.find(existing => existing.id === c.id)));
    }

    const renderResults = (query = '') => {
      const q = query.toLowerCase();
      const filtered = cmds.filter(c => c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
      
      if (!filtered.length) {
        results.innerHTML = `<div class="empty-state" style="padding: 32px 0"><span style="font-size:24px;margin-bottom:8px;display:block">🔍</span><span style="color:var(--text-tertiary)">No commands found</span></div>`;
        return;
      }

      // Grouping
      const grouped = {};
      filtered.forEach(c => {
        const g = c.group || 'Commands';
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push(c);
      });

      let html = '';
      let first = true;
      for (const [g, list] of Object.entries(grouped)) {
        html += `<div class="cmd-group-label">${g}</div>`;
        for (const c of list) {
          html += `
            <div class="cmd-item ${first ? 'selected' : ''}" data-id="${c.id}">
              <div class="cmd-icon">${c.icon}</div>
              <div class="cmd-title">${c.title}</div>
              <div class="cmd-shortcut">Enter</div>
            </div>
          `;
          first = false;
        }
      }
      results.innerHTML = html;

      // Click handling
      results.querySelectorAll('.cmd-item').forEach(el => {
        el.addEventListener('click', () => {
          const cmd = cmds.find(c => c.id === el.dataset.id);
          if (cmd) {
            UI.closeCommandPalette();
            cmd.action();
          }
        });
      });
    };

    // Keyboard navigation inside palette
    input.addEventListener('keydown', (e) => {
      const items = Array.from(results.querySelectorAll('.cmd-item'));
      if (!items.length) return;
      
      const idx = items.findIndex(el => el.classList.contains('selected'));
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[idx]?.classList.remove('selected');
        const next = items[(idx + 1) % items.length];
        next.classList.add('selected');
        next.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[idx]?.classList.remove('selected');
        const next = items[(idx - 1 + items.length) % items.length];
        next.classList.add('selected');
        next.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        items[idx]?.click();
      }
    });

    input.addEventListener('input', () => renderResults(input.value));
    
    // Initial render
    this._renderResults = renderResults;
  },

  openCommandPalette() {
    const backdrop = document.getElementById('cmd-palette-backdrop');
    if (!backdrop) return;
    backdrop.classList.add('active');
    const input = document.getElementById('cmd-input');
    input.value = '';
    if (this._renderResults) this._renderResults('');
    setTimeout(() => input.focus(), 50);
  },

  closeCommandPalette() {
    document.getElementById('cmd-palette-backdrop')?.classList.remove('active');
  }
};

window.UI = UI;

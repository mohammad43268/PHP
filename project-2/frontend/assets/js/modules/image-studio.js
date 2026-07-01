/**
 * DevForge AI – AI Image Studio Module
 */
'use strict';

const ImageStudio = {
  async render() {
    return `
      <div class="module-header">
        <h1 class="title gradient-text">🖼️ AI Image Studio</h1>
        <p class="subtitle">OCR, captioning, background removal, icon generation, upscaling (requires Python AI service)</p>
      </div>

      <div class="grid-3 stagger-children" style="margin-bottom:var(--space-6)">
        ${[
          { id: 'ocr',       icon: '🔎', label: 'Extract Text (OCR)',    desc: 'Extract text from any image' },
          { id: 'caption',   icon: '💬', label: 'Image Captioning',      desc: 'AI-generated image description' },
          { id: 'metadata',  icon: '📊', label: 'Image Metadata',        desc: 'EXIF data, dimensions, format' },
        ].map(t => `
          <div class="glass-card" style="cursor:pointer;text-align:center;padding:var(--space-5)" onclick="ImageStudio.openTool('${t.id}')">
            <div style="font-size:36px;margin-bottom:var(--space-3)">${t.icon}</div>
            <div class="text-base font-semibold">${t.label}</div>
            <div class="text-xs text-tertiary">${t.desc}</div>
          </div>
        `).join('')}
      </div>

      <div class="card" id="image-tool-panel">
        <div class="card-header"><h3 class="card-title" id="image-tool-title">Select a Tool</h3></div>
        <div id="image-tool-content">
          <div class="empty-state" style="padding:2rem">
            <div class="empty-state-icon">🖼️</div>
            <p class="empty-state-desc">Click a tool above to start</p>
          </div>
        </div>
      </div>
    `;
  },

  async init() {},

  openTool(toolId) {
    const title = { ocr: '🔎 OCR – Extract Text', caption: '💬 Image Captioning', metadata: '📊 Image Metadata' };
    document.getElementById('image-tool-title').textContent = title[toolId] || toolId;

    document.getElementById('image-tool-content').innerHTML = `
      <div class="dropzone" onclick="document.getElementById('img-input-${toolId}').click()">
        <div class="dropzone-icon">🖼️</div>
        <div class="dropzone-text">Drop an image or click to select</div>
        <div class="dropzone-hint">PNG, JPG, JPEG, WEBP, BMP</div>
      </div>
      <input type="file" id="img-input-${toolId}" accept="image/*" style="display:none" onchange="ImageStudio.processImage(this.files[0],'${toolId}')">
      <div id="img-result-${toolId}" style="margin-top:var(--space-4)"></div>
    `;
  },

  async processImage(file, toolId) {
    if (!file) return;
    const resultEl = document.getElementById(`img-result-${toolId}`);
    if (!resultEl) return;

    // Show preview
    const url = URL.createObjectURL(file);
    resultEl.innerHTML = `
      <div style="margin-bottom:var(--space-4)">
        <img src="${url}" style="max-height:200px;border-radius:var(--radius-lg);border:1px solid var(--border)">
      </div>
      <div class="ai-thinking">Processing with AI...</div>
    `;

    if (toolId === 'metadata') {
      resultEl.innerHTML += `
        <div class="card" style="margin-top:var(--space-4)">
          ${[['Name', file.name], ['Size', Utils.formatBytes(file.size)], ['Type', file.type], ['Last Modified', new Date(file.lastModified).toLocaleString()]].map(([k,v]) =>
            `<div class="flex justify-between" style="padding:6px 0;border-bottom:1px solid var(--border)"><span class="text-sm text-tertiary">${k}</span><span class="text-sm">${v}</span></div>`
          ).join('')}
        </div>
      `;
      const aiDiv = resultEl.querySelector('.ai-thinking');
      if (aiDiv) aiDiv.remove();
      return;
    }

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = toolId === 'ocr' ? await API.aiOcr(fd) : await API.aiCaption(fd);
      const aiDiv = resultEl.querySelector('.ai-thinking');
      if (aiDiv) aiDiv.remove();

      if (res.success) {
        resultEl.insertAdjacentHTML('beforeend', `
          <div class="code-block">
            <div class="code-block-header">
              <span class="code-block-lang">${toolId === 'ocr' ? 'Extracted Text' : 'Caption'}</span>
              <button class="code-block-copy" onclick="Utils.copyToClipboard('${Utils.escapeHtml(res.data?.text || res.data?.caption || '')}')">📋 Copy</button>
            </div>
            <pre style="padding:var(--space-4);font-size:var(--text-sm);white-space:pre-wrap">${Utils.escapeHtml(res.data?.text || res.data?.caption || 'No result')}</pre>
          </div>
        `);
      } else {
        resultEl.insertAdjacentHTML('beforeend', `<p class="text-error">${res.error || 'AI service unavailable'}</p>`);
      }
    } catch (err) {
      const aiDiv = resultEl.querySelector('.ai-thinking');
      if (aiDiv) aiDiv.textContent = `Error: ${err.message}. Start the Python service first.`;
    }
  },

  destroy() {},
};

export default ImageStudio;

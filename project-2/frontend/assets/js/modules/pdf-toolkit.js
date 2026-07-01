/**
 * DevForge AI – PDF Toolkit Module
 */

'use strict';

const PDFToolkit = {
  async render() {
    return `
      <div class="module-header">
        <h1 class="title gradient-text">📄 PDF Toolkit</h1>
        <p class="subtitle">Merge, split, compress, rotate, watermark, OCR, and convert PDFs</p>
      </div>

      <div class="grid-3 stagger-children" style="margin-bottom:var(--space-6)">
        ${[
          { id: 'merge',    icon: '🔗', label: 'Merge PDFs',      desc: 'Combine multiple PDFs into one' },
          { id: 'split',    icon: '✂️', label: 'Split PDF',       desc: 'Extract pages or split by range' },
          { id: 'compress', icon: '🗜️', label: 'Compress PDF',    desc: 'Reduce PDF file size' },
          { id: 'rotate',   icon: '🔄', label: 'Rotate Pages',    desc: 'Rotate PDF pages 90°/180°/270°' },
          { id: 'watermark',icon: '💧', label: 'Add Watermark',   desc: 'Text or image watermark' },
          { id: 'ocr',      icon: '🔎', label: 'OCR (Extract Text)', desc: 'Extract text using AI OCR' },
          { id: 'img2pdf',  icon: '🖼️', label: 'Images to PDF',  desc: 'Combine images into PDF' },
          { id: 'extract',  icon: '📋', label: 'Extract Text',    desc: 'Extract all text from PDF' },
        ].map(tool => `
          <div class="glass-card" onclick="PDFToolkit.openTool('${tool.id}')" style="cursor:pointer;text-align:center;padding:var(--space-5)">
            <div style="font-size:36px;margin-bottom:var(--space-3)">${tool.icon}</div>
            <div class="text-base font-semibold" style="margin-bottom:var(--space-1)">${tool.label}</div>
            <div class="text-xs text-tertiary">${tool.desc}</div>
          </div>
        `).join('')}
      </div>

      <div id="pdf-tool-panel" class="card" style="display:none">
        <div class="card-header" id="pdf-tool-header">
          <h3 class="card-title">Tool</h3>
          <button class="btn btn-ghost btn-xs" onclick="PDFToolkit.closeTool()">✕ Close</button>
        </div>
        <div id="pdf-tool-content"></div>
      </div>
    `;
  },

  async init() {},

  openTool(toolId) {
    const panel   = document.getElementById('pdf-tool-panel');
    const header  = document.getElementById('pdf-tool-header')?.querySelector('h3');
    const content = document.getElementById('pdf-tool-content');
    if (!panel || !content) return;

    panel.style.display = '';

    const tools = {
      merge: {
        label: '🔗 Merge PDFs',
        html: `
          <div class="dropzone" onclick="document.getElementById('merge-files').click()">
            <div class="dropzone-icon">📄</div>
            <div class="dropzone-text">Select multiple PDF files</div>
          </div>
          <input type="file" id="merge-files" multiple accept=".pdf" style="display:none">
          <button class="btn btn-primary" style="margin-top:var(--space-4)" onclick="PDFToolkit.merge()">🔗 Merge PDFs</button>
        `,
      },
      extract: {
        label: '📋 Extract Text',
        html: `
          <div class="dropzone" onclick="document.getElementById('extract-file').click()">
            <div class="dropzone-icon">📄</div>
            <div class="dropzone-text">Select PDF file</div>
          </div>
          <input type="file" id="extract-file" accept=".pdf" style="display:none" onchange="PDFToolkit.extractText(this.files[0])">
        `,
      },
      ocr: {
        label: '🔎 OCR',
        html: `
          <div class="dropzone" onclick="document.getElementById('ocr-file').click()">
            <div class="dropzone-icon">🔎</div>
            <div class="dropzone-text">Select PDF or image for OCR</div>
            <div class="dropzone-hint">Requires Python AI service</div>
          </div>
          <input type="file" id="ocr-file" accept=".pdf,.png,.jpg,.jpeg" style="display:none" onchange="PDFToolkit.runOCR(this.files[0])">
          <div id="ocr-result" style="margin-top:var(--space-4)"></div>
        `,
      },
    };

    const tool = tools[toolId] || { label: `${toolId} Tool`, html: '<p class="text-secondary">This tool requires PHP backend extensions (pdftk/ghostscript).</p>' };
    if (header) header.textContent = tool.label;
    content.innerHTML = tool.html;

    panel.scrollIntoView({ behavior: 'smooth' });
  },

  closeTool() {
    const panel = document.getElementById('pdf-tool-panel');
    if (panel) panel.style.display = 'none';
  },

  async merge() {
    const files = document.getElementById('merge-files')?.files;
    if (!files?.length) return Toast.warning('No Files', 'Select PDF files first');
    Toast.info('Merge', 'PDF merge requires pdftk or ghostscript on the server');
  },

  async extractText(file) {
    if (!file) return;
    Toast.info('Extracting...', 'Text extraction in progress');
    // Would call backend PHP which uses pdftotext
    const fd = new FormData();
    fd.append('file', file);
    fd.append('action', 'extract');
    try {
      const res = await API.upload('/PHP/project-2/api/pdf.php', fd);
      if (res.success) {
        document.getElementById('pdf-tool-content').insertAdjacentHTML('beforeend', `
          <div class="code-block" style="margin-top:var(--space-4)">
            <div class="code-block-header"><span class="code-block-lang">Extracted Text</span><button class="code-block-copy" onclick="Utils.copyToClipboard(this.nextElementSibling.textContent)">Copy</button></div>
            <pre><code>${Utils.escapeHtml(res.data?.text || '')}</code></pre>
          </div>
        `);
      } else Toast.error('Failed', res.error);
    } catch (err) { Toast.error('Error', err.message); }
  },

  async runOCR(file) {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await API.aiOcr(fd);
      const resultEl = document.getElementById('ocr-result');
      if (resultEl) {
        resultEl.innerHTML = res.success
          ? `<div class="code-block"><pre><code>${Utils.escapeHtml(res.data?.text || 'No text found')}</code></pre></div>`
          : `<p class="text-error">${res.error}</p>`;
      }
    } catch (err) { Toast.error('Error', err.message); }
  },

  destroy() {},
};

export default PDFToolkit;

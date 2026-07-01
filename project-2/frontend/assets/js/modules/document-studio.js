/**
 * DevForge AI – AI Document Studio Module
 * Upload PDF/DOCX/TXT, then: summarize, translate, ask questions, generate flashcards
 */

'use strict';

const DocumentStudio = {
  currentDoc: null,

  async render() {
    return `
      <div class="module-header">
        <h1 class="title gradient-text">📚 AI Document Studio</h1>
        <p class="subtitle">Upload documents and use AI to summarize, translate, ask questions, and generate flashcards</p>
      </div>

      <div style="display:grid;grid-template-columns:300px 1fr;gap:var(--space-4);height:calc(100vh - 220px)">

        <!-- Upload Panel -->
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Upload Document</h3></div>
            <div class="dropzone" onclick="document.getElementById('doc-file').click()" id="doc-drop">
              <div class="dropzone-icon">📄</div>
              <div class="dropzone-text">PDF, DOCX, TXT, MD</div>
              <div class="dropzone-hint">Max 20MB</div>
            </div>
            <input type="file" id="doc-file" accept=".pdf,.docx,.txt,.md" style="display:none" onchange="DocumentStudio.uploadDoc(this.files[0])">
            <div id="doc-upload-progress" style="display:none;margin-top:var(--space-3)">
              <div class="progress"><div class="progress-bar" id="doc-progress-bar" style="width:0%"></div></div>
            </div>
          </div>

          <!-- Current Doc Info -->
          <div class="card" id="doc-info" style="display:none">
            <div class="text-sm font-semibold truncate" id="doc-name"></div>
            <div class="text-xs text-tertiary" id="doc-size"></div>
            <div class="text-xs text-secondary" style="margin-top:var(--space-2)" id="doc-excerpt"></div>
          </div>

          <!-- AI Actions -->
          <div class="card" id="doc-actions" style="display:none">
            <div class="card-header"><h3 class="card-title">AI Actions</h3></div>
            <div class="flex flex-col gap-2">
              ${[
                { id: 'summarize',  label: '📝 Summarize' },
                { id: 'translate',  label: '🌍 Translate' },
                { id: 'keywords',   label: '🔑 Keywords' },
                { id: 'flashcards', label: '🃏 Flashcards' },
                { id: 'quiz',       label: '❓ Quiz' },
                { id: 'notes',      label: '📋 Study Notes' },
              ].map(a => `<button class="btn btn-secondary btn-sm" onclick="DocumentStudio.runAction('${a.id}')">${a.label}</button>`).join('')}

              <div class="separator"></div>
              <input type="text" class="form-input" id="doc-question" placeholder="Ask a question about this document...">
              <button class="btn btn-primary btn-sm" onclick="DocumentStudio.askQuestion()">Ask AI →</button>
            </div>
          </div>
        </div>

        <!-- Result Area -->
        <div class="card" style="display:flex;flex-direction:column;padding:0;overflow:hidden">
          <div class="card-header" style="padding:var(--space-3) var(--space-4)">
            <h3 class="card-title" id="doc-result-title">Results</h3>
            <button class="btn btn-ghost btn-xs" onclick="DocumentStudio.copyResult()">📋 Copy</button>
          </div>
          <div id="doc-result" style="flex:1;overflow:auto;padding:var(--space-5)" class="selectable">
            <div class="empty-state">
              <div class="empty-state-icon">📚</div>
              <h3 class="empty-state-title">Upload a Document</h3>
              <p class="empty-state-desc">Upload a PDF, DOCX, or TXT file, then use AI to analyze, summarize, and interact with it.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    const drop = document.getElementById('doc-drop');
    if (drop) {
      drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drag-over'); });
      drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
      drop.addEventListener('drop', (e) => {
        e.preventDefault();
        drop.classList.remove('drag-over');
        if (e.dataTransfer.files[0]) this.uploadDoc(e.dataTransfer.files[0]);
      });
    }
  },

  async uploadDoc(file) {
    if (!file) return;
    const progress = document.getElementById('doc-upload-progress');
    const bar      = document.getElementById('doc-progress-bar');
    progress.style.display = '';
    bar.style.width = '30%';

    // Read file content
    const text = await this.readFile(file);
    this.currentDoc = { name: file.name, size: file.size, text, type: file.type };

    bar.style.width = '100%';
    setTimeout(() => { progress.style.display = 'none'; bar.style.width = '0%'; }, 1000);

    // Show info
    document.getElementById('doc-info').style.display = '';
    document.getElementById('doc-actions').style.display = '';
    document.getElementById('doc-name').textContent = file.name;
    document.getElementById('doc-size').textContent = `${Utils.formatBytes(file.size)} · ${text.split(' ').length} words`;
    document.getElementById('doc-excerpt').textContent = text.substring(0, 200) + '...';

    Toast.success('Document Loaded', file.name);
  },

  readFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result || '');
      reader.readAsText(file);
    });
  },

  async runAction(action) {
    if (!this.currentDoc) return Toast.warning('No Document', 'Upload a document first');

    const prompts = {
      summarize:  'Summarize this document concisely, highlighting the main points:',
      translate:  'Translate this document to Spanish (or specify a language in your question):',
      keywords:   'Extract the top 20 keywords and key phrases from this document:',
      flashcards: 'Create 10 flashcards (Q&A format) from this document for studying:',
      quiz:       'Generate 10 multiple-choice quiz questions from this document:',
      notes:      'Generate comprehensive study notes from this document:',
    };

    const prompt = prompts[action] || action;
    const maxChars = 3000;
    const docText = this.currentDoc.text.substring(0, maxChars);

    const titles = { summarize: '📝 Summary', translate: '🌍 Translation', keywords: '🔑 Keywords',
                     flashcards: '🃏 Flashcards', quiz: '❓ Quiz', notes: '📋 Study Notes' };
    document.getElementById('doc-result-title').textContent = titles[action] || action;

    const resultEl = document.getElementById('doc-result');
    resultEl.innerHTML = '<div class="ai-thinking">AI is reading your document...</div>';

    try {
      const res = await API.post('/PHP/project-2/api/chat.php', {
        message:  `${prompt}\n\nDocument: "${this.currentDoc.name}"\n\n${docText}${this.currentDoc.text.length > maxChars ? '\n...[truncated]' : ''}`,
        provider: 'ollama', model: 'llama3.2', history: [],
      });

      if (res.success) {
        this._lastResult = res.data.response;
        resultEl.innerHTML = Utils.renderMarkdown(res.data.response);
        resultEl.querySelectorAll('pre code').forEach(b => hljs?.highlightElement(b));
      } else {
        resultEl.innerHTML = `<p class="text-error">${res.error}</p>`;
      }
    } catch (err) { resultEl.innerHTML = `<p class="text-error">${err.message}</p>`; }
  },

  async askQuestion() {
    const question = document.getElementById('doc-question')?.value.trim();
    if (!question || !this.currentDoc) return;
    document.getElementById('doc-result-title').textContent = '💬 Answer';
    await this.runAction(`Answer this question about the document: "${question}"`);
  },

  copyResult() {
    if (this._lastResult) Utils.copyToClipboard(this._lastResult);
  },

  destroy() {},
};

export default DocumentStudio;

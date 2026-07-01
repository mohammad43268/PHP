/**
 * DevForge AI – AI Coding Assistant Module
 * Explain, optimize, debug, review, generate, test code with Monaco Editor
 */

'use strict';

const AICoding = {
  monacoLoaded: false,
  editor: null,

  async render() {
    return `
      <div class="module-header">
        <h1 class="title gradient-text">💻 AI Coding Assistant</h1>
        <p class="subtitle">Explain, debug, optimize, generate, and review code using AI</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);height:calc(100vh - 220px)">

        <!-- Input Panel -->
        <div class="card" style="display:flex;flex-direction:column;padding:0;overflow:hidden">
          <div class="card-header" style="padding:var(--space-3) var(--space-4)">
            <select class="form-select" id="code-lang" style="width:auto;padding:4px 8px">
              ${['javascript','typescript','python','php','java','c','cpp','csharp','go','rust','sql','html','css','bash','json','yaml'].map(l =>
                `<option value="${l}">${l}</option>`
              ).join('')}
            </select>
            <div class="flex gap-2">
              <button class="btn btn-ghost btn-xs" onclick="AICoding.clearCode()">🗑 Clear</button>
              <button class="btn btn-ghost btn-xs" onclick="AICoding.loadSample()">📋 Sample</button>
            </div>
          </div>
          <div id="monaco-container" style="flex:1;min-height:0"></div>
        </div>

        <!-- Action + Result Panel -->
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <!-- Actions Grid -->
          <div class="card">
            <div class="card-header"><h3 class="card-title">AI Actions</h3></div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-2)">
              ${[
                { id: 'explain',   label: '💡 Explain Code',       prompt: 'Explain this code clearly, line by line if needed:' },
                { id: 'optimize',  label: '⚡ Optimize Code',      prompt: 'Optimize this code for performance and readability:' },
                { id: 'debug',     label: '🐛 Debug Code',          prompt: 'Find all bugs in this code and explain the fixes:' },
                { id: 'review',    label: '🔍 Code Review',         prompt: 'Do a thorough code review of this. Check style, security, performance:' },
                { id: 'generate',  label: '✨ Generate Tests',      prompt: 'Generate comprehensive unit tests for this code:' },
                { id: 'document',  label: '📝 Generate Docs',       prompt: 'Generate complete documentation (JSDoc/PHPDoc/docstrings) for this code:' },
                { id: 'convert',   label: '🔄 Convert Language',    prompt: 'Convert this code to' },
                { id: 'algorithm', label: '🧩 Explain Algorithm',   prompt: 'Explain the algorithm and complexity (Big O) of this code:' },
                { id: 'security',  label: '🔐 Security Scan',       prompt: 'Find all security vulnerabilities in this code:' },
                { id: 'refactor',  label: '🏗️ Refactor',           prompt: 'Refactor this code following SOLID principles and clean code guidelines:' },
              ].map(a => `
                <button class="btn btn-secondary btn-sm" onclick="AICoding.run('${a.id}','${a.prompt.replace(/'/g,"\\'")}')">
                  ${a.label}
                </button>
              `).join('')}
            </div>
            ${/* Convert target */`
            <div id="convert-target" style="display:none;margin-top:var(--space-3)">
              <select class="form-select" id="convert-lang">
                <option value="Python">Python</option>
                <option value="JavaScript">JavaScript</option>
                <option value="TypeScript">TypeScript</option>
                <option value="PHP">PHP</option>
                <option value="Java">Java</option>
                <option value="Go">Go</option>
                <option value="Rust">Rust</option>
                <option value="C++">C++</option>
              </select>
            </div>`}
          </div>

          <!-- Result -->
          <div class="card" style="flex:1;overflow:auto;padding:0">
            <div class="card-header" style="padding:var(--space-3) var(--space-4)">
              <h3 class="card-title">Result</h3>
              <button class="btn btn-ghost btn-xs" onclick="AICoding.copyResult()">📋 Copy</button>
            </div>
            <div id="ai-code-result" style="padding:var(--space-4);overflow:auto;max-height:400px">
              <div class="empty-state" style="padding:2rem">
                <div class="empty-state-icon">💡</div>
                <p class="empty-state-desc">Paste your code on the left, then click an action</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    await this.loadMonaco();
  },

  async loadMonaco() {
    // Load Monaco from CDN
    return new Promise((resolve) => {
      if (window.monaco) { this.initEditor(); resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
      script.onload = () => {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
        require(['vs/editor/editor.main'], () => {
          this.initEditor();
          resolve();
        });
      };
      document.head.appendChild(script);
    });
  },

  initEditor() {
    const container = document.getElementById('monaco-container');
    if (!container || !window.monaco) return;

    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'vs-light' : 'vs-dark';
    this.editor = monaco.editor.create(container, {
      value: '// Paste your code here...\n',
      language: 'javascript',
      theme,
      fontSize: 14,
      minimap: { enabled: false },
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      fontFamily: 'JetBrains Mono, Fira Code, monospace',
    });

    document.getElementById('code-lang')?.addEventListener('change', (e) => {
      if (this.editor) monaco.editor.setModelLanguage(this.editor.getModel(), e.target.value);
    });
  },

  async run(action, prompt) {
    const code = this.editor?.getValue() || document.getElementById('monaco-container')?.textContent || '';
    if (!code.trim() || code.includes('Paste your code here')) {
      Toast.warning('No Code', 'Paste some code first');
      return;
    }

    let fullPrompt = prompt;
    if (action === 'convert') {
      const targetLang = document.getElementById('convert-lang')?.value || 'Python';
      fullPrompt = `Convert this code to ${targetLang}. Preserve logic and add comments:`;
    }

    const resultEl = document.getElementById('ai-code-result');
    resultEl.innerHTML = '<div class="ai-thinking">AI is analyzing your code...</div>';

    try {
      const res = await API.post('/PHP/project-2/api/chat.php', {
        message:  `${fullPrompt}\n\n\`\`\`\n${code}\n\`\`\``,
        provider: 'ollama',
        model:    'llama3.2',
        history:  [],
      });

      if (res.success) {
        this._lastResult = res.data.response;
        resultEl.innerHTML = Utils.renderMarkdown(res.data.response);
        resultEl.querySelectorAll('pre code').forEach(b => { if (hljs) hljs.highlightElement(b); });
      } else {
        resultEl.innerHTML = `<p class="text-error">${res.error}</p>`;
        Toast.error('AI Error', res.error);
      }
    } catch (err) {
      resultEl.innerHTML = `<p class="text-error">${err.message}</p>`;
      Toast.error('Error', err.message);
    }
  },

  clearCode() {
    this.editor?.setValue('// Paste your code here...\n');
  },

  loadSample() {
    const sample = `// Sample: Fibonacci with memoization
function fibonacci(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}

console.log(fibonacci(10)); // 55
console.log(fibonacci(50)); // 12586269025`;
    this.editor?.setValue(sample);
    if (window.monaco && this.editor) {
      monaco.editor.setModelLanguage(this.editor.getModel(), 'javascript');
      document.getElementById('code-lang').value = 'javascript';
    }
  },

  copyResult() {
    if (this._lastResult) Utils.copyToClipboard(this._lastResult);
    else Toast.warning('Nothing to copy', 'Run an AI action first');
  },

  destroy() {
    this.editor?.dispose();
    this.editor = null;
  },
};

export default AICoding;

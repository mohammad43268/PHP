/**
 * DevForge AI – AI Assistant Module
 * Full chat interface with streaming, history, model selection, voice
 */

'use strict';

const AIAssistant = {
  chatId: null,
  history: [],
  isStreaming: false,
  recognition: null,

  async render() {
    return `
      <div style="display:flex;height:calc(100vh - 130px);gap:var(--space-4)">

        <!-- Sidebar: Chat History -->
        <div style="width:260px;flex-shrink:0;display:flex;flex-direction:column;gap:var(--space-2)">
          <div class="card" style="flex-shrink:0">
            <button class="btn btn-primary btn-block" onclick="AIAssistant.newChat()">
              ✨ New Chat
            </button>
          </div>

          <!-- Model selector -->
          <div class="card" style="flex-shrink:0;padding:var(--space-3)">
            <label class="form-label">Model</label>
            <select class="form-select" id="ai-model-select" onchange="AIAssistant.setModel(this.value)">
              <optgroup label="Ollama (Local)">
                <option value="ollama:llama3.2">Llama 3.2</option>
                <option value="ollama:qwen2.5">Qwen 2.5</option>
                <option value="ollama:deepseek-r1">DeepSeek R1</option>
                <option value="ollama:gemma3">Gemma 3</option>
                <option value="ollama:phi4">Phi 4</option>
                <option value="ollama:mistral">Mistral</option>
              </optgroup>
              <optgroup label="OpenAI">
                <option value="openai:gpt-4o">GPT-4o</option>
                <option value="openai:gpt-4o-mini">GPT-4o mini</option>
              </optgroup>
              <optgroup label="Gemini">
                <option value="gemini:gemini-2.0-flash">Gemini 2.0 Flash</option>
              </optgroup>
              <optgroup label="Anthropic">
                <option value="anthropic:claude-3-5-sonnet-20241022">Claude Sonnet</option>
              </optgroup>
            </select>
          </div>

          <!-- Chat list -->
          <div class="card" style="flex:1;overflow-y:auto;padding:var(--space-2)">
            <div id="chat-history-list">
              <div class="empty-state" style="padding:1rem">
                <p class="text-xs text-tertiary">No chats yet</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Chat Area -->
        <div class="card" style="flex:1;display:flex;flex-direction:column;overflow:hidden;padding:0">
          <!-- Chat header -->
          <div class="card-header" style="padding:var(--space-4) var(--space-5)">
            <div>
              <h3 class="card-title" id="chat-title">New Conversation</h3>
              <div class="text-xs text-tertiary" id="chat-model-label">Select a model to start</div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-ghost btn-xs" onclick="AIAssistant.exportChat()" data-tooltip="Export Chat">📤</button>
              <button class="btn btn-ghost btn-xs" onclick="AIAssistant.clearChat()" data-tooltip="Clear Chat">🗑️</button>
            </div>
          </div>

          <!-- Messages -->
          <div id="chat-messages" style="flex:1;overflow-y:auto;padding:var(--space-5);display:flex;flex-direction:column;gap:var(--space-4)">
            <div class="empty-state" id="chat-empty-state">
              <div style="font-size:48px">🤖</div>
              <h3 class="empty-state-title">DevForge AI Assistant</h3>
              <p class="empty-state-desc">Ask me anything — code, concepts, debugging, or just chat. I support local Ollama models and cloud APIs.</p>
              <div class="grid-2" style="margin-top:var(--space-4);gap:var(--space-2)">
                ${['Explain async/await in JavaScript', 'Write a Python FastAPI endpoint', 'Debug this: TypeError: undefined', 'What is RAG in AI?'].map(q => `
                  <div class="glass-card" style="padding:var(--space-3);cursor:pointer;font-size:var(--text-sm);color:var(--text-secondary)"
                       onclick="AIAssistant.sendSuggestion('${q}')">
                    "${q}"
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div style="padding:var(--space-4) var(--space-5);border-top:1px solid var(--border)">
            <div class="form-input-group" style="border-radius:var(--radius-xl)">
              <textarea
                id="chat-input"
                class="form-input"
                placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
                rows="1"
                style="border-radius:var(--radius-xl) 0 0 var(--radius-xl);resize:none;max-height:120px;min-height:44px;line-height:1.5;padding:12px 16px"
              ></textarea>
              <button class="btn-icon" id="voice-input-btn" onclick="AIAssistant.toggleVoice()" data-tooltip="Voice Input" style="width:44px;border-radius:0;border:none">🎙️</button>
              <button class="btn btn-primary" id="send-btn" onclick="AIAssistant.sendMessage()" style="border-radius:0 var(--radius-xl) var(--radius-xl) 0;padding:0 20px">
                Send ↗
              </button>
            </div>
            <div class="flex items-center gap-3" style="margin-top:var(--space-2)">
              <div class="text-xs text-tertiary">Enter to send · Shift+Enter for new line</div>
              <div id="ai-thinking" class="ai-thinking" style="display:none">AI is thinking...</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    this.setupKeyboard();
    await this.loadHistory();
    this.autoResizeTextarea();
  },

  setupKeyboard() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    input.addEventListener('input', () => this.autoResizeInput(input));
  },

  autoResizeInput(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  },

  autoResizeTextarea() {
    const input = document.getElementById('chat-input');
    if (input) this.autoResizeInput(input);
  },

  async loadHistory() {
    try {
      const res = await API.chat({ action: 'history' });
    } catch {}
  },

  newChat() {
    this.chatId  = null;
    this.history = [];
    document.getElementById('chat-messages').innerHTML = document.getElementById('chat-empty-state')?.outerHTML || '';
    document.getElementById('chat-title').textContent   = 'New Conversation';
    document.getElementById('chat-input').value         = '';
    document.getElementById('chat-input').style.height  = '';
  },

  async sendMessage() {
    if (this.isStreaming) return;
    const input   = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    // Hide empty state
    document.getElementById('chat-empty-state')?.remove();

    input.value = '';
    input.style.height = '';

    // Add user message to UI
    this.appendMessage('user', message);
    this.history.push({ role: 'user', content: message });

    // Parse model selection
    const modelSel = document.getElementById('ai-model-select')?.value || 'ollama:llama3.2';
    const [provider, model] = modelSel.split(':');

    // Show thinking indicator
    document.getElementById('ai-thinking').style.display = 'flex';
    this.isStreaming = true;
    document.getElementById('send-btn').disabled = true;

    // Create AI message placeholder
    const msgId = 'ai-msg-' + Date.now();
    this.appendMessage('assistant', '', msgId);

    try {
      const res = await API.post('/PHP/project-2/api/chat.php', {
        message,
        chat_id:  this.chatId || undefined,
        history:  this.history.slice(-20),
        provider,
        model,
        stream:   false,
      });

      if (res.success) {
        const el = document.getElementById(msgId);
        if (el) {
          el.innerHTML = Utils.renderMarkdown(res.data.response);
          el.querySelectorAll('pre code').forEach(block => {
            if (typeof hljs !== 'undefined') hljs.highlightElement(block);
          });
        }
        this.history.push({ role: 'assistant', content: res.data.response });
        this.chatId = res.data.chat_id;
        document.getElementById('chat-title').textContent = message.substring(0, 40) + (message.length > 40 ? '...' : '');
      } else {
        document.getElementById(msgId)?.remove();
        Toast.error('AI Error', res.error || 'Failed to get response');
      }
    } catch (err) {
      document.getElementById(msgId)?.remove();
      Toast.error('Connection Error', err.message);
    } finally {
      this.isStreaming = false;
      document.getElementById('send-btn').disabled = false;
      document.getElementById('ai-thinking').style.display = 'none';
    }

    this.scrollToBottom();
  },

  sendSuggestion(text) {
    const input = document.getElementById('chat-input');
    if (input) { input.value = text; this.sendMessage(); }
  },

  appendMessage(role, content, id) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const isUser = role === 'user';
    const div = document.createElement('div');
    div.style.cssText = `display:flex;gap:var(--space-3);${isUser ? 'flex-direction:row-reverse' : ''}`;

    const avatar = `
      <div style="width:32px;height:32px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;
                  background:${isUser ? 'var(--accent-gradient)' : 'linear-gradient(135deg,#7B2FBE,#00D4FF)'};
                  box-shadow:0 2px 8px rgba(0,212,255,0.2)">
        ${isUser ? '👤' : '🤖'}
      </div>
    `;

    const bubble = `
      <div ${id ? `id="${id}"` : ''}
           class="selectable"
           style="max-width:75%;padding:var(--space-3) var(--space-4);border-radius:${isUser ? 'var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)' : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)'};
                  background:${isUser ? 'var(--accent-dim)' : 'var(--glass-bg)'};
                  border:1px solid ${isUser ? 'var(--border-accent)' : 'var(--glass-border)'};
                  font-size:var(--text-sm);line-height:1.7;
                  ${content ? '' : 'min-width:60px;min-height:40px'}">
        ${content ? Utils.renderMarkdown(content) : '<div class="loading-dots"><span></span><span></span><span></span></div>'}
      </div>
    `;

    div.innerHTML = `${avatar}${bubble}`;
    container.appendChild(div);
    this.scrollToBottom();
  },

  scrollToBottom() {
    const c = document.getElementById('chat-messages');
    if (c) c.scrollTop = c.scrollHeight;
  },

  clearChat() {
    this.newChat();
    Toast.info('Chat Cleared', 'Started a new conversation');
  },

  exportChat() {
    if (!this.history.length) return Toast.warning('Nothing to export', 'Chat is empty');
    const md = this.history.map(m => `**${m.role === 'user' ? 'You' : 'AI'}:** ${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chat-${Date.now()}.md`;
    a.click();
    Toast.success('Exported!', 'Chat saved as Markdown');
  },

  setModel(val) {
    const [provider, model] = val.split(':');
    document.getElementById('chat-model-label').textContent = `${provider} › ${model}`;
  },

  toggleVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      Toast.error('Not Supported', 'Voice input requires Chrome/Edge');
      return;
    }
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
      document.getElementById('voice-input-btn').textContent = '🎙️';
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SR();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false;
    this.recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      const input = document.getElementById('chat-input');
      if (input) input.value = text;
    };
    this.recognition.onend = () => {
      this.recognition = null;
      document.getElementById('voice-input-btn').textContent = '🎙️';
    };
    this.recognition.start();
    document.getElementById('voice-input-btn').textContent = '🔴';
  },

  destroy() {
    if (this.recognition) this.recognition.stop();
  },
};

export default AIAssistant;

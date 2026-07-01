/**
 * DevForge AI – Voice Assistant Module
 */
'use strict';

const VoiceAssistant = {
  recognition: null, isListening: false,

  async render() {
    return `
      <div class="module-header">
        <h1 class="title gradient-text">🎙️ Voice Assistant</h1>
        <p class="subtitle">Hands-free AI interaction with speech recognition and text-to-speech</p>
      </div>
      <div style="text-align:center;padding:var(--space-16) var(--space-8)">
        <div class="waveform" id="waveform" style="justify-content:center;margin-bottom:var(--space-8);opacity:0.3">
          ${Array(12).fill('<div class="waveform-bar" style="height:8px"></div>').join('')}
        </div>
        <button id="voice-main-btn" class="btn btn-primary btn-xl" onclick="VoiceAssistant.toggle()" style="border-radius:50%;width:100px;height:100px;font-size:36px;margin-bottom:var(--space-6)">🎙️</button>
        <p class="text-tertiary text-sm" id="voice-status">Click to start listening</p>
        <div id="voice-transcript" class="card" style="max-width:600px;margin:var(--space-6) auto;display:none">
          <div id="voice-text" class="text-base"></div>
        </div>
        <div id="voice-response" class="card" style="max-width:600px;margin:var(--space-4) auto;display:none">
          <div id="voice-response-text" class="text-sm selectable"></div>
        </div>
      </div>
    `;
  },

  async init() {},

  toggle() {
    this.isListening ? this.stop() : this.start();
  },

  start() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      Toast.error('Not Supported', 'Voice input requires Chrome or Edge');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SR();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.onstart = () => {
      this.isListening = true;
      document.getElementById('voice-main-btn').textContent = '🔴';
      document.getElementById('voice-status').textContent = 'Listening...';
      document.getElementById('waveform').style.opacity = '1';
    };
    this.recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      this.showTranscript(text);
      this.processCommand(text);
    };
    this.recognition.onend = () => { this.isListening = false; document.getElementById('voice-main-btn').textContent = '🎙️'; document.getElementById('voice-status').textContent = 'Click to start'; document.getElementById('waveform').style.opacity = '0.3'; };
    this.recognition.start();
  },

  stop() { this.recognition?.stop(); },

  showTranscript(text) {
    const el = document.getElementById('voice-transcript');
    if (el) { el.style.display = ''; document.getElementById('voice-text').textContent = `"${text}"`; }
  },

  async processCommand(text) {
    const lc = text.toLowerCase();
    if (lc.includes('navigate to') || lc.includes('go to') || lc.includes('open')) {
      const moduleMap = { 'ai assistant': 'ai-assistant', 'dashboard': 'dashboard', 'settings': 'settings', 'vault': 'vault', 'git': 'git-dashboard' };
      for (const [name, id] of Object.entries(moduleMap)) {
        if (lc.includes(name)) { App.navigate(id); this.speak(`Navigating to ${name}`); return; }
      }
    }
    // AI response
    try {
      const res = await API.post('/PHP/project-2/api/chat.php', { message: text, provider: 'ollama', model: 'llama3.2', history: [] });
      if (res.success) { this.showResponse(res.data.response); this.speak(res.data.response.substring(0, 500)); }
    } catch {}
  },

  showResponse(text) {
    const el = document.getElementById('voice-response');
    if (el) { el.style.display = ''; document.getElementById('voice-response-text').innerHTML = Utils.renderMarkdown(text); }
  },

  speak(text) {
    if (!window.speechSynthesis) return;
    const utt = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, ''));
    utt.rate = 1; utt.pitch = 1;
    window.speechSynthesis.speak(utt);
  },

  destroy() { this.recognition?.stop(); window.speechSynthesis?.cancel(); },
};

export default VoiceAssistant;

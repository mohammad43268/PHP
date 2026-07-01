/**
 * DevForge AI – Application Bootstrap & Module Router
 * Core app engine: state management, routing, theme, keyboard shortcuts, toasts
 */

"use strict";

// ─── App State ────────────────────────────────────────────────────────────────
const AppState = {
  currentModule: "dashboard",
  theme: "dark",
  sidebarCollapsed: false,
  settings: {},
  user: { name: "Developer", avatar: "D" },
  notifications: [],
  modules: {},
  pyServiceOnline: false,
};

// ─── Module Registry ──────────────────────────────────────────────────────────
const MODULES = {
  dashboard: { label: "Dashboard", icon: "⚡", file: "dev-dashboard" },
  "ai-assistant": { label: "AI Assistant", icon: "🤖", file: "ai-assistant" },
  "ai-coding": { label: "AI Coding", icon: "💻", file: "ai-coding" },
  "api-studio": { label: "API Studio", icon: "🔌", file: "api-studio" },
  "web-analyzer": {
    label: "Web Analyzer",
    icon: "🌐",
    file: "website-analyzer",
  },
  "pdf-toolkit": { label: "PDF Toolkit", icon: "📄", file: "pdf-toolkit" },
  vault: { label: "Secure Vault", icon: "🔐", file: "vault" },
  "file-sharing": { label: "File Sharing", icon: "🔗", file: "file-sharing" },
  portfolio: { label: "Portfolio", icon: "🎨", file: "portfolio" },
  "doc-studio": { label: "Doc Studio", icon: "📚", file: "document-studio" },
  voice: { label: "Voice Assistant", icon: "🎙️", file: "voice-assistant" },
  "file-explorer": {
    label: "File Explorer",
    icon: "📁",
    file: "file-explorer",
  },
  "git-dashboard": {
    label: "Git Dashboard",
    icon: "🌿",
    file: "git-dashboard",
  },
  "image-studio": { label: "Image Studio", icon: "🖼️", file: "image-studio" },
  settings: { label: "Settings", icon: "⚙️", file: "settings" },
};

// ─── Command Palette Registry ─────────────────────────────────────────────────
const COMMANDS = [
  {
    id: "nav-dashboard",
    title: "Go to Dashboard",
    desc: "Developer metrics",
    icon: "⚡",
    action: () => App.navigate("dashboard"),
    group: "Navigation",
  },
  {
    id: "nav-ai",
    title: "Open AI Assistant",
    desc: "Chat with AI",
    icon: "🤖",
    action: () => App.navigate("ai-assistant"),
    group: "Navigation",
  },
  {
    id: "nav-coding",
    title: "AI Coding Assistant",
    desc: "Code tools",
    icon: "💻",
    action: () => App.navigate("ai-coding"),
    group: "Navigation",
  },
  {
    id: "nav-api",
    title: "API Testing Studio",
    desc: "Test APIs",
    icon: "🔌",
    action: () => App.navigate("api-studio"),
    group: "Navigation",
  },
  {
    id: "nav-seo",
    title: "Website Analyzer",
    desc: "SEO & analysis",
    icon: "🌐",
    action: () => App.navigate("web-analyzer"),
    group: "Navigation",
  },
  {
    id: "nav-pdf",
    title: "PDF Toolkit",
    desc: "PDF tools",
    icon: "📄",
    action: () => App.navigate("pdf-toolkit"),
    group: "Navigation",
  },
  {
    id: "nav-vault",
    title: "Secure File Vault",
    desc: "Encrypted files",
    icon: "🔐",
    action: () => App.navigate("vault"),
    group: "Navigation",
  },
  {
    id: "nav-share",
    title: "File Sharing",
    desc: "Share links",
    icon: "🔗",
    action: () => App.navigate("file-sharing"),
    group: "Navigation",
  },
  {
    id: "nav-portfolio",
    title: "Portfolio Generator",
    desc: "Build portfolio",
    icon: "🎨",
    action: () => App.navigate("portfolio"),
    group: "Navigation",
  },
  {
    id: "nav-docs",
    title: "Document Studio",
    desc: "AI document tools",
    icon: "📚",
    action: () => App.navigate("doc-studio"),
    group: "Navigation",
  },
  {
    id: "nav-voice",
    title: "Voice Assistant",
    desc: "Voice commands",
    icon: "🎙️",
    action: () => App.navigate("voice"),
    group: "Navigation",
  },
  {
    id: "nav-explorer",
    title: "Smart File Explorer",
    desc: "AI file search",
    icon: "📁",
    action: () => App.navigate("file-explorer"),
    group: "Navigation",
  },
  {
    id: "nav-git",
    title: "Git Dashboard",
    desc: "Version control",
    icon: "🌿",
    action: () => App.navigate("git-dashboard"),
    group: "Navigation",
  },
  {
    id: "nav-image",
    title: "AI Image Studio",
    desc: "Image AI tools",
    icon: "🖼️",
    action: () => App.navigate("image-studio"),
    group: "Navigation",
  },
  {
    id: "nav-settings",
    title: "Settings",
    desc: "Configure DevForge",
    icon: "⚙️",
    action: () => App.navigate("settings"),
    group: "Navigation",
  },
  {
    id: "toggle-theme",
    title: "Toggle Theme",
    desc: "Dark / Light",
    icon: "🌙",
    action: () => App.toggleTheme(),
    group: "Actions",
    shortcut: "Ctrl+Shift+T",
  },
  {
    id: "toggle-sidebar",
    title: "Toggle Sidebar",
    desc: "Collapse sidebar",
    icon: "📐",
    action: () => App.toggleSidebar(),
    group: "Actions",
    shortcut: "Ctrl+\\",
  },
  {
    id: "reload",
    title: "Reload Module",
    desc: "Refresh current view",
    icon: "🔄",
    action: () => App.reload(),
    group: "Actions",
  },
];

// ─── Main App Object ──────────────────────────────────────────────────────────
const App = {
  /** Bootstrap the application */
  async init() {
    // Load settings from server
    try {
      const res = await API.getSettings();
      if (res.success) AppState.settings = res.data;
    } catch { }

    // Apply saved theme
    AppState.theme = AppState.settings?.theme || "dark";
    document.documentElement.setAttribute("data-theme", AppState.theme);

    // Apply sidebar state
    AppState.sidebarCollapsed = AppState.settings?.sidebar_collapsed ?? false;
    if (AppState.sidebarCollapsed) {
      document.getElementById("sidebar")?.classList.add("collapsed");
    }

    // Boot UI subsystems
    UI.init();
    CommandPalette.init();
    Keyboard.init();
    Toast.init();

    // Check Python service health
    this.checkPyService();

    // Navigate to module from hash or default
    const hash = window.location.hash.replace("#", "") || "dashboard";
    this.navigate(hash, false);

    // Update status bar
    this.updateStatusBar();

    console.log(
      "%cDevForge AI v1.0.0 loaded ⚡",
      "color: #00D4FF; font-weight: bold; font-size: 14px;",
    );
  },

  /** Navigate to a module */
  async navigate(moduleId, pushState = true) {
    if (!MODULES[moduleId]) moduleId = "dashboard";

    // Update URL hash
    if (pushState) history.pushState(null, "", `#${moduleId}`);

    // Update sidebar active state
    document.querySelectorAll(".nav-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.module === moduleId);
    });

    AppState.currentModule = moduleId;

    // Load module
    const contentArea = document.getElementById("content-area");
    if (!contentArea) return;

    // Show skeleton loader
    contentArea.innerHTML = this.skeletonLoader();

    try {
      // Dynamically import module
      const moduleName = MODULES[moduleId].file;
      if (!AppState.modules[moduleId]) {
        const mod = await import(`/frontend/assets/js/modules/${moduleName}.js`);
        AppState.modules[moduleId] = mod.default || mod;
      }
      const module = AppState.modules[moduleId];

      // Render module
      const html = await module.render();
      contentArea.innerHTML = `<div class="page-enter">${html}</div>`;

      // Initialize module
      if (module.init) await module.init();
    } catch (err) {
      console.error(`Module ${moduleId} failed:`, err);
      contentArea.innerHTML = this.errorState(moduleId, err.message);
    }
  },

  /** Reload current module */
  reload() {
    delete AppState.modules[AppState.currentModule];
    this.navigate(AppState.currentModule, false);
  },

  /** Toggle dark/light theme */
  toggleTheme() {
    AppState.theme = AppState.theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", AppState.theme);
    API.saveSettings({ theme: AppState.theme });
    Toast.show(
      "success",
      "Theme Changed",
      `Switched to ${AppState.theme} mode`,
    );
  },

  /** Toggle sidebar collapsed state */
  toggleSidebar() {
    AppState.sidebarCollapsed = !AppState.sidebarCollapsed;
    document
      .getElementById("sidebar")
      ?.classList.toggle("collapsed", AppState.sidebarCollapsed);
    API.saveSettings({ sidebar_collapsed: AppState.sidebarCollapsed });
  },

  /** Check if Python FastAPI service is running */
  async checkPyService() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch("http://127.0.0.1:8765/health", {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      AppState.pyServiceOnline = res.ok;
    } catch {
      AppState.pyServiceOnline = false;
    }
    this.updateStatusBar();
  },

  /** Update status bar with current app state */
  updateStatusBar() {
    const pyDot = document.getElementById("py-status-dot");
    const pyLabel = document.getElementById("py-status-label");
    if (pyDot && pyLabel) {
      pyDot.className = `status-dot ${AppState.pyServiceOnline ? "online" : "error"}`;
      pyLabel.textContent = AppState.pyServiceOnline
        ? "AI Online"
        : "AI Offline";
    }
  },

  /** Skeleton loader HTML */
  skeletonLoader() {
    return `
      <div class="module-container">
        <div class="module-header">
          <div class="skeleton" style="width:200px;height:32px;margin-bottom:8px"></div>
          <div class="skeleton" style="width:300px;height:16px"></div>
        </div>
        <div class="grid-3" style="margin-bottom:24px">
          ${'<div class="skeleton" style="height:100px;border-radius:8px"></div>'.repeat(3)}
        </div>
        <div class="skeleton" style="height:400px;border-radius:8px"></div>
      </div>
    `;
  },

  /** Error state HTML */
  errorState(moduleId, msg) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">Module Failed to Load</h3>
        <p class="empty-state-desc">Could not load <strong>${moduleId}</strong>. ${msg}</p>
        <button class="btn btn-secondary" onclick="App.reload()">Try Again</button>
      </div>
    `;
  },
};

// ─── Toast Notification System ────────────────────────────────────────────────
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById("toast-container");
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      document.body.appendChild(this.container);
    }
  },

  show(type, title, message = "", duration = 4000) {
    const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ""}
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    this.container.appendChild(toast);

    // Auto dismiss
    setTimeout(() => {
      toast.classList.add("exiting");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(title, msg) {
    this.show("success", title, msg);
  },
  error(title, msg) {
    this.show("error", title, msg);
  },
  warning(title, msg) {
    this.show("warning", title, msg);
  },
  info(title, msg) {
    this.show("info", title, msg);
  },
};

// ─── Command Palette ──────────────────────────────────────────────────────────
const CommandPalette = {
  el: null,
  input: null,
  results: null,
  selectedIndex: 0,
  filteredCommands: [],
  isOpen: false,

  init() {
    this.el = document.getElementById("command-palette");
    this.input = document.getElementById("command-input");
    this.results = document.getElementById("command-results");
    if (!this.el) return;

    this.el.addEventListener("click", (e) => {
      if (e.target === this.el) this.close();
    });

    this.input?.addEventListener("input", () => this.search(this.input.value));
    this.input?.addEventListener("keydown", (e) => this.handleKey(e));
  },

  open() {
    if (!this.el) return;
    this.el.classList.remove("hidden");
    this.input?.focus();
    this.input.value = "";
    this.search("");
    this.isOpen = true;
  },

  close() {
    this.el?.classList.add("hidden");
    this.isOpen = false;
  },

  toggle() {
    this.isOpen ? this.close() : this.open();
  },

  search(query) {
    query = query.toLowerCase().trim();
    this.filteredCommands = COMMANDS.filter(
      (c) =>
        !query ||
        c.title.toLowerCase().includes(query) ||
        c.desc?.toLowerCase().includes(query) ||
        c.group?.toLowerCase().includes(query),
    );
    this.selectedIndex = 0;
    this.render();
  },

  render() {
    if (!this.results) return;
    const groups = {};
    this.filteredCommands.forEach((cmd) => {
      (groups[cmd.group] ||= []).push(cmd);
    });

    this.results.innerHTML =
      Object.entries(groups)
        .map(
          ([group, cmds]) => `
      <div class="command-group">
        <div class="command-group-label">${group}</div>
        ${cmds
              .map(
                (cmd, i) => `
          <div class="command-item ${i === this.selectedIndex ? "selected" : ""}"
               data-id="${cmd.id}"
               onclick="CommandPalette.execute('${cmd.id}')">
            <div class="command-item-icon">${cmd.icon}</div>
            <div class="command-item-text">
              <div class="command-item-title">${cmd.title}</div>
              ${cmd.desc ? `<div class="command-item-desc">${cmd.desc}</div>` : ""}
            </div>
            ${cmd.shortcut ? `<div class="command-item-shortcut">${cmd.shortcut}</div>` : ""}
          </div>
        `,
              )
              .join("")}
      </div>
    `,
        )
        .join("") ||
      '<div class="empty-state" style="padding:2rem"><p>No commands found</p></div>';
  },

  execute(id) {
    const cmd = COMMANDS.find((c) => c.id === id);
    if (cmd) {
      this.close();
      setTimeout(() => cmd.action(), 100);
    }
  },

  handleKey(e) {
    if (e.key === "ArrowDown") {
      this.selectedIndex = Math.min(
        this.selectedIndex + 1,
        this.filteredCommands.length - 1,
      );
      this.render();
    } else if (e.key === "ArrowUp") {
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      this.render();
    } else if (e.key === "Enter") {
      const cmd = this.filteredCommands[this.selectedIndex];
      if (cmd) this.execute(cmd.id);
    } else if (e.key === "Escape") {
      this.close();
    }
  },
};

// ─── Global Keyboard Shortcuts ────────────────────────────────────────────────
const Keyboard = {
  shortcuts: new Map(),

  init() {
    document.addEventListener("keydown", (e) => this.handle(e));

    // Register defaults
    this.register("ctrl+k", () => CommandPalette.toggle());
    this.register("ctrl+\\", () => App.toggleSidebar());
    this.register("ctrl+shift+t", () => App.toggleTheme());
    this.register("ctrl+shift+d", () => App.navigate("dashboard"));
    this.register("ctrl+shift+a", () => App.navigate("ai-assistant"));
    this.register("escape", () => {
      CommandPalette.close();
      this.closeAllModals();
    });
  },

  register(shortcut, fn) {
    this.shortcuts.set(shortcut.toLowerCase(), fn);
  },

  handle(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push("ctrl");
    if (e.altKey) parts.push("alt");
    if (e.shiftKey) parts.push("shift");
    parts.push(e.key.toLowerCase());
    const key = parts.join("+");

    const fn = this.shortcuts.get(key);
    if (fn) {
      // Don't intercept if typing in inputs (unless Escape or Ctrl shortcuts)
      const tag = document.activeElement?.tagName;
      if (
        (tag === "INPUT" || tag === "TEXTAREA") &&
        !e.ctrlKey &&
        !e.metaKey &&
        key !== "escape"
      )
        return;
      e.preventDefault();
      fn(e);
    }
  },

  closeAllModals() {
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
  },
};

// ─── Theme Manager ────────────────────────────────────────────────────────────
const Theme = {
  themes: ["dark", "light", "hacker", "ocean", "sunset"],
  current: "dark",

  apply(name) {
    document.documentElement.setAttribute("data-theme", name);
    this.current = name;
    AppState.theme = name;
    localStorage.setItem("devforge-theme", name);
  },

  init() {
    const saved = localStorage.getItem("devforge-theme") || "dark";
    this.apply(saved);
  },
};

// ─── Utility: Format helpers ──────────────────────────────────────────────────
const Utils = {
  formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  },

  formatDate(ts) {
    return new Date(ts * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  timeAgo(ts) {
    const diff = Date.now() / 1000 - ts;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  },

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        Toast.success("Copied!", "Text copied to clipboard");
      })
      .catch(() => {
        Toast.error("Failed", "Could not copy to clipboard");
      });
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  },

  throttle(fn, ms) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn(...args);
      }
    };
  },

  /** Add ripple effect to button */
  addRipple(btn) {
    btn.addEventListener("click", function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple-effect";
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
      this.classList.add("ripple-container");
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  },

  /** Render markdown with highlight.js */
  renderMarkdown(text) {
    if (typeof marked !== "undefined") {
      marked.setOptions({
        highlight: (code, lang) => {
          if (hljs && lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          }
          return hljs ? hljs.highlightAuto(code).value : code;
        },
        breaks: true,
        gfm: true,
      });
      return marked.parse(text);
    }
    return text.replace(/\n/g, "<br>");
  },
};

// ─── Global Modal Helper ──────────────────────────────────────────────────────
function showModal(title, bodyHTML, footerHTML = "") {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">✕</button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ""}
    </div>
  `;
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.remove();
  });
  document.body.appendChild(backdrop);
  return backdrop;
}

// ─── Expose globals ───────────────────────────────────────────────────────────
window.App = App;
window.Toast = Toast;
window.CommandPalette = CommandPalette;
window.Keyboard = Keyboard;
window.Utils = Utils;
window.showModal = showModal;
window.AppState = AppState;
window.MODULES = MODULES;

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => App.init());

// Handle browser back/forward
window.addEventListener("popstate", () => {
  const hash = window.location.hash.replace("#", "") || "dashboard";
  App.navigate(hash, false);
});

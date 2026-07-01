/**
 * DevForge AI – API Client
 * Typed wrapper for all PHP backend API calls with CSRF, error handling, retry
 */

"use strict";

const API = (() => {
  let csrfToken = null;

  // Get CSRF token from meta tag
  function getCsrf() {
    if (csrfToken) return csrfToken;
    csrfToken =
      document.querySelector('meta[name="csrf-token"]')?.content || "";
    return csrfToken;
  }

  // Base fetch with error handling
  async function request(method, url, data = null, options = {}) {
    const headers = {
      "X-CSRF-Token": getCsrf(),
      "X-Requested-With": "XMLHttpRequest",
    };

    if (!(data instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const config = {
      method,
      headers,
      credentials: "same-origin",
      signal: options.signal,
    };

    if (data !== null) {
      config.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    try {
      const res = await fetch(url, config);
      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        const error = contentType.includes("json")
          ? (await res.json()).error || `HTTP ${res.status}`
          : `HTTP ${res.status}`;
        throw new Error(error);
      }

      if (contentType.includes("json")) {
        return await res.json();
      }
      return await res.text();
    } catch (err) {
      if (err.name === "AbortError") throw err;
      console.error(`API ${method} ${url}:`, err.message);
      throw err;
    }
  }

  // Streaming fetch (for AI responses)
  async function stream(url, data, onChunk, onDone, onError) {
    const controller = new AbortController();

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrf(),
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(data),
        signal: controller.signal,
        credentials: "same-origin",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") {
              onDone?.();
              return controller;
            }
            try {
              const parsed = JSON.parse(raw);
              onChunk?.(parsed.content || parsed.text || parsed);
            } catch {
              onChunk?.(raw);
            }
          }
        }
      }
      onDone?.();
    } catch (err) {
      if (err.name !== "AbortError") onError?.(err);
    }

    return controller;
  }

  return {
    get: (url, opts) => request("GET", url, null, opts),
    post: (url, data, opts) => request("POST", url, data, opts),
    put: (url, data, opts) => request("PUT", url, data, opts),
    patch: (url, data, opts) => request("PATCH", url, data, opts),
    delete: (url, opts) => request("DELETE", url, null, opts),
    upload: (url, formData, opts) => request("POST", url, formData, opts),
    stream,

    // ── Convenience wrappers ────────────────────────────────────────────────

    // Chat
    chat: (data) => request("POST", "/api/chat.php", data),
    chatStream: (data, ...args) =>
      stream("/api/chat.php", data, ...args),

    // Settings
    getSettings: () => request("GET", "/api/settings.php"),
    saveSettings: (data) =>
      request("POST", "/api/settings.php", data),

    // Files
    uploadFile: (fd) => request("POST", "/api/files.php", fd),
    getFiles: () => request("GET", "/api/files.php"),
    deleteFile: (id) =>
      request("DELETE", `/api/files.php?id=${id}`),

    // Vault
    vaultUpload: (fd) => request("POST", "/api/vault.php", fd),
    getVault: () => request("GET", "/api/vault.php"),

    // SEO
    analyzeSeo: (url) => request("POST", "/api/seo.php", { url }),

    // API Studio
    proxyRequest: (data) =>
      request("POST", "/api/proxy.php", data),

    // Git
    getGitLog: (path) =>
      request("POST", "/api/git.php", { path, action: "log" }),
    getGitDiff: (path, hash) =>
      request("POST", "/api/git.php", {
        path,
        hash,
        action: "diff",
      }),

    // System
    getSystemInfo: () => request("GET", "/api/system.php"),

    // File sharing
    createShare: (data) =>
      request("POST", "/api/sharing.php", data),
    getShares: () => request("GET", "/api/sharing.php"),
    deleteShare: (id) =>
      request("DELETE", `/api/sharing.php?id=${id}`),

    // Portfolio
    savePortfolio: (data) =>
      request("POST", "/api/portfolio.php", data),
    getPortfolio: () => request("GET", "/api/portfolio.php"),

    // Python AI proxy (via PHP gateway)
    aiOcr: (fd) =>
      request("POST", "/api/ai-proxy.php?service=ocr", fd),
    aiCaption: (fd) =>
      request("POST", "/api/ai-proxy.php?service=caption", fd),
    aiDocument: (fd) =>
      request("POST", "/api/ai-proxy.php?service=document", fd),
    aiWhisper: (fd) =>
      request("POST", "/api/ai-proxy.php?service=whisper", fd),
  };
})();

// Expose globally
window.API = API;

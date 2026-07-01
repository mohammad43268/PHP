<?php
/**
 * DevForge AI – Main Application Shell
 */
declare(strict_types=1);
require_once __DIR__ . '/config/app.php';
$settings = loadSettings();
$theme = $settings['theme'] ?? 'dark';
?>
<!DOCTYPE html>
<html lang="en" data-theme="<?= htmlspecialchars($theme) ?>">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= APP_NAME ?></title>

  <!-- PWA & SEO -->
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#000000">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23000'/><text y='70' x='20' font-size='70'>⚡</text></svg>">

  <!-- Core CSS -->
  <link rel="stylesheet" href="/frontend/assets/css/main.css">
  <link rel="stylesheet" href="/frontend/assets/css/animations.css">
  <link rel="stylesheet" href="/frontend/assets/css/components.css">
  <link rel="stylesheet" href="/frontend/assets/css/layout.css">

  <!-- Highlight.js for code -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" id="hljs-theme">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <!-- JS App -->
  <script src="/frontend/assets/js/api.js"></script>
  <script src="/frontend/assets/js/ui.js"></script>
  <script type="module" src="/frontend/assets/js/app.js"></script>
</head>
<body>
  <div id="app">
    <!-- Slim Rail Sidebar -->
    <aside id="sidebar">
      <div class="sidebar-logo" onclick="App.navigate('dashboard')">
        <div class="logo-icon">⚡</div>
        <div class="logo-text">DevForge</div>
      </div>
      <nav class="sidebar-nav" id="sidebar-nav">
        <!-- Rendered by ui.js -->
      </nav>
      <div class="sidebar-footer">
        <div class="nav-item" onclick="App.toggleTheme()" data-label="Toggle Theme">
          <span class="nav-item-icon">🌗</span>
        </div>
        <div class="nav-item" onclick="App.navigate('settings')" data-label="Settings">
          <span class="nav-item-icon">⚙️</span>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main id="main-area">
      <!-- Container for module content -->
      <div id="content-area">
        <!-- Module injected here via JS -->
      </div>
    </main>

    <!-- Floating Command Palette -->
    <div id="cmd-palette-backdrop">
      <div id="cmd-palette">
        <div class="cmd-input-wrap">
          <span style="color: var(--text-tertiary); margin-right: var(--space-2);">🔍</span>
          <input type="text" id="cmd-input" placeholder="Search commands, modules, or files... (Cmd+K)" autocomplete="off" spellcheck="false">
          <span class="cmd-shortcut">ESC</span>
        </div>
        <div class="cmd-list" id="cmd-results">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>

    <!-- Notification Container -->
    <div id="toast-container" style="position:fixed;bottom:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;"></div>
  </div>

  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  </script>
</body>
</html>

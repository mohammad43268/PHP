<?php
/**
 * DevForge AI – System Info API
 * Returns CPU, RAM, disk, PHP version, service statuses
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/helpers.php';

requireGet();

// ── PHP version ───────────────────────────────────────────────────────────────
$phpVersion = PHP_VERSION;

// ── Disk usage ────────────────────────────────────────────────────────────────
$diskTotal = disk_total_space(__DIR__);
$diskFree  = disk_free_space(__DIR__);
$diskUsed  = $diskTotal - $diskFree;
$diskPct   = $diskTotal > 0 ? round(($diskUsed / $diskTotal) * 100, 1) : 0;

// ── Memory usage ──────────────────────────────────────────────────────────────
$memUsed  = memory_get_usage(true);
$memPeak  = memory_get_peak_usage(true);
$memLimit = ini_get('memory_limit');

// ── System load (Unix only) ───────────────────────────────────────────────────
$load = function_exists('sys_getloadavg') ? sys_getloadavg() : [0, 0, 0];

// ── Storage stats ─────────────────────────────────────────────────────────────
$storageStats = [
    'vault_files'   => Storage::count('vault', 'files'),
    'shared_files'  => Storage::count('files', 'files'),
    'chat_sessions' => Storage::count('chat-history', 'chats'),
    'api_requests'  => Storage::count('api-history', 'requests'),
    'seo_analyses'  => Storage::count('seo-history', 'analyses'),
];

// ── Check Python service ───────────────────────────────────────────────────────
$pythonOnline = false;
$ctx = stream_context_create(['http' => ['timeout' => 2, 'ignore_errors' => true]]);
$pyRes = @file_get_contents(PYTHON_URL . '/health', false, $ctx);
if ($pyRes !== false) {
    $pyData = json_decode($pyRes, true);
    $pythonOnline = ($pyData['status'] ?? '') === 'ok';
}

// ── Check Ollama ──────────────────────────────────────────────────────────────
$settings      = loadSettings();
$ollamaUrl     = $settings['ai']['ollama_url'] ?? 'http://localhost:11434';
$ollamaOnline  = false;
$ollamaModels  = [];
$ctx2 = stream_context_create(['http' => ['timeout' => 2, 'ignore_errors' => true]]);
$oRes = @file_get_contents($ollamaUrl . '/api/tags', false, $ctx2);
if ($oRes !== false) {
    $oData = json_decode($oRes, true);
    $ollamaOnline = isset($oData['models']);
    $ollamaModels = array_map(fn($m) => $m['name'] ?? '', $oData['models'] ?? []);
}

// ── Upload folder size ────────────────────────────────────────────────────────
function folderSize(string $dir): int {
    $size = 0;
    if (!is_dir($dir)) return 0;
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)) as $f) {
        $size += $f->getSize();
    }
    return $size;
}
$uploadsSize = folderSize(UPLOADS_PATH);
$vaultSize   = folderSize(VAULT_PATH);
$logsSize    = folderSize(LOGS_PATH);

Logger::activity('viewed_system_info', 'dashboard');

apiSuccess([
    'php'      => [
        'version'      => $phpVersion,
        'memory_used'  => $memUsed,
        'memory_peak'  => $memPeak,
        'memory_limit' => $memLimit,
        'extensions'   => array_values(array_intersect(['openssl', 'json', 'mbstring', 'curl', 'gd', 'zip'], get_loaded_extensions())),
    ],
    'disk'     => [
        'total'   => $diskTotal,
        'free'    => $diskFree,
        'used'    => $diskUsed,
        'percent' => $diskPct,
    ],
    'load'     => $load,
    'storage'  => array_merge($storageStats, [
        'uploads_size' => $uploadsSize,
        'vault_size'   => $vaultSize,
        'logs_size'    => $logsSize,
    ]),
    'services' => [
        'python_fastapi' => $pythonOnline,
        'ollama'         => $ollamaOnline,
        'ollama_models'  => $ollamaModels,
        'php_ok'         => true,
        'cpp_bin'        => is_dir(ROOT_PATH . '/backend/cpp/bin'),
    ],
    'uptime'   => time(),
    'os'       => PHP_OS_FAMILY,
]);

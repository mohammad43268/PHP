<?php
/**
 * DevForge AI – Application Configuration & Bootstrap
 * Core constants, autoloader, and environment setup
 */

declare(strict_types=1);

// ─── Version & Identity ───────────────────────────────────────────────────────
define('APP_NAME',    'DevForge AI');
define('APP_VERSION', '1.0.0');
define('APP_BUILD',   '2025.07');

// ─── Paths ────────────────────────────────────────────────────────────────────
define('ROOT_PATH',     dirname(__DIR__));
define('CONFIG_PATH',   ROOT_PATH . '/config');
define('STORAGE_PATH',  ROOT_PATH . '/storage');
define('UPLOADS_PATH',  ROOT_PATH . '/storage/uploads');
define('VAULT_PATH',    ROOT_PATH . '/storage/vault');
define('LOGS_PATH',     ROOT_PATH . '/storage/logs');
define('CACHE_PATH',    ROOT_PATH . '/storage/cache');
define('REPORTS_PATH',  ROOT_PATH . '/storage/reports');
define('GENERATED_PATH',ROOT_PATH . '/storage/generated');
define('BACKEND_PATH',  ROOT_PATH . '/backend/php');
define('PYTHON_URL',    'http://127.0.0.1:8765'); // FastAPI service URL

// ─── Security ────────────────────────────────────────────────────────────────
define('CSRF_TOKEN_LENGTH', 64);
define('SESSION_LIFETIME',  3600 * 8); // 8 hours
define('MAX_UPLOAD_MB',     50);
define('RATE_LIMIT_RPM',    120); // requests per minute

// ─── PHP Settings ─────────────────────────────────────────────────────────────
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', LOGS_PATH . '/php_errors.log');
ini_set('upload_max_filesize', MAX_UPLOAD_MB . 'M');
ini_set('post_max_size', (MAX_UPLOAD_MB + 5) . 'M');
ini_set('max_execution_time', '120');
ini_set('memory_limit', '256M');

// ─── Session Configuration ────────────────────────────────────────────────────
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.gc_maxlifetime', (string)SESSION_LIFETIME);
ini_set('session.cookie_lifetime', (string)SESSION_LIFETIME);

// ─── Timezone ─────────────────────────────────────────────────────────────────
date_default_timezone_set('UTC');

// ─── Autoloader ───────────────────────────────────────────────────────────────
spl_autoload_register(function (string $class): void {
    $map = [
        'Router'      => BACKEND_PATH . '/classes/Router.php',
        'Auth'        => BACKEND_PATH . '/classes/Auth.php',
        'Storage'     => BACKEND_PATH . '/classes/Storage.php',
        'Security'    => BACKEND_PATH . '/classes/Security.php',
        'Logger'      => BACKEND_PATH . '/classes/Logger.php',
        'RateLimiter' => BACKEND_PATH . '/classes/RateLimiter.php',
    ];
    if (isset($map[$class])) {
        require_once $map[$class];
    }
});

// ─── Required Directories ─────────────────────────────────────────────────────
$dirs = [STORAGE_PATH, UPLOADS_PATH, VAULT_PATH, LOGS_PATH, CACHE_PATH, REPORTS_PATH, GENERATED_PATH];
foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// ─── Helper: Load Settings ────────────────────────────────────────────────────
function loadSettings(): array {
    $file = CONFIG_PATH . '/settings.json';
    if (!file_exists($file)) return [];
    $data = json_decode(file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

// ─── Helper: JSON Response ────────────────────────────────────────────────────
function jsonResponse(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// ─── Helper: API Error ───────────────────────────────────────────────────────
function apiError(string $message, int $status = 400): never {
    jsonResponse(['success' => false, 'error' => $message], $status);
}

// ─── Helper: API Success ─────────────────────────────────────────────────────
function apiSuccess(mixed $data = null, string $message = 'OK'): never {
    jsonResponse(['success' => true, 'message' => $message, 'data' => $data]);
}

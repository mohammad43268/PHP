<?php
/**
 * DevForge AI – Bootstrap helper for all API endpoints
 */
declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/config/app.php';
require_once dirname(__DIR__) . '/classes/Storage.php';
require_once dirname(__DIR__) . '/classes/Security.php';
require_once dirname(__DIR__) . '/classes/Logger.php';
require_once dirname(__DIR__) . '/classes/RateLimiter.php';

// Start session
session_name('DEVFORGE_SID');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

Security::setSecureHeaders();
RateLimiter::checkIp();

// Get request method and body
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/**
 * Require POST method
 */
function requirePost(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        apiError('Method not allowed', 405);
    }
}

/**
 * Require GET method
 */
function requireGet(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        apiError('Method not allowed', 405);
    }
}

/**
 * Proxy a request to Python FastAPI
 */
function proxyToPython(string $path, array $data = [], string $method = 'POST'): array {
    $url = PYTHON_URL . $path;
    $ctx = stream_context_create([
        'http' => [
            'method'  => $method,
            'header'  => "Content-Type: application/json\r\nAccept: application/json",
            'content' => json_encode($data),
            'timeout' => 30,
            'ignore_errors' => true,
        ],
    ]);

    $res = @file_get_contents($url, false, $ctx);
    if ($res === false) {
        return ['success' => false, 'error' => 'AI service unavailable. Start the Python FastAPI server.'];
    }

    $decoded = json_decode($res, true);
    return is_array($decoded) ? $decoded : ['success' => false, 'error' => 'Invalid response from AI service'];
}

/**
 * Proxy a multipart file to Python FastAPI
 */
function proxyFileToPython(string $path, string $fileKey, string $tmpFile, string $filename, array $extra = []): array {
    $url  = PYTHON_URL . $path;
    $boundary = '----DevForgeBoundary' . uniqid();
    $body = '';

    // Add extra fields
    foreach ($extra as $k => $v) {
        $body .= "--{$boundary}\r\nContent-Disposition: form-data; name=\"{$k}\"\r\n\r\n{$v}\r\n";
    }

    // Add file
    $fileContent = file_get_contents($tmpFile);
    $body .= "--{$boundary}\r\nContent-Disposition: form-data; name=\"{$fileKey}\"; filename=\"{$filename}\"\r\nContent-Type: application/octet-stream\r\n\r\n{$fileContent}\r\n";
    $body .= "--{$boundary}--\r\n";

    $ctx = stream_context_create([
        'http' => [
            'method'        => 'POST',
            'header'        => "Content-Type: multipart/form-data; boundary={$boundary}\r\nContent-Length: " . strlen($body),
            'content'       => $body,
            'timeout'       => 60,
            'ignore_errors' => true,
        ],
    ]);

    $res = @file_get_contents($url, false, $ctx);
    if ($res === false) return ['success' => false, 'error' => 'AI service unavailable'];
    $decoded = json_decode($res, true);
    return is_array($decoded) ? $decoded : ['success' => false, 'error' => 'Invalid AI response'];
}

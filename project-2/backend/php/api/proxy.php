<?php
/**
 * DevForge AI – API Proxy (for API Testing Studio)
 * Forwards requests to external APIs and returns results
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') apiError('Method not allowed', 405);

Security::validateCsrf();
$body = Security::getJsonBody();

$targetUrl  = trim($body['url'] ?? '');
$reqMethod  = strtoupper($body['method'] ?? 'GET');
$headers    = $body['headers'] ?? [];
$bodyData   = $body['body'] ?? null;
$auth       = $body['auth'] ?? [];
$params     = $body['params'] ?? [];

if (empty($targetUrl)) apiError('URL is required');
if (!Security::isValidUrl($targetUrl)) apiError('Invalid URL');

// Block internal/private IPs (security)
$host = parse_url($targetUrl, PHP_URL_HOST);
if (in_array($host, ['localhost', '127.0.0.1', '0.0.0.0', '::1'], true)) {
    apiError('Cannot proxy to localhost from API Studio');
}

// Add query params
if (!empty($params)) {
    $sep = str_contains($targetUrl, '?') ? '&' : '?';
    $targetUrl .= $sep . http_build_query($params);
}

// Build header string
$headerLines = [];
foreach ($headers as $k => $v) {
    $headerLines[] = "{$k}: {$v}";
}

// Auth
if (!empty($auth['type'])) {
    match ($auth['type']) {
        'bearer' => $headerLines[] = 'Authorization: Bearer ' . $auth['token'],
        'api_key' => $headerLines[] = ($auth['header'] ?? 'X-API-Key') . ': ' . $auth['key'],
        'basic'  => $headerLines[] = 'Authorization: Basic ' . base64_encode($auth['user'] . ':' . $auth['pass']),
        default  => null,
    };
}

// Set Content-Type if posting body
if ($bodyData !== null && !isset($headers['Content-Type'])) {
    $headerLines[] = 'Content-Type: application/json';
}

// Execute
$start = microtime(true);

$ctx = stream_context_create(['http' => [
    'method'          => $reqMethod,
    'header'          => implode("\r\n", $headerLines),
    'content'         => ($bodyData !== null && $reqMethod !== 'GET') ? (is_array($bodyData) ? json_encode($bodyData) : $bodyData) : null,
    'timeout'         => 30,
    'ignore_errors'   => true,
    'follow_location' => true,
    'max_redirects'   => 3,
]]);

$response = @file_get_contents($targetUrl, false, $ctx);
$elapsed  = round((microtime(true) - $start) * 1000); // ms

// Parse response headers
$responseHeaders = $http_response_header ?? [];
$statusCode      = 0;
$responseHeaderMap = [];
foreach ($responseHeaders as $h) {
    if (preg_match('/HTTP\/\d\.\d\s+(\d+)/', $h, $m)) {
        $statusCode = (int)$m[1];
    } elseif (str_contains($h, ':')) {
        [$k, $v] = explode(':', $h, 2);
        $responseHeaderMap[strtolower(trim($k))] = trim($v);
    }
}

$body = $response ?? '';
$contentType = $responseHeaderMap['content-type'] ?? '';
$isJson = str_contains($contentType, 'json');

$parsed = null;
if ($isJson && !empty($body)) {
    $parsed = json_decode($body, true);
}

// Save to API history
$record = [
    'id'          => uniqid('req_', true),
    'url'         => $targetUrl,
    'method'      => $reqMethod,
    'status'      => $statusCode,
    'time_ms'     => $elapsed,
    'size'        => strlen($body),
    'ts'          => time(),
];
$data = Storage::read('api-history');
$reqs = $data['requests'] ?? [];
if (count($reqs) >= 200) $reqs = array_slice($reqs, -199);
$reqs[] = $record;
Storage::write('api-history', ['requests' => $reqs]);

Logger::activity('api_request', 'api-studio', ['url' => $targetUrl, 'method' => $reqMethod, 'status' => $statusCode]);

apiSuccess([
    'status'   => $statusCode,
    'time_ms'  => $elapsed,
    'size'     => strlen($body),
    'headers'  => $responseHeaderMap,
    'body'     => $parsed ?? $body,
    'raw'      => $body,
    'is_json'  => $isJson,
]);

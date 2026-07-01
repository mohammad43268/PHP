<?php
/**
 * DevForge AI – Python AI Proxy
 * Forwards requests to Python FastAPI with file upload support
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/helpers.php';

$service = $_GET['service'] ?? '';
$method  = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') apiError('Method not allowed', 405);

$allowedServices = ['ocr', 'caption', 'whisper', 'document', 'embeddings'];
if (!in_array($service, $allowedServices, true)) {
    apiError('Unknown AI service: ' . $service);
}

// Map service to Python endpoint
$endpoints = [
    'ocr'       => '/ocr',
    'caption'   => '/caption',
    'whisper'   => '/whisper',
    'document'  => '/document/analyze',
    'embeddings'=> '/embeddings',
];

$pyPath = $endpoints[$service];

if (!empty($_FILES['file'])) {
    $file       = $_FILES['file'];
    $validation = Security::validateUpload($file);
    if (!$validation['valid']) apiError($validation['error']);

    $extra = [];
    if ($service === 'document') {
        $extra['action'] = $_POST['action'] ?? 'summarize';
    }

    $result = proxyFileToPython($pyPath, 'file', $file['tmp_name'], $file['name'], $extra);
    apiSuccess($result, null);
} else {
    $body   = Security::getJsonBody();
    $result = proxyToPython($pyPath, $body);
    apiSuccess($result, null);
}

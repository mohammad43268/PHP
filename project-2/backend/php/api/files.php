<?php
/**
 * DevForge AI – Files API
 * GET: list files | POST: search | DELETE: remove
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $data = Storage::read('files');
    // Remove sensitive fields
    $files = array_map(function ($f) {
        unset($f['password_hash'], $f['path']);
        return $f;
    }, $data['files'] ?? []);
    apiSuccess(array_reverse($files));
}

if ($method === 'POST') {
    $body   = Security::getJsonBody();
    $action = $body['action'] ?? 'list';

    if ($action === 'search') {
        $query = strtolower($body['query'] ?? '');
        $data  = Storage::read('files');
        $files = array_values(array_filter($data['files'] ?? [], function ($f) use ($query) {
            return str_contains(strtolower($f['name'] ?? ''), $query);
        }));
        // Remove sensitive fields
        $files = array_map(function ($f) { unset($f['password_hash'], $f['path']); return $f; }, $files);
        apiSuccess($files);
    }
}

if ($method === 'DELETE') {
    Security::validateCsrf();
    $id = $_GET['id'] ?? '';
    if (empty($id)) apiError('ID required');

    $data  = Storage::read('files');
    $files = $data['files'] ?? [];
    $file  = array_values(array_filter($files, fn($f) => $f['id'] === $id));

    if (!empty($file) && !empty($file[0]['path']) && file_exists($file[0]['path'])) {
        unlink($file[0]['path']);
    }

    Storage::deleteBy('files', 'files', 'id', $id);
    apiSuccess(null, 'File deleted');
}

apiError('Method not allowed', 405);

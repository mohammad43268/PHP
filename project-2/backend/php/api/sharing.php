<?php
/**
 * DevForge AI – File Sharing API
 * Upload → generate secure share link + QR code
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Check if it's a download request
    $token = $_GET['token'] ?? '';
    if ($token) {
        handleDownload($token);
    }
    $data = Storage::read('files');
    apiSuccess($data['files'] ?? []);
}

if ($method === 'POST') {
    Security::validateCsrf();

    if (!empty($_FILES['file'])) {
        $file      = $_FILES['file'];
        $password  = $_POST['password'] ?? '';
        $expiry    = (int)($_POST['expiry'] ?? 0); // hours (0 = no expiry)
        $maxDl     = (int)($_POST['max_downloads'] ?? 0); // 0 = unlimited
        $autoDelete = (bool)($_POST['auto_delete'] ?? false);

        $validation = Security::validateUpload($file, [], 50);
        if (!$validation['valid']) apiError($validation['error']);

        $id       = uniqid('share_', true);
        $token    = Security::generateToken(16);
        $safeName = Security::sanitizeFilename($file['name']);
        $destPath = UPLOADS_PATH . '/' . $id . '_' . $safeName;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            apiError('Could not save file');
        }

        $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
        $host     = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $shareUrl = "{$protocol}://{$host}/PHP/project-2/api/sharing.php?token={$token}";

        $record = [
            'id'            => $id,
            'token'         => $token,
            'name'          => $safeName,
            'path'          => $destPath,
            'mime'          => $validation['mime'],
            'size'          => $file['size'],
            'sha256'        => hash_file('sha256', $destPath),
            'password_hash' => !empty($password) ? Security::hashPassword($password) : '',
            'expiry'        => $expiry > 0 ? time() + ($expiry * 3600) : 0,
            'max_downloads' => $maxDl,
            'downloads'     => 0,
            'auto_delete'   => $autoDelete,
            'share_url'     => $shareUrl,
            'created'       => time(),
        ];

        Storage::append('files', 'files', $record);
        Logger::activity('file_shared', 'file-sharing', ['name' => $safeName]);

        apiSuccess([
            'id'        => $id,
            'token'     => $token,
            'share_url' => $shareUrl,
            'name'      => $safeName,
            'size'      => $file['size'],
            'expiry'    => $record['expiry'],
        ], 'File shared successfully');
    }
}

if ($method === 'DELETE') {
    Security::validateCsrf();
    $id = $_GET['id'] ?? '';
    if (empty($id)) apiError('ID required');

    $data  = Storage::read('files');
    $files = $data['files'] ?? [];
    $file  = array_values(array_filter($files, fn($f) => $f['id'] === $id));
    if (!empty($file) && file_exists($file[0]['path'])) {
        unlink($file[0]['path']);
    }
    Storage::deleteBy('files', 'files', 'id', $id);
    apiSuccess(null, 'Share deleted');
}

function handleDownload(string $token): void {
    $data  = Storage::read('files');
    $files = array_values(array_filter($data['files'] ?? [], fn($f) => $f['token'] === $token));
    if (empty($files)) {
        http_response_code(404);
        echo 'File not found or expired'; exit;
    }
    $f = $files[0];

    // Check expiry
    if ($f['expiry'] > 0 && time() > $f['expiry']) {
        if ($f['auto_delete'] && file_exists($f['path'])) unlink($f['path']);
        http_response_code(410); echo 'Link expired'; exit;
    }

    // Check max downloads
    if ($f['max_downloads'] > 0 && $f['downloads'] >= $f['max_downloads']) {
        http_response_code(410); echo 'Download limit reached'; exit;
    }

    // Check password
    if (!empty($f['password_hash'])) {
        $pass = $_GET['password'] ?? $_POST['password'] ?? '';
        if (!Security::verifyPassword($pass, $f['password_hash'])) {
            http_response_code(401); echo 'Password required'; exit;
        }
    }

    if (!file_exists($f['path'])) { http_response_code(404); echo 'File missing'; exit; }

    // Increment counter
    Storage::updateBy('files', 'files', 'token', $token, ['downloads' => $f['downloads'] + 1]);

    // Auto delete after last download
    if ($f['max_downloads'] > 0 && ($f['downloads'] + 1) >= $f['max_downloads'] && $f['auto_delete']) {
        register_shutdown_function(function() use ($f) { if (file_exists($f['path'])) unlink($f['path']); });
    }

    header('Content-Type: ' . ($f['mime'] ?? 'application/octet-stream'));
    header('Content-Disposition: attachment; filename="' . addslashes($f['name']) . '"');
    header('Content-Length: ' . filesize($f['path']));
    readfile($f['path']);
    exit;
}

apiError('Method not allowed', 405);

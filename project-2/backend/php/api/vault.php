<?php
/**
 * DevForge AI – Vault API
 * AES-256 encrypted file upload/download/management
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $data = Storage::read('vault');
    apiSuccess($data['files'] ?? []);
}

if ($method === 'POST') {
    Security::validateCsrf();

    // Handle upload
    if (!empty($_FILES['file'])) {
        $file = $_FILES['file'];
        $pass = $_POST['password'] ?? '';

        $validation = Security::validateUpload($file, [], 50);
        if (!$validation['valid']) apiError($validation['error']);

        $id        = uniqid('vault_', true);
        $safeName  = Security::sanitizeFilename($file['name']);
        $encName   = $id . '.enc';
        $destPath  = VAULT_PATH . '/' . $encName;

        // Read file content
        $content = file_get_contents($file['tmp_name']);
        if ($content === false) apiError('Could not read file');

        // Encrypt
        $settings = loadSettings();
        $masterKey = !empty($pass) ? $pass : ($settings['security']['vault_password'] ?? 'devforge_default_key');
        $encrypted = Security::encrypt($content, $masterKey);

        file_put_contents($destPath, $encrypted);

        $record = [
            'id'         => $id,
            'name'       => $safeName,
            'enc_file'   => $encName,
            'mime'       => $validation['mime'],
            'size'       => strlen($content),
            'sha256'     => hash('sha256', $content),
            'password_protected' => !empty($pass),
            'uploaded'   => time(),
        ];

        Storage::append('vault', 'files', $record);
        Logger::activity('vault_upload', 'vault', ['name' => $safeName]);
        apiSuccess($record, 'File encrypted and stored');
    }

    // Handle download
    $body = Security::getJsonBody();
    if (($body['action'] ?? '') === 'download') {
        $id   = $body['id'] ?? '';
        $pass = $body['password'] ?? '';
        $data = Storage::read('vault');
        $file = array_values(array_filter($data['files'] ?? [], fn($f) => $f['id'] === $id));
        if (empty($file)) apiError('File not found', 404);
        $file = $file[0];

        $encPath = VAULT_PATH . '/' . $file['enc_file'];
        if (!file_exists($encPath)) apiError('Encrypted file missing', 404);

        $settings  = loadSettings();
        $masterKey = !empty($pass) ? $pass : ($settings['security']['vault_password'] ?? 'devforge_default_key');
        $encrypted = file_get_contents($encPath);
        $decrypted = Security::decrypt($encrypted, $masterKey);

        if ($decrypted === false) apiError('Decryption failed. Wrong password?', 403);

        header('Content-Type: ' . ($file['mime'] ?? 'application/octet-stream'));
        header('Content-Disposition: attachment; filename="' . addslashes($file['name']) . '"');
        header('Content-Length: ' . strlen($decrypted));
        echo $decrypted;
        exit;
    }
}

if ($method === 'DELETE') {
    Security::validateCsrf();
    $id = $_GET['id'] ?? Security::getJsonBody()['id'] ?? '';
    if (empty($id)) apiError('ID required');

    $data  = Storage::read('vault');
    $files = $data['files'] ?? [];
    $file  = array_values(array_filter($files, fn($f) => $f['id'] === $id));

    if (!empty($file)) {
        $encPath = VAULT_PATH . '/' . $file[0]['enc_file'];
        if (file_exists($encPath)) unlink($encPath);
    }

    Storage::deleteBy('vault', 'files', 'id', $id);
    Logger::activity('vault_delete', 'vault', ['id' => $id]);
    apiSuccess(null, 'File deleted from vault');
}

apiError('Method not allowed', 405);

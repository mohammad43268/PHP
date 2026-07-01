<?php
/**
 * DevForge AI – Security Class
 * CSRF, XSS sanitization, input validation, secure headers
 */

declare(strict_types=1);

class Security {

    /** Validate CSRF token */
    public static function validateCsrf(): void {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') return;

        $token = $_SERVER['HTTP_X_CSRF_TOKEN']
              ?? $_POST['_csrf']
              ?? '';

        if (!hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'CSRF validation failed']);
            exit;
        }
    }

    /** Sanitize string input (XSS safe) */
    public static function sanitize(mixed $input): string {
        return htmlspecialchars(strip_tags(trim((string)$input)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /** Sanitize array recursively */
    public static function sanitizeArray(array $arr): array {
        return array_map(function ($val) {
            if (is_array($val)) return self::sanitizeArray($val);
            return self::sanitize($val);
        }, $arr);
    }

    /** Get sanitized POST body (JSON) */
    public static function getJsonBody(): array {
        $raw = file_get_contents('php://input');
        if (empty($raw)) return [];
        $data = json_decode($raw, true);
        if (!is_array($data)) return [];
        return $data; // Don't HTML-escape JSON — sanitize at output
    }

    /** Hash a password */
    public static function hashPassword(string $password): string {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    /** Verify a password */
    public static function verifyPassword(string $password, string $hash): bool {
        return password_verify($password, $hash);
    }

    /** AES-256-CBC encryption */
    public static function encrypt(string $data, string $key): string {
        $iv         = random_bytes(16);
        $key        = hash('sha256', $key, true);
        $encrypted  = openssl_encrypt($data, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
        return base64_encode($iv . $encrypted);
    }

    /** AES-256-CBC decryption */
    public static function decrypt(string $data, string $key): string|false {
        $raw        = base64_decode($data);
        $iv         = substr($raw, 0, 16);
        $encrypted  = substr($raw, 16);
        $key        = hash('sha256', $key, true);
        return openssl_decrypt($encrypted, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
    }

    /** Generate a SHA-256 hash of a file */
    public static function fileHash(string $path): string|false {
        if (!file_exists($path)) return false;
        return hash_file('sha256', $path);
    }

    /** Validate uploaded file */
    public static function validateUpload(array $file, array $allowedTypes = [], int $maxMb = 50): array {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['valid' => false, 'error' => 'Upload error: ' . $file['error']];
        }
        if ($file['size'] > $maxMb * 1024 * 1024) {
            return ['valid' => false, 'error' => "File too large (max {$maxMb}MB)"];
        }
        if (!empty($allowedTypes)) {
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, $allowedTypes, true)) {
                return ['valid' => false, 'error' => "File type not allowed: .{$ext}"];
            }
        }
        // Check MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime  = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        return ['valid' => true, 'mime' => $mime, 'ext' => strtolower(pathinfo($file['name'], PATHINFO_EXTENSION))];
    }

    /** Secure filename (prevent path traversal) */
    public static function sanitizeFilename(string $name): string {
        $name = basename($name);
        $name = preg_replace('/[^a-zA-Z0-9._\-]/', '_', $name);
        return substr($name, 0, 255);
    }

    /** Set secure response headers */
    public static function setSecureHeaders(): void {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
    }

    /** Validate email */
    public static function isValidEmail(string $email): bool {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /** Validate URL */
    public static function isValidUrl(string $url): bool {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }

    /** Generate a secure random token */
    public static function generateToken(int $length = 32): string {
        return bin2hex(random_bytes($length));
    }
}

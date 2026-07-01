<?php
/**
 * DevForge AI – Settings API
 * GET: read settings | POST: update settings
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $settings = loadSettings();
    // Remove sensitive values before sending
    unset($settings['security']['vault_password']);
    if (isset($settings['ai'])) {
        // Mask API keys
        foreach (['openai_key', 'gemini_key', 'anthropic_key'] as $k) {
            if (!empty($settings['ai'][$k])) {
                $settings['ai'][$k] = str_repeat('•', 8) . substr($settings['ai'][$k], -4);
            }
        }
    }
    apiSuccess($settings);
}

if ($method === 'POST') {
    Security::validateCsrf();
    $body = Security::getJsonBody();
    if (empty($body)) apiError('No data provided');

    $settingsFile = CONFIG_PATH . '/settings.json';
    $current = file_exists($settingsFile)
        ? json_decode(file_get_contents($settingsFile), true) ?? []
        : [];

    // Deep merge (only update provided keys)
    function deepMerge(array $base, array $update): array {
        foreach ($update as $k => $v) {
            if (is_array($v) && isset($base[$k]) && is_array($base[$k])) {
                $base[$k] = deepMerge($base[$k], $v);
            } else {
                $base[$k] = $v;
            }
        }
        return $base;
    }

    $merged = deepMerge($current, $body);

    // Don't allow overwriting real API keys with masked values
    foreach (['openai_key', 'gemini_key', 'anthropic_key'] as $k) {
        if (isset($merged['ai'][$k]) && str_contains($merged['ai'][$k], '•')) {
            $merged['ai'][$k] = $current['ai'][$k] ?? '';
        }
    }

    $fp = fopen($settingsFile, 'c');
    if (!$fp) apiError('Could not write settings');
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    flock($fp, LOCK_UN);
    fclose($fp);

    Logger::activity('settings_updated', 'settings', array_keys($body));
    apiSuccess(null, 'Settings saved');
}

apiError('Method not allowed', 405);

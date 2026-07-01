<?php
/**
 * DevForge AI – Logger Class
 * Activity logging, error logging, audit trail
 */

declare(strict_types=1);

class Logger {
    private const MAX_LOG_SIZE  = 5 * 1024 * 1024; // 5 MB
    private const MAX_LOG_LINES = 10000;

    public static function info(string $message, array $context = []): void {
        self::write('INFO', $message, $context);
    }

    public static function error(string $message, array $context = []): void {
        self::write('ERROR', $message, $context);
    }

    public static function warning(string $message, array $context = []): void {
        self::write('WARN', $message, $context);
    }

    public static function debug(string $message, array $context = []): void {
        if (defined('APP_DEBUG') && APP_DEBUG) {
            self::write('DEBUG', $message, $context);
        }
    }

    /** Log user activity to activity.json */
    public static function activity(string $action, string $module, array $meta = []): void {
        $event = [
            'id'        => uniqid('evt_', true),
            'action'    => $action,
            'module'    => $module,
            'meta'      => $meta,
            'ip'        => self::getIp(),
            'ts'        => time(),
            'date'      => date('Y-m-d H:i:s'),
        ];

        $data   = Storage::read('activity');
        $events = $data['events'] ?? [];

        // Keep last 1000 events
        if (count($events) >= 1000) {
            $events = array_slice($events, -999);
        }
        $events[] = $event;
        Storage::write('activity', ['events' => $events]);
    }

    /** Write to log file */
    private static function write(string $level, string $message, array $context): void {
        $logFile = LOGS_PATH . '/app.log';

        // Rotate if too large
        if (file_exists($logFile) && filesize($logFile) > self::MAX_LOG_SIZE) {
            rename($logFile, $logFile . '.' . date('Ymd-His') . '.bak');
        }

        $entry = sprintf(
            "[%s] [%s] %s %s\n",
            date('Y-m-d H:i:s'),
            $level,
            $message,
            !empty($context) ? json_encode($context) : ''
        );

        file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
    }

    private static function getIp(): string {
        return $_SERVER['HTTP_X_FORWARDED_FOR']
            ?? $_SERVER['HTTP_X_REAL_IP']
            ?? $_SERVER['REMOTE_ADDR']
            ?? 'unknown';
    }

    /** Get recent log entries */
    public static function getRecentLogs(int $limit = 100): array {
        $logFile = LOGS_PATH . '/app.log';
        if (!file_exists($logFile)) return [];

        $lines  = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $recent = array_slice($lines, -$limit);
        return array_reverse($recent);
    }
}

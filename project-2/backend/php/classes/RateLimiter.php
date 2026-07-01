<?php
/**
 * DevForge AI – Rate Limiter
 * File-based rate limiting using cache JSON
 */

declare(strict_types=1);

class RateLimiter {
    private static string $cacheFile = '';

    public static function init(): void {
        self::$cacheFile = CACHE_PATH . '/rate_limits.json';
    }

    /**
     * Check if the given key exceeds the rate limit
     * @param string $key      Unique key (e.g., IP + endpoint)
     * @param int    $limit    Max requests
     * @param int    $window   Time window in seconds
     */
    public static function check(string $key, int $limit = 60, int $window = 60): bool {
        $data = self::load();
        $now  = time();

        if (!isset($data[$key])) {
            $data[$key] = ['count' => 0, 'reset' => $now + $window];
        }

        // Reset window if expired
        if ($now > $data[$key]['reset']) {
            $data[$key] = ['count' => 0, 'reset' => $now + $window];
        }

        $data[$key]['count']++;
        self::save($data);

        if ($data[$key]['count'] > $limit) {
            http_response_code(429);
            header('Retry-After: ' . ($data[$key]['reset'] - $now));
            jsonResponse(['success' => false, 'error' => 'Rate limit exceeded. Try again later.'], 429);
        }

        return true;
    }

    /** Rate limit by IP for current endpoint */
    public static function checkIp(int $limit = RATE_LIMIT_RPM, int $window = 60): void {
        $ip  = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        self::check($ip . ':' . basename($uri), $limit, $window);
    }

    private static function load(): array {
        if (!file_exists(self::$cacheFile)) return [];
        $raw = file_get_contents(self::$cacheFile);
        return json_decode($raw ?: '{}', true) ?? [];
    }

    private static function save(array $data): void {
        // Clean up expired entries
        $now = time();
        $data = array_filter($data, fn($v) => ($v['reset'] ?? 0) > $now);

        file_put_contents(self::$cacheFile, json_encode($data), LOCK_EX);
    }
}

RateLimiter::init();

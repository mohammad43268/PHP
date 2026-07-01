<?php
/**
 * DevForge AI – Storage Class (SQLite Database Engine)
 * Replaces flat JSON files with a high-performance SQLite document store.
 */

declare(strict_types=1);

class Storage {
    private static ?PDO $db = null;

    public static function init(): void {
        if (self::$db !== null) return;
        
        $dbPath = STORAGE_PATH . '/database.sqlite';
        $dsn = 'sqlite:' . $dbPath;
        
        self::$db = new PDO($dsn);
        self::$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        self::$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        // Create the document store table if it doesn't exist
        self::$db->exec("
            CREATE TABLE IF NOT EXISTS documents (
                filename TEXT PRIMARY KEY,
                content TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
    }

    /** Read a JSON document from the database */
    public static function read(string $file): array {
        self::init();
        $file = self::sanitize($file);
        
        $stmt = self::$db->prepare("SELECT content FROM documents WHERE filename = ?");
        $stmt->execute([$file]);
        $row = $stmt->fetch();
        
        if ($row && !empty($row['content'])) {
            $data = json_decode($row['content'], true);
            return is_array($data) ? $data : [];
        }
        return [];
    }

    /** Write an entire JSON document to the database */
    public static function write(string $file, array $data): bool {
        self::init();
        $file = self::sanitize($file);
        $content = json_encode($data, JSON_UNESCAPED_UNICODE);
        
        $stmt = self::$db->prepare("
            INSERT INTO documents (filename, content, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(filename) DO UPDATE SET 
            content = excluded.content,
            updated_at = CURRENT_TIMESTAMP
        ");
        return $stmt->execute([$file, $content]);
    }

    /** Append a record to a collection inside the document */
    public static function append(string $file, string $key, array $record): array {
        self::$db->beginTransaction();
        try {
            $data = self::read($file);
            if (!isset($data[$key]) || !is_array($data[$key])) {
                $data[$key] = [];
            }
            $data[$key][] = $record;
            self::write($file, $data);
            self::$db->commit();
            return $record;
        } catch (Exception $e) {
            self::$db->rollBack();
            throw $e;
        }
    }

    /** Find records in a collection by a field value */
    public static function findBy(string $file, string $key, string $field, mixed $value): array {
        $data = self::read($file);
        return array_values(array_filter($data[$key] ?? [], fn($r) => ($r[$field] ?? null) === $value));
    }

    /** Delete a record by ID from a collection */
    public static function deleteBy(string $file, string $key, string $field, mixed $value): bool {
        self::$db->beginTransaction();
        try {
            $data = self::read($file);
            if (!isset($data[$key])) {
                self::$db->rollBack();
                return false;
            }
            $data[$key] = array_values(array_filter($data[$key], fn($r) => ($r[$field] ?? null) !== $value));
            self::write($file, $data);
            self::$db->commit();
            return true;
        } catch (Exception $e) {
            self::$db->rollBack();
            return false;
        }
    }

    /** Update a record by field */
    public static function updateBy(string $file, string $key, string $field, mixed $value, array $update): bool {
        self::$db->beginTransaction();
        try {
            $data = self::read($file);
            if (!isset($data[$key])) {
                self::$db->rollBack();
                return false;
            }
            foreach ($data[$key] as &$record) {
                if (($record[$field] ?? null) === $value) {
                    $record = array_merge($record, $update);
                }
            }
            self::write($file, $data);
            self::$db->commit();
            return true;
        } catch (Exception $e) {
            self::$db->rollBack();
            return false;
        }
    }

    /** Count records in a collection */
    public static function count(string $file, string $key): int {
        $data = self::read($file);
        return count($data[$key] ?? []);
    }

    private static function sanitize(string $file): string {
        $file = preg_replace('#[^a-z0-9/\-_]#i', '', $file);
        if (!str_ends_with($file, '.json')) $file .= '.json';
        return ltrim($file, '/');
    }
}

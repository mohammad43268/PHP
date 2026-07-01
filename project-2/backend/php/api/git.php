<?php
/**
 * DevForge AI – Git Dashboard API
 * Parses git log, branches, diff
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') apiError('Method not allowed', 405);

Security::validateCsrf();
$body   = Security::getJsonBody();
$action = $body['action'] ?? 'log';
$path   = $body['path'] ?? ROOT_PATH;

// Sanitize path
$path = realpath($path) ?: ROOT_PATH;

// Ensure git is available
exec('git --version 2>&1', $out, $ret);
if ($ret !== 0) apiError('Git is not installed or not in PATH');

// Check if path is a git repo
exec("git -C " . escapeshellarg($path) . " rev-parse --is-inside-work-tree 2>&1", $o, $r);
if ($r !== 0) {
    // Try to find the workspace root git repo
    $path = ROOT_PATH;
    exec("git -C " . escapeshellarg($path) . " rev-parse --is-inside-work-tree 2>&1", $o, $r);
    if ($r !== 0) apiError('No git repository found');
}

switch ($action) {
    case 'log':
        $limit = min((int)($body['limit'] ?? 50), 200);
        $format = '--pretty=format:{"hash":"%H","short":"%h","author":"%an","email":"%ae","date":"%ai","subject":"%s","refs":"%D"}';
        exec("git -C " . escapeshellarg($path) . " log {$format} -n {$limit} 2>&1", $lines, $rc);
        $commits = [];
        foreach ($lines as $line) {
            $c = @json_decode($line, true);
            if ($c) $commits[] = $c;
        }
        // Stats
        exec("git -C " . escapeshellarg($path) . " shortlog -sne --all 2>&1", $authorLines);
        $authors = [];
        foreach ($authorLines as $al) {
            if (preg_match('/^\s*(\d+)\s+(.+)\s+<(.+)>$/', $al, $m)) {
                $authors[] = ['count' => (int)$m[1], 'name' => $m[2], 'email' => $m[3]];
            }
        }
        apiSuccess(['commits' => $commits, 'authors' => $authors]);

    case 'branches':
        exec("git -C " . escapeshellarg($path) . " branch -a --format='%(refname:short)|%(objectname:short)|%(committerdate:relative)' 2>&1", $blines);
        $branches = [];
        foreach ($blines as $bl) {
            [$name, $hash, $date] = explode('|', $bl . '||');
            $branches[] = ['name' => trim($name), 'hash' => trim($hash), 'date' => trim($date)];
        }
        $current = trim(shell_exec("git -C " . escapeshellarg($path) . " rev-parse --abbrev-ref HEAD 2>&1") ?? '');
        apiSuccess(['branches' => $branches, 'current' => $current]);

    case 'diff':
        $hash = preg_replace('/[^a-f0-9]/i', '', $body['hash'] ?? '');
        if (empty($hash)) apiError('Commit hash required');
        exec("git -C " . escapeshellarg($path) . " show --stat {$hash} 2>&1", $diffLines);
        $diff = implode("\n", $diffLines);
        apiSuccess(['diff' => $diff, 'hash' => $hash]);

    case 'status':
        exec("git -C " . escapeshellarg($path) . " status --porcelain 2>&1", $statusLines);
        $files = [];
        foreach ($statusLines as $sl) {
            if (strlen($sl) > 3) {
                $files[] = ['status' => substr($sl, 0, 2), 'file' => trim(substr($sl, 3))];
            }
        }
        apiSuccess(['files' => $files]);

    case 'stats':
        $total = trim(shell_exec("git -C " . escapeshellarg($path) . " rev-list --count HEAD 2>&1") ?? '0');
        $files = trim(shell_exec("git -C " . escapeshellarg($path) . " ls-files | wc -l 2>&1") ?? '0');
        $first = trim(shell_exec("git -C " . escapeshellarg($path) . " log --pretty=format:'%ai' --reverse | head -1 2>&1") ?? '');
        apiSuccess(['total_commits' => (int)$total, 'tracked_files' => (int)$files, 'first_commit' => $first]);

    default:
        apiError('Unknown action');
}

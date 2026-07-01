<?php
/**
 * phpinfo_demo.php — Server & PHP Info Dashboard
 *
 * PHP Skills Demonstrated:
 *  - phpversion()       — current PHP version
 *  - PHP_OS             — operating system constant
 *  - PHP_INT_MAX        — integer limit constant
 *  - PHP_FLOAT_EPSILON  — float precision constant
 *  - PHP_EOL            — end of line constant
 *  - PHP_MAJOR_VERSION  — version number constants
 *  - $_SERVER superglobal — server environment info
 *  - extension_loaded() — check installed extensions
 *  - get_loaded_extensions() — list all loaded extensions
 *  - ini_get()          — read php.ini settings
 *  - memory_get_usage() — current memory usage
 *  - memory_get_peak_usage() — peak memory usage
 *  - getenv()           — environment variables
 *  - defined()          — check if a constant is defined
 *  - microtime()        — high resolution timer
 *  - number_format()    — numeric formatting
 */

$pageTitle = 'Server & PHP Info';

// ── Capture start time for execution time demo ────────────────────────────────
$script_start = microtime(true);

// ── Build comprehensive info sections ────────────────────────────────────────

// 1. PHP Version Info
$php_info = [
    'PHP Version'           => phpversion(),
    'PHP Major Version'     => PHP_MAJOR_VERSION,
    'PHP Minor Version'     => PHP_MINOR_VERSION,
    'PHP Release Version'   => PHP_RELEASE_VERSION,
    'PHP OS'                => PHP_OS,
    'PHP OS Family'         => PHP_OS_FAMILY,
    'PHP SAPI'              => php_sapi_name(),
    'PHP Binary Path'       => PHP_BINARY,
    'PHP Extensions Dir'    => PHP_EXTENSION_DIR,
    'PHP Max Execution Time'=> ini_get('max_execution_time') . 's',
];

// 2. Server Info from $_SERVER superglobal
$server_info = [
    'Server Software'   => $_SERVER['SERVER_SOFTWARE'] ?? 'N/A',
    'Server Name'       => $_SERVER['SERVER_NAME']     ?? 'N/A',
    'Server Port'       => $_SERVER['SERVER_PORT']     ?? 'N/A',
    'Document Root'     => $_SERVER['DOCUMENT_ROOT']   ?? 'N/A',
    'Request URI'       => $_SERVER['REQUEST_URI']     ?? 'N/A',
    'HTTP Host'         => $_SERVER['HTTP_HOST']       ?? 'N/A',
    'Remote Address'    => $_SERVER['REMOTE_ADDR']     ?? 'N/A',
    'Gateway Interface' => $_SERVER['GATEWAY_INTERFACE'] ?? 'N/A',
    'Script Filename'   => $_SERVER['SCRIPT_FILENAME'] ?? 'N/A',
];

// 3. PHP Constants
$constants_info = [
    'PHP_INT_MAX'        => number_format(PHP_INT_MAX),
    'PHP_INT_MIN'        => number_format(PHP_INT_MIN),
    'PHP_INT_SIZE'       => PHP_INT_SIZE . ' bytes',
    'PHP_FLOAT_EPSILON'  => PHP_FLOAT_EPSILON,
    'PHP_FLOAT_MAX'      => number_format(PHP_FLOAT_MAX, 0, '.', ','),
    'PHP_FLOAT_DIG'      => PHP_FLOAT_DIG . ' significant decimals',
    'PHP_EOL'            => json_encode(PHP_EOL),
    'DIRECTORY_SEPARATOR'=> json_encode(DIRECTORY_SEPARATOR),
    'PATH_SEPARATOR'     => json_encode(PATH_SEPARATOR),
    'PHP_MAXPATHLEN'     => PHP_MAXPATHLEN . ' chars',
];

// 4. Memory info
$mem_usage  = memory_get_usage(true);
$mem_peak   = memory_get_peak_usage(true);
$mem_limit  = ini_get('memory_limit');

function format_bytes(int $bytes): string {
    if ($bytes >= 1048576) return round($bytes / 1048576, 2) . ' MB';
    if ($bytes >= 1024)    return round($bytes / 1024, 2) . ' KB';
    return $bytes . ' B';
}

$memory_info = [
    'Memory Usage (real)' => format_bytes($mem_usage),
    'Peak Memory Usage'   => format_bytes($mem_peak),
    'Memory Limit'        => $mem_limit,
    'Upload Max Filesize' => ini_get('upload_max_filesize'),
    'Post Max Size'       => ini_get('post_max_size'),
    'Max Input Vars'      => ini_get('max_input_vars'),
    'Default Timezone'    => date_default_timezone_get(),
    'Current Timestamp'   => time() . ' (' . date('Y-m-d H:i:s') . ')',
];

// 5. Loaded extensions (get_loaded_extensions)
$all_extensions = get_loaded_extensions();
sort($all_extensions);

$important_ext = ['json', 'pdo', 'pdo_mysql', 'pdo_sqlite', 'curl', 'mbstring',
                  'openssl', 'gd', 'zip', 'xml', 'xmlreader', 'fileinfo',
                  'intl', 'redis', 'xdebug', 'opcache', 'sodium'];

// ── Calculate execution time ──────────────────────────────────────────────────
$exec_time = microtime(true) - $script_start;

require_once 'includes/header.php';
?>

<main>
    <div class="container">

        <div class="page-header fade-up">
            <div class="badge">⚙️ PHP Skills</div>
            <h1>Server & PHP Info</h1>
            <p>Demonstrates <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">phpversion()</code>, <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">$_SERVER</code>, constants, <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">memory_get_usage()</code></p>
        </div>

        <!-- ── Quick Stats ── -->
        <div class="stats-row fade-up-1">
            <div class="stat-card">
                <span class="stat-number">PHP <?= PHP_MAJOR_VERSION ?>.<?= PHP_MINOR_VERSION ?></span>
                <span class="stat-label">PHP Version</span>
            </div>
            <div class="stat-card">
                <span class="stat-number"><?= count($all_extensions) ?></span>
                <span class="stat-label">Extensions Loaded</span>
            </div>
            <div class="stat-card">
                <span class="stat-number"><?= format_bytes($mem_usage) ?></span>
                <span class="stat-label">Memory Used</span>
            </div>
            <div class="stat-card">
                <span class="stat-number"><?= round($exec_time * 1000, 2) ?>ms</span>
                <span class="stat-label">Execution Time</span>
            </div>
            <div class="stat-card">
                <span class="stat-number"><?= PHP_INT_SIZE * 8 ?>-bit</span>
                <span class="stat-label">Architecture</span>
            </div>
        </div>

        <!-- ── Info Sections Grid ── -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;" class="fade-up-2">

            <!-- PHP Version Info -->
            <div class="card" id="php-version-card">
                <div class="card-icon indigo">🐘</div>
                <h3 style="margin-bottom:16px;">PHP Version Details</h3>
                <?php foreach ($php_info as $key => $val): ?>
                <div class="info-row">
                    <span class="info-key"><?= htmlspecialchars($key) ?></span>
                    <span class="info-val"><?= htmlspecialchars((string)$val) ?></span>
                </div>
                <?php endforeach; ?>
            </div>

            <!-- Memory Info -->
            <div class="card" id="memory-card">
                <div class="card-icon emerald">🧠</div>
                <h3 style="margin-bottom:16px;">Memory & Settings</h3>
                <?php foreach ($memory_info as $key => $val): ?>
                <div class="info-row">
                    <span class="info-key"><?= htmlspecialchars($key) ?></span>
                    <span class="info-val"><?= htmlspecialchars((string)$val) ?></span>
                </div>
                <?php endforeach; ?>
                <!-- Memory bar -->
                <div style="margin-top:16px;">
                    <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-secondary);margin-bottom:6px;">
                        <span>Memory Usage</span>
                        <span><?= format_bytes($mem_usage) ?> / <?= $mem_limit ?></span>
                    </div>
                    <div class="progress-bar-wrap">
                        <div class="progress-bar" style="width:<?= min(100, round($mem_usage / (1024*1024*128) * 100)) ?>%;background:linear-gradient(90deg,var(--emerald),var(--cyan));"></div>
                    </div>
                </div>
            </div>

        </div>

        <!-- PHP Constants -->
        <div class="card fade-up-3" style="margin-top:24px;" id="constants-card">
            <div class="card-icon amber">📌</div>
            <h3 style="margin-bottom:16px;">PHP Built-in Constants</h3>
            <p style="margin-bottom:16px;color:var(--text-secondary);font-size:0.9rem;">
                PHP provides many predefined constants accessible anywhere without <code style="font-family:'JetBrains Mono',monospace;">$</code> — they never change at runtime.
            </p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;">
                <?php foreach ($constants_info as $name => $val): ?>
                <div style="background:rgba(0,0,0,0.25);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
                    <code style="font-family:'JetBrains Mono',monospace;font-size:0.78rem;color:var(--amber);">
                        <?= htmlspecialchars($name) ?>
                    </code>
                    <div style="color:var(--text-primary);font-size:0.85rem;margin-top:4px;word-break:break-all;">
                        <?= htmlspecialchars((string)$val) ?>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- $_SERVER Superglobal -->
        <div class="card fade-up-3" style="margin-top:24px;" id="server-card">
            <div class="card-icon violet">🌐</div>
            <h3 style="margin-bottom:4px;">$_SERVER Superglobal</h3>
            <p style="margin-bottom:16px;color:var(--text-secondary);font-size:0.9rem;">
                PHP automatically populates <code style="font-family:'JetBrains Mono',monospace;">$_SERVER</code> with server & request info.
            </p>
            <?php foreach ($server_info as $key => $val): ?>
            <div class="info-row">
                <span class="info-key"><code style="font-family:'JetBrains Mono',monospace;font-size:0.82rem;color:var(--violet);">$_SERVER['<?= $key ?>']</code></span>
                <span class="info-val" style="max-width:60%;"><?= htmlspecialchars((string)$val) ?></span>
            </div>
            <?php endforeach; ?>
        </div>

        <!-- Important Extensions -->
        <div class="card fade-up-4" style="margin-top:24px;" id="extensions-card">
            <div class="card-icon cyan">🔌</div>
            <h3 style="margin-bottom:4px;">extension_loaded() — Key Extensions</h3>
            <p style="margin-bottom:16px;color:var(--text-secondary);font-size:0.9rem;">
                Using <code style="font-family:'JetBrains Mono',monospace;">extension_loaded($name)</code> to check if critical extensions are available.
            </p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;">
                <?php foreach ($important_ext as $ext): ?>
                <?php $loaded = extension_loaded($ext); ?>
                <div style="display:flex;align-items:center;gap:8px;
                            background:rgba(255,255,255,0.03);border:1px solid var(--border);
                            border-radius:var(--radius-sm);padding:10px 12px;">
                    <span><?= $loaded ? '✅' : '❌' ?></span>
                    <code style="font-size:0.8rem;font-family:'JetBrains Mono',monospace;
                                 color:<?= $loaded ? 'var(--emerald)' : 'var(--text-muted)' ?>;">
                        <?= htmlspecialchars($ext) ?>
                    </code>
                </div>
                <?php endforeach; ?>
            </div>
            <p style="margin-top:16px;font-size:0.85rem;color:var(--text-secondary);">
                <strong><?= count($all_extensions) ?></strong> total extensions loaded. Showing <?= count($important_ext) ?> important ones.
            </p>
        </div>

        <!-- All Loaded Extensions -->
        <div class="card fade-up-5" style="margin-top:24px;" id="all-extensions-card">
            <div class="card-icon rose">📦</div>
            <h3 style="margin-bottom:16px;">All Loaded Extensions — <code style="font-size:0.85rem;color:var(--accent-light);">get_loaded_extensions()</code></h3>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
                <?php foreach ($all_extensions as $ext): ?>
                <span class="tag tag-indigo" style="font-size:0.72rem;"><?= htmlspecialchars($ext) ?></span>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- microtime() demo -->
        <div class="card fade-up-6" style="margin-top:24px;" id="timing-card">
            <div class="card-icon emerald">⏱️</div>
            <h3 style="margin-bottom:8px;">microtime() — Precise Execution Timing</h3>
            <p style="margin-bottom:16px;color:var(--text-secondary);font-size:0.9rem;">
                PHP's <code style="font-family:'JetBrains Mono',monospace;">microtime(true)</code> returns a float with microsecond precision.
            </p>
            <div class="code-block">
                <div>$start = microtime(true); <span style="color:var(--text-muted);">// At script start</span></div>
                <div>// ... all the PHP logic ran here ...</div>
                <div>$exec_time = microtime(true) - $start;</div>
                <div>echo round($exec_time * 1000, 4) . " ms";</div>
                <div style="margin-top:10px;color:#fff;font-weight:600;">
                    → This page took: <?= round($exec_time * 1000, 4) ?> ms
                </div>
            </div>
        </div>

    </div>
</main>

<?php require_once 'includes/footer.php'; ?>

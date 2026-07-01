<?php
/**
 * files.php — File Manager Demo
 *
 * PHP Skills Demonstrated:
 *  - file_put_contents()  — write/create a file
 *  - file_get_contents()  — read a file
 *  - file_exists()        — check if a file exists
 *  - filesize()           — get file size in bytes
 *  - filemtime()          — get last modified timestamp
 *  - glob()               — list files matching a pattern
 *  - unlink()             — delete a file
 *  - basename()           — extract filename from path
 *  - pathinfo()           — split path into parts
 *  - realpath()           — get absolute path
 *  - is_writable()        — check write permissions
 *  - fopen/fwrite/fclose  — low-level file streams
 *  - DIRECTORY_SEPARATOR  — PHP constant
 */

$pageTitle = 'File Manager';

// ── Storage directory ─────────────────────────────────────────────────────────
$storage_dir = 'data' . DIRECTORY_SEPARATOR . 'user_files' . DIRECTORY_SEPARATOR;

// Create directory if it doesn't exist
if (!is_dir($storage_dir)) {
    mkdir($storage_dir, 0755, true);
}

$action    = $_POST['action'] ?? '';
$fm_error  = '';
$fm_success= '';

// ── Handle Actions ────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Action: Create a new file
    if ($action === 'create') {
        $filename  = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_POST['filename'] ?? '');
        $extension = '.txt';
        $content   = $_POST['content'] ?? '';

        if (empty($filename)) {
            $fm_error = 'Filename cannot be empty (only letters, numbers, _ and -)';
        } else {
            $filepath = $storage_dir . $filename . $extension;
            if (file_exists($filepath)) {
                $fm_error = "File '{$filename}.txt' already exists. Choose a different name.";
            } else {
                // Use fopen / fwrite / fclose for fine-grained control
                $fh = fopen($filepath, 'w');
                if ($fh) {
                    fwrite($fh, $content);
                    fclose($fh);
                    $fm_success = "✅ File '{$filename}.txt' created successfully! ({$filepath})";
                } else {
                    $fm_error = 'Could not open file for writing. Check permissions.';
                }
            }
        }
    }

    // Action: Delete a file
    if ($action === 'delete') {
        $del_file = basename($_POST['del_file'] ?? '');   // basename() for security
        $filepath = $storage_dir . $del_file;

        if (empty($del_file)) {
            $fm_error = 'No file specified for deletion.';
        } elseif (!file_exists($filepath)) {
            $fm_error = "File '{$del_file}' not found.";
        } else {
            if (unlink($filepath)) {                       // unlink() to delete
                $fm_success = "🗑️ File '{$del_file}' deleted successfully.";
            } else {
                $fm_error = "Could not delete '{$del_file}'. Check permissions.";
            }
        }
    }

    // Action: View file content
    $view_content = '';
    $view_name    = '';
    if ($action === 'view') {
        $view_name = basename($_POST['view_file'] ?? '');
        $filepath  = $storage_dir . $view_name;
        if (file_exists($filepath)) {
            $view_content = file_get_contents($filepath);  // file_get_contents()
        }
    }
}

// ── List all .txt files using glob() ─────────────────────────────────────────
$files = glob($storage_dir . '*.txt');   // glob() returns array of matching paths
$files = is_array($files) ? $files : [];

// Pre-create sample files if none exist
if (empty($files)) {
    $sample_files = [
        'hello_world' => "Hello, World!\n\nThis is a sample file created by PHP.\nDate: " . date('Y-m-d H:i:s'),
        'php_facts'   => "PHP Facts\n=========\n\n1. PHP stands for PHP: Hypertext Preprocessor\n2. Created by Rasmus Lerdorf in 1994\n3. PHP 8.x supports JIT compilation\n4. Used by over 77% of all websites\n5. Laravel, WordPress, and Drupal are built on PHP",
    ];
    foreach ($sample_files as $name => $content) {
        $fh = fopen($storage_dir . $name . '.txt', 'w');
        if ($fh) { fwrite($fh, $content); fclose($fh); }
    }
    $files = glob($storage_dir . '*.txt');
    $files = is_array($files) ? $files : [];
}

require_once 'includes/header.php';
?>

<main>
    <div class="container" style="max-width:900px;">

        <div class="page-header fade-up">
            <div class="badge">📁 PHP Skills</div>
            <h1>File Manager</h1>
            <p>Demonstrates <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">fopen()</code>, <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">glob()</code>, <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">file_put_contents()</code>, and <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">unlink()</code></p>
        </div>

        <?php if ($fm_success): ?>
        <div class="alert alert-success fade-up" id="fm-success" role="alert"><?= htmlspecialchars($fm_success) ?></div>
        <?php endif; ?>

        <?php if ($fm_error): ?>
        <div class="alert alert-error fade-up" id="fm-error" role="alert">❌ <?= htmlspecialchars($fm_error) ?></div>
        <?php endif; ?>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;" class="fade-up-1">

            <!-- ── Create File Form ── -->
            <div class="card" id="create-file-card">
                <div class="card-icon amber">📝</div>
                <h3 style="margin-bottom:16px;">Create New File</h3>
                <form method="POST" action="files.php" id="create-file-form">
                    <input type="hidden" name="action" value="create">
                    <div class="form-group">
                        <label class="form-label" for="new-filename">Filename (no extension)</label>
                        <input type="text" id="new-filename" name="filename" class="form-control"
                               placeholder="my_notes" pattern="[a-zA-Z0-9_\-]+"
                               title="Letters, numbers, underscores and hyphens only">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="new-content">File Content</label>
                        <textarea id="new-content" name="content" class="form-control" rows="5"
                                  placeholder="Write anything here..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-sm" id="create-file-btn" style="width:100%;">
                        📝 Create File with fopen()
                    </button>
                </form>
            </div>

            <!-- ── File Functions Reference ── -->
            <div class="card" id="file-functions-card">
                <div class="card-icon cyan">🔧</div>
                <h3 style="margin-bottom:16px;">PHP File Functions</h3>
                <?php
                $fn_list = [
                    ['fn' => 'file_put_contents()',  'desc' => 'Write string to file (creates if not exists)', 'color' => 'indigo'],
                    ['fn' => 'file_get_contents()',  'desc' => 'Read entire file into a string',               'color' => 'violet'],
                    ['fn' => 'fopen($path, "w")',    'desc' => 'Open file handle for writing',                 'color' => 'cyan'],
                    ['fn' => 'fwrite($fh, $str)',    'desc' => 'Write to open file handle',                    'color' => 'emerald'],
                    ['fn' => 'fclose($fh)',          'desc' => 'Close an open file handle',                    'color' => 'amber'],
                    ['fn' => 'file_exists($path)',   'desc' => 'Check if a file or directory exists',          'color' => 'rose'],
                    ['fn' => 'glob($pattern)',       'desc' => 'Return array of matching file paths',          'color' => 'indigo'],
                    ['fn' => 'unlink($path)',        'desc' => 'Delete a file from the filesystem',            'color' => 'rose'],
                    ['fn' => 'filesize($path)',      'desc' => 'Get file size in bytes',                       'color' => 'violet'],
                    ['fn' => 'filemtime($path)',     'desc' => 'Get last modified UNIX timestamp',             'color' => 'cyan'],
                    ['fn' => 'basename($path)',      'desc' => 'Extract filename from a full path',            'color' => 'emerald'],
                    ['fn' => 'pathinfo($path)',      'desc' => 'Split path into dirname/basename/ext',         'color' => 'amber'],
                ];
                foreach ($fn_list as $f): ?>
                <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
                    <code class="tag tag-<?= $f['color'] ?>" style="white-space:nowrap;font-size:0.72rem;flex-shrink:0;">
                        <?= htmlspecialchars($f['fn']) ?>
                    </code>
                    <span style="font-size:0.8rem;color:var(--text-secondary);"><?= htmlspecialchars($f['desc']) ?></span>
                </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- ── File List (glob() results) ── -->
        <div class="card fade-up-2" style="margin-top:24px;" id="file-list-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                <div>
                    <div class="card-icon emerald" style="display:inline-flex;margin-right:12px;margin-bottom:0;">📂</div>
                    <h3 style="display:inline;">Files in <code style="font-size:0.85rem;color:var(--accent-light);"><?= htmlspecialchars($storage_dir) ?></code></h3>
                </div>
                <span class="tag tag-emerald"><?= count($files) ?> file<?= count($files) !== 1 ? 's' : '' ?></span>
            </div>

            <?php if (empty($files)): ?>
            <p style="color:var(--text-muted);text-align:center;padding:24px;">No files yet. Create one above! ☝️</p>
            <?php else: ?>
            <div class="table-wrapper">
                <table id="files-table">
                    <thead>
                        <tr>
                            <th>Filename</th>
                            <th>Size</th>
                            <th>Last Modified</th>
                            <th>Is Writable</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($files as $file_path):
                            $fname    = basename($file_path);               // basename()
                            $fsize    = filesize($file_path);               // filesize()
                            $fmtime   = filemtime($file_path);              // filemtime()
                            $fdate    = date('M j, Y H:i:s', $fmtime);
                            $writable = is_writable($file_path) ? '✅ Yes' : '❌ No';
                            $pinfo    = pathinfo($file_path);               // pathinfo()
                        ?>
                        <tr id="file-row-<?= htmlspecialchars(str_replace('.', '-', $fname)) ?>">
                            <td>
                                <span style="font-family:'JetBrains Mono',monospace;font-size:0.85rem;">
                                    📄 <?= htmlspecialchars($fname) ?>
                                </span>
                                <div style="font-size:0.72rem;color:var(--text-muted);">
                                    ext: .<?= htmlspecialchars($pinfo['extension'] ?? 'n/a') ?>
                                </div>
                            </td>
                            <td style="font-family:'JetBrains Mono',monospace;">
                                <?= $fsize ?> B
                                <?php if ($fsize >= 1024): ?>
                                <span style="color:var(--text-muted);">(<?= round($fsize/1024, 1) ?> KB)</span>
                                <?php endif; ?>
                            </td>
                            <td style="color:var(--text-secondary);font-size:0.85rem;white-space:nowrap;">
                                <?= $fdate ?>
                            </td>
                            <td><?= $writable ?></td>
                            <td>
                                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                    <!-- View action -->
                                    <form method="POST" action="files.php" style="display:inline;">
                                        <input type="hidden" name="action" value="view">
                                        <input type="hidden" name="view_file" value="<?= htmlspecialchars($fname) ?>">
                                        <button type="submit" class="btn btn-secondary btn-sm"
                                                id="view-btn-<?= htmlspecialchars(str_replace('.', '-', $fname)) ?>">👁 View</button>
                                    </form>
                                    <!-- Delete action -->
                                    <form method="POST" action="files.php" style="display:inline;"
                                          onsubmit="return confirm('Delete <?= htmlspecialchars($fname) ?>?')">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="del_file" value="<?= htmlspecialchars($fname) ?>">
                                        <button type="submit" class="btn btn-danger btn-sm"
                                                id="del-btn-<?= htmlspecialchars(str_replace('.', '-', $fname)) ?>">🗑 Delete</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </div>

        <!-- ── View File Content ── -->
        <?php if (!empty($view_content) && !empty($view_name)): ?>
        <div class="card fade-up-3" style="margin-top:24px;" id="file-viewer-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                <h3>📄 <?= htmlspecialchars($view_name) ?></h3>
                <span class="tag tag-cyan"><?= strlen($view_content) ?> chars</span>
            </div>
            <div class="code-block" style="white-space:pre-wrap;word-break:break-word;">
                <?= htmlspecialchars($view_content) ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- ── Code Demo ── -->
        <div class="card fade-up-4" style="margin-top:24px;" id="file-code-demo">
            <div class="card-icon indigo">💻</div>
            <h3 style="margin-bottom:16px;">How File I/O Works in PHP</h3>
            <div class="code-block">
<pre style="margin:0;white-space:pre-wrap;">// Method 1: Simple (one-liner)
file_put_contents('notes.txt', "Hello World!\n", FILE_APPEND);
$content = file_get_contents('notes.txt');

// Method 2: Fine-grained (stream)
$fh = fopen('notes.txt', 'a');  // 'a' = append mode
fwrite($fh, "New line: " . date('H:i:s') . "\n");
fclose($fh);

// List files with glob()
$files = glob('data/*.txt');   // returns array of paths
foreach ($files as $path) {
    echo basename($path) . ' — ' . filesize($path) . " bytes\n";
}

// Delete a file
if (file_exists('old.txt')) {
    unlink('old.txt');   // returns true on success
}</pre>
            </div>
        </div>

    </div>
</main>

<?php require_once 'includes/footer.php'; ?>

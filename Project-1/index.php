<?php
/**
 * index.php — Dashboard / Home
 *
 * PHP Skills Demonstrated:
 *  - file_get_contents() — reading a file
 *  - json_decode()       — parsing JSON into associative arrays
 *  - htmlspecialchars()  — XSS prevention / output escaping
 *  - foreach loop        — iterating over arrays
 *  - array access        — $array['key'] syntax
 *  - include             — reusable header/footer
 *  - date()              — current date/time
 *  - PHP_EOL constant    — platform-independent newline
 */

$pageTitle = 'Dashboard';

// ── 1. Read & decode JSON file into PHP array ────────────────────────────────
$json_path = 'data/profile.json';

if (!file_exists($json_path)) {
    die('<p style="color:red;font-family:sans-serif;padding:2rem;">Error: profile.json not found.</p>');
}

$json_raw  = file_get_contents($json_path);           // Read raw JSON string
$data      = json_decode($json_raw, true);            // Decode → PHP assoc array

// ── 2. Extract data sections from the array ──────────────────────────────────
$profile = $data['profile'];   // Nested array
$skills  = $data['skills'];    // Array of skill objects
$links   = $data['links'];     // Array of link objects
$stats   = $data['stats'];     // Nested stats array

// ── 3. PHP built-in functions for extra info ─────────────────────────────────
$server_time = date('H:i:s');
$server_date = date('l, F j, Y');

require_once 'includes/header.php';
?>

<main>
    <div class="container">

        <!-- ── Hero Section ── -->
        <section class="hero fade-up">
            <div class="hero-badge">
                <span class="dot"></span>
                PHP Showcase — Live & Running
            </div>

            <h1>
                Hello, I'm<br>
                <span class="gradient-text"><?= htmlspecialchars($profile['name']) ?></span>
            </h1>

            <p><?= htmlspecialchars($profile['bio']) ?></p>

            <div class="hero-actions">
                <a href="contact.php" class="btn btn-primary" id="hero-contact-btn">📬 Get In Touch</a>
                <a href="#skills" class="btn btn-secondary" id="hero-skills-btn">⚡ View Skills</a>
            </div>
        </section>

        <!-- ── Stats Row ── -->
        <div class="stats-row fade-up-1">
            <?php
            // PHP Skill: array of key-value pairs + emoji mapping
            $stat_icons = ['projects' => '🚀', 'commits' => '📝', 'skills' => '⚡', 'coffee_cups' => '☕'];
            foreach ($stats as $key => $value):
                $label = ucwords(str_replace('_', ' ', $key)); // str_replace + ucwords
            ?>
            <div class="stat-card">
                <span class="stat-number"><?= $stat_icons[$key] ?? '' ?> <?= htmlspecialchars((string)$value) ?></span>
                <span class="stat-label"><?= htmlspecialchars($label) ?></span>
            </div>
            <?php endforeach; ?>
        </div>

        <!-- ── Skills Section ── -->
        <section id="skills" style="margin-bottom: 56px;">
            <div class="page-header" style="margin-bottom:32px;">
                <div class="badge">⚡ Skills</div>
                <h1 style="font-size:1.8rem;">Technical Proficiency</h1>
                <p>Data loaded dynamically from <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">profile.json</code> via PHP</p>
            </div>

            <div class="card fade-up-2">
                <?php
                // PHP Skill: foreach over nested array, string interpolation, arithmetic
                foreach ($skills as $index => $skill):
                    $bar_width = (int)$skill['level']; // Cast to int for safety
                    $color_class = htmlspecialchars($skill['color']);
                ?>
                <div style="margin-bottom: 20px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                        <span style="font-weight:600; font-size:0.9rem;"><?= htmlspecialchars($skill['name']) ?></span>
                        <span class="tag tag-<?= $color_class ?>"><?= $bar_width ?>%</span>
                    </div>
                    <div class="progress-bar-wrap">
                        <!-- PHP injecting a calculated CSS value -->
                        <div class="progress-bar" style="width: <?= $bar_width ?>%;"></div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- ── Links Section ── -->
        <section style="margin-bottom: 56px;">
            <div class="page-header" style="margin-bottom:32px;">
                <div class="badge">🔗 Links</div>
                <h1 style="font-size:1.8rem;">Connect With Me</h1>
            </div>
            <div style="max-width:460px;margin:0 auto;">
                <?php foreach ($links as $link):
                    $is_highlight = (bool)$link['highlight']; // Type casting to bool
                ?>
                <a href="<?= htmlspecialchars($link['url']) ?>"
                   class="card fade-up-3"
                   style="display:block;text-decoration:none;margin-bottom:12px;
                          <?= $is_highlight ? 'background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15));border-color:rgba(99,102,241,0.4);' : '' ?>"
                   target="_blank"
                   id="link-<?= $loop_i = array_search($link, $links) ?>">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <span style="font-weight:600;"><?= htmlspecialchars($link['title']) ?></span>
                        <span style="color:var(--text-muted);">→</span>
                    </div>
                </a>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- ── PHP Concepts Showcase ── -->
        <section>
            <div class="page-header" style="margin-bottom:32px;">
                <div class="badge">🐘 PHP Concepts</div>
                <h1 style="font-size:1.8rem;">What This App Showcases</h1>
                <p>Navigate each page to see PHP skills in action</p>
            </div>

            <div class="card-grid">
                <?php
                // PHP Skill: Storing structured data in an array of associative arrays
                $pages = [
                    [
                        'icon'  => '📬', 'color' => 'violet',
                        'title' => 'Contact Form',
                        'desc'  => 'POST handling, input validation with filter_var(), sessions, and file writing.',
                        'tags'  => ['$_POST', 'filter_var()', 'sessions', 'file I/O'],
                        'tag_color' => 'violet',
                        'link'  => 'contact.php',
                        'id'    => 'card-contact',
                    ],
                    [
                        'icon'  => '🔢', 'color' => 'cyan',
                        'title' => 'Calculator',
                        'desc'  => 'PHP functions, GET parameters, arithmetic operators, match expressions.',
                        'tags'  => ['functions', '$_GET', 'match', 'arithmetic'],
                        'tag_color' => 'cyan',
                        'link'  => 'calc.php',
                        'id'    => 'card-calc',
                    ],
                    [
                        'icon'  => '📊', 'color' => 'emerald',
                        'title' => 'Data Table',
                        'desc'  => 'Sorting with usort(), filtering with array_filter(), and mapping with array_map().',
                        'tags'  => ['usort()', 'array_filter()', 'array_map()', 'date()'],
                        'tag_color' => 'emerald',
                        'link'  => 'users.php',
                        'id'    => 'card-users',
                    ],
                    [
                        'icon'  => '📁', 'color' => 'amber',
                        'title' => 'File Manager',
                        'desc'  => 'Read, write and list files using fopen(), fwrite(), glob() and file_exists().',
                        'tags'  => ['fopen()', 'fwrite()', 'glob()', 'unlink()'],
                        'tag_color' => 'amber',
                        'link'  => 'files.php',
                        'id'    => 'card-files',
                    ],
                    [
                        'icon'  => '⚙️', 'color' => 'rose',
                        'title' => 'Server Info',
                        'desc'  => 'Inspect server with phpversion(), PHP_OS, $_SERVER superglobal and PHP constants.',
                        'tags'  => ['phpversion()', 'PHP_OS', '$_SERVER', 'constants'],
                        'tag_color' => 'rose',
                        'link'  => 'phpinfo_demo.php',
                        'id'    => 'card-phpinfo',
                    ],
                    [
                        'icon'  => '🏠', 'color' => 'indigo',
                        'title' => 'Dashboard (This Page)',
                        'desc'  => 'JSON file I/O, htmlspecialchars(), foreach loops, and include statements.',
                        'tags'  => ['json_decode()', 'file_get_contents()', 'foreach', 'include'],
                        'tag_color' => 'indigo',
                        'link'  => 'index.php',
                        'id'    => 'card-dashboard',
                    ],
                ];

                foreach ($pages as $page):
                ?>
                <a href="<?= $page['link'] ?>" class="card fade-up" style="text-decoration:none;" id="<?= $page['id'] ?>">
                    <div class="card-icon <?= $page['color'] ?>"><?= $page['icon'] ?></div>
                    <h3><?= htmlspecialchars($page['title']) ?></h3>
                    <p><?= htmlspecialchars($page['desc']) ?></p>
                    <div class="skill-tags">
                        <?php foreach ($page['tags'] as $tag): ?>
                        <span class="tag tag-<?= $page['tag_color'] ?>"><?= htmlspecialchars($tag) ?></span>
                        <?php endforeach; ?>
                    </div>
                </a>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- ── Live PHP Output ── -->
        <section style="margin-top:56px;">
            <div class="card fade-up-5">
                <div class="card-icon indigo">🕐</div>
                <h3 style="margin-bottom:4px;">Live Server Output</h3>
                <p style="margin-bottom:16px;">This data is generated fresh by PHP on every page load — no JavaScript needed.</p>
                <div class="code-block">
                    <div><?= '<?php echo date(\'H:i:s\'); ?>' ?> → <strong style="color:#fff;"><?= $server_time ?></strong></div>
                    <div><?= '<?php echo date(\'l, F j, Y\'); ?>' ?> → <strong style="color:#fff;"><?= $server_date ?></strong></div>
                    <div><?= '<?php echo phpversion(); ?>' ?> → <strong style="color:#fff;"><?= phpversion() ?></strong></div>
                    <div><?= '<?php echo PHP_OS; ?>' ?> → <strong style="color:#fff;"><?= PHP_OS ?></strong></div>
                    <div><?= '<?php echo count($skills); ?>' ?> → <strong style="color:#fff;"><?= count($skills) ?> skills loaded</strong></div>
                </div>
            </div>
        </section>

    </div><!-- /.container -->
</main>

<?php require_once 'includes/footer.php'; ?>
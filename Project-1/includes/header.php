<?php
/**
 * Shared Header / Navigation
 * PHP Skill: include/require, $currentPage variable for active state
 */

// Determine current page for active nav styling
$currentFile = basename($_SERVER['PHP_SELF']);

// Helper: mark current nav link as active
function navClass(string $file, string $currentFile): string {
    return ($file === $currentFile) ? 'active' : '';
}

$nav_items = [
    ['file' => 'index.php',        'icon' => '🏠', 'label' => 'Dashboard'],
    ['file' => 'contact.php',      'icon' => '📬', 'label' => 'Contact'],
    ['file' => 'calc.php',         'icon' => '🔢', 'label' => 'Calculator'],
    ['file' => 'users.php',        'icon' => '📊', 'label' => 'Data Table'],
    ['file' => 'files.php',        'icon' => '📁', 'label' => 'File Manager'],
    ['file' => 'phpinfo_demo.php', 'icon' => '⚙️', 'label' => 'Server Info'],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="PHP Skills Showcase — A premium multi-page PHP project demonstrating core PHP concepts.">
    <title><?= htmlspecialchars($pageTitle ?? 'PHP Showcase') ?> | PHP Skills</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
<div class="page-wrapper">

<nav class="navbar" role="navigation" aria-label="Main navigation">
    <div class="container">
        <a href="index.php" class="navbar-brand" id="nav-brand">
            <div class="brand-icon">🐘</div>
            <span>PHP Showcase</span>
        </a>
        <ul class="nav-links" id="main-nav">
            <?php foreach ($nav_items as $item): ?>
            <li>
                <a href="<?= $item['file'] ?>"
                   class="<?= navClass($item['file'], $currentFile) ?>"
                   id="nav-<?= str_replace('.php', '', $item['file']) ?>">
                    <?= $item['icon'] ?> <?= $item['label'] ?>
                </a>
            </li>
            <?php endforeach; ?>
        </ul>
    </div>
</nav>

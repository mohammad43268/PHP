<?php
/**
 * Shared Footer
 * PHP Skill: date(), time(), phpversion() in a reusable include
 */
?>
<footer>
    <div class="container">
        <p>
            Built with <strong>PHP <?= phpversion() ?></strong> &bull;
            Running on <strong><?= PHP_OS ?></strong> &bull;
            <?= date('D, d M Y — H:i:s T') ?>
        </p>
        <p style="margin-top:8px;">
            <a href="index.php">PHP Skills Showcase</a> — Demonstrating core PHP concepts beautifully.
        </p>
    </div>
</footer>

</div><!-- /.page-wrapper -->
</body>
</html>

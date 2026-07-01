<?php
/**
 * contact.php — Contact Form with Validation
 *
 * PHP Skills Demonstrated:
 *  - $_POST superglobal    — reading submitted form data
 *  - $_SERVER superglobal  — request method detection
 *  - filter_var()          — email validation (FILTER_VALIDATE_EMAIL)
 *  - isset() / empty()     — checking form fields
 *  - trim()                — sanitizing whitespace
 *  - strlen()              — string length validation
 *  - file_put_contents()   — writing to a log file
 *  - date()                — timestamping messages
 *  - htmlspecialchars()    — XSS prevention
 *  - Sticky form           — re-populating fields after error
 */

$pageTitle = 'Contact Form';

// ── Initialize variables ─────────────────────────────────────────────────────
$errors   = [];          // Validation errors array
$success  = false;       // Was the form submitted successfully?
$fields   = [            // Sticky form values (re-populated on error)
    'name'    => '',
    'email'   => '',
    'subject' => '',
    'message' => '',
];

// ── Process POST Request ─────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // 1. Read & sanitize inputs with trim()
    $fields['name']    = trim($_POST['name']    ?? '');
    $fields['email']   = trim($_POST['email']   ?? '');
    $fields['subject'] = trim($_POST['subject'] ?? '');
    $fields['message'] = trim($_POST['message'] ?? '');

    // 2. Validate: Name
    if (empty($fields['name'])) {
        $errors['name'] = 'Name is required.';
    } elseif (strlen($fields['name']) < 2) {
        $errors['name'] = 'Name must be at least 2 characters.';
    } elseif (strlen($fields['name']) > 60) {
        $errors['name'] = 'Name cannot exceed 60 characters.';
    }

    // 3. Validate: Email — using filter_var() with FILTER_VALIDATE_EMAIL
    if (empty($fields['email'])) {
        $errors['email'] = 'Email is required.';
    } elseif (!filter_var($fields['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Please enter a valid email address.';
    }

    // 4. Validate: Subject
    if (empty($fields['subject'])) {
        $errors['subject'] = 'Please select a subject.';
    }

    // 5. Validate: Message
    if (empty($fields['message'])) {
        $errors['message'] = 'Message cannot be empty.';
    } elseif (strlen($fields['message']) < 10) {
        $errors['message'] = 'Message must be at least 10 characters.';
    } elseif (strlen($fields['message']) > 1000) {
        $errors['message'] = 'Message cannot exceed 1000 characters.';
    }

    // 6. If no errors → save to file
    if (empty($errors)) {
        $timestamp  = date('Y-m-d H:i:s');
        $ip_address = htmlspecialchars($_SERVER['REMOTE_ADDR'] ?? 'unknown');

        // Build a formatted log entry using heredoc string syntax
        $log_entry = <<<EOT
========================================
Date:    {$timestamp}
IP:      {$ip_address}
Name:    {$fields['name']}
Email:   {$fields['email']}
Subject: {$fields['subject']}
Message:
{$fields['message']}
========================================

EOT;

        // Append to messages.txt using FILE_APPEND flag
        $log_path = 'data/messages.txt';
        file_put_contents($log_path, $log_entry, FILE_APPEND | LOCK_EX);

        $success = true;
        // Clear form fields after success
        $fields = array_fill_keys(array_keys($fields), '');
    }
}

// ── Subject options (defined as PHP array) ───────────────────────────────────
$subjects = [
    ''                 => '— Select a subject —',
    'general'          => '💬 General Enquiry',
    'collaboration'    => '🤝 Collaboration',
    'job'              => '💼 Job Opportunity',
    'feedback'         => '📣 Feedback',
    'other'            => '📎 Other',
];

require_once 'includes/header.php';
?>

<main>
    <div class="container" style="max-width:720px;">

        <div class="page-header fade-up">
            <div class="badge">📬 PHP Skills</div>
            <h1>Contact Form</h1>
            <p>Demonstrates <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">$_POST</code>, <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">filter_var()</code>, validation, and <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">file_put_contents()</code></p>
        </div>

        <?php if ($success): ?>
        <div class="alert alert-success fade-up" id="success-message" role="alert">
            ✅ <strong>Message sent!</strong> It's been saved to <code>data/messages.txt</code> on the server.
        </div>
        <?php endif; ?>

        <?php if (!empty($errors)): ?>
        <div class="alert alert-error fade-up" id="error-summary" role="alert">
            ⚠️ <strong>Please fix <?= count($errors) ?> error<?= count($errors) > 1 ? 's' : '' ?>:</strong>
            <?= implode(', ', $errors) ?>
        </div>
        <?php endif; ?>

        <!-- ── Form ── -->
        <form method="POST" action="contact.php" class="card fade-up-1" id="contact-form" novalidate>

            <!-- PHP Skill: Explaining the POST workflow inline -->
            <div class="alert alert-info" style="margin-bottom:24px;">
                💡 When submitted, PHP reads <code style="font-family:'JetBrains Mono',monospace;">$_POST['field']</code>, validates, then writes to a file using <code style="font-family:'JetBrains Mono',monospace;">file_put_contents()</code>.
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                <!-- Name -->
                <div class="form-group" style="<?= isset($errors['name']) ? 'grid-column:span 1;' : '' ?>">
                    <label class="form-label" for="name">Full Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        class="form-control"
                        placeholder="Mohammad Huzaifa"
                        value="<?= htmlspecialchars($fields['name']) ?>"
                        maxlength="60"
                        required
                    >
                    <?php if (isset($errors['name'])): ?>
                    <p style="color:var(--rose);font-size:0.8rem;margin-top:6px;">⚠ <?= htmlspecialchars($errors['name']) ?></p>
                    <?php endif; ?>
                </div>

                <!-- Email -->
                <div class="form-group">
                    <label class="form-label" for="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        class="form-control"
                        placeholder="hello@example.com"
                        value="<?= htmlspecialchars($fields['email']) ?>"
                        required
                    >
                    <?php if (isset($errors['email'])): ?>
                    <p style="color:var(--rose);font-size:0.8rem;margin-top:6px;">⚠ <?= htmlspecialchars($errors['email']) ?></p>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Subject -->
            <div class="form-group">
                <label class="form-label" for="subject">Subject</label>
                <select id="subject" name="subject" class="form-control" required>
                    <?php foreach ($subjects as $value => $label): ?>
                    <option value="<?= htmlspecialchars($value) ?>"
                        <?= ($fields['subject'] === $value) ? 'selected' : '' ?>>
                        <?= htmlspecialchars($label) ?>
                    </option>
                    <?php endforeach; ?>
                </select>
                <?php if (isset($errors['subject'])): ?>
                <p style="color:var(--rose);font-size:0.8rem;margin-top:6px;">⚠ <?= htmlspecialchars($errors['subject']) ?></p>
                <?php endif; ?>
            </div>

            <!-- Message -->
            <div class="form-group">
                <label class="form-label" for="message">Message</label>
                <textarea
                    id="message"
                    name="message"
                    class="form-control"
                    rows="5"
                    placeholder="Write your message here... (min 10 characters)"
                    maxlength="1000"
                    required
                ><?= htmlspecialchars($fields['message']) ?></textarea>
                <?php if (isset($errors['message'])): ?>
                <p style="color:var(--rose);font-size:0.8rem;margin-top:6px;">⚠ <?= htmlspecialchars($errors['message']) ?></p>
                <?php endif; ?>
                <p style="font-size:0.78rem;color:var(--text-muted);margin-top:6px;">
                    <?= strlen($fields['message']) ?>/1000 characters used
                </p>
            </div>

            <button type="submit" class="btn btn-primary" id="submit-btn" style="width:100%;">
                📨 Send Message via PHP
            </button>
        </form>

        <!-- ── Code Explanation ── -->
        <div class="card fade-up-2" style="margin-top:24px;">
            <div class="card-icon violet">💡</div>
            <h3>What PHP does behind the scenes</h3>
            <div class="code-block" style="margin-top:16px;">
<pre style="margin:0;white-space:pre-wrap;">// 1. Detect form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

  // 2. Read & sanitize
  $name  = trim($_POST['name']);
  $email = trim($_POST['email']);

  // 3. Validate email
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Invalid email!';
  }

  // 4. Save to file if valid
  if (empty($errors)) {
    file_put_contents('data/messages.txt',
      $log_entry, FILE_APPEND | LOCK_EX);
  }
}</pre>
            </div>
        </div>

        <!-- ── Recent Messages Preview ── -->
        <?php
        $log_path = 'data/messages.txt';
        $messages_raw = '';
        if (file_exists($log_path)) {
            $messages_raw = file_get_contents($log_path);
        }
        // Count messages by counting separator occurrences
        $msg_count = substr_count($messages_raw, '========================================');
        $msg_count = (int)floor($msg_count / 2); // Each message has 2 lines of ===
        ?>
        <div class="card fade-up-3" style="margin-top:24px;">
            <div class="card-icon emerald">📂</div>
            <h3>Messages Log — <code style="font-size:0.8rem;color:var(--accent-light);">data/messages.txt</code></h3>
            <p style="margin:8px 0 16px;">
                <?= $msg_count ?> message<?= $msg_count !== 1 ? 's' : '' ?> saved on server.
                File size: <strong><?= file_exists($log_path) ? number_format(filesize($log_path)) : '0' ?> bytes</strong>
            </p>
            <?php if (!empty($messages_raw)): ?>
            <div class="code-block" style="max-height:200px;overflow-y:auto;font-size:0.78rem;">
                <?= htmlspecialchars($messages_raw) ?>
            </div>
            <?php else: ?>
            <p style="color:var(--text-muted);font-style:italic;">No messages yet. Submit the form above!</p>
            <?php endif; ?>
        </div>

    </div>
</main>

<?php require_once 'includes/footer.php'; ?>

<?php
/**
 * calc.php — PHP Calculator
 *
 * PHP Skills Demonstrated:
 *  - $_GET superglobal     — reading URL query parameters
 *  - Custom functions      — define and call PHP functions
 *  - match expression      — modern PHP 8 switch-like construct
 *  - Type juggling         — PHP's loose typing in action
 *  - is_numeric()          — input validation
 *  - round()               — rounding floats
 *  - intdiv()              — integer division
 *  - fmod()                — floating point modulo
 *  - abs(), sqrt(), pow()  — math built-in functions
 *  - number_format()       — formatting numbers
 *  - Ternary operator      — compact if/else
 */

$pageTitle = 'PHP Calculator';

// ── Define a PHP function for each operation ─────────────────────────────────
/**
 * Performs the selected arithmetic operation.
 * Returns [result, expression_string, error]
 */
function calculate(float $a, float $b, string $op): array
{
    $expr  = '';
    $result = null;
    $error  = '';

    // PHP 8 match expression (strict — no type coercion)
    switch ($op) {
        case 'add':
            $result = $a + $b;
            $expr   = "{$a} + {$b}";
            break;
        case 'sub':
            $result = $a - $b;
            $expr   = "{$a} − {$b}";
            break;
        case 'mul':
            $result = $a * $b;
            $expr   = "{$a} × {$b}";
            break;
        case 'div':
            if ($b == 0) {
                $error = "Division by zero is undefined! 🚫";
            } else {
                $result = $a / $b;
                $expr   = "{$a} ÷ {$b}";
            }
            break;
        case 'mod':
            if ($b == 0) {
                $error = "Modulo by zero is undefined! 🚫";
            } else {
                $result = fmod($a, $b);   // fmod() for float modulo
                $expr   = "{$a} % {$b}";
            }
            break;
        case 'pow':
            $result = pow($a, $b);
            $expr   = "{$a} ^ {$b}";
            break;
        case 'sqrt':
            if ($a < 0) {
                $error = "Cannot take √ of a negative number! 🚫";
            } else {
                $result = sqrt($a);
                $expr   = "√{$a}";
            }
            break;
        case 'abs':
            $result = abs($a);
            $expr   = "|{$a}|";
            break;
        default:
            $error = "Unknown operation.";
    }

    return ['result' => $result, 'expr' => $expr, 'error' => $error];
}

// ── Retrieve & Validate GET parameters ───────────────────────────────────────
$num_a  = $_GET['num_a']  ?? '';
$num_b  = $_GET['num_b']  ?? '';
$op     = $_GET['op']     ?? '';
$result_data = null;
$calc_error  = '';

$has_input = isset($_GET['op']);

if ($has_input) {
    // Validate: must be numeric
    if ($op !== 'sqrt' && $op !== 'abs') {
        // Two operand ops
        if (!is_numeric($num_a) || !is_numeric($num_b)) {
            $calc_error = 'Both inputs must be valid numbers.';
        } else {
            $result_data = calculate((float)$num_a, (float)$num_b, $op);
            if ($result_data['error']) {
                $calc_error = $result_data['error'];
            }
        }
    } else {
        // Single operand ops
        if (!is_numeric($num_a)) {
            $calc_error = 'Input A must be a valid number.';
        } else {
            $result_data = calculate((float)$num_a, 0, $op);
            if ($result_data['error']) {
                $calc_error = $result_data['error'];
            }
        }
    }
}

// Operations definition array
$operations = [
    ['value' => 'add',  'label' => '+ Add',         'symbol' => '+',  'color' => 'indigo'],
    ['value' => 'sub',  'label' => '− Subtract',    'symbol' => '−',  'color' => 'violet'],
    ['value' => 'mul',  'label' => '× Multiply',    'symbol' => '×',  'color' => 'cyan'],
    ['value' => 'div',  'label' => '÷ Divide',      'symbol' => '÷',  'color' => 'emerald'],
    ['value' => 'mod',  'label' => '% Modulo',      'symbol' => '%',  'color' => 'amber'],
    ['value' => 'pow',  'label' => '^ Power',       'symbol' => '^',  'color' => 'rose'],
    ['value' => 'sqrt', 'label' => '√ Square Root', 'symbol' => '√',  'color' => 'cyan'],
    ['value' => 'abs',  'label' => '| | Absolute',  'symbol' => '||', 'color' => 'violet'],
];

$single_ops = ['sqrt', 'abs'];

require_once 'includes/header.php';
?>

<main>
    <div class="container" style="max-width:820px;">

        <div class="page-header fade-up">
            <div class="badge">🔢 PHP Skills</div>
            <h1>PHP Calculator</h1>
            <p>Demonstrates <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">$_GET</code>, custom <strong>functions</strong>, <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">is_numeric()</code>, and PHP math functions</p>
        </div>

        <!-- ── Calculator Form ── -->
        <form method="GET" action="calc.php" class="card fade-up-1" id="calculator-form">

            <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:end;margin-bottom:20px;">
                <!-- Number A -->
                <div class="form-group" style="margin-bottom:0;">
                    <label class="form-label" for="num_a">Number A</label>
                    <input type="text" id="num_a" name="num_a" class="form-control"
                           placeholder="e.g. 42"
                           value="<?= htmlspecialchars($num_a) ?>">
                </div>

                <!-- Operator display -->
                <div style="text-align:center;padding-bottom:4px;">
                    <span style="font-size:2rem;color:var(--accent-light);font-weight:700;">
                        <?php
                        // PHP Skill: ternary + array search to find symbol
                        $current_op_data = array_filter($operations, fn($o) => $o['value'] === $op);
                        $current_symbol  = !empty($current_op_data) ? current($current_op_data)['symbol'] : '?';
                        echo htmlspecialchars($current_symbol);
                        ?>
                    </span>
                </div>

                <!-- Number B -->
                <div class="form-group" style="margin-bottom:0;" id="num_b_group">
                    <label class="form-label" for="num_b">Number B</label>
                    <input type="text" id="num_b" name="num_b" class="form-control"
                           placeholder="e.g. 7"
                           value="<?= htmlspecialchars($num_b) ?>"
                           <?= in_array($op, $single_ops) ? 'disabled style="opacity:0.3;"' : '' ?>>
                </div>
            </div>

            <!-- Operation Selection -->
            <div class="form-group">
                <label class="form-label">Select Operation</label>
                <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
                    <?php foreach ($operations as $oper): ?>
                    <label style="cursor:pointer;">
                        <input type="radio" name="op" value="<?= $oper['value'] ?>"
                               <?= ($op === $oper['value']) ? 'checked' : '' ?>
                               style="display:none;">
                        <span class="tag tag-<?= $oper['color'] ?>"
                              style="cursor:pointer;padding:7px 14px;font-size:0.85rem;
                                     <?= ($op === $oper['value']) ? 'box-shadow:0 0 0 2px var(--accent);' : '' ?>">
                            <?= htmlspecialchars($oper['label']) ?>
                        </span>
                    </label>
                    <?php endforeach; ?>
                </div>
            </div>

            <button type="submit" class="btn btn-primary" id="calc-submit-btn" style="width:100%;margin-top:8px;">
                ⚡ Calculate with PHP
            </button>
        </form>

        <!-- ── Result ── -->
        <?php if ($has_input): ?>

        <?php if ($calc_error): ?>
        <div class="alert alert-error fade-up" id="calc-error" role="alert">❌ <?= htmlspecialchars($calc_error) ?></div>
        <?php elseif ($result_data && $result_data['result'] !== null): ?>
        <div class="result-box fade-up" id="calc-result">
            <div style="font-size:0.9rem;color:var(--text-muted);margin-bottom:8px;font-family:'JetBrains Mono',monospace;">
                <?= htmlspecialchars($result_data['expr']) ?>
            </div>
            <div class="result-number">
                <?php
                $r = $result_data['result'];
                // Format: if it's a whole number, show as int; otherwise round to 6 dp
                echo is_float($r) && $r != floor($r)
                    ? number_format($r, 6, '.', ',')
                    : number_format($r, 0, '.', ',');
                ?>
            </div>
            <div class="result-label">
                <?php
                // Additional info using PHP math functions
                echo "abs = " . abs($r) . " &bull; ";
                if ($r > 0) echo "√ ≈ " . number_format(sqrt($r), 4);
                else echo "floor = " . floor($r);
                ?>
            </div>
        </div>
        <?php endif; ?>

        <?php endif; ?>

        <!-- ── PHP Functions showcase ── -->
        <div class="card fade-up-2" style="margin-top:24px;">
            <div class="card-icon cyan">🧮</div>
            <h3 style="margin-bottom:16px;">PHP Math Functions Used</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
                <?php
                $math_funcs = [
                    ['fn' => 'abs($n)',          'desc' => 'Absolute value',        'color' => 'indigo'],
                    ['fn' => 'sqrt($n)',          'desc' => 'Square root',           'color' => 'violet'],
                    ['fn' => 'pow($a, $b)',       'desc' => 'Power / exponent',      'color' => 'cyan'],
                    ['fn' => 'fmod($a, $b)',      'desc' => 'Float modulo',          'color' => 'emerald'],
                    ['fn' => 'round($n, $dp)',    'desc' => 'Round to decimals',     'color' => 'amber'],
                    ['fn' => 'floor($n)',         'desc' => 'Round down',            'color' => 'rose'],
                    ['fn' => 'ceil($n)',          'desc' => 'Round up',              'color' => 'indigo'],
                    ['fn' => 'number_format($n)', 'desc' => 'Format with commas',    'color' => 'violet'],
                    ['fn' => 'is_numeric($v)',    'desc' => 'Check if numeric',      'color' => 'cyan'],
                    ['fn' => 'intdiv($a, $b)',    'desc' => 'Integer division',      'color' => 'emerald'],
                    ['fn' => 'min(...$arr)',       'desc' => 'Minimum value',         'color' => 'amber'],
                    ['fn' => 'max(...$arr)',       'desc' => 'Maximum value',         'color' => 'rose'],
                ];
                foreach ($math_funcs as $f):
                ?>
                <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
                    <code style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;color:var(--accent-light);">
                        <?= htmlspecialchars($f['fn']) ?>
                    </code>
                    <p style="font-size:0.78rem;color:var(--text-muted);margin-top:5px;"><?= htmlspecialchars($f['desc']) ?></p>
                </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- ── Type Juggling Demo ── -->
        <div class="card fade-up-3" style="margin-top:24px;">
            <div class="card-icon amber">⚠️</div>
            <h3 style="margin-bottom:8px;">PHP Type Juggling Demo</h3>
            <p style="margin-bottom:16px;color:var(--text-secondary);">PHP automatically converts types. Here's what happens behind the scenes:</p>
            <div class="code-block">
                <?php
                // Live type juggling examples
                $examples = [
                    ['expr' => '"5" + 3',      'val' => "5" + 3,      'type' => gettype("5" + 3)],
                    ['expr' => '"5.5" + 1',    'val' => "5.5" + 1,    'type' => gettype("5.5" + 1)],
                    ['expr' => 'true + true',  'val' => true + true,  'type' => gettype(true + true)],
                    ['expr' => '"10" * "3"',   'val' => "10" * "3",   'type' => gettype("10" * "3")],
                    ['expr' => '(int)"42abc"', 'val' => (int)"42abc", 'type' => gettype((int)"42abc")],
                    ['expr' => '(bool)0',      'val' => var_export((bool)0, true), 'type' => 'bool'],
                ];
                foreach ($examples as $ex):
                    echo htmlspecialchars("{$ex['expr']}") . " → ";
                    echo "<strong style='color:#fff;'>" . htmlspecialchars((string)$ex['val']) . "</strong>";
                    echo " <span style='color:var(--text-muted);'>(type: {$ex['type']})</span>\n";
                endforeach;
                ?>
            </div>
        </div>

    </div>
</main>

<script>
// Highlight selected radio label
document.querySelectorAll('input[name="op"]').forEach(radio => {
    radio.addEventListener('change', function() {
        document.querySelectorAll('input[name="op"] + span').forEach(s => s.style.boxShadow = '');
        this.nextElementSibling.style.boxShadow = '0 0 0 2px var(--accent)';

        // Disable Number B for single-operand operations
        const singleOps = ['sqrt', 'abs'];
        const numB = document.getElementById('num_b');
        if (singleOps.includes(this.value)) {
            numB.disabled = true;
            numB.style.opacity = '0.3';
        } else {
            numB.disabled = false;
            numB.style.opacity = '1';
        }
    });
});
</script>

<?php require_once 'includes/footer.php'; ?>

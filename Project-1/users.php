<?php
/**
 * users.php — Data Table with Sorting & Filtering
 *
 * PHP Skills Demonstrated:
 *  - Defining arrays of associative arrays (in-memory "database")
 *  - usort()        — custom sort using a comparison callback
 *  - array_filter() — filter elements by condition
 *  - array_map()    — transform each element
 *  - array_column() — extract a column from a 2D array
 *  - array_unique() — deduplicate values
 *  - count()        — count array elements
 *  - date() + strtotime() — date manipulation
 *  - sprintf()      — formatted strings
 *  - in_array()     — check value existence
 *  - $_GET superglobal — URL query params for sort/filter
 */

$pageTitle = 'Data Table';

// ── In-memory dataset (simulating a database result) ─────────────────────────
$users_raw = [
    ['id'=>1,  'name'=>'Alice Johnson',   'role'=>'Frontend Dev',  'country'=>'USA',     'score'=>92, 'status'=>'active',   'joined'=>'2023-03-15'],
    ['id'=>2,  'name'=>'Bob Martinez',    'role'=>'Backend Dev',   'country'=>'Spain',   'score'=>85, 'status'=>'active',   'joined'=>'2022-11-20'],
    ['id'=>3,  'name'=>'Chen Wei',        'role'=>'DevOps',        'country'=>'China',   'score'=>78, 'status'=>'inactive', 'joined'=>'2023-07-02'],
    ['id'=>4,  'name'=>'Diana Patel',     'role'=>'UI Designer',   'country'=>'India',   'score'=>95, 'status'=>'active',   'joined'=>'2024-01-10'],
    ['id'=>5,  'name'=>'Ethan Brooks',    'role'=>'Backend Dev',   'country'=>'UK',      'score'=>67, 'status'=>'inactive', 'joined'=>'2022-05-30'],
    ['id'=>6,  'name'=>'Fatima Al-Sayed', 'role'=>'Full-Stack',   'country'=>'UAE',     'score'=>88, 'status'=>'active',   'joined'=>'2023-09-14'],
    ['id'=>7,  'name'=>'Gabriel Silva',   'role'=>'Frontend Dev',  'country'=>'Brazil',  'score'=>74, 'status'=>'active',   'joined'=>'2024-03-22'],
    ['id'=>8,  'name'=>'Hannah Schmidt',  'role'=>'QA Engineer',   'country'=>'Germany', 'score'=>82, 'status'=>'active',   'joined'=>'2023-01-05'],
    ['id'=>9,  'name'=>'Ivan Petrov',     'role'=>'DevOps',        'country'=>'Russia',  'score'=>70, 'status'=>'inactive', 'joined'=>'2022-08-17'],
    ['id'=>10, 'name'=>'Jiya Sharma',     'role'=>'UI Designer',   'country'=>'India',   'score'=>91, 'status'=>'active',   'joined'=>'2024-05-01'],
    ['id'=>11, 'name'=>'Kevin O\'Brien',  'role'=>'Full-Stack',   'country'=>'Ireland', 'score'=>83, 'status'=>'active',   'joined'=>'2023-06-28'],
    ['id'=>12, 'name'=>'Lena Kowalski',   'role'=>'Backend Dev',   'country'=>'Poland',  'score'=>77, 'status'=>'inactive', 'joined'=>'2022-12-09'],
];

// ── 1. array_map() — Add computed fields to every row ────────────────────────
$users = array_map(function(array $user): array {
    // Days since joining using strtotime()
    $joined_ts = strtotime($user['joined']);
    $user['days_since'] = (int)floor((time() - $joined_ts) / 86400);

    // Grade using a nested ternary (PHP skill: complex ternaries)
    $s = $user['score'];
    $user['grade'] = $s >= 90 ? 'A' : ($s >= 80 ? 'B' : ($s >= 70 ? 'C' : 'D'));

    return $user;
}, $users_raw);

// ── 2. $_GET: Read sort & filter preferences ──────────────────────────────────
$sort_by     = $_GET['sort']   ?? 'id';        // Default sort by ID
$sort_dir    = $_GET['dir']    ?? 'asc';
$filter_role = $_GET['role']   ?? 'all';
$filter_stat = $_GET['status'] ?? 'all';

// ── 3. array_filter() — Filter by role and status ────────────────────────────
$filtered = array_filter($users, function(array $u) use ($filter_role, $filter_stat): bool {
    $role_ok   = ($filter_role === 'all') || ($u['role'] === $filter_role);
    $status_ok = ($filter_stat === 'all') || ($u['status'] === $filter_stat);
    return $role_ok && $status_ok;
});

// ── 4. usort() — Sort by selected column ─────────────────────────────────────
$allowed_sorts = ['id', 'name', 'score', 'days_since', 'grade'];
if (!in_array($sort_by, $allowed_sorts)) $sort_by = 'id';   // Whitelist validation

usort($filtered, function(array $a, array $b) use ($sort_by, $sort_dir): int {
    $cmp = is_string($a[$sort_by])
        ? strcmp($a[$sort_by], $b[$sort_by])   // String comparison
        : ($a[$sort_by] <=> $b[$sort_by]);      // Spaceship operator for numbers
    return $sort_dir === 'desc' ? -$cmp : $cmp;
});

// ── 5. array_column() + array_unique() — get distinct roles for filter ────────
$all_roles = array_unique(array_column($users_raw, 'role'));
sort($all_roles);

// ── 6. Aggregate stats with array_map / array_column ─────────────────────────
$all_scores = array_column($users, 'score');
$avg_score  = count($all_scores) > 0 ? round(array_sum($all_scores) / count($all_scores), 1) : 0;
$max_score  = max($all_scores);
$min_score  = min($all_scores);
$active_count = count(array_filter($users, fn($u) => $u['status'] === 'active'));

// Helper: build query string for sort links
function sortLink(string $col, string $currentSort, string $currentDir, string $role, string $status): string {
    $newDir = ($col === $currentSort && $currentDir === 'asc') ? 'desc' : 'asc';
    return sprintf(
        '?sort=%s&dir=%s&role=%s&status=%s',
        urlencode($col), $newDir,
        urlencode($role), urlencode($status)
    );
}

require_once 'includes/header.php';
?>

<main>
    <div class="container">

        <div class="page-header fade-up">
            <div class="badge">📊 PHP Skills</div>
            <h1>Data Table</h1>
            <p>Demonstrates <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">usort()</code>, <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">array_filter()</code>, <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">array_map()</code>, and <code style="color:var(--accent-light);font-family:'JetBrains Mono',monospace;">array_column()</code></p>
        </div>

        <!-- ── Aggregate Stats ── -->
        <div class="stats-row fade-up-1">
            <div class="stat-card">
                <span class="stat-number"><?= count($users) ?></span>
                <span class="stat-label">Total Users</span>
            </div>
            <div class="stat-card">
                <span class="stat-number"><?= $active_count ?></span>
                <span class="stat-label">Active</span>
            </div>
            <div class="stat-card">
                <span class="stat-number"><?= $avg_score ?></span>
                <span class="stat-label">Avg Score</span>
            </div>
            <div class="stat-card">
                <span class="stat-number"><?= $max_score ?></span>
                <span class="stat-label">Top Score</span>
            </div>
            <div class="stat-card">
                <span class="stat-number"><?= count($filtered) ?></span>
                <span class="stat-label">Showing</span>
            </div>
        </div>

        <!-- ── Filters ── -->
        <form method="GET" action="users.php" class="card fade-up-2" style="margin-bottom:20px;" id="filter-form">
            <input type="hidden" name="sort" value="<?= htmlspecialchars($sort_by) ?>">
            <input type="hidden" name="dir"  value="<?= htmlspecialchars($sort_dir) ?>">

            <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end;">
                <div class="form-group" style="flex:1;min-width:160px;margin-bottom:0;">
                    <label class="form-label" for="filter-role">Filter by Role</label>
                    <select name="role" id="filter-role" class="form-control">
                        <option value="all" <?= $filter_role === 'all' ? 'selected' : '' ?>>All Roles</option>
                        <?php foreach ($all_roles as $r): ?>
                        <option value="<?= htmlspecialchars($r) ?>" <?= $filter_role === $r ? 'selected' : '' ?>>
                            <?= htmlspecialchars($r) ?>
                        </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="form-group" style="flex:1;min-width:160px;margin-bottom:0;">
                    <label class="form-label" for="filter-status">Filter by Status</label>
                    <select name="status" id="filter-status" class="form-control">
                        <option value="all"     <?= $filter_stat === 'all'      ? 'selected' : '' ?>>All Statuses</option>
                        <option value="active"  <?= $filter_stat === 'active'   ? 'selected' : '' ?>>🟢 Active</option>
                        <option value="inactive"<?= $filter_stat === 'inactive' ? 'selected' : '' ?>>🔴 Inactive</option>
                    </select>
                </div>

                <button type="submit" class="btn btn-primary btn-sm" id="apply-filter-btn">Apply Filter</button>
                <a href="users.php" class="btn btn-secondary btn-sm" id="reset-filter-btn">Reset</a>
            </div>
        </form>

        <!-- ── Data Table ── -->
        <div class="table-wrapper fade-up-3">
            <table id="users-table">
                <thead>
                    <tr>
                        <?php
                        $cols = [
                            'id'         => '#',
                            'name'       => 'Name',
                            'role'       => 'Role',
                            'country'    => 'Country',
                            'score'      => 'Score',
                            'grade'      => 'Grade',
                            'status'     => 'Status',
                            'days_since' => 'Days Active',
                            'joined'     => 'Joined',
                        ];
                        foreach ($cols as $key => $label):
                            $is_sortable = in_array($key, $allowed_sorts);
                            $is_current  = ($sort_by === $key);
                            $arrow       = $is_current ? ($sort_dir === 'asc' ? ' ↑' : ' ↓') : '';
                        ?>
                        <th <?= $is_sortable ? '' : '' ?>>
                            <?php if ($is_sortable): ?>
                            <a href="<?= sortLink($key, $sort_by, $sort_dir, $filter_role, $filter_stat) ?>"
                               style="color:<?= $is_current ? 'var(--accent-light)' : 'inherit' ?>;text-decoration:none;">
                                <?= htmlspecialchars($label) ?><?= $arrow ?>
                            </a>
                            <?php else: ?>
                            <?= htmlspecialchars($label) ?>
                            <?php endif; ?>
                        </th>
                        <?php endforeach; ?>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($filtered)): ?>
                    <tr>
                        <td colspan="9" style="text-align:center;color:var(--text-muted);padding:32px;">
                            No users match the current filters.
                        </td>
                    </tr>
                    <?php else: ?>
                    <?php foreach ($filtered as $user): ?>
                    <tr id="user-row-<?= $user['id'] ?>">
                        <td style="color:var(--text-muted);font-family:'JetBrains Mono',monospace;">#<?= $user['id'] ?></td>
                        <td style="font-weight:600;"><?= htmlspecialchars($user['name']) ?></td>
                        <td>
                            <span class="tag tag-indigo"><?= htmlspecialchars($user['role']) ?></span>
                        </td>
                        <td><?= htmlspecialchars($user['country']) ?></td>
                        <td>
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-weight:700;min-width:28px;"><?= $user['score'] ?></span>
                                <div class="progress-bar-wrap" style="flex:1;height:6px;">
                                    <div class="progress-bar" style="width:<?= $user['score'] ?>%;"></div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <?php
                            $grade_colors = ['A' => 'emerald', 'B' => 'cyan', 'C' => 'amber', 'D' => 'rose'];
                            $gc = $grade_colors[$user['grade']] ?? 'indigo';
                            ?>
                            <span class="tag tag-<?= $gc ?>"><?= $user['grade'] ?></span>
                        </td>
                        <td>
                            <?php if ($user['status'] === 'active'): ?>
                            <span class="pill pill-green">🟢 Active</span>
                            <?php else: ?>
                            <span class="pill pill-rose">🔴 Inactive</span>
                            <?php endif; ?>
                        </td>
                        <td style="font-family:'JetBrains Mono',monospace;color:var(--text-secondary);">
                            <?= number_format($user['days_since']) ?>d
                        </td>
                        <td style="color:var(--text-secondary);white-space:nowrap;">
                            <?= htmlspecialchars(date('M j, Y', strtotime($user['joined']))) ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- ── PHP Functions Used ── -->
        <div class="card fade-up-4" style="margin-top:24px;">
            <div class="card-icon emerald">🔧</div>
            <h3 style="margin-bottom:16px;">Array Functions Used on This Page</h3>
            <div class="code-block">
<pre style="margin:0;white-space:pre-wrap;"><?php
$function_demos = [
    'array_map($fn, $users)'                => count($users) . ' users enriched with computed fields',
    'array_filter($users, $condition)'       => count($filtered) . ' users match current filters',
    'usort($arr, $compareFn)'               => "Sorted by '{$sort_by}' ({$sort_dir})",
    'array_column($users, "role")'          => implode(', ', array_slice($all_roles, 0, 3)) . '...',
    'array_unique($roles)'                  => count($all_roles) . ' distinct roles found',
    'array_sum($scores)'                    => array_sum($all_scores) . ' total points',
    'count($filtered)'                      => count($filtered) . ' rows displayed',
    'in_array($sort, $whitelist)'           => 'Validates sort column for security',
];
foreach ($function_demos as $fn => $result) {
    echo htmlspecialchars($fn) . "\n  → " . htmlspecialchars($result) . "\n\n";
}
?></pre>
            </div>
        </div>

    </div>
</main>

<?php require_once 'includes/footer.php'; ?>

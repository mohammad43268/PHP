<?php
/**
 * DevForge AI – SEO Website Analyzer API
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $data = Storage::read('seo-history');
    apiSuccess($data['analyses'] ?? []);
}

if ($method === 'POST') {
    Security::validateCsrf();
    $body = Security::getJsonBody();
    $url  = trim($body['url'] ?? '');

    if (empty($url)) apiError('URL is required');
    if (!Security::isValidUrl($url)) apiError('Invalid URL format');

    // Fetch the page
    $ctx = stream_context_create(['http' => [
        'method'     => 'GET',
        'user_agent' => 'DevForge-AI-SEO-Analyzer/1.0',
        'timeout'    => 15,
        'ignore_errors' => true,
        'follow_location' => true,
        'max_redirects'   => 3,
        'header'     => "Accept: text/html,application/xhtml+xml\r\n",
    ]]);

    $html = @file_get_contents($url, false, $ctx);

    // Get response headers
    $responseHeaders = $http_response_header ?? [];
    $statusCode = 0;
    if (!empty($responseHeaders[0])) {
        preg_match('/HTTP\/\d\.\d\s+(\d+)/', $responseHeaders[0], $m);
        $statusCode = (int)($m[1] ?? 0);
    }

    if ($html === false || empty($html)) {
        apiError('Could not fetch URL. Check if it is accessible.');
    }

    // Parse with DOMDocument
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadHTML($html, LIBXML_NOWARNING | LIBXML_NOERROR);
    libxml_clear_errors();
    $xpath = new DOMXPath($dom);

    // ── Title ─────────────────────────────────────────────────────────────────
    $title     = $xpath->query('//title')->item(0)?->textContent ?? '';
    $titleLen  = mb_strlen($title);

    // ── Meta description ───────────────────────────────────────────────────────
    $metaDesc  = '';
    foreach ($xpath->query("//meta[@name='description']") as $node) {
        $metaDesc = $node->getAttribute('content');
        break;
    }

    // ── Open Graph ────────────────────────────────────────────────────────────
    $og = [];
    foreach ($xpath->query("//meta[starts-with(@property,'og:')]") as $node) {
        $og[$node->getAttribute('property')] = $node->getAttribute('content');
    }

    // ── Twitter tags ──────────────────────────────────────────────────────────
    $twitter = [];
    foreach ($xpath->query("//meta[starts-with(@name,'twitter:')]") as $node) {
        $twitter[$node->getAttribute('name')] = $node->getAttribute('content');
    }

    // ── Headings ──────────────────────────────────────────────────────────────
    $headings = [];
    foreach (['h1','h2','h3','h4','h5','h6'] as $tag) {
        $nodes = $xpath->query("//{$tag}");
        $list  = [];
        foreach ($nodes as $n) $list[] = trim($n->textContent);
        $headings[$tag] = $list;
    }

    // ── Images ────────────────────────────────────────────────────────────────
    $totalImages  = 0;
    $missingAlt   = 0;
    foreach ($xpath->query('//img') as $img) {
        $totalImages++;
        if (!$img->hasAttribute('alt') || trim($img->getAttribute('alt')) === '') {
            $missingAlt++;
        }
    }

    // ── Links ─────────────────────────────────────────────────────────────────
    $internal = 0;
    $external = 0;
    $host = parse_url($url, PHP_URL_HOST) ?? '';
    foreach ($xpath->query('//a[@href]') as $a) {
        $href = $a->getAttribute('href');
        if (str_starts_with($href, 'http')) {
            $linkHost = parse_url($href, PHP_URL_HOST) ?? '';
            if ($linkHost === $host) $internal++;
            else $external++;
        } else {
            $internal++;
        }
    }

    // ── Security headers ──────────────────────────────────────────────────────
    $secHeaders = [];
    $checkHeaders = ['x-frame-options', 'content-security-policy', 'x-content-type-options',
                     'strict-transport-security', 'x-xss-protection', 'referrer-policy'];
    foreach ($responseHeaders as $h) {
        $lower = strtolower($h);
        foreach ($checkHeaders as $sh) {
            if (str_starts_with($lower, $sh)) {
                $secHeaders[$sh] = true;
            }
        }
    }
    foreach ($checkHeaders as $sh) {
        if (!isset($secHeaders[$sh])) $secHeaders[$sh] = false;
    }

    // ── Performance hints ─────────────────────────────────────────────────────
    $htmlSize = strlen($html);
    $hints    = [];
    if ($htmlSize > 100000)       $hints[] = 'Large HTML page (>100KB)';
    if (empty($title))            $hints[] = 'Missing <title> tag';
    if ($titleLen > 60)           $hints[] = 'Title too long (>60 chars)';
    if (empty($metaDesc))         $hints[] = 'Missing meta description';
    if (strlen($metaDesc) > 160)  $hints[] = 'Meta description too long (>160 chars)';
    if (count($headings['h1'] ?? []) !== 1) $hints[] = 'Should have exactly one H1 tag';
    if ($missingAlt > 0)          $hints[] = "{$missingAlt} image(s) missing alt text";
    if (!isset($og['og:title']))  $hints[] = 'Missing og:title (Open Graph)';
    if (!isset($og['og:image']))  $hints[] = 'Missing og:image (Open Graph)';

    // ── SEO Score (0-100) ─────────────────────────────────────────────────────
    $score = 100;
    if (empty($title))               $score -= 20;
    elseif ($titleLen > 60 || $titleLen < 10) $score -= 5;
    if (empty($metaDesc))            $score -= 15;
    elseif (strlen($metaDesc) > 160) $score -= 5;
    if (count($headings['h1'] ?? []) !== 1) $score -= 10;
    if ($missingAlt > 0)             $score -= min(10, $missingAlt * 2);
    if (empty($og))                  $score -= 10;
    if (empty($twitter))             $score -= 5;
    $secScore = count(array_filter($secHeaders));
    $score   -= (count($checkHeaders) - $secScore) * 2;
    $score    = max(0, min(100, $score));

    $analysis = [
        'id'           => uniqid('seo_', true),
        'url'          => $url,
        'status_code'  => $statusCode,
        'html_size'    => $htmlSize,
        'title'        => $title,
        'title_length' => $titleLen,
        'meta_desc'    => $metaDesc,
        'meta_desc_length' => mb_strlen($metaDesc),
        'open_graph'   => $og,
        'twitter'      => $twitter,
        'headings'     => $headings,
        'images'       => ['total' => $totalImages, 'missing_alt' => $missingAlt],
        'links'        => ['internal' => $internal, 'external' => $external],
        'security_headers' => $secHeaders,
        'performance_hints' => $hints,
        'seo_score'    => $score,
        'analyzed_at'  => time(),
    ];

    // Save to history
    $data = Storage::read('seo-history');
    $analyses = $data['analyses'] ?? [];
    if (count($analyses) >= 50) $analyses = array_slice($analyses, -49);
    $analyses[] = $analysis;
    Storage::write('seo-history', ['analyses' => $analyses]);

    Logger::activity('seo_analysis', 'web-analyzer', ['url' => $url, 'score' => $score]);
    apiSuccess($analysis);
}

apiError('Method not allowed', 405);

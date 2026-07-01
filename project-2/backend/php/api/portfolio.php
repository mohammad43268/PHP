<?php
/**
 * DevForge AI – Portfolio API
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    apiSuccess(Storage::read('portfolio'));
}

if ($method === 'POST') {
    Security::validateCsrf();
    $body = Security::getJsonBody();
    if (empty($body)) apiError('No data');

    $data = Storage::read('portfolio');
    $portfolios = $data['portfolios'] ?? [];
    $portfolios[] = array_merge($body, ['id' => uniqid('port_', true), 'saved' => time()]);
    if (count($portfolios) > 20) $portfolios = array_slice($portfolios, -20);
    Storage::write('portfolio', ['portfolios' => $portfolios]);

    Logger::activity('portfolio_saved', 'portfolio');
    apiSuccess(null, 'Portfolio saved');
}

apiError('Method not allowed', 405);

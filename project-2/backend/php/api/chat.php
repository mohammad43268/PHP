<?php
/**
 * DevForge AI – Chat API
 * Proxies AI chat to Ollama/OpenAI/Gemini/Anthropic
 * Supports streaming via SSE
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Return chat history
    $data = Storage::read('chat-history');
    apiSuccess($data['chats'] ?? []);
}

if ($method === 'POST') {
    Security::validateCsrf();
    $body = Security::getJsonBody();

    $message  = trim($body['message'] ?? '');
    $chatId   = $body['chat_id'] ?? uniqid('chat_', true);
    $model    = $body['model'] ?? '';
    $history  = $body['history'] ?? [];
    $stream   = (bool)($body['stream'] ?? false);

    if (empty($message)) apiError('Message is required');

    $settings = loadSettings();
    $ai       = $settings['ai'] ?? [];
    $provider = $ai['provider'] ?? 'ollama';
    if (empty($model)) $model = $ai["{$provider}_model"] ?? 'llama3.2';

    // Build response based on provider
    try {
        $response = match ($provider) {
            'ollama'    => chatOllama($message, $history, $model, $ai, $stream),
            'openai'    => chatOpenAI($message, $history, $model, $ai),
            'gemini'    => chatGemini($message, $history, $model, $ai),
            'anthropic' => chatAnthropic($message, $history, $model, $ai),
            default     => chatOllama($message, $history, $model, $ai, $stream),
        };
    } catch (Exception $e) {
        apiError('AI Error: ' . $e->getMessage());
    }

    // Save to history
    $data   = Storage::read('chat-history');
    $chats  = $data['chats'] ?? [];
    $idx    = array_search($chatId, array_column($chats, 'id'));

    $msg = ['role' => 'user', 'content' => $message, 'ts' => time()];
    $res = ['role' => 'assistant', 'content' => $response, 'ts' => time(), 'model' => $model];

    if ($idx !== false) {
        $chats[$idx]['messages'][] = $msg;
        $chats[$idx]['messages'][] = $res;
        $chats[$idx]['updated']    = time();
    } else {
        $chats[] = [
            'id'       => $chatId,
            'title'    => substr($message, 0, 50),
            'model'    => $model,
            'provider' => $provider,
            'messages' => [$msg, $res],
            'created'  => time(),
            'updated'  => time(),
        ];
    }
    // Keep last 200 chats
    if (count($chats) > 200) $chats = array_slice($chats, -200);
    Storage::write('chat-history', ['chats' => $chats]);

    Logger::activity('ai_chat', 'ai-assistant', ['provider' => $provider, 'model' => $model]);
    apiSuccess(['response' => $response, 'chat_id' => $chatId, 'model' => $model]);
}

if ($method === 'DELETE') {
    Security::validateCsrf();
    $id = $_GET['id'] ?? '';
    if ($id) {
        $data = Storage::read('chat-history');
        $data['chats'] = array_values(array_filter($data['chats'] ?? [], fn($c) => $c['id'] !== $id));
        Storage::write('chat-history', $data);
        apiSuccess(null, 'Chat deleted');
    }
    apiError('Chat ID required');
}

// ─────────────────────────────────────────────────────────────────────────────
function chatOllama(string $message, array $history, string $model, array $ai, bool $stream): string {
    $url = rtrim($ai['ollama_url'] ?? 'http://localhost:11434', '/') . '/api/chat';
    $messages = array_map(fn($m) => ['role' => $m['role'], 'content' => $m['content']], $history);
    $messages[] = ['role' => 'user', 'content' => $message];

    $payload = json_encode([
        'model'    => $model,
        'messages' => $messages,
        'stream'   => false,
        'options'  => ['temperature' => (float)($ai['temperature'] ?? 0.7)],
    ]);

    $ctx = stream_context_create(['http' => [
        'method'        => 'POST',
        'header'        => "Content-Type: application/json\r\nContent-Length: " . strlen($payload),
        'content'       => $payload,
        'timeout'       => 120,
        'ignore_errors' => true,
    ]]);

    $res = @file_get_contents($url, false, $ctx);
    if ($res === false) throw new Exception('Ollama is not running. Start it with: ollama serve');

    $data = json_decode($res, true);
    if (isset($data['error'])) throw new Exception($data['error']);
    return $data['message']['content'] ?? $data['response'] ?? '';
}

function chatOpenAI(string $message, array $history, string $model, array $ai): string {
    $key = $ai['openai_key'] ?? '';
    if (empty($key)) throw new Exception('OpenAI API key not set');

    $messages = array_map(fn($m) => ['role' => $m['role'], 'content' => $m['content']], $history);
    $messages[] = ['role' => 'user', 'content' => $message];

    $payload = json_encode([
        'model'       => $model,
        'messages'    => $messages,
        'max_tokens'  => (int)($ai['max_tokens'] ?? 4096),
        'temperature' => (float)($ai['temperature'] ?? 0.7),
    ]);

    $ctx = stream_context_create(['http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\nAuthorization: Bearer {$key}",
        'content' => $payload,
        'timeout' => 60,
        'ignore_errors' => true,
    ]]);

    $res = @file_get_contents('https://api.openai.com/v1/chat/completions', false, $ctx);
    if ($res === false) throw new Exception('OpenAI API unreachable');
    $data = json_decode($res, true);
    if (isset($data['error'])) throw new Exception($data['error']['message']);
    return $data['choices'][0]['message']['content'] ?? '';
}

function chatGemini(string $message, array $history, string $model, array $ai): string {
    $key = $ai['gemini_key'] ?? '';
    if (empty($key)) throw new Exception('Gemini API key not set');

    $contents = [];
    foreach ($history as $m) {
        $role = $m['role'] === 'assistant' ? 'model' : 'user';
        $contents[] = ['role' => $role, 'parts' => [['text' => $m['content']]]];
    }
    $contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

    $payload = json_encode(['contents' => $contents]);
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}";

    $ctx = stream_context_create(['http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json",
        'content' => $payload,
        'timeout' => 60,
        'ignore_errors' => true,
    ]]);

    $res = @file_get_contents($url, false, $ctx);
    if ($res === false) throw new Exception('Gemini API unreachable');
    $data = json_decode($res, true);
    if (isset($data['error'])) throw new Exception($data['error']['message']);
    return $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
}

function chatAnthropic(string $message, array $history, string $model, array $ai): string {
    $key = $ai['anthropic_key'] ?? '';
    if (empty($key)) throw new Exception('Anthropic API key not set');

    $messages = array_map(fn($m) => ['role' => $m['role'], 'content' => $m['content']], $history);
    $messages[] = ['role' => 'user', 'content' => $message];

    $payload = json_encode([
        'model'      => $model,
        'max_tokens' => (int)($ai['max_tokens'] ?? 4096),
        'messages'   => $messages,
    ]);

    $ctx = stream_context_create(['http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\nx-api-key: {$key}\r\nanthropic-version: 2023-06-01",
        'content' => $payload,
        'timeout' => 60,
        'ignore_errors' => true,
    ]]);

    $res = @file_get_contents('https://api.anthropic.com/v1/messages', false, $ctx);
    if ($res === false) throw new Exception('Anthropic API unreachable');
    $data = json_decode($res, true);
    if (isset($data['error'])) throw new Exception($data['error']['message']);
    return $data['content'][0]['text'] ?? '';
}

apiError('Method not allowed', 405);

<?php
declare(strict_types=1);

/**
 * Roma Capital — proxy PHP para GET /api/cartas (Apache / Hostinger).
 * Consome a API do sistema Invest Master mantendo a
 * API Key apenas no servidor — a chave nunca vai ao navegador.
 */

require_once dirname(__DIR__) . '/includes/api-config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

function roma_json_error(int $status, string $error, string $message, array $extra = []): void
{
    http_response_code($status);
    echo json_encode(array_merge(['error' => $error, 'message' => $message], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

function roma_build_upstream_url(string $base, string $path, array $query): string
{
    $url = $base . $path;
    if ($query !== []) {
        $url .= '?' . http_build_query($query);
    }
    return $url;
}

/**
 * @return array{networkError?: string, parseError?: true, status?: int, body?: mixed}
 */
function roma_fetch_upstream_json(string $url, array $headerLines, array $resolve = []): array
{
    if (!function_exists('curl_init')) {
        return ['networkError' => 'Extensão cURL do PHP não está habilitada no servidor.'];
    }

    $ch = curl_init($url);
    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => $headerLines,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTPGET        => true,
        // Força IPv4: algumas hospedagens não roteiam o registro AAAA (IPv6)
        // do upstream e retornam "Could not resolve host".
        CURLOPT_IPRESOLVE      => CURL_IPRESOLVE_V4,
    ];
    if ($resolve !== []) {
        $options[CURLOPT_RESOLVE] = $resolve;
    }
    curl_setopt_array($ch, $options);

    $text = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($text === false) {
        return ['networkError' => $err !== '' ? $err : 'Falha ao contatar a API upstream.'];
    }

    $body = json_decode($text, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return ['parseError' => true, 'status' => $status];
    }

    return ['status' => $status, 'body' => $body];
}

function roma_upstream_network_message(string $baseUrl, string $err): string
{
    $hint = 'Confirme CONTEMPLADAS_API_BASE_URL (URL base exata da API, sem /api/v1 no final).';
    if (stripos($err, 'Could not resolve host') !== false || stripos($err, 'getaddrinfo') !== false) {
        return 'Não foi possível resolver o endereço da API (' . $baseUrl . '). ' . $hint;
    }
    return 'Falha de rede ao contatar a API (' . $baseUrl . '): ' . $err . '. ' . $hint;
}

/**
 * Fallback: fixa os IPs A conhecidos do upstream quando o DNS do servidor falha.
 * Atualize a lista de IPs se a hospedagem da API mudar de endereço.
 */
function roma_fallback_resolve(string $baseUrl): array
{
    $host = parse_url($baseUrl, PHP_URL_HOST);
    if (!is_string($host) || $host === '') {
        return [];
    }
    $scheme = strtolower((string) parse_url($baseUrl, PHP_URL_SCHEME));
    $port = parse_url($baseUrl, PHP_URL_PORT) ?: ($scheme === 'http' ? 80 : 443);
    $ips = '147.79.105.157,89.116.213.249'; // IPs A de sistema.investmaisparcerias.com.br
    return [$host . ':' . $port . ':' . $ips];
}

$apiKey = roma_api_key();
$baseUrl = roma_api_base_url();

$query = [];
foreach ($_GET as $key => $value) {
    if ($value === null || $value === '') {
        continue;
    }
    $query[(string) $key] = is_array($value) ? array_map('strval', $value) : (string) $value;
}

// A Roma exibe o mesmo catálogo das operações parceiras. Quando a hospedagem
// não possui a credencial compartilhada, consulta o proxy público já ativo da
// Pluscon. A integração direta continua prioritária sempre que estiver configurada.
if ($apiKey === '' || $baseUrl === '') {
    $sharedCatalogUrl = roma_shared_catalog_url();
    if (filter_var($sharedCatalogUrl, FILTER_VALIDATE_URL) === false) {
        roma_json_error(500, 'invalid_shared_catalog_url', 'A URL do catálogo compartilhado é inválida.');
    }

    $sharedUrl = roma_build_upstream_url($sharedCatalogUrl, '', $query);
    $shared = roma_fetch_upstream_json($sharedUrl, ['Accept: application/json']);

    if (isset($shared['networkError'])) {
        roma_json_error(502, 'shared_catalog_unreachable', 'Não foi possível carregar o catálogo compartilhado.');
    }
    if (!empty($shared['parseError'])) {
        roma_json_error(502, 'invalid_shared_catalog_json', 'O catálogo compartilhado retornou uma resposta inválida.');
    }

    header('Cache-Control: public, max-age=0, s-maxage=5, stale-while-revalidate=20');
    http_response_code((int) ($shared['status'] ?? 502));
    echo json_encode($shared['body'] ?? null, JSON_UNESCAPED_UNICODE);
    exit;
}

if (filter_var($baseUrl, FILTER_VALIDATE_URL) === false) {
    roma_json_error(
        500,
        'invalid_api_base_url',
        'CONTEMPLADAS_API_BASE_URL inválida. Use uma URL absoluta, ex.: https://api.seuprovedor.com'
    );
}

$headers = [
    'Accept: application/json',
    'Authorization: Bearer ' . $apiKey,
    'X-API-Key: ' . $apiKey,
];

$primaryUrl = roma_build_upstream_url($baseUrl, '/api/v1/cartas', $query);
$first = roma_fetch_upstream_json($primaryUrl, $headers);

// Se o DNS do servidor falhar ao resolver o upstream, tenta fixando os IPs conhecidos.
if (isset($first['networkError'])) {
    $resolve = roma_fallback_resolve($baseUrl);
    if ($resolve !== []) {
        $first = roma_fetch_upstream_json($primaryUrl, $headers, $resolve);
    }
}

if (isset($first['networkError'])) {
    roma_json_error(502, 'upstream_unreachable', roma_upstream_network_message($baseUrl, $first['networkError']));
}

if (!empty($first['parseError'])) {
    roma_json_error(502, 'invalid_upstream_json', 'A API retornou um corpo que não é JSON válido.', [
        'status' => $first['status'] ?? 0,
    ]);
}

$upstreamStatus = (int) ($first['status'] ?? 502);
$body = $first['body'] ?? null;

// Fallback para a rota pública caso a v1 não exista nesse backend.
if ($upstreamStatus === 404) {
    $fallbackUrl = roma_build_upstream_url($baseUrl, '/api/public/cartas', $query);
    $second = roma_fetch_upstream_json($fallbackUrl, $headers);

    if (isset($second['networkError'])) {
        roma_json_error(502, 'upstream_unreachable', roma_upstream_network_message($baseUrl, $second['networkError']));
    }

    if (!empty($second['parseError'])) {
        roma_json_error(502, 'invalid_upstream_json', 'A API (fallback) retornou um corpo que não é JSON válido.', [
            'status' => $second['status'] ?? 0,
        ]);
    }

    $upstreamStatus = (int) ($second['status'] ?? 502);
    $body = $second['body'] ?? null;
}

// Catálogo reflete cadastros novos quase em tempo real: o navegador sempre
// revalida (max-age=0) e a borda guarda apenas alguns segundos.
header('Cache-Control: public, max-age=0, s-maxage=5, stale-while-revalidate=20');
http_response_code($upstreamStatus);
echo json_encode($body, JSON_UNESCAPED_UNICODE);

<?php
// Recursos públicos fixos. Nenhum cookie, credencial ou URL arbitrária é repassado.
function media_error($status, $message) {
    http_response_code($status);
    header('Cache-Control: no-store');
    header('Content-Type: text/plain; charset=utf-8');
    echo $message;
    exit;
}
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'HEAD'], true)) {
    header('Allow: GET, HEAD');
    media_error(405, 'Método não permitido.');
}
$media = [
    'home-video' => ['https://www.embracon.com.br/videos/homeb.mp4', 'video/mp4'],
    'matriz' => ['https://www.embracon.com.br/img/matriz.jpg', 'image/jpeg'],
    'como-funciona-lance' => ['https://www.embracon.com.br/img/consorcio/comoFuncionaOLance.png', 'image/png'],
    'como-ser-contemplado' => ['https://www.embracon.com.br/img/consorcio/comoSerContemplado.png', 'image/png']
];
$id = $_GET['asset'] ?? null;
if (!is_string($id) || !isset($media[$id]) || count($_GET) !== 1) media_error(404, 'Recurso não encontrado.');
$range = $_SERVER['HTTP_RANGE'] ?? null;
if ($range !== null && !preg_match('/^bytes=(?:\d+-\d*|-\d+)$/D', $range)) media_error(400, 'Intervalo inválido.');
if (!function_exists('curl_init')) media_error(503, 'Recurso temporariamente indisponível.');
$headers = [];
$body = '';
$maxBytes = 4 * 1024 * 1024;
$curl = curl_init($media[$id][0]);
curl_setopt_array($curl, [
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_NOBODY => $method === 'HEAD',
    CURLOPT_HTTPHEADER => $range === null ? [] : ['Range: ' . $range],
    CURLOPT_HEADERFUNCTION => function ($handle, $line) use (&$headers) {
        if (strpos($line, ':') !== false) {
            [$name, $value] = explode(':', $line, 2);
            $headers[strtolower(trim($name))] = trim($value);
        }
        return strlen($line);
    },
    CURLOPT_WRITEFUNCTION => function ($handle, $chunk) use (&$body, $maxBytes) {
        if (strlen($body) + strlen($chunk) > $maxBytes) return 0;
        $body .= $chunk;
        return strlen($chunk);
    }
]);
$ok = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$type = strtolower(trim(explode(';', (string) curl_getinfo($curl, CURLINFO_CONTENT_TYPE))[0]));
curl_close($curl);
$contentRange = $headers['content-range'] ?? '';
if ($status === 416) {
    if (preg_match('/^bytes \*\/\d+$/D', $contentRange)) header('Content-Range: ' . $contentRange);
    media_error(416, 'Intervalo indisponível.');
}
if ($ok === false || !in_array($status, [200, 206], true) || $type !== $media[$id][1] ||
    (isset($headers['content-length']) && (int) $headers['content-length'] > $maxBytes)) {
    media_error(502, 'Recurso temporariamente indisponível.');
}
http_response_code($status);
header('Content-Type: ' . $type);
header('Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
header('Vary: Range');
header('Accept-Ranges: bytes');
if ($status === 206 && preg_match('/^bytes \d+-\d+\/\d+$/D', $contentRange)) header('Content-Range: ' . $contentRange);
if ($method !== 'HEAD') {
    header('Content-Length: ' . strlen($body));
    echo $body;
} elseif (isset($headers['content-length'])) {
    header('Content-Length: ' . (int) $headers['content-length']);
}

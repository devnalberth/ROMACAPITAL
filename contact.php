<?php
declare(strict_types=1);

header('Content-Type: text/plain; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Método de envio não permitido.';
    exit;
}

function clean_text(string $value): string
{
    $value = strip_tags(trim($value));
    return preg_replace('/[\r\n]+/', ' ', $value) ?? '';
}

$name = clean_text((string) ($_POST['name'] ?? ''));
$email = filter_var(trim((string) ($_POST['email'] ?? '')), FILTER_SANITIZE_EMAIL);
$phone = clean_text((string) ($_POST['phone'] ?? ''));
$company = clean_text((string) ($_POST['company'] ?? ''));
$objective = clean_text((string) ($_POST['objective'] ?? $_POST['subject'] ?? ''));
$message = trim(strip_tags((string) ($_POST['message'] ?? '')));

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $phone === '' || $objective === '' || $message === '') {
    http_response_code(422);
    echo 'Preencha os campos obrigatórios com informações válidas.';
    exit;
}

$recipient = 'contato@romacapsolucoes.com.br';
$subject = 'Novo diagnóstico solicitado pelo site';
$emailBody = implode("\n", [
    'Nova solicitação de diagnóstico',
    '',
    "Nome: {$name}",
    "E-mail: {$email}",
    "Telefone: {$phone}",
    'Empresa: ' . ($company !== '' ? $company : 'Não informada'),
    "Decisão em análise: {$objective}",
    '',
    'Contexto:',
    $message,
]);

$headers = implode("\r\n", [
    'From: Roma Capital <noreply@romacapsolucoes.com.br>',
    "Reply-To: {$name} <{$email}>",
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
]);

if (mail($recipient, $subject, $emailBody, $headers)) {
    http_response_code(200);
    echo 'Solicitação recebida. Nossa equipe entrará em contato em horário comercial.';
    exit;
}

http_response_code(500);
echo 'Não foi possível enviar sua solicitação. Tente novamente ou escreva para contato@romacapsolucoes.com.br.';

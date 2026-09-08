<?php
declare(strict_types=1);

/**
 * Roma Capital — credenciais do catálogo de Cartas Contempladas.
 *
 * COMO USAR
 *   1. Copie este arquivo para `config.php` (na mesma pasta, a raiz do site).
 *   2. Preencha a chave abaixo com a API Key emitida pelo sistema Invest Master.
 *   3. Envie o `config.php` para a hospedagem. Ele NÃO vai para o Git.
 *
 * O `config.php` fica apenas no servidor: a chave nunca chega ao navegador,
 * porque quem conversa com a API é o proxy `api/cartas.php`.
 */

// URL base do sistema Invest Master — só protocolo + domínio, sem /api/v1 no final.
define('CONTEMPLADAS_API_BASE_URL', 'https://sistema.investmaisparcerias.com.br');

// Chave de API da Roma Capital (peça uma chave própria ao administrador do sistema).
define('CONTEMPLADAS_API_KEY', 'COLE_AQUI_A_CHAVE_DA_ROMA');

<?php
declare(strict_types=1);

/**
 * Credenciais da API do sistema (catálogo de Cartas Contempladas).
 * A tabela da Roma Capital consome o MESMO backend da Invest Master.
 * Ordem de resolução: variáveis de ambiente do servidor → constantes em config.php
 */
if (!defined('CONTEMPLADAS_API_KEY')) {
    $envKey = getenv('CONTEMPLADAS_API_KEY') ?: getenv('INVESTMASTER_API_KEY');
    if ($envKey !== false && $envKey !== '') {
        define('CONTEMPLADAS_API_KEY', $envKey);
    }
}

if (!defined('CONTEMPLADAS_API_BASE_URL')) {
    $envBase = getenv('CONTEMPLADAS_API_BASE_URL') ?: getenv('INVESTMASTER_API_BASE_URL');
    if ($envBase !== false && $envBase !== '') {
        define('CONTEMPLADAS_API_BASE_URL', $envBase);
    }
}

$configFile = dirname(__DIR__) . '/config.php';
if (is_file($configFile)) {
    require_once $configFile;
}

function roma_api_key(): string
{
    if (defined('CONTEMPLADAS_API_KEY')) {
        return trim((string) CONTEMPLADAS_API_KEY);
    }
    // Retrocompatibilidade caso o config use o nome antigo.
    if (defined('INVESTMASTER_API_KEY')) {
        return trim((string) INVESTMASTER_API_KEY);
    }
    return '';
}

function roma_api_base_url(): string
{
    if (defined('CONTEMPLADAS_API_BASE_URL')) {
        return rtrim(trim((string) CONTEMPLADAS_API_BASE_URL), '/');
    }
    if (defined('INVESTMASTER_API_BASE_URL')) {
        return rtrim(trim((string) INVESTMASTER_API_BASE_URL), '/');
    }
    return '';
}

function roma_shared_catalog_url(): string
{
    $envUrl = getenv('CONTEMPLADAS_SHARED_CATALOG_URL');
    if ($envUrl !== false && trim($envUrl) !== '') {
        return trim($envUrl);
    }

    // Catálogo compartilhado já utilizado pelas operações parceiras.
    return 'https://plusconsorcio.com.br/api/cartas.php';
}

# Cartas Contempladas — integração com o sistema Invest Master

A página `/contempladas` monta a tabela do catálogo a partir da **mesma API do
sistema Invest Master** que abastece os sites da Invest Master, TM Consórcios e RBS.

## Como os dados chegam à página

```
navegador → /api/cartas (proxy same-origin) → catálogo Invest Master
```

O front-end **nunca** vê a chave da API: quem guarda a credencial é o proxy no
servidor. Por isso a página chama `/api/cartas`, e não a API diretamente.

## Configuração

Na hospedagem Apache, a integração usa automaticamente o catálogo público
compartilhado da Pluscon quando não há credenciais locais. A configuração direta
abaixo é opcional e tem prioridade sobre esse fallback.

### Hostinger / Apache (hospedagem compartilhada) — cenário atual

O sistema Invest Master já está no ar em `https://sistema.investmaisparcerias.com.br`.
É esse endereço que a Roma vai consultar (o mesmo que a TM Consórcios usa).

1. Use a **credencial compartilhada do catálogo Invest Master**, a mesma das
   integrações da TM Consórcios, Pluscon e RBS. Não existe uma chave exclusiva
   da Roma Capital.
2. Copie `config.example.php` para `config.php` e preencha:

   ```php
   define('CONTEMPLADAS_API_BASE_URL', 'https://sistema.investmaisparcerias.com.br');
   define('CONTEMPLADAS_API_KEY', 'a-chave-compartilhada');
   ```

3. Envie os arquivos para o `public_html`, **incluindo** `config.php`,
   `.htaccess`, `proxy/cartas.php` e `includes/api-config.php`.
   O `config.php` está no `.gitignore` de propósito — ele não sobe por Git,
   você o coloca direto no servidor (Gerenciador de Arquivos ou FTP).
4. Confirme que o domínio da Roma está **liberado no CORS/allowlist** do sistema,
   se ele tiver essa restrição.
5. Teste abrindo `https://SEU-DOMINIO/api/cartas` no navegador: deve devolver
   JSON com as cartas. Se devolver erro, a mensagem diz o que falta.

Requisitos do servidor: PHP com **cURL** habilitado e `mod_rewrite` ativo
(padrão na Hostinger).

### Vercel (proxy Node) — alternativa

Arquivo `api/cartas.js`, atendido automaticamente em `/api/cartas`.
Defina em **Project → Settings → Environment Variables** e refaça o deploy:

| Variável | Valor |
| --- | --- |
| `INVESTMASTER_API_KEY` | credencial compartilhada do catálogo |
| `INVESTMASTER_API_BASE_URL` | `https://sistema.investmaisparcerias.com.br` |

As URLs amigáveis (`/inicio`, `/sobre`, `/contempladas`…) estão duplicadas nos
dois lugares de propósito: `rewrites`/`redirects` no `vercel.json` para a Vercel,
e `RewriteRule` no `.htaccess` para o Apache. **Ao criar ou renomear uma página,
atualize os dois.**

### Por que o PHP não fica em `/api/`

A Vercel reserva `/api/` para Serverless Functions e recusa dois arquivos com o
mesmo nome-base — `api/cartas.js` + `api/cartas.php` quebrava o build com
*"Two or more files have conflicting paths or names"*. Por isso o proxy PHP mora
em `proxy/cartas.php`, e o `.htaccess` aponta `/api/cartas` para lá. O front-end
chama `/api/cartas` nos dois ambientes, sem saber quem responde.

O `.vercelignore` mantém `proxy/`, `includes/` e os `.php` fora do deploy da Vercel.

## Arquivos da funcionalidade

| Arquivo | Papel |
| --- | --- |
| `contempladas.html` | página (shell da Roma + catálogo + modais) |
| `assets/css/pages/contempladas.css` | estilos do catálogo nos tokens da Roma |
| `assets/js/pages/contempladas.js` | busca, filtros, ordenação, seleção, exportação |
| `api/cartas.js` | proxy da Vercel (Serverless Function) |
| `proxy/cartas.php` | proxy do Apache/Hostinger |
| `includes/api-config.php` | resolução de credenciais do proxy PHP |

## Comportamento

- **Filtro de produto** (Todos / Imóvel / Veículo) é **server-side**: refaz a
  chamada com `?tipo=`. Os chips de status filtram no cliente.
- **Juntar cotas**: só permite somar cotas da **mesma administradora**; cartas
  reservadas não entram em proposta. O painel soma crédito, entrada, saldo,
  taxa e monta a composição de parcelas combinada.
- **Ordenação**: clique nos cabeçalhos da tabela (`aria-sort` reflete o estado).
- **Exportação**: Excel (.xls via markup de tabela) e PDF (janela de impressão).
- **Logos das administradoras**: mapeadas em `adminLogos` no JS. Hoje cobrem
  Embracon, Bradesco e Volkswagen (`assets/img/parceiras/`). Administradora sem
  logo cai no nome em texto — para adicionar outra, inclua o arquivo e uma
  entrada no mapa com seus `aliases`.
- **WhatsApp**: `RC_WHATSAPP_E164` no topo do JS (`5547988751429`, o número do
  rodapé do site).

# Páginas de consórcio — Roma Capital

As três páginas foram extraídas dos sites públicos em 14/10/2026. HTML, CSS, fontes, imagens e vídeos foram aproveitados; os runtimes das administradoras foram substituídos por interações locais. As mídias maiores usam os endereços públicos oficiais, conforme a configuração abaixo.

| Página | Caminho |
| --- | --- |
| Seleção de administradoras | `/consorcios/` |
| Embracon | `/consorcios/embracon/` |
| Bradesco Consórcios | `/consorcios/bradesco/` |
| Volkswagen — Jetta | `/consorcios/volkswagen/` |

## Atendimento

Edite `consorcios/assets/config.js` para alterar a empresa e o WhatsApp. O número `5511989864178` foi obtido dos canais oficiais já presentes neste repositório. Os dados ficam no formulário até a abertura do WhatsApp e seguem na mensagem pronta. O visitante precisa enviá-la; não há banco de dados, API de registro de leads ou envio automático às administradoras.

Os botões de simulação, contato e chat abrem o formulário local. Os acessos institucionais a áreas de cliente, boletos, informações e documentos continuam como links para os domínios oficiais. A página Bradesco não coleta agência, conta, CPF ou senha de acesso. A captura de leads solicita nome, e-mail, celular, modalidade e CEP opcional, com autorização de contato.

## Hospedagem e subdomínio

Os diretórios são servidos por `index.html`, com assets próprios. As páginas são estáticas e a rota de mídia precisa da função Node na Vercel ou de PHP com cURL no Apache. Um servidor somente estático permite revisar o restante das páginas, mas não executa essa rota. Para um subdomínio que aponte à raiz deste mesmo site, mantenha os caminhos `/consorcios/...` ou adicione um rewrite de host para a administradora escolhida, depois de definir o hostname. Se publicar somente a pasta `consorcios` como raiz de outro site, atualize `homeUrl`, os links à página principal e as URLs canônicas. Não foram feitas alterações de DNS nem publicação na produção.

## Recursos e limites

Os arquivos públicos essenciais de cada marca estão nas respectivas pastas. O front-end não executa Next.js. A função Node/PHP busca somente as quatro mídias públicas permitidas; o formulário continua independente de serviços de leads das administradoras. As consultas, login bancário, contratação e simuladores oficiais não foram copiados. Não calculamos parcelas sem regras: o visitante recebe a simulação no atendimento.

As fontes e a maior parte das imagens foram baixadas para uso local. O vídeo principal da Embracon, a foto da matriz e as imagens de lance/contemplação são servidos por `/api/consorcio-media?asset=...`, com lista fixa de quatro URLs oficiais. O proxy aceita GET/HEAD e Range, limita respostas a 4 MiB, não encaminha cookies/credenciais e usa cache HTTP. No Apache, `.htaccess` encaminha a rota para `proxy/consorcio-media.php` (requer cURL); na Vercel, a função é `api/consorcio-media.js`. O vídeo do Jetta usa diretamente o CDN público da Volkswagen. Essa escolha evita o erro de transporte dos grandes arquivos no conector, e mantém dependência da disponibilidade desses endereços oficiais. As cópias originais foram preservadas no pacote de transferência preparado anteriormente. As páginas preservam a maior parte da estrutura e do CSS originais; composição client-only e interações foram reconstruídas. Portanto, a validação visual comparativa em desktop e celular é obrigatória antes de considerar a cópia pixel perfect. O ambiente desta execução não disponibilizou a skill de controle de navegador necessária para testar previews locais; foram feitas verificações estáticas e testes de validação/URL do formulário.

## Verificação

`node --test tests/consorcio-lead.test.cjs tests/consorcio-media.test.cjs` verifica os campos, o destinatário, as mensagens e o proxy Node (lista de URLs permitidas, GET/HEAD, Range, tamanho máximo e preservação dos bytes). O formulário não é enviado durante os testes. O proxy PHP deve ser validado na hospedagem com cURL; este ambiente não possui PHP CLI.

Originais: Embracon (`https://www.embracon.com.br/consorcio`), Bradesco (`https://banco.bradesco/html/classic/produtos-servicos/consorcios/index.shtm`), Volkswagen (`https://www.cnvw.com.br/modelos/consorcio-jetta`).

## Revisão e publicação

A implementação usa a branch `feat/consorcio-pages` para revisão. A integração na `main`, a publicação no domínio principal e a configuração dos subdomínios dependem da revisão do código e dos nomes de host escolhidos. Não foi alterado o DNS.

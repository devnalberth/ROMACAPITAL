/**
 * Roma Capital — proxy server-side para a API Invest Master (Vercel Serverless / Node).
 * Nunca exponha INVESTMASTER_API_KEY no front-end estático.
 *
 * GET /api/cartas?status=&tipo=
 * Repassa query string (status, tipo) para o upstream.
 */

function stripTrailingSlash(s) {
    return String(s || "").replace(/\/+$/, "");
}

function buildUpstreamUrl(base, pathname, searchParams) {
    const root = stripTrailingSlash(base);
    const url = new URL(root + pathname);
    searchParams.forEach((value, key) => {
        url.searchParams.set(key, value);
    });
    return url.toString();
}

function upstreamNetworkMessage(baseUrl, err) {
    const code = err && err.cause && err.cause.code ? String(err.cause.code) : "";
    const hint =
        "Confirme INVESTMASTER_API_BASE_URL na Vercel (URL base exata da API, sem /api/v1 no final). " +
        "Se o host não existir na internet (DNS), o catálogo não carrega.";
    if (code === "ENOTFOUND") {
        return "Não foi possível resolver o endereço da API (" + baseUrl + "). " + hint;
    }
    return "Falha de rede ao contatar a API (" + baseUrl + "): " + (err && err.message ? err.message : "erro desconhecido") + ". " + hint;
}

async function fetchUpstreamJson(url, headers) {
    let upstreamRes;
    try {
        upstreamRes = await fetch(url, { headers, method: "GET" });
    } catch (err) {
        return { networkError: err };
    }
    const text = await upstreamRes.text();
    let body;
    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        return {
            parseError: true,
            status: upstreamRes.status
        };
    }
    return { upstreamRes, body };
}

module.exports = async function cartasProxy(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }

    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const apiKey = process.env.INVESTMASTER_API_KEY;
    const rawBase = process.env.INVESTMASTER_API_BASE_URL;

    if (!apiKey) {
        res.status(500).json({
            error: "missing_api_key",
            message: "Configure INVESTMASTER_API_KEY nas variáveis de ambiente do deploy."
        });
        return;
    }

    if (!rawBase || !String(rawBase).trim()) {
        res.status(500).json({
            error: "missing_api_base_url",
            message:
                "Defina INVESTMASTER_API_BASE_URL na Vercel com a URL base da API (a mesma que aparece na documentação ou no suporte da Invest Master, em geral só protocolo + domínio, sem /api/v1 no final). O host api.investmaster.com.br não é usado por padrão porque costuma não existir no DNS."
        });
        return;
    }

    const baseUrl = stripTrailingSlash(String(rawBase).trim());

    try {
        void new URL(baseUrl);
    } catch {
        res.status(500).json({
            error: "invalid_api_base_url",
            message: "INVESTMASTER_API_BASE_URL inválida. Use uma URL absoluta, ex.: https://api.seuprovedor.com"
        });
        return;
    }

    const incomingUrl = new URL(req.url || "/", "https://example.internal");
    const searchParams = new URLSearchParams(incomingUrl.searchParams);
    if (req.query && typeof req.query === "object") {
        for (const [key, value] of Object.entries(req.query)) {
            if (value === undefined || value === null) continue;
            if (Array.isArray(value)) {
                value.forEach((item) => searchParams.append(key, String(item)));
            } else {
                searchParams.set(key, String(value));
            }
        }
    }

    const headers = {
        Accept: "application/json",
        Authorization: "Bearer " + apiKey,
        "X-API-Key": apiKey
    };

    const primaryUrl = buildUpstreamUrl(baseUrl, "/api/v1/cartas", searchParams);
    let first = await fetchUpstreamJson(primaryUrl, headers);

    if (first.networkError) {
        res.status(502).json({
            error: "upstream_unreachable",
            message: upstreamNetworkMessage(baseUrl, first.networkError)
        });
        return;
    }

    if (first.parseError) {
        res.status(502).json({
            error: "invalid_upstream_json",
            message: "A API retornou um corpo que não é JSON válido.",
            status: first.status
        });
        return;
    }

    let upstreamRes = first.upstreamRes;
    let body = first.body;

    if (upstreamRes.status === 404) {
        const fallbackUrl = buildUpstreamUrl(baseUrl, "/api/public/cartas", searchParams);
        const second = await fetchUpstreamJson(fallbackUrl, headers);
        if (second.networkError) {
            res.status(502).json({
                error: "upstream_unreachable",
                message: upstreamNetworkMessage(baseUrl, second.networkError)
            });
            return;
        }
        if (second.parseError) {
            res.status(502).json({
                error: "invalid_upstream_json",
                message: "A API (fallback) retornou um corpo que não é JSON válido.",
                status: second.status
            });
            return;
        }
        upstreamRes = second.upstreamRes;
        body = second.body;
    }

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");

    res.status(upstreamRes.status).json(body);
};

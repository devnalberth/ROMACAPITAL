const MAX_BYTES = 4 * 1024 * 1024;
const MEDIA = Object.freeze({
  'home-video': { url: 'https://www.embracon.com.br/videos/homeb.mp4', type: 'video/mp4' },
  'matriz': { url: 'https://www.embracon.com.br/img/matriz.jpg', type: 'image/jpeg' },
  'como-funciona-lance': { url: 'https://www.embracon.com.br/img/consorcio/comoFuncionaOLance.png', type: 'image/png' },
  'como-ser-contemplado': { url: 'https://www.embracon.com.br/img/consorcio/comoSerContemplado.png', type: 'image/png' }
});

function error(res, status, message) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.status(status).end(message);
}

async function readLimited(response) {
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new Error('media_too_large');
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

function createHandler(fetcher = fetch) {
  return async function consorcioMedia(req, res) {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD');
      return error(res, 405, 'Método não permitido.');
    }
    const query = new URL(req.url || '/', 'http://localhost').searchParams;
    const id = query.get('asset');
    if (query.getAll('asset').length !== 1 || [...query.keys()].some(key => key !== 'asset') ||
        !Object.prototype.hasOwnProperty.call(MEDIA, id)) {
      return error(res, 404, 'Recurso não encontrado.');
    }
    const range = req.headers?.range;
    if (range !== undefined && (typeof range !== 'string' || !/^bytes=(?:\d+-\d*|-\d+)$/.test(range))) {
      return error(res, 400, 'Intervalo inválido.');
    }
    try {
      const media = MEDIA[id];
      const upstream = await fetcher(media.url, {
        method: req.method,
        headers: range ? { Range: range } : {},
        redirect: 'error',
        signal: AbortSignal.timeout(15000)
      });
      if (upstream.status === 416) {
        const contentRange = upstream.headers.get('content-range');
        if (contentRange && /^bytes \*\/\d+$/.test(contentRange)) res.setHeader('Content-Range', contentRange);
        return error(res, 416, 'Intervalo indisponível.');
      }
      if (![200, 206].includes(upstream.status) ||
          upstream.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== media.type ||
          Number(upstream.headers.get('content-length') || 0) > MAX_BYTES) {
        await upstream.body?.cancel();
        return error(res, 502, 'Recurso temporariamente indisponível.');
      }
      const body = req.method === 'HEAD' ? null : await readLimited(upstream);
      res.setHeader('Content-Type', media.type);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
      res.setHeader('Vary', 'Range');
      res.setHeader('Accept-Ranges', 'bytes');
      const contentRange = upstream.headers.get('content-range');
      if (upstream.status === 206 && contentRange && /^bytes \d+-\d+\/\d+$/.test(contentRange)) res.setHeader('Content-Range', contentRange);
      if (body) res.setHeader('Content-Length', String(body.byteLength));
      else if (upstream.headers.has('content-length')) res.setHeader('Content-Length', upstream.headers.get('content-length'));
      res.status(upstream.status).end(body || undefined);
    } catch {
      error(res, 502, 'Recurso temporariamente indisponível.');
    }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;


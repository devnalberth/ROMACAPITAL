const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../api/consorcio-media.js');

function response() {
  return { headers: {}, statusCode: 200, body: null,
    setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    end(body) { this.body = body == null ? Buffer.alloc(0) : Buffer.from(body); }
  };
}
async function run(fetcher, url = '/api/consorcio-media?asset=matriz', method = 'GET', headers = {}) {
  const res = response();
  await createHandler(fetcher)({ url, method, headers }, res);
  return res;
}

test('rejeita URL arbitrária e método de escrita sem consultar a origem', async () => {
  const fetcher = () => { throw new Error('não deve buscar'); };
  assert.equal((await run(fetcher, '/api/consorcio-media?asset=https://example.com')).statusCode, 404);
  assert.equal((await run(fetcher, undefined, 'POST')).statusCode, 405);
  assert.equal((await run(fetcher, '/api/consorcio-media?asset=matriz&asset=home-video')).statusCode, 404);
});

test('repassa somente Range para a URL fixa e preserva os bytes', async () => {
  const bytes = Uint8Array.from([255, 216, 255, 3, 8]);
  const res = await run(async (url, options) => {
    assert.equal(url, 'https://www.embracon.com.br/img/matriz.jpg');
    assert.deepEqual(options.headers, {});
    assert.equal(options.redirect, 'error');
    return new Response(bytes, { headers: { 'Content-Type': 'image/jpeg' } });
  }, undefined, 'GET', { cookie: 'session=privado', authorization: 'privado' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, Buffer.from(bytes));
  assert.equal(res.headers['content-length'], '5');
  assert.match(res.headers['cache-control'], /public/);
});

test('preserva resposta parcial e intervalo do vídeo', async () => {
  const res = await run(async (url, options) => {
    assert.equal(options.headers.Range, 'bytes=10-12');
    return new Response('abc', { status: 206, headers: { 'Content-Type': 'video/mp4', 'Content-Range': 'bytes 10-12/100' } });
  }, '/api/consorcio-media?asset=home-video', 'GET', { range: 'bytes=10-12' });
  assert.equal(res.statusCode, 206);
  assert.equal(res.headers['content-range'], 'bytes 10-12/100');
  assert.equal(res.body.toString(), 'abc');
});

test('recusa múltiplos intervalos e cabeçalho manipulado antes da busca', async () => {
  const fetcher = () => { throw new Error('não deve buscar'); };
  for (const range of ['bytes=0-1,5-6', 'bytes=0-1\r\nX-Test: 1']) {
    assert.equal((await run(fetcher, undefined, 'GET', { range })).statusCode, 400);
  }
});

test('HEAD retorna metadados sem corpo', async () => {
  const res = await run(async (url, options) => {
    assert.equal(options.method, 'HEAD');
    return new Response(null, { headers: { 'Content-Type': 'image/jpeg', 'Content-Length': '2000' } });
  }, undefined, 'HEAD');
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-length'], '2000');
  assert.equal(res.body.length, 0);
});

test('não entrega HTML de erro como imagem e não expõe falhas internas', async () => {
  const html = await run(async () => new Response('<html>erro</html>', { headers: { 'Content-Type': 'text/html' } }));
  assert.equal(html.statusCode, 502);
  assert.doesNotMatch(html.body.toString(), /<html>/);
  const network = await run(async () => { throw new Error('detalhe interno'); });
  assert.equal(network.statusCode, 502);
  assert.doesNotMatch(network.body.toString(), /detalhe interno/);
});

test('limita respostas declaradas e streams acima de 4 MiB', async () => {
  const declared = await run(async () => new Response(null, { headers: { 'Content-Type': 'image/jpeg', 'Content-Length': String(5 * 1024 * 1024) } }));
  assert.equal(declared.statusCode, 502);
  const streamed = await run(async () => new Response(new Uint8Array(4 * 1024 * 1024 + 1), { headers: { 'Content-Type': 'image/jpeg' } }));
  assert.equal(streamed.statusCode, 502);
});

test('mantém resposta de intervalo fora dos limites', async () => {
  const res = await run(async () => new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */100' } }), '/api/consorcio-media?asset=home-video', 'GET', { range: 'bytes=200-' });
  assert.equal(res.statusCode, 416);
  assert.equal(res.headers['content-range'], 'bytes */100');
});


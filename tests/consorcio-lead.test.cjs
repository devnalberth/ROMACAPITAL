const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('../consorcios/assets/lead-core.js');
const valid = { name: 'Ana Maria', email: 'ana@example.com', phone: '(11) 99999-8888', zipcode: '01234-567', category: 'Automóveis', consent: true };

test('valida e normaliza os campos sem transmitir dados', () => {
  const result = core.validate(valid);
  assert.equal(result.valid, true);
  assert.equal(result.lead.phone, '11999998888');
  assert.equal(result.lead.zipcode, '01234567');
  assert.equal(core.validate({ ...valid, zipcode: '' }).valid, true);
});
test('aceita celular colado com DDI brasileiro sem trocar o DDD', () => {
  const result = core.validate({ ...valid, phone: '+55 (82) 99999-8888' });
  assert.equal(result.valid, true);
  assert.equal(result.lead.phone, '82999998888');
  assert.equal(core.validate({ ...valid, phone: '(55) 99999-8888' }).lead.phone, '55999998888');
});
test('recusa e-mail, telefone, CEP e consentimento inválidos', () => {
  const result = core.validate({ ...valid, email: 'inválido', phone: '1234', zipcode: '12', consent: false });
  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ['consent','email','phone','zipcode']);
  assert.equal(core.validate({ ...valid, category: 'crédito inexistente' }).valid, false);
});
test('abre o contato configurado e preserva acentos, quebras e interesse', () => {
  for (const company of ['Roma Capital','RBS Consultoria Inteligente']) {
    const lead = core.validate({ ...valid, name: 'João & Márcia', category: 'Imóveis' }).lead;
    const url = new URL(core.buildWhatsApp({ company, whatsapp: '5511989864178' }, lead, { administrator: 'Embracon', page: 'https://example.com/consorcios/embracon/', campaign: { utm_campaign: 'Teste & imóveis' } }));
    assert.equal(url.origin, 'https://wa.me');
    assert.equal(url.pathname, '/5511989864178');
    const text = url.searchParams.get('text');
    assert.ok(text.includes(company));
    assert.ok(text.includes('João & Márcia'));
    assert.ok(text.includes('Interesse: Imóveis'));
    assert.ok(text.includes('\nE-mail: ana@example.com'));
    assert.ok(text.includes('utm_campaign: Teste & imóveis'));
    assert.ok(!text.includes('undefined'));
    assert.equal([...url.searchParams.keys()].length, 1);
  }
});
test('mensagem do Jetta mantém o produto e omite CEP não informado', () => {
  const lead = core.validate({ ...valid, product: 'Jetta', zipcode: '' }).lead;
  const url = new URL(core.buildWhatsApp({ company: 'Roma Capital', whatsapp: '5511989864178' }, lead, { administrator: 'Volkswagen Consórcio', page: 'https://example.com/consorcios/volkswagen/' }));
  assert.match(url.searchParams.get('text'), /Automóveis — Jetta/);
  assert.ok(!url.searchParams.get('text').includes('CEP:'));
});
test('não cria URL com destinatário ausente e limita campos manipulados', () => {
  assert.throws(() => core.buildWhatsApp({ company: 'Roma Capital', whatsapp: '' }, valid, { administrator: 'Embracon', page: '/' }));
  assert.equal(core.validate({ ...valid, name: 'a'.repeat(1000) }).lead.name.length, 120);
});

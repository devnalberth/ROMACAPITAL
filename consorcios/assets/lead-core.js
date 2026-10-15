(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ConsorcioLead = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const clean = (value, max = 160) => String(value || '').trim().replace(/[\r\n\t]+/g, ' ').slice(0, max);
  const digits = (value) => String(value || '').replace(/\D/g, '');
  const categories = ['Automóveis', 'Imóveis', 'Motos', 'Pesados', 'Serviços', 'Agronegócio'];

  function validate(values) {
    let phone = digits(values.phone);
    if (phone.startsWith('55') && (phone.length === 12 || phone.length === 13)) phone = phone.slice(2);
    const lead = {
      name: clean(values.name, 120), email: clean(values.email),
      phone, zipcode: digits(values.zipcode),
      category: clean(values.category, 60), product: clean(values.product, 80),
      consent: values.consent === true || values.consent === 'on',
    };
    const errors = {};
    if (lead.name.length < 3 || !/[a-z\u00c0-\u017f]/i.test(lead.name)) errors.name = 'Informe seu nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) errors.email = 'Informe um e-mail válido.';
    if (!/^[1-9]{2}\d{8,9}$/.test(lead.phone)) errors.phone = 'Informe o celular com DDD, com 10 ou 11 dígitos.';
    if (lead.zipcode && !/^\d{8}$/.test(lead.zipcode)) errors.zipcode = 'O CEP deve ter 8 dígitos.';
    if (!categories.includes(lead.category)) errors.category = 'Escolha uma modalidade.';
    if (!lead.consent) errors.consent = 'Autorize o contato para continuar.';
    return { lead, errors, valid: Object.keys(errors).length === 0 };
  }

  function buildWhatsApp(config, lead, context) {
    const phone = digits(config.whatsapp);
    if (!/^\d{11,15}$/.test(phone)) throw new Error('O número de atendimento não foi configurado.');
    const message = [
      `Olá! Quero receber uma simulação com a ${clean(config.company, 100)}.`, '',
      `Administradora: ${clean(context.administrator, 100)}`,
      `Interesse: ${clean(lead.category, 60)}${lead.product ? ` — ${clean(lead.product, 80)}` : ''}`,
      `Nome: ${clean(lead.name, 120)}`, `E-mail: ${clean(lead.email)}`, `Celular: ${digits(lead.phone)}`,
    ];
    if (lead.zipcode) message.push(`CEP: ${digits(lead.zipcode)}`);
    message.push('', `Origem: ${clean(context.page, 300)}`);
    const campaign = context.campaign || {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
      if (campaign[key]) message.push(`${key}: ${clean(campaign[key], 120)}`);
    });
    message.push('Contato autorizado pelo formulário.');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message.join('\n'))}`;
  }
  return Object.freeze({ validate, buildWhatsApp, categories });
});

(() => {
  'use strict';
  const config = window.CONSORCIO_CONFIG;
  const core = window.ConsorcioLead;
  const dialog = document.getElementById('consorcio-lead');
  if (!config || !core || !dialog) return;
  const form = dialog.querySelector('form');
  const brand = document.body.dataset.consorcioBrand;
  const names = { embracon: 'Embracon', bradesco: 'Bradesco Consórcios', volkswagen: 'Volkswagen Consórcio' };
  let category = '', product = '', previousFocus;
  document.querySelectorAll('[data-company]').forEach((el) => { el.textContent = config.company; });
  document.querySelectorAll('[data-company-home]').forEach((el) => { el.href = config.homeUrl; });

  function showStep(step) {
    dialog.querySelectorAll('[data-lead-step]').forEach((el) => { el.hidden = Number(el.dataset.leadStep) !== step; });
    dialog.querySelectorAll('[data-step-dot]').forEach((el) => { el.classList.toggle('is-active', Number(el.dataset.stepDot) <= step); });
    dialog.querySelector('#consorcio-lead-title').textContent = step === 1 ? 'Vamos começar!' : step === 2 ? 'Descubra algo incrível' : 'Continue seu atendimento';
    dialog.querySelector('[data-selected-category]').textContent = `${names[brand]} · ${product || category}`;
    dialog.scrollTop = 0;
  }

  function open(trigger) {
    previousFocus = trigger;
    const raw = trigger?.dataset.category || '';
    const aliases = { Carros: 'Automóveis', Imoveis: 'Imóveis', Servicos: 'Serviços' };
    category = aliases[raw] || (core.categories.includes(raw) ? raw : '');
    product = trigger?.dataset.product || (brand === 'volkswagen' ? 'Jetta' : '');
    if (brand === 'volkswagen') category = 'Automóveis';
    if (brand === 'bradesco' && !category) category = 'Automóveis';
    showStep(category ? 2 : 1);
    const menu = document.getElementById('consorcio-menu');
    if (menu?.open) menu.close();
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add('consorcio-modal-open');
    const first = category ? form.elements.name : dialog.querySelector('[data-select-category]');
    first.focus({ preventScroll: true });
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open-lead]');
    if (trigger) { event.preventDefault(); open(trigger); }
  });
  dialog.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('consorcio-modal-open');
    form.reset();
    dialog.querySelector('[data-whatsapp-fallback]').removeAttribute('href');
    dialog.querySelector('[data-form-error]').textContent = '';
    paintErrors({});
    previousFocus?.focus({ preventScroll: true });
  });
  dialog.querySelectorAll('[data-select-category]').forEach((button) => button.addEventListener('click', () => {
    category = button.dataset.selectCategory; showStep(2); form.elements.name.focus();
  }));
  dialog.querySelector('[data-back-step]').addEventListener('click', () => { showStep(1); dialog.querySelector('[data-select-category]').focus(); });
  dialog.querySelector('[data-edit-lead]').addEventListener('click', () => { showStep(2); form.elements.name.focus(); });

  function paintErrors(errors) {
    dialog.querySelectorAll('[data-error]').forEach((el) => {
      el.textContent = errors[el.dataset.error] || '';
      const input = form.elements[el.dataset.error];
      if (input) input.setAttribute('aria-invalid', errors[el.dataset.error] ? 'true' : 'false');
    });
  }
  form.addEventListener('input', (event) => {
    const key = event.target.name;
    const label = dialog.querySelector(`[data-error="${key}"]`);
    if (label) label.textContent = '';
    event.target.setAttribute('aria-invalid', 'false');
  });
  form.elements.phone.addEventListener('input', (event) => {
    let digits = event.target.value.replace(/\D/g, '');
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2);
    const d = digits.slice(0, 11);
    event.target.value = d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length > 10 ? 7 : 6)}${d.length > 6 ? '-' + d.slice(d.length > 10 ? 7 : 6) : ''}` : d;
  });
  form.elements.zipcode.addEventListener('input', (event) => {
    const d = event.target.value.replace(/\D/g, '').slice(0, 8);
    event.target.value = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const result = core.validate({ ...values, category, product });
    paintErrors(result.errors);
    if (!result.valid) { form.elements[Object.keys(result.errors)[0]]?.focus(); return; }
    try {
      const params = new URLSearchParams(location.search);
      const campaign = Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].map((key) => [key, params.get(key)]));
      const url = core.buildWhatsApp(config, result.lead, { administrator: names[brand], page: location.origin + location.pathname, campaign });
      const fallback = dialog.querySelector('[data-whatsapp-fallback]');
      fallback.href = url;
      showStep(3);
      // Keep this synchronous with the visitor's click to avoid popup blocking.
      window.open(url, '_blank', 'noopener,noreferrer');
      fallback.focus();
    } catch (error) {
      dialog.querySelector('[data-form-error]').textContent = error.message;
    }
  });
})();

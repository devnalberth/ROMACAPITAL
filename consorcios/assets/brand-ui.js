(() => {
  'use strict';
  const brand = document.body.dataset.consorcioBrand;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menu = document.getElementById('consorcio-menu');
  let menuTrigger;
  document.querySelectorAll('[data-mobile-menu]').forEach((button) => {
    button.addEventListener('click', () => {
      menuTrigger = button;
      menu.showModal();
      button.setAttribute('aria-expanded', 'true');
      menu.querySelector('a').focus();
    });
  });
  menu?.querySelector('[data-close-menu]').addEventListener('click', () => menu.close());
  menu?.addEventListener('close', () => { menuTrigger?.setAttribute('aria-expanded','false'); menuTrigger?.focus(); });

  // Institutional access stays on the administrators' official domains.
  const officialMenus = {
    'A Embracon': [['História','https://www.embracon.com.br/a-embracon'],['Governança','https://www.embracon.com.br/governanca'],['Sustentabilidade','https://www.embracon.com.br/sustentabilidade']],
    'O Consórcio': [['Simule seu consórcio','#simular'],['O que é consórcio','https://www.embracon.com.br/conhecaoconsorcio/o-que-e-consorcio'],['Carta de crédito','https://www.embracon.com.br/carta-de-credito']],
    'Central de Ajuda': [['Falar com um consultor','#simular'],['Central de ajuda oficial','https://www.embracon.com.br/conhecaoconsorcio/o-que-e-consorcio']],
    'Cliente': [['Área do cliente','https://www.embracon.com.br/clientes'],['2ª via de boleto','https://autoatendimento.embracon.com.br/login']],
  };
  let activePopup;
  function closePopup() {
    if (!activePopup) return;
    activePopup.button.setAttribute('aria-expanded', 'false');
    activePopup.panel.remove();
    activePopup = null;
  }
  document.querySelectorAll('[data-official-menu]').forEach((button) => {
    button.addEventListener('click', () => {
      const wasOpen = activePopup?.button === button;
      closePopup();
      if (wasOpen) return;
      button.parentElement.style.position = 'relative';
      const panel = document.createElement('div');
      panel.className = 'consorcio-source-menu';
      (officialMenus[button.dataset.officialMenu] || []).forEach(([label, href]) => {
        const a = document.createElement('a'); a.textContent = label; a.href = href;
        if (href === '#simular') a.dataset.openLead = '';
        else { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        panel.append(a);
      });
      button.setAttribute('aria-expanded','true');
      button.parentElement.append(panel); activePopup = { button, panel };
    });
  });
  document.addEventListener('click', (event) => { if (activePopup && !activePopup.button.parentElement.contains(event.target)) closePopup(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closePopup(); });
  document.querySelectorAll('[data-disclosure]').forEach((button) => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    if (!panel) return;
    button.addEventListener('click', () => { panel.hidden = !panel.hidden; button.setAttribute('aria-expanded', String(!panel.hidden)); });
  });

  document.querySelectorAll('[data-youtube]').forEach((button) => button.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.className = 'consorcio-video-frame'; iframe.title = button.getAttribute('aria-label');
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(button.dataset.youtube)}?autoplay=1`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true; button.replaceWith(iframe);
  }));
  document.querySelectorAll('[data-background-video]').forEach((video) => {
    if (reduced) { video.removeAttribute('autoplay'); video.pause(); return; }
    video.muted = true;
    video.play().catch(() => { /* the poster/first frame remains visible */ });
  });
  const vwVideo = document.querySelector('.consorcio-vw-video');
  if (vwVideo && !reduced && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) vwVideo.play().catch(() => {}); else vwVideo.pause(); });
    }, { threshold: .4 }); observer.observe(vwVideo);
  }
  if (brand === 'volkswagen') {
    const nav = document.querySelector('nav[data-scrolled]');
    let queued = false;
    window.addEventListener('scroll', () => {
      if (queued || !nav) return; queued = true;
      requestAnimationFrame(() => { nav.dataset.scrolled = String(scrollY > 35); queued = false; });
    }, { passive: true });
  }
  if (brand === 'embracon' && !reduced) {
    const word = [...document.querySelectorAll('span')].find((span) => span.textContent.trim() === 'SONHOS');
    if (word) { const words = ['SONHOS','METAS','CONQUISTAS']; let current = 0;
      setInterval(() => { if (!document.hidden) { current = (current + 1) % words.length; word.textContent = words[current]; } }, 3500);
    }
  }
  if (brand === 'embracon') {
    const nav = document.querySelector('nav[data-has-scrolled]');
    let previous = scrollY, queued = false;
    window.addEventListener('scroll', () => {
      if (!nav || queued) return; queued = true;
      requestAnimationFrame(() => {
        nav.dataset.hasScrolled = String(scrollY > 30);
        nav.dataset.scrollDirection = scrollY > previous && scrollY > 200 ? 'down' : 'up';
        previous = scrollY; queued = false;
      });
    }, { passive: true });
  }
  document.querySelectorAll('[data-scroll-to]').forEach((button) => button.addEventListener('click', (event) => {
    event.preventDefault(); document.getElementById(button.dataset.scrollTo)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }));

  if (brand !== 'bradesco') return;
  const banners = [...document.querySelectorAll('[data-banner-slide]')];
  let bannerIndex = 0, timer;
  function showBanner(index) { bannerIndex = (index + banners.length) % banners.length; banners.forEach((el,i) => { el.hidden = i !== bannerIndex; }); }
  document.querySelector('[data-banner-prev]')?.addEventListener('click', () => showBanner(bannerIndex - 1));
  document.querySelector('[data-banner-next]')?.addEventListener('click', () => showBanner(bannerIndex + 1));
  const pause = document.querySelector('[data-banner-pause]');
  function startBanners() { timer = setInterval(() => { if (!document.hidden) showBanner(bannerIndex + 1); }, 7000); }
  if (!reduced && banners.length > 1) startBanners();
  pause?.addEventListener('click', () => {
    if (timer) { clearInterval(timer); timer = null; pause.textContent = '▶'; pause.setAttribute('aria-label','Retomar banners'); }
    else { startBanners(); pause.textContent = 'Ⅱ'; pause.setAttribute('aria-label','Pausar banners'); }
  });
  document.querySelectorAll('[data-bradesco-question]').forEach((button, index) => {
    const topic = button.closest('.pergunta-topico');
    const answer = topic ? topic.nextElementSibling : button.nextElementSibling;
    if (!answer) return;
    answer.id ||= `consorcio-answer-${index}`; button.setAttribute('aria-controls', answer.id); button.setAttribute('aria-expanded','false');
    button.addEventListener('click', () => { const open = answer.classList.toggle('is-open'); button.setAttribute('aria-expanded',String(open)); });
  });
  document.querySelectorAll('[data-faq-group]').forEach((button) => button.addEventListener('click', (event) => {
    event.preventDefault();
    const id = button.getAttribute('href').replace(/^.*#/, '');
    document.querySelectorAll('#selector .collapse').forEach((panel) => { panel.classList.toggle('is-open', panel.id === id); });
  }));
  document.querySelector('#selector .collapse')?.classList.add('is-open');
  document.querySelector('#selector .pergunta-topico [data-bradesco-question]')?.setAttribute('aria-expanded', 'true');
  document.querySelectorAll('[data-bradesco-tab]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-bradesco-tab]').forEach((b) => b.classList.toggle('open', b === button));
    document.querySelectorAll('#id-entenda-mobile .tab-content').forEach((panel) => panel.classList.toggle('open',panel.id === button.dataset.bradescoTab));
  }));
  const slides = [...document.querySelectorAll('#id-entenda .carrossel > div')];
  const tabHolder = document.querySelector('#id-entenda .slick-dots-custom');
  if (slides.length && tabHolder) {
    tabHolder.className = 'consorcio-tabs'; tabHolder.setAttribute('role','tablist');
    const labels = ['Entenda','Etapas','Contemplação'];
    slides.forEach((slide,index) => {
      slide.hidden = index !== 0;
      const button = document.createElement('button');button.type='button';button.textContent=labels[index];button.setAttribute('role','tab');button.setAttribute('aria-selected',String(index===0));
      button.addEventListener('click', () => { slides.forEach((s,i) => { s.hidden = i !== index; }); [...tabHolder.children].forEach((b,i) => b.setAttribute('aria-selected',String(i===index))); });
      tabHolder.append(button);
    });
  }
})();

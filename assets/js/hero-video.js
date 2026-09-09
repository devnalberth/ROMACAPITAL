/**
 * Roma Capital — vídeo da hero (padrão em todas as páginas).
 *
 * O <source> usa data-src: o vídeo só é baixado quando faz sentido —
 * fora de mobile, sem prefers-reduced-motion e sem economia de dados.
 * Nos demais casos fica o poster, sem custo de rede.
 */
(() => {
    const heroVideo = document.querySelector('.hero-video');

    if (!heroVideo) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    let heroIsVisible = true;

    const heroSource = heroVideo.querySelector('source[data-src]');
    // O vídeo agora pesa ~0,9 MB, então também carrega no celular.
    // Continua fora do ar em prefers-reduced-motion, economia de dados e 2G.
    const redeLenta = /(^|-)2g$/.test(connection?.effectiveType || '');
    const shouldLoadVideo = !reducedMotion.matches && !connection?.saveData && !redeLenta;

    if (heroSource && shouldLoadVideo) {
        heroSource.src = heroSource.dataset.src;
        heroVideo.load();
    }

    const syncHeroMotion = () => {
        if (!shouldLoadVideo || reducedMotion.matches || !heroIsVisible) {
            heroVideo.pause();
            return;
        }

        heroVideo.play().catch(() => {});
    };

    const resetHeroFrame = () => {
        if (!reducedMotion.matches) return;

        if (heroVideo.readyState >= 1) {
            heroVideo.currentTime = 0;
            return;
        }

        heroVideo.addEventListener('loadedmetadata', () => {
            heroVideo.currentTime = 0;
        }, { once: true });
    };

    const heroObserver = new IntersectionObserver(([entry]) => {
        heroIsVisible = entry.isIntersecting;
        syncHeroMotion();
    }, { threshold: 0.05 });

    syncHeroMotion();
    resetHeroFrame();
    heroObserver.observe(heroVideo);
    reducedMotion.addEventListener?.('change', () => {
        syncHeroMotion();
        resetHeroFrame();
    });
})();

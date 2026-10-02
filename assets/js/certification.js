/* Certificação PCA-10 — mesma validação pública utilizada no site da RBS. */
(() => {
    'use strict';

    const pcaValidationUrl = 'https://moodle.abac.kaptiva.com.br/mod/customcert/verify_certificate.php';

    document.querySelectorAll('[data-pca]').forEach((link) => {
        link.href = pcaValidationUrl;
    });
})();

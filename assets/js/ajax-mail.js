$(function() {

    // Get the form.
    var form = $('#contact-form');

    if (!form.length) {
        return;
    }

    // Get the messages div.
    var formMessages = $('.form-message');

    if (!formMessages.length) {
        formMessages = $('<div class="form-message" role="status" aria-live="polite"></div>');
        form.append(formMessages);
    }

    // Set up an event listener for the contact form.
    $(form).submit(function(e) {
        // Stop the browser from submitting the form.
        e.preventDefault();

        if (!form[0].checkValidity()) {
            form[0].reportValidity();
            return;
        }

        var submitButton = form.find('button[type="submit"]');
        var submitLabel = submitButton.find('.btn-title');
        var originalLabel = submitLabel.text();

        submitButton.prop('disabled', true).attr('aria-busy', 'true');
        submitLabel.text('Enviando…');
        formMessages.removeClass('success error').text('');

        // Serialize the form data.
        var formData = $(form).serialize();

        // Submit the form using AJAX.
        $.ajax({
            type: 'POST',
            url: $(form).attr('action'),
            data: formData
        })
        .done(function(response) {
            // Make sure that the formMessages div has the 'success' class.
            $(formMessages).removeClass('error');
            $(formMessages).addClass('success');

            // Set the message text.
            $(formMessages).text(response);

            // Clear the form.
            form[0].reset();
        })
        .fail(function(data) {
            // Make sure that the formMessages div has the 'error' class.
            $(formMessages).removeClass('success');
            $(formMessages).addClass('error');

            // Set the message text.
            if (data.responseText !== '') {
                $(formMessages).text(data.responseText);
            } else {
                $(formMessages).text('Não foi possível enviar sua solicitação. Tente novamente ou fale conosco por e-mail.');
            }
        })
        .always(function() {
            submitButton.prop('disabled', false).removeAttr('aria-busy');
            submitLabel.text(originalLabel);
        });
    });

});

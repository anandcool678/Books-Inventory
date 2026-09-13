package com.bookscatalogue.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendBookAddedEmail(String recipientEmail, String userName, String bookTitle, String isbn) {
        if (!mailEnabled) {
            log.info("Book upload email is disabled. Skipping email for user {} and book {}", userName, bookTitle);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(recipientEmail);
            message.setSubject("Book added to your inventory");
            message.setText(
                    "Hello " + userName + ",\n\n" +
                            "Your inventory has been updated with the following book:\n" +
                            "Title: " + bookTitle + "\n" +
                            "ISBN: " + isbn + "\n\n" +
                            "Thanks for using the Books Catalogue app."
            );
            mailSender.send(message);
            log.info("Book upload email sent to {} for ISBN {}", recipientEmail, isbn);
        } catch (Exception e) {
            log.warn("Failed to send book upload email to {} for ISBN {}. Error: {}", recipientEmail, isbn, e.getMessage());
        }
    }
}

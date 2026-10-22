package de.linus.tnbp.access;

import java.time.Clock;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import jakarta.validation.Validator;
import jakarta.validation.constraints.Email;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class RegistrationService {
    private final AccountRepository accounts;
    private final PasswordPolicy passwords;
    private final PasswordEncoder encoder;
    private final RegistrationLink link;
    private final Clock clock;
    private final Validator validator;
    private final TransactionTemplate transaction;

    public RegistrationService(AccountRepository accounts, PasswordPolicy passwords, PasswordEncoder encoder,
            RegistrationLink link, Clock clock, Validator validator, PlatformTransactionManager transactionManager) {
        this.accounts = accounts;
        this.passwords = passwords;
        this.encoder = encoder;
        this.link = link;
        this.clock = clock;
        this.validator = validator;
        this.transaction = new TransactionTemplate(transactionManager);
    }

    public void register(String token, String email, String password) {
        String normalizedEmail = email == null ? "" : email.strip().toLowerCase(Locale.ROOT);
        String normalizedPassword = passwords.normalize(password);
        Map<String, String> errors = new LinkedHashMap<>();
        if (normalizedEmail.isEmpty() || normalizedEmail.length() > 254
                || !validator.validate(new EmailAddress(normalizedEmail)).isEmpty()
                || !normalizedEmail.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
            errors.put("email", "Gib eine gültige E-Mail-Adresse mit höchstens 254 Zeichen ein.");
        }
        String passwordError = passwords.error(normalizedPassword);
        if (passwordError != null) {
            errors.put("password", passwordError);
        }
        if (!errors.isEmpty()) {
            throw new RegistrationFailure(errors);
        }
        if (!link.accepts(token, clock.instant())) {
            throw new RegistrationFailure(Map.of());
        }
        String hash = encoder.encode(normalizedPassword);
        try {
            transaction.executeWithoutResult(status ->
                accounts.insert(UUID.randomUUID(), normalizedEmail, hash, clock.instant()));
        } catch (DuplicateKeyException duplicate) {
            throw new RegistrationFailure(Map.of());
        }
    }

    private record EmailAddress(@Email String value) {}
}

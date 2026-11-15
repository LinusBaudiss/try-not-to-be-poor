package de.linus.tnbp.access;

import jakarta.validation.Validator;
import jakarta.validation.constraints.Email;
import java.util.Locale;

/** Reine Registrierungsregel für normalisierte E-Mail-Adressen. */
final class RegistrationEmailPolicy {
    private RegistrationEmailPolicy() {}

    static String normalize(String email) {
        return email == null ? "" : email.strip().toLowerCase(Locale.ROOT);
    }

    static boolean valid(String normalizedEmail, Validator validator) {
        return normalizedEmail != null && !normalizedEmail.isEmpty() && normalizedEmail.length() <= 254
            && validator.validate(new EmailAddress(normalizedEmail)).isEmpty()
            && normalizedEmail.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+");
    }

    private record EmailAddress(@Email String value) {}
}

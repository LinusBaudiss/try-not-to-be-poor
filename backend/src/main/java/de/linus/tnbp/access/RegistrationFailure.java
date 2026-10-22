package de.linus.tnbp.access;

import java.util.Map;

class RegistrationFailure extends RuntimeException {
    private final Map<String, String> fieldErrors;

    RegistrationFailure(Map<String, String> fieldErrors) {
        super("Registrierung nicht möglich.");
        this.fieldErrors = Map.copyOf(fieldErrors);
    }

    Map<String, String> fieldErrors() {
        return fieldErrors;
    }
}

package de.linus.tnbp.access;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.List;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;

class RegistrationEmailTest {
    private static final ValidatorFactory FACTORY = Validation.buildDefaultValidatorFactory();
    private static final Validator VALIDATOR = FACTORY.getValidator();

    @AfterAll static void closeValidatorFactory() { FACTORY.close(); }

    @Test void normalisiertVorDerFachpruefungOhneLocaleAbhaengigkeit() {
        assertThat(RegistrationEmailPolicy.normalize("  PERSON@EXAMPLE.ORG  ")).isEqualTo("person@example.org");
        assertThat(RegistrationEmailPolicy.normalize(null)).isEmpty();
    }

    @Test void gueltigkeitsregelBehaelt254ZeichenGrenzeUndFormatbeispiele() {
        String boundary = "a".repeat(64) + "@" + "b".repeat(63) + "." + "c".repeat(63) + "." + "d".repeat(61);
        assertThat(boundary).hasSize(254);
        assertThat(RegistrationEmailPolicy.valid(boundary, VALIDATOR)).isTrue();
        assertThat(RegistrationEmailPolicy.valid(boundary + "d", VALIDATOR)).isFalse();
        for (String email : List.of("", "kaputt", "zwei@@example.org", "a b@example.org"))
            assertThat(RegistrationEmailPolicy.valid(RegistrationEmailPolicy.normalize(email), VALIDATOR)).isFalse();
    }
}

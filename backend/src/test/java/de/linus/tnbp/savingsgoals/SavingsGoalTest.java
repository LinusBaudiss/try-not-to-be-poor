package de.linus.tnbp.savingsgoals;

import static org.assertj.core.api.Assertions.*;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class SavingsGoalTest {
    @Test void positiveSichereCentUndNichtleereNamenSindErforderlich() {
        for (long value : new long[] {1, 9007199254740991L})
            assertThatCode(() -> SavingsGoals.validate("  Reise  ", value, LocalDate.of(2000, 2, 29))).doesNotThrowAnyException();
        for (Long value : new Long[] {null, 0L, -1L, 9007199254740992L, Long.MIN_VALUE, Long.MAX_VALUE})
            assertThatThrownBy(() -> SavingsGoals.validate("Reise", value, null)).isInstanceOf(SavingsGoals.InvalidGoal.class);
        for (String name : new String[] {null, "", "  ", "\t\n", "\u2003", "\u00a0", "\uFEFF", "Rei\0se"})
            assertThatThrownBy(() -> SavingsGoals.validate(name, 1L, null)).isInstanceOf(SavingsGoals.InvalidGoal.class);
        for (var date : new LocalDate[] {LocalDate.of(0, 1, 1), LocalDate.of(10000, 1, 1)})
            assertThatThrownBy(() -> SavingsGoals.validate("Reise", 1L, date)).isInstanceOf(SavingsGoals.InvalidGoal.class);
    }
    @Test void validierungGeschiehtVorDatenbankzugriffUndTrimEntsprichtDerOberflaeche() {
        var repository = org.mockito.Mockito.mock(SavingsGoalRepository.class);
        var service = new SavingsGoals(repository);
        assertThatThrownBy(() -> service.save(null, "Rei\0se", 1L, null)).isInstanceOf(SavingsGoals.InvalidGoal.class);
        assertThatThrownBy(() -> service.update(null, UUID.randomUUID(), "Rei\0se", 1L, null)).isInstanceOf(SavingsGoals.InvalidGoal.class);
        org.mockito.Mockito.verifyNoInteractions(repository);
        assertThat(SavingsGoals.trimName(" \u00a0\uFEFFReise 🧳\u2003 ")).isEqualTo("Reise 🧳");
    }
    @Test void ungueltigerFortschrittWirdVorTransaktionUndDatenbankAbgewiesen() {
        var repository = org.mockito.Mockito.mock(SavingsGoalRepository.class);
        var service = new SavingsGoals(repository);
        for (Long value : new Long[] {null, -1L, 9007199254740992L, Long.MIN_VALUE, Long.MAX_VALUE}) {
            assertThatThrownBy(() -> service.progress(null, UUID.randomUUID(), value))
                .isInstanceOfSatisfying(SavingsGoals.InvalidGoal.class,
                    failure -> assertThat(failure.fields).containsOnlyKeys("progressCents"));
        }
        org.mockito.Mockito.verifyNoInteractions(repository);
    }

    @ParameterizedTest(name = "signierter Fortschritt {0} Cent bleibt exakt")
    @CsvSource({"-9007199254740991", "-3000", "0", "7000", "15000", "9007199254740991"})
    void signierterFortschrittErlaubtVorzeichenUndBeideSicherenGrenzen(long cents) {
        assertThatCode(() -> SavingsGoals.validateSignedProgress(cents)).doesNotThrowAnyException();
    }

    @ParameterizedTest(name = "signierter Fortschritt außerhalb der Grenze: {0}")
    @CsvSource({"-9007199254740992", "9007199254740992"})
    void signierterFortschrittLehntGrenzueberschreitungAb(long cents) {
        assertThatThrownBy(() -> SavingsGoals.validateSignedProgress(cents))
            .isInstanceOfSatisfying(SavingsGoals.InvalidGoal.class,
                failure -> assertThat(failure.fields).containsOnlyKeys("progressCents"));
    }

    @ParameterizedTest(name = "v1-Fortschritt {0} Cent: gültig={1}")
    @CsvSource({"0,true", "2000,true", "9007199254740991,true", "-1,false", "9007199254740992,false"})
    void v1FortschrittBleibtNichtnegativBisZumSicherenMaximum(long cents, boolean valid) {
        if (valid) assertThatCode(() -> SavingsGoals.validateProgress(cents)).doesNotThrowAnyException();
        else assertThatThrownBy(() -> SavingsGoals.validateProgress(cents)).isInstanceOf(SavingsGoals.InvalidGoal.class);
    }

    @ParameterizedTest(name = "Progress {0} mit Differenz {1} ergibt {2}")
    @CsvSource({"2000,-5000,-3000", "30000,-5000,25000"})
    void korrekturdifferenzWirdAufDenTatsaechlichenFortschrittAngewandt(long current, long difference, long expected) {
        assertThat(SavingsGoals.progressAfterDifference(current, difference)).isEqualTo(expected);
    }

    @ParameterizedTest(name = "Korrektur außerhalb der sicheren Grenze: {0} + {1}")
    @CsvSource({"9007199254740991,1", "-9007199254740991,-1"})
    void korrekturdifferenzLehntUnsicherenGesamtstandAb(long current, long difference) {
        assertThatThrownBy(() -> SavingsGoals.progressAfterDifference(current, difference))
            .isInstanceOf(ArithmeticException.class);
    }

    @Test void signierterFortschrittLehntFehlendenWertAb() {
        assertThatThrownBy(() -> SavingsGoals.validateSignedProgress(null))
            .isInstanceOf(SavingsGoals.InvalidGoal.class);
    }

}

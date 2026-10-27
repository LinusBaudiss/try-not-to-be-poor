package de.linus.tnbp.savingsgoals;

import static org.assertj.core.api.Assertions.*;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

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

}

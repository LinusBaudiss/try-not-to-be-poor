package de.linus.tnbp.savingsgoals;

import static org.assertj.core.api.Assertions.*;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SavingsGoalTest {
    @Test void positiveSichereCentUndNichtleereNamenSindErforderlich() {
        for (long value : new long[] {1, 9007199254740991L})
            assertThatCode(() -> SavingsGoalService.validate("  Reise  ", value, LocalDate.of(2000, 2, 29))).doesNotThrowAnyException();
        for (Long value : new Long[] {null, 0L, -1L, 9007199254740992L, Long.MIN_VALUE, Long.MAX_VALUE})
            assertThatThrownBy(() -> SavingsGoalService.validate("Reise", value, null)).isInstanceOf(SavingsGoalService.InvalidGoal.class);
        for (String name : new String[] {null, "", "  ", "\t\n", "\u2003", "\u00a0", "\uFEFF", "Rei\0se"})
            assertThatThrownBy(() -> SavingsGoalService.validate(name, 1L, null)).isInstanceOf(SavingsGoalService.InvalidGoal.class);
        for (var date : new LocalDate[] {LocalDate.of(0, 1, 1), LocalDate.of(10000, 1, 1)})
            assertThatThrownBy(() -> SavingsGoalService.validate("Reise", 1L, date)).isInstanceOf(SavingsGoalService.InvalidGoal.class);
    }
    @Test void validierungGeschiehtVorDatenbankzugriffUndTrimEntsprichtDerOberflaeche() {
        var repository = org.mockito.Mockito.mock(SavingsGoalRepository.class);
        var manager = org.mockito.Mockito.mock(org.springframework.transaction.PlatformTransactionManager.class);
        var service = new SavingsGoalService(repository, manager);
        assertThatThrownBy(() -> service.save(UUID.randomUUID(), "Rei\0se", 1L, null)).isInstanceOf(SavingsGoalService.InvalidGoal.class);
        org.mockito.Mockito.verifyNoInteractions(repository, manager);
        assertThat(SavingsGoalService.trimName(" \u00a0\uFEFFReise 🧳\u2003 ")).isEqualTo("Reise 🧳");
    }
}

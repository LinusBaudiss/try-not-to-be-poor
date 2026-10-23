package de.linus.tnbp.expensebudget;

import static org.assertj.core.api.Assertions.*;
import java.time.*;
import org.junit.jupiter.api.Test;

class ExpenseTest {
    @Test void nameUndPositiveGanzeSichereCentSindErforderlich() {
        for (long value : new long[] {1, 9007199254740991L})
            assertThatCode(() -> ExpenseService.validate("  Brot  ", value)).doesNotThrowAnyException();
        for (Long value : new Long[] {null, 0L, -1L, 9007199254740992L, Long.MIN_VALUE, Long.MAX_VALUE})
            assertThatThrownBy(() -> ExpenseService.validate("Brot", value)).isInstanceOf(ExpenseService.InvalidExpense.class);
        for (String name : new String[] {null, "", "  ", "\t\n", "\u2003", "\u00a0", "\uFEFF"})
            assertThatThrownBy(() -> ExpenseService.validate(name, 1L)).isInstanceOf(ExpenseService.InvalidExpense.class);
    }
    @Test void nullzeichenWirdVorDerTransaktionAlsNamensfehlerAbgewiesen() {
        var repository = org.mockito.Mockito.mock(ExpenseRepository.class);
        var manager = org.mockito.Mockito.mock(org.springframework.transaction.PlatformTransactionManager.class);
        var service = new ExpenseService(repository, Clock.systemUTC(), manager);
        assertThatThrownBy(() -> service.save(java.util.UUID.randomUUID(), "Bro\0t", 1L))
            .isInstanceOfSatisfying(ExpenseService.InvalidExpense.class, failure ->
                assertThat(failure.fields).containsOnlyKeys("name").containsValue("Entferne das Nullzeichen aus dem Namen der Ausgabe."));
        org.mockito.Mockito.verifyNoInteractions(repository, manager);
    }
    @Test void nameWirdWieInDerEuroOberflaecheGetrimmt() {
        assertThat(ExpenseService.trimName(" \u00a0\uFEFFBrot 🥖\u2003 ")).isEqualTo("Brot 🥖");
    }
    @Test void datumVerwendetBerlinBeiWinterSommerMonatsUndJahresgrenzen() {
        String[][] boundaries = {
            {"2026-10-31T22:59:59Z", "2026-10-31"}, {"2026-10-31T23:00:00Z", "2026-11-01"},
            {"2026-06-30T21:59:59Z", "2026-06-30"}, {"2026-06-30T22:00:00Z", "2026-07-01"},
            {"2026-12-31T22:59:59Z", "2026-12-31"}, {"2026-12-31T23:00:00Z", "2027-01-01"},
            {"2026-03-29T01:00:00Z", "2026-03-29"}, {"2026-10-25T01:00:00Z", "2026-10-25"}
        };
        for (String[] boundary : boundaries) assertThat(ExpenseService.recordedOn(Clock.fixed(Instant.parse(boundary[0]), ZoneOffset.UTC)))
            .isEqualTo(LocalDate.parse(boundary[1]));
    }
}

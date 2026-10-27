package de.linus.tnbp.expenses;

import static org.assertj.core.api.Assertions.*;
import java.time.*;
import org.junit.jupiter.api.Test;

class ExpenseTest {
    @Test void nameUndPositiveGanzeSichereCentSindErforderlich() {
        for (long value : new long[] {1, 9007199254740991L})
            assertThatCode(() -> Expenses.validate("  Brot  ", value)).doesNotThrowAnyException();
        for (Long value : new Long[] {null, 0L, -1L, 9007199254740992L, Long.MIN_VALUE, Long.MAX_VALUE})
            assertThatThrownBy(() -> Expenses.validate("Brot", value)).isInstanceOf(Expenses.InvalidExpense.class);
        for (String name : new String[] {null, "", "  ", "\t\n", "\u2003", "\u00a0", "\uFEFF"})
            assertThatThrownBy(() -> Expenses.validate(name, 1L)).isInstanceOf(Expenses.InvalidExpense.class);
    }
    @Test void nullzeichenWirdVorDerTransaktionAlsNamensfehlerAbgewiesen() {
        var repository = org.mockito.Mockito.mock(ExpenseRepository.class);
        var service = new Expenses(repository);
        assertThatThrownBy(() -> service.save(null, "Bro\0t", 1L))
            .isInstanceOfSatisfying(Expenses.InvalidExpense.class, failure ->
                assertThat(failure.fields).containsOnlyKeys("name").containsValue("Entferne das Nullzeichen aus dem Namen der Ausgabe."));
        org.mockito.Mockito.verifyNoInteractions(repository);
    }
    @Test void bearbeitungValidiertEbenfallsVorJedemDatenbankzugriff() {
        var repository = org.mockito.Mockito.mock(ExpenseRepository.class);
        var service = new Expenses(repository);
        assertThatThrownBy(() -> service.update(null, java.util.UUID.randomUUID(), "  ", 1L))
            .isInstanceOf(Expenses.InvalidExpense.class);
        assertThatThrownBy(() -> service.update(null, java.util.UUID.randomUUID(), "Brot", 0L))
            .isInstanceOf(Expenses.InvalidExpense.class);
        org.mockito.Mockito.verifyNoInteractions(repository);
    }
    @Test void nameWirdWieInDerEuroOberflaecheGetrimmt() {
        assertThat(Expenses.trimName(" \u00a0\uFEFFBrot 🥖\u2003 ")).isEqualTo("Brot 🥖");
    }
}

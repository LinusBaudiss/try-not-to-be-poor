package de.linus.tnbp.expenses;

import static org.assertj.core.api.Assertions.*;
import java.math.BigDecimal;
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

    @Test void monatsgesamtstandAkzeptiertNurGanzeNichtnegativeSichereCent() {
        assertThat(Expenses.checkedTotal(BigDecimal.ZERO)).isZero();
        assertThat(Expenses.checkedTotal(BigDecimal.valueOf(1))).isEqualTo(1);
        assertThat(Expenses.checkedTotal(BigDecimal.valueOf(9007199254740991L))).isEqualTo(9007199254740991L);
        for (String value : new String[]{"-1", "9007199254740992", "1.5", "9223372036854775808"}) {
            assertThatThrownBy(() -> Expenses.checkedTotal(new BigDecimal(value)))
                .isInstanceOf(Expenses.MonthLimit.class);
        }
    }

    @Test void monatsänderungBerechnetNeuenGesamtstandMitExakterDifferenz() {
        // Abgeleitet aus der fachlichen Regel: alte Ausgabe ersetzen, nie den Bestand addieren.
        assertThat(Expenses.replacementTotal(BigDecimal.valueOf(80000), 80000, 85000)).isEqualTo(85000);
        assertThat(Expenses.replacementTotal(BigDecimal.valueOf(9007199254740991L),
            9007199254740991L, 9007199254740991L))
            .isEqualTo(9007199254740991L);
        assertThatThrownBy(() -> Expenses.replacementTotal(BigDecimal.valueOf(100), 35, 9007199254740928L))
            .isInstanceOf(Expenses.MonthLimit.class);
    }
}

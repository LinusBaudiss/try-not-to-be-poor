package de.linus.tnbp.budget;

import static org.assertj.core.api.Assertions.*;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class BudgetTest {
    @Test void betraegeSindGanzeNichtnegativeSichereCentwerte() {
        assertThatCode(() -> Budgets.validate(0L)).doesNotThrowAnyException();
        assertThatCode(() -> Budgets.validate(9007199254740991L)).doesNotThrowAnyException();
        for (Long amount : new Long[] {null, -1L, 9007199254740992L, Long.MAX_VALUE, Long.MIN_VALUE}) {
            assertThatThrownBy(() -> Budgets.validate(amount)).isInstanceOf(Budgets.InvalidAmount.class);
        }
    }

}

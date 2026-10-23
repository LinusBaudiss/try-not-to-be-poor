package de.linus.tnbp.expensebudget;

import static org.assertj.core.api.Assertions.*;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class BudgetTest {
    @Test void betraegeSindGanzeNichtnegativeSichereCentwerte() {
        assertThatCode(() -> BudgetService.validate(0L)).doesNotThrowAnyException();
        assertThatCode(() -> BudgetService.validate(9007199254740991L)).doesNotThrowAnyException();
        for (Long amount : new Long[] {null, -1L, 9007199254740992L, Long.MAX_VALUE, Long.MIN_VALUE}) {
            assertThatThrownBy(() -> BudgetService.validate(amount)).isInstanceOf(BudgetService.InvalidAmount.class);
        }
    }

    @Test void monatsgrenzenVerwendenBerlinAuchBeiSommerzeitUndJahreswechsel() {
        String[][] boundaries = {
            {"2026-10-31T22:59:59Z", "2026-10-01"}, {"2026-10-31T23:00:00Z", "2026-11-01"},
            {"2026-06-30T21:59:59Z", "2026-06-01"}, {"2026-06-30T22:00:00Z", "2026-07-01"},
            {"2026-12-31T22:59:59Z", "2026-12-01"}, {"2026-12-31T23:00:00Z", "2027-01-01"},
            {"2026-03-29T01:00:00Z", "2026-03-01"}, {"2026-10-25T01:00:00Z", "2026-10-01"}
        };
        for (String[] boundary : boundaries) {
            assertThat(BudgetService.currentMonth(Clock.fixed(Instant.parse(boundary[0]), ZoneOffset.UTC)))
                .isEqualTo(LocalDate.parse(boundary[1]));
        }
    }
}

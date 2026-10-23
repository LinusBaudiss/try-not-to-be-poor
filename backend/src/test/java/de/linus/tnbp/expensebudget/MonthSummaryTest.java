package de.linus.tnbp.expensebudget;

import static org.assertj.core.api.Assertions.*;
import java.math.BigDecimal;
import java.time.*;
import org.junit.jupiter.api.Test;

class MonthSummaryTest {
    static final LocalDate MONTH = LocalDate.of(2026, 10, 1);
    @Test void fehlendNullNegativUndCentgrenzenWerdenExaktBerechnet() {
        assertThat(MonthSummaryService.calculate(MONTH, null, BigDecimal.ZERO).remainingCents()).isNull();
        assertThat(MonthSummaryService.calculate(MONTH, 10000L, BigDecimal.valueOf(1234)).remainingCents()).isEqualTo(8766);
        assertThat(MonthSummaryService.calculate(MONTH, 10000L, BigDecimal.ZERO).remainingCents()).isEqualTo(10000);
        assertThat(MonthSummaryService.calculate(MONTH, 0L, BigDecimal.ZERO).remainingCents()).isZero();
        long max = BudgetService.MAX_CENTS;
        assertThat(MonthSummaryService.calculate(MONTH, 0L, BigDecimal.valueOf(max)).remainingCents()).isEqualTo(-max);
        assertThat(MonthSummaryService.calculate(MONTH, max, BigDecimal.ZERO).remainingCents()).isEqualTo(max);
        assertThat(MonthSummaryService.calculate(MONTH, max, BigDecimal.valueOf(max - 1)).remainingCents()).isEqualTo(1);
        for (BigDecimal invalid : new BigDecimal[] {BigDecimal.valueOf(-1), BigDecimal.valueOf(max).add(BigDecimal.ONE), new BigDecimal("1.1"), new BigDecimal("9223372036854775808")})
            assertThatThrownBy(() -> MonthSummaryService.calculate(MONTH, 0L, invalid)).isInstanceOf(ArithmeticException.class);
        for (long invalid : new long[] {-1, max + 1})
            assertThatThrownBy(() -> MonthSummaryService.calculate(MONTH, invalid, BigDecimal.ZERO)).isInstanceOf(ArithmeticException.class);
    }
    @Test void berlinMonatWirdAuchImSommerUndBeimJahreswechselVerwendet() {
        String[][] cases = {{"2026-06-30T21:59:59Z", "2026-06-01"}, {"2026-06-30T22:00:00Z", "2026-07-01"},
            {"2026-10-31T22:59:59Z", "2026-10-01"}, {"2026-10-31T23:00:00Z", "2026-11-01"},
            {"2026-12-31T23:00:00Z", "2027-01-01"}};
        for (String[] c : cases) assertThat(BudgetService.currentMonth(Clock.fixed(Instant.parse(c[0]), ZoneOffset.UTC))).isEqualTo(LocalDate.parse(c[1]));
    }
}

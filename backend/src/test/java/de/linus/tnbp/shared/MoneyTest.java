package de.linus.tnbp.shared;

import static org.assertj.core.api.Assertions.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class MoneyTest {
    @Test void summenUndDifferenzenBleibenExaktInnerhalbDerSicherenCentgrenze() {
        long max = Money.MAX_CENTS;
        assertThat(Money.subtract(0, max)).isEqualTo(-max);
        assertThat(Money.subtract(max, max - 1)).isEqualTo(1);
        assertThat(Money.nonnegativeExact(BigDecimal.valueOf(max))).isEqualTo(max);
        for (String invalid : new String[] {"-1", "9007199254740992", "1.1", "9223372036854775808"})
            assertThatThrownBy(() -> Money.nonnegativeExact(new BigDecimal(invalid))).isInstanceOf(ArithmeticException.class);
        assertThatThrownBy(() -> Money.subtract(max, -1)).isInstanceOf(ArithmeticException.class);
        assertThatThrownBy(() -> Money.exact(-max - 1)).isInstanceOf(ArithmeticException.class);
    }

    @Test void einZeitpunktBestimmtBerlinTagUndMonatAuchAnZeitumstellungen() {
        String[][] boundaries = {
            {"2026-10-31T22:59:59Z", "2026-10-31"}, {"2026-10-31T23:00:00Z", "2026-11-01"},
            {"2026-06-30T21:59:59Z", "2026-06-30"}, {"2026-06-30T22:00:00Z", "2026-07-01"},
            {"2026-12-31T23:00:00Z", "2027-01-01"},
            {"2026-03-29T00:59:59Z", "2026-03-29"}, {"2026-03-29T01:00:00Z", "2026-03-29"},
            {"2026-10-25T00:59:59Z", "2026-10-25"}, {"2026-10-25T01:00:00Z", "2026-10-25"}
        };
        for (String[] boundary : boundaries) {
            var instant = Instant.parse(boundary[0]);
            var context = new FinanceContext(UUID.randomUUID(), instant, false, null, null, null);
            assertThat(context.instant()).isEqualTo(instant);
            assertThat(context.day()).isEqualTo(LocalDate.parse(boundary[1]));
            assertThat(context.month()).isEqualTo(LocalDate.parse(boundary[1]).withDayOfMonth(1));
            assertThatThrownBy(context::requireRead).isInstanceOf(IllegalStateException.class);
        }
    }
}

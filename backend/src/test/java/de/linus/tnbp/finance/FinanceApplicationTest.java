package de.linus.tnbp.finance;

import static org.assertj.core.api.Assertions.*;
import org.junit.jupiter.api.Test;

class FinanceApplicationTest {
    @Test void fehlendesNullUndPositivesBudgetBleibenImRestbudgetUnterschieden() {
        assertThat(FinanceApplication.remainingCents(null, 100)).isNull();
        assertThat(FinanceApplication.remainingCents(0L, 0)).isZero();
        assertThat(FinanceApplication.remainingCents(10000L, 0)).isEqualTo(10000);
        assertThat(FinanceApplication.remainingCents(10000L, 1234)).isEqualTo(8766);
        assertThat(FinanceApplication.remainingCents(0L, 1234)).isEqualTo(-1234);
        assertThat(FinanceApplication.remainingCents(99999L, 55555)).isEqualTo(44444);
        assertThat(FinanceApplication.remainingCents(99999L, 0)).isEqualTo(99999);
    }

    @Test void restbudgetBleibtExaktBisZurSicherenGrenzeUndLehntUeberlaufAb() {
        long max = 9007199254740991L;
        assertThat(FinanceApplication.remainingCents(max, 0)).isEqualTo(max);
        assertThat(FinanceApplication.remainingCents(0L, max)).isEqualTo(-max);
        assertThatThrownBy(() -> FinanceApplication.remainingCents(max, -1)).isInstanceOf(ArithmeticException.class);
    }
}

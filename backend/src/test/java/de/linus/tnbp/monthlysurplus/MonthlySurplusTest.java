package de.linus.tnbp.monthlysurplus;

import static org.assertj.core.api.Assertions.*;
import de.linus.tnbp.shared.Money;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class MonthlySurplusTest {
    @Test void exakteFormelUnterscheidetBudgetNullUndFehlendesBudget() {
        assertThat(MonthlySurplus.surplus(100000L, 80000)).isEqualTo(20000L);
        assertThat(MonthlySurplus.surplus(10000L, 0)).isEqualTo(10000L);
        assertThat(MonthlySurplus.surplus(100L, 100)).isZero();
        assertThat(MonthlySurplus.surplus(100L, 101)).isZero();
        assertThat(MonthlySurplus.surplus(0L, 0)).isZero();
        assertThat(MonthlySurplus.surplus(null, 100)).isNull();
        assertThat(MonthlySurplus.surplus(Money.MAX_CENTS, 0)).isEqualTo(Money.MAX_CENTS);
        assertThat(MonthlySurplus.surplus(0L, Money.MAX_CENTS)).isZero();
        for (long invalid : new long[]{-1, Money.MAX_CENTS + 1, Long.MAX_VALUE}) {
            assertThatThrownBy(() -> MonthlySurplus.surplus(invalid, 0)).isInstanceOf(ArithmeticException.class);
            assertThatThrownBy(() -> MonthlySurplus.surplus(null, invalid)).isInstanceOf(ArithmeticException.class);
        }
    }
    @Test void nurErstmonatBisLetztenAbgeschlossenenMonatOhneDatumsnormalisierung() {
        var october = LocalDate.of(2026, 10, 1);
        var november = october.plusMonths(1);
        assertThat(MonthlySurplus.eligible(october, november, october)).isTrue();
        for (var month : new LocalDate[]{null, october.minusMonths(1), november, november.plusMonths(1), october.plusDays(1)})
            assertThat(MonthlySurplus.eligible(october, november, month)).isFalse();
        assertThat(MonthlySurplus.eligible(null, november, october)).isFalse();
        assertThat(MonthlySurplus.eligible(october, october, october)).isFalse();
    }
    @Test void ersatzsummePrueftDenNeuenGesamtstandOhneZwischenueberlauf() {
        var open = new MonthlySurplus.MonthRecord(20000L,null,false);
        assertThat(MonthlySurplus.replacementPending(java.math.BigDecimal.valueOf(30000),open,15000L)).isEqualTo(25000);
        assertThat(MonthlySurplus.replacementPending(java.math.BigDecimal.valueOf(30000),open,0L)).isEqualTo(10000);
        var atLimit = new MonthlySurplus.MonthRecord(Money.MAX_CENTS,null,false);
        assertThat(MonthlySurplus.replacementPending(java.math.BigDecimal.valueOf(Money.MAX_CENTS),atLimit,Money.MAX_CENTS)).isEqualTo(Money.MAX_CENTS);
        assertThatThrownBy(()->MonthlySurplus.replacementPending(java.math.BigDecimal.valueOf(Money.MAX_CENTS),open,20001L)).isInstanceOf(ArithmeticException.class);
        var bound = new MonthlySurplus.MonthRecord(20000L,java.util.UUID.randomUUID(),true);
        assertThat(MonthlySurplus.replacementPending(java.math.BigDecimal.ZERO,bound,15000L)).isZero();
        var noBudget = new MonthlySurplus.MonthRecord(null,null,false);
        assertThat(MonthlySurplus.replacementPending(java.math.BigDecimal.ZERO,noBudget,null)).isZero();
    }
}

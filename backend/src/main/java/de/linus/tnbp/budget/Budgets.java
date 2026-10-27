package de.linus.tnbp.budget;

import de.linus.tnbp.shared.FinanceContext;
import de.linus.tnbp.shared.Money;
import java.time.LocalDate;
import org.springframework.stereotype.Service;

/** Historisch gültiges Budget des angegebenen Monats oder ausdrücklich kein Budget. */
@Service
public class Budgets {
    private final BudgetRepository budgets;
    Budgets(BudgetRepository budgets) { this.budgets = budgets; }
    public Long current(FinanceContext context, LocalDate month) {
        context.requireRead();
        Long amount = budgets.current(context.userId(), month);
        if (amount != null && !Money.nonnegative(amount)) throw new ArithmeticException("Ungültige Centgrenze");
        return amount;
    }
    public long save(FinanceContext context, Long amountCents) {
        validate(amountCents);
        context.requireWrite();
        budgets.save(context.userId(), context.month(), amountCents);
        return amountCents;
    }
    public static void validate(Long amountCents) {
        if (!Money.nonnegative(amountCents)) throw new InvalidAmount();
    }
    public static final class InvalidAmount extends RuntimeException {}
}

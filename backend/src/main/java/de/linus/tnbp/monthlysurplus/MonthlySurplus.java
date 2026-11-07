package de.linus.tnbp.monthlysurplus;

import de.linus.tnbp.shared.FinanceContext;
import de.linus.tnbp.shared.Money;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.stereotype.Service;

/** Eigener Datenbesitzer für Aktivierung, Monatsherkunft und offene Vormerkungen. */
@Service
public class MonthlySurplus {
    public record Activation(boolean active, LocalDate activationMonth) {}
    private final ActivationRepository activations;
    private final MonthRecordRepository records;
    MonthlySurplus(ActivationRepository activations, MonthRecordRepository records) { this.activations = activations; this.records = records; }
    public Activation state(FinanceContext context) {
        context.requireRead();
        LocalDate month = activations.month(context.userId());
        return new Activation(month != null, month);
    }
    public Activation activate(FinanceContext context) {
        context.requireWrite();
        activations.insert(context.userId(), context.month());
        return state(context);
    }
    public long pending(FinanceContext context) {
        context.requireRead();
        return Money.nonnegativeExact(records.pending(context.userId()));
    }
    /** Vor Quellprojektionen prüfen; vorhandene Nachweise werden auch bei geänderten Quellen erhalten. */
    public boolean needsClosing(FinanceContext context, LocalDate month) {
        context.requireWrite();
        return eligible(activations.month(context.userId()), context.month(), month) && !records.exists(context.userId(), month);
    }
    public boolean closeMonth(FinanceContext context, LocalDate month, Long budgetCents, long expensesCents) {
        context.requireWrite();
        if (!needsClosing(context, month)) return false;
        Long surplus = surplus(budgetCents, expensesCents);
        // Auch bei fehlendem Budget und Nullmonaten den gesamten Bestand vor dem Commit prüfen.
        Money.nonnegativeExact(records.pending(context.userId()).add(BigDecimal.valueOf(surplus == null ? 0 : surplus)));
        records.insert(context.userId(), month, surplus);
        return true;
    }
    static boolean eligible(LocalDate activation, LocalDate current, LocalDate month) {
        return activation != null && month != null && month.getYear() >= 1 && month.getYear() <= 9999
            && month.getDayOfMonth() == 1 && !month.isBefore(activation) && month.isBefore(current);
    }
    static Long surplus(Long budgetCents, long expensesCents) {
        if (!Money.nonnegative(expensesCents) || budgetCents != null && !Money.nonnegative(budgetCents))
            throw new ArithmeticException("Ungültige Centgrenze");
        return budgetCents == null ? null : Math.max(0, Money.subtract(budgetCents, expensesCents));
    }
}

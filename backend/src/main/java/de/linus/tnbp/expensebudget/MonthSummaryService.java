package de.linus.tnbp.expensebudget;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class MonthSummaryService {
    record Summary(LocalDate month, Long budgetCents, long expensesCents, Long remainingCents) {}
    private final MonthSummaryRepository summaries;
    private final Clock clock;
    private final TransactionTemplate transaction;
    public MonthSummaryService(MonthSummaryRepository summaries, Clock clock, PlatformTransactionManager manager) {
        this.summaries = summaries; this.clock = clock; this.transaction = new TransactionTemplate(manager);
        this.transaction.setReadOnly(true);
    }
    Summary current(UUID userId) {
        LocalDate month = BudgetService.currentMonth(clock);
        return transaction.execute(status -> {
            summaries.context(userId);
            var snapshot = summaries.current(userId, month);
            return calculate(month, snapshot.budgetCents(), snapshot.expensesCents());
        });
    }
    static Summary calculate(LocalDate month, Long budget, BigDecimal expenses) {
        long total = expenses.longValueExact();
        if (total < 0 || total > BudgetService.MAX_CENTS || budget != null && (budget < 0 || budget > BudgetService.MAX_CENTS))
            throw new ArithmeticException("Ungültige Centgrenze");
        Long remaining = budget == null ? null : Math.subtractExact(budget, total);
        return new Summary(month, budget, total, remaining);
    }
}

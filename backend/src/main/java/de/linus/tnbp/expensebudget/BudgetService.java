package de.linus.tnbp.expensebudget;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class BudgetService {
    static final long MAX_CENTS = 9007199254740991L;
    private static final ZoneId BERLIN = ZoneId.of("Europe/Berlin");
    private final BudgetRepository budgets;
    private final Clock clock;
    private final TransactionTemplate transaction;

    public BudgetService(BudgetRepository budgets, Clock clock, PlatformTransactionManager manager) {
        this.budgets = budgets; this.clock = clock; this.transaction = new TransactionTemplate(manager);
    }

    Long current(UUID userId) {
        return transaction.execute(status -> {
            budgets.context(userId);
            return budgets.current(userId, currentMonth(clock));
        });
    }

    long save(UUID userId, Long amountCents) {
        validate(amountCents);
        // TransactionTemplate kehrt erst nach erfolgreichem Commit zurück.
        transaction.executeWithoutResult(status -> {
            budgets.context(userId);
            budgets.save(userId, currentMonth(clock), amountCents);
        });
        return amountCents;
    }

    static LocalDate currentMonth(Clock clock) { return LocalDate.now(clock.withZone(BERLIN)).withDayOfMonth(1); }
    static void validate(Long amountCents) {
        if (amountCents == null || amountCents < 0 || amountCents > MAX_CENTS) throw new InvalidAmount();
    }
    static final class InvalidAmount extends RuntimeException {}
}

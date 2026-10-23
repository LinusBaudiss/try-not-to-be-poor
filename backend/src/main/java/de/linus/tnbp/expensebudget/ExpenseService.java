package de.linus.tnbp.expensebudget;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class ExpenseService {
    private final ExpenseRepository expenses;
    private final Clock clock;
    private final TransactionTemplate transaction;
    public ExpenseService(ExpenseRepository expenses, Clock clock, PlatformTransactionManager manager) {
        this.expenses = expenses; this.clock = clock; this.transaction = new TransactionTemplate(manager);
    }

    List<ExpenseRepository.Expense> all(UUID userId) {
        return transaction.execute(status -> { expenses.context(userId); return expenses.all(userId); });
    }

    ExpenseRepository.Expense save(UUID userId, String name, Long amountCents) {
        validate(name, amountCents);
        return transaction.execute(status -> {
            expenses.context(userId);
            expenses.lock(userId);
            LocalDate day = recordedOn(clock);
            BigDecimal total = expenses.monthTotal(userId, day.withDayOfMonth(1)).add(BigDecimal.valueOf(amountCents));
            // Budget und Summe liegen beide in [0, MAX]; damit ist auch Budget - Summe sicher.
            if (total.compareTo(BigDecimal.valueOf(BudgetService.MAX_CENTS)) > 0) throw new MonthLimit();
            var expense = new ExpenseRepository.Expense(UUID.randomUUID(), trimName(name), amountCents, day);
            expenses.insert(userId, expense);
            return expense;
        }); // Erst nach erfolgreichem Commit wird der Eintrag zurückgegeben.
    }

    static LocalDate recordedOn(Clock clock) { return LocalDate.now(clock.withZone(ZoneId.of("Europe/Berlin"))); }
    static void validate(String name, Long amountCents) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (name == null || trimName(name).isEmpty()) errors.put("name", "Gib einen Namen für die Ausgabe ein.");
        if (name != null && name.indexOf(0) >= 0) errors.put("name", "Entferne das Nullzeichen aus dem Namen der Ausgabe.");
        if (amountCents == null || amountCents <= 0 || amountCents > BudgetService.MAX_CENTS)
            errors.put("amountCents", "Gib einen positiven Betrag bis 90.071.992.547.409,91 Euro in ganzen Cent ein.");
        if (!errors.isEmpty()) throw new InvalidExpense(errors);
    }
    static String trimName(String name) {
        int start = 0, end = name.length();
        while (start < end && space(name.charAt(start))) start++;
        while (end > start && space(name.charAt(end - 1))) end--;
        return name.substring(start, end);
    }
    private static boolean space(char value) {
        return (value >= '\t' && value <= '\r') || Character.isSpaceChar(value) || value == '\uFEFF';
    }
    static final class InvalidExpense extends RuntimeException {
        final Map<String, String> fields;
        InvalidExpense(Map<String, String> fields) { this.fields = fields; }
    }
    static final class MonthLimit extends RuntimeException {}
}

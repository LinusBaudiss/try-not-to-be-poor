package de.linus.tnbp.expenses;

import de.linus.tnbp.shared.FinanceContext;
import de.linus.tnbp.shared.Money;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Öffentlicher Zugang zum eigenen Ausgabenbestand; kein eigener Transaktionsabschluss. */
@Service
public class Expenses {
    public record Expense(UUID id, String name, long amountCents, LocalDate recordedOn) {}
    private final ExpenseRepository expenses;
    Expenses(ExpenseRepository expenses) { this.expenses = expenses; }

    public List<Expense> all(FinanceContext context) {
        context.requireRead();
        return expenses.all(context.userId());
    }
    public long monthTotal(FinanceContext context, LocalDate month) {
        context.requireRead();
        return Money.nonnegativeExact(expenses.monthTotal(context.userId(), month.withDayOfMonth(1)));
    }
    public Expense save(FinanceContext context, String name, Long amountCents) {
        validate(name, amountCents);
        context.requireWrite();
        checkTotal(expenses.monthTotal(context.userId(), context.month()).add(BigDecimal.valueOf(amountCents)));
        var expense = new Expense(UUID.randomUUID(), trimName(name), amountCents, context.day());
        expenses.insert(context.userId(), expense);
        return expense;
    }
    public Expense update(FinanceContext context, UUID expenseId, String name, Long amountCents) {
        validate(name, amountCents);
        context.requireWrite();
        var previous = expenses.find(context.userId(), expenseId);
        checkTotal(expenses.monthTotal(context.userId(), previous.recordedOn().withDayOfMonth(1))
            .subtract(BigDecimal.valueOf(previous.amountCents())).add(BigDecimal.valueOf(amountCents)));
        var updated = new Expense(previous.id(), trimName(name), amountCents, previous.recordedOn());
        expenses.update(context.userId(), updated);
        return updated;
    }
    public void delete(FinanceContext context, UUID expenseId) {
        context.requireWrite();
        expenses.delete(context.userId(), expenseId);
    }
    private static void checkTotal(BigDecimal total) {
        try { Money.nonnegativeExact(total); }
        catch (ArithmeticException failure) { throw new MonthLimit(); }
    }

    public static void validate(String name, Long amountCents) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (name == null || trimName(name).isEmpty()) errors.put("name", "Gib einen Namen für die Ausgabe ein.");
        if (name != null && name.indexOf(0) >= 0) errors.put("name", "Entferne das Nullzeichen aus dem Namen der Ausgabe.");
        if (!Money.positive(amountCents))
            errors.put("amountCents", "Gib einen positiven Betrag bis 90.071.992.547.409,91 Euro in ganzen Cent ein.");
        if (!errors.isEmpty()) throw new InvalidExpense(errors);
    }
    public static String trimName(String name) {
        int start = 0, end = name.length();
        while (start < end && space(name.charAt(start))) start++;
        while (end > start && space(name.charAt(end - 1))) end--;
        return name.substring(start, end);
    }
    private static boolean space(char value) {
        return (value >= '\t' && value <= '\r') || Character.isSpaceChar(value) || value == '\uFEFF';
    }
    public static final class InvalidExpense extends RuntimeException {
        public final Map<String, String> fields;
        InvalidExpense(Map<String, String> fields) { this.fields = Map.copyOf(fields); }
    }
    public static final class MonthLimit extends RuntimeException {}
    public static final class NotFound extends RuntimeException {}
}

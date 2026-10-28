package de.linus.tnbp.savingsgoals;

import de.linus.tnbp.shared.FinanceContext;
import de.linus.tnbp.shared.Money;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Öffentliche Zielbefehle und Projektionen im bereits gebundenen Kontokontext. */
@Service
public class SavingsGoals {
    public record Goal(UUID id, String name, long targetAmountCents, long progressCents, LocalDate targetDate) {}
    private final SavingsGoalRepository goals;
    SavingsGoals(SavingsGoalRepository goals) { this.goals = goals; }
    public List<Goal> all(FinanceContext context) {
        context.requireRead();
        return goals.all(context.userId());
    }
    public Goal save(FinanceContext context, String name, Long targetAmountCents, LocalDate targetDate) {
        validate(name, targetAmountCents, targetDate);
        context.requireWrite();
        var goal = new Goal(UUID.randomUUID(), trimName(name), targetAmountCents, 0, targetDate);
        goals.insert(context.userId(), goal);
        return goal;
    }
    public Goal progress(FinanceContext context, UUID id, Long progressCents) {
        validateProgress(progressCents);
        context.requireWrite();
        return goals.progress(context.userId(), id, progressCents).orElseThrow(NotFound::new);
    }
    public Goal update(FinanceContext context, UUID id, String name, Long targetAmountCents, LocalDate targetDate) {
        validate(name, targetAmountCents, targetDate);
        context.requireWrite();
        return goals.update(context.userId(), id, trimName(name), targetAmountCents, targetDate).orElseThrow(NotFound::new);
    }
    public void delete(FinanceContext context, UUID id) {
        context.requireWrite();
        if (!goals.delete(context.userId(), id)) throw new NotFound();
    }
    public void requireGoal(FinanceContext context, UUID id) {
        context.requireRead();
        if (!goals.exists(context.userId(), id)) throw new NotFound();
    }
    public static void validateSignedProgress(Long progressCents) {
        if (progressCents == null || progressCents < -Money.MAX_CENTS || progressCents > Money.MAX_CENTS)
            throw new InvalidGoal(Map.of("progressCents", "Gib einen gültigen Gesamtfortschritt in ganzen Cent ein."));
    }
    public static void validateProgress(Long progressCents) {
        // v1 bleibt unterstützt; signierte Fortschritte werden erst später freigegeben.
        if (!Money.nonnegative(progressCents))
            throw new InvalidGoal(Map.of("progressCents", "Gib einen Fortschritt von 0 bis 90.071.992.547.409,91 Euro in ganzen Cent ein."));
    }
    public static final class NotFound extends RuntimeException {}
    public static void validate(String name, Long amountCents, LocalDate date) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (name == null || trimName(name).isEmpty()) errors.put("name", "Gib einen Namen für das Sparziel ein.");
        if (name != null && name.indexOf(0) >= 0) errors.put("name", "Entferne das Nullzeichen aus dem Namen des Sparziels.");
        if (!Money.positive(amountCents))
            errors.put("targetAmountCents", "Gib einen positiven Zielbetrag bis 90.071.992.547.409,91 Euro in ganzen Cent ein.");
        if (date != null && (date.getYear() < 1 || date.getYear() > 9999))
            errors.put("targetDate", "Gib ein gültiges Kalenderdatum zwischen 0001 und 9999 ein.");
        if (!errors.isEmpty()) throw new InvalidGoal(errors);
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
    public static final class InvalidGoal extends RuntimeException {
        public final Map<String, String> fields;
        InvalidGoal(Map<String, String> fields) { this.fields = Map.copyOf(fields); }
    }
}

package de.linus.tnbp.savingsgoals;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class SavingsGoalService {
    static final long MAX_CENTS = 9007199254740991L;
    private final SavingsGoalRepository goals;
    private final TransactionTemplate transaction;
    public SavingsGoalService(SavingsGoalRepository goals, PlatformTransactionManager manager) {
        this.goals = goals; this.transaction = new TransactionTemplate(manager);
    }
    List<SavingsGoalRepository.Goal> all(UUID userId) {
        return transaction.execute(status -> { goals.context(userId); return goals.all(userId); });
    }
    SavingsGoalRepository.Goal save(UUID userId, String name, Long targetAmountCents, LocalDate targetDate) {
        validate(name, targetAmountCents, targetDate);
        return transaction.execute(status -> {
            goals.context(userId);
            var goal = new SavingsGoalRepository.Goal(UUID.randomUUID(), trimName(name), targetAmountCents, 0, targetDate);
            goals.insert(userId, goal);
            return goal;
        }); // Erst nach erfolgreichem Commit wird das Ziel bestätigt.
    }
    SavingsGoalRepository.Goal progress(UUID userId, UUID id, Long progressCents) {
        if (progressCents == null || progressCents < 0 || progressCents > MAX_CENTS)
            throw new InvalidGoal(Map.of("progressCents", "Gib einen Fortschritt von 0 bis 90.071.992.547.409,91 Euro in ganzen Cent ein."));
        return transaction.execute(status -> {
            goals.context(userId);
            return goals.progress(userId, id, progressCents).orElseThrow(NotFound::new);
        }); // Auch ein erfolgreiches UPDATE wird erst nach erfolgreichem Commit bestätigt.
    }
    static final class NotFound extends RuntimeException {}
    static void validate(String name, Long amountCents, LocalDate date) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (name == null || trimName(name).isEmpty()) errors.put("name", "Gib einen Namen für das Sparziel ein.");
        if (name != null && name.indexOf(0) >= 0) errors.put("name", "Entferne das Nullzeichen aus dem Namen des Sparziels.");
        if (amountCents == null || amountCents <= 0 || amountCents > MAX_CENTS)
            errors.put("targetAmountCents", "Gib einen positiven Zielbetrag bis 90.071.992.547.409,91 Euro in ganzen Cent ein.");
        if (date != null && (date.getYear() < 1 || date.getYear() > 9999))
            errors.put("targetDate", "Gib ein gültiges Kalenderdatum zwischen 0001 und 9999 ein.");
        if (!errors.isEmpty()) throw new InvalidGoal(errors);
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
    static final class InvalidGoal extends RuntimeException {
        final Map<String, String> fields;
        InvalidGoal(Map<String, String> fields) { this.fields = fields; }
    }
}

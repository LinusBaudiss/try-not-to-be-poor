package de.linus.tnbp.savingsgoals;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SavingsGoalRepository {
    record Goal(UUID id, String name, long targetAmountCents, long progressCents, LocalDate targetDate) {}
    private final JdbcTemplate jdbc;
    public SavingsGoalRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    void context(UUID userId) {
        jdbc.queryForObject("SELECT set_config('app.user_id', ?, true)", String.class, userId.toString());
    }
    List<Goal> all(UUID userId) {
        return jdbc.query("""
            SELECT id, name, target_amount_cents, progress_cents, target_date FROM savings_goals.goals
            WHERE user_id = ? ORDER BY id
            """, (row, index) -> new Goal(row.getObject("id", UUID.class), row.getString("name"),
                row.getLong("target_amount_cents"), row.getLong("progress_cents"), row.getObject("target_date", LocalDate.class)), userId);
    }
    Optional<Goal> progress(UUID userId, UUID id, long progressCents) {
        return jdbc.query("""
            UPDATE savings_goals.goals SET progress_cents = ? WHERE user_id = ? AND id = ?
            RETURNING id, name, target_amount_cents, progress_cents, target_date
            """, (row, index) -> new Goal(row.getObject("id", UUID.class), row.getString("name"),
                row.getLong("target_amount_cents"), row.getLong("progress_cents"), row.getObject("target_date", LocalDate.class)),
            progressCents, userId, id).stream().findFirst();
    }
    Optional<Goal> update(UUID userId, UUID id, String name, long targetAmountCents, LocalDate targetDate) {
        return jdbc.query("""
            UPDATE savings_goals.goals SET name = ?, target_amount_cents = ?, target_date = ?
            WHERE user_id = ? AND id = ?
            RETURNING id, name, target_amount_cents, progress_cents, target_date
            """, (row, index) -> new Goal(row.getObject("id", UUID.class), row.getString("name"),
                row.getLong("target_amount_cents"), row.getLong("progress_cents"), row.getObject("target_date", LocalDate.class)),
            name, targetAmountCents, targetDate, userId, id).stream().findFirst();
    }
    boolean delete(UUID userId, UUID id) {
        return jdbc.update("DELETE FROM savings_goals.goals WHERE user_id = ? AND id = ?", userId, id) == 1;
    }
    void insert(UUID userId, Goal goal) {
        jdbc.update("INSERT INTO savings_goals.goals (id, user_id, name, target_amount_cents, target_date) VALUES (?, ?, ?, ?, ?)",
            goal.id(), userId, goal.name(), goal.targetAmountCents(), goal.targetDate());
    }
}

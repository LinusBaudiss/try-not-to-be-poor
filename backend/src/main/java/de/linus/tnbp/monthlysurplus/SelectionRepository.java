package de.linus.tnbp.monthlysurplus;

import java.time.LocalDate;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class SelectionRepository {
    private final JdbcTemplate jdbc;
    SelectionRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    UUID selected(UUID userId, LocalDate month) {
        var rows = jdbc.query("""
            SELECT goal_id FROM monthly_surplus.selections
            WHERE user_id = ? AND effective_month <= ? ORDER BY effective_month DESC LIMIT 1
            """, (row, index) -> row.getObject(1, UUID.class), userId, month);
        return rows.isEmpty() ? null : rows.getFirst();
    }
    boolean references(UUID userId, UUID goalId) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM monthly_surplus.selections WHERE user_id = ? AND goal_id = ?)",
            Boolean.class, userId, goalId));
    }
    void select(UUID userId, LocalDate month, UUID goalId) {
        jdbc.update("""
            INSERT INTO monthly_surplus.selections(user_id, effective_month, goal_id) VALUES (?, ?, ?)
            ON CONFLICT (user_id, effective_month) DO UPDATE SET goal_id = EXCLUDED.goal_id
            """, userId, month, goalId);
    }
}

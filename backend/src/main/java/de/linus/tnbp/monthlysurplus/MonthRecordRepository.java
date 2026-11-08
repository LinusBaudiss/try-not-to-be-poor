package de.linus.tnbp.monthlysurplus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class MonthRecordRepository {
    private final JdbcTemplate jdbc;
    MonthRecordRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    boolean exists(UUID userId, LocalDate month) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM monthly_surplus.month_records WHERE user_id = ? AND origin_month = ?)",
            Boolean.class, userId, month));
    }
    BigDecimal pending(UUID userId) {
        return jdbc.queryForObject("SELECT COALESCE(SUM(surplus_cents), 0) FROM monthly_surplus.month_records WHERE user_id = ? AND surplus_cents IS NOT NULL AND goal_id IS NULL",
            BigDecimal.class, userId);
    }
    void insert(UUID userId, LocalDate month, Long surplusCents) {
        insert(userId, month, surplusCents, null, false);
    }
    void insert(UUID userId, LocalDate month, Long surplusCents, UUID goalId, boolean consumed) {
        jdbc.update("INSERT INTO monthly_surplus.month_records(user_id, origin_month, surplus_cents, goal_id, consumed) VALUES (?, ?, ?, ?, ?)",
            userId, month, surplusCents, goalId, consumed);
    }
    void bindOpen(UUID userId, UUID goalId) {
        jdbc.update("""
            UPDATE monthly_surplus.month_records SET goal_id = ?
            WHERE user_id = ? AND surplus_cents IS NOT NULL AND goal_id IS NULL
            """, goalId, userId);
    }
}

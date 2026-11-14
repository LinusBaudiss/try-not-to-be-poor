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
    MonthlySurplus.MonthRecord find(UUID userId, LocalDate month) {
        return jdbc.query("""
            SELECT surplus_cents, goal_id, consumed FROM monthly_surplus.month_records
            WHERE user_id = ? AND origin_month = ?
            """, (row, index) -> new MonthlySurplus.MonthRecord(row.getObject("surplus_cents", Long.class),
                row.getObject("goal_id", UUID.class), row.getBoolean("consumed")), userId, month)
            .stream().findFirst().orElse(null);
    }
    void correct(UUID userId, LocalDate month, Long surplusCents, boolean consumed) {
        if (jdbc.update("""
            UPDATE monthly_surplus.month_records SET surplus_cents = ?, consumed = consumed OR ?
            WHERE user_id = ? AND origin_month = ?
            """, surplusCents, consumed, userId, month) != 1)
            throw new IllegalStateException("Monatsnachweis erforderlich.");
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
    boolean references(UUID userId, UUID goalId) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM monthly_surplus.month_records WHERE user_id = ? AND goal_id = ?)",
            Boolean.class, userId, goalId));
    }
    void consume(UUID userId, UUID goalId) {
        jdbc.update("UPDATE monthly_surplus.month_records SET consumed = true WHERE user_id = ? AND goal_id = ? AND NOT consumed", userId, goalId);
    }
}

package de.linus.tnbp.expensebudget;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class MonthSummaryRepository {
    record Snapshot(Long budgetCents, BigDecimal expensesCents) {}
    private final JdbcTemplate jdbc;
    public MonthSummaryRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    void context(UUID userId) {
        jdbc.queryForObject("SELECT set_config('app.user_id', ?, true)", String.class, userId.toString());
    }

    Snapshot current(UUID userId, LocalDate month) {
        // Eine SQL-Anweisung sieht auch unter READ COMMITTED einen gemeinsamen MVCC-Snapshot.
        return jdbc.queryForObject("""
            SELECT (SELECT amount_cents FROM expense_budget.budgets
                    WHERE user_id = ? AND valid_from <= ? ORDER BY valid_from DESC LIMIT 1) AS budget_cents,
                   (SELECT COALESCE(SUM(amount_cents), 0) FROM expense_budget.expenses
                    WHERE user_id = ? AND recorded_on >= ? AND recorded_on < ?) AS expenses_cents
            """, (row, index) -> new Snapshot(row.getObject("budget_cents", Long.class), row.getBigDecimal("expenses_cents")),
            userId, month, userId, month, month.plusMonths(1));
    }
}

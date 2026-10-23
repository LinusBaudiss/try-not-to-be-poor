package de.linus.tnbp.expensebudget;

import java.time.LocalDate;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class BudgetRepository {
    private final JdbcTemplate jdbc;
    public BudgetRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    void context(UUID userId) {
        jdbc.queryForObject("SELECT set_config('app.user_id', ?, true)", String.class, userId.toString());
    }

    Long current(UUID userId, LocalDate month) {
        return jdbc.query("""
            SELECT amount_cents FROM expense_budget.budgets
            WHERE user_id = ? AND valid_from <= ? ORDER BY valid_from DESC LIMIT 1
            """, (row, index) -> row.getLong("amount_cents"), userId, month).stream().findFirst().orElse(null);
    }

    void save(UUID userId, LocalDate month, long amountCents) {
        jdbc.update("""
            INSERT INTO expense_budget.budgets (user_id, valid_from, amount_cents) VALUES (?, ?, ?)
            ON CONFLICT (user_id, valid_from) DO UPDATE SET amount_cents = EXCLUDED.amount_cents
            WHERE expense_budget.budgets.user_id = ?
            """, userId, month, amountCents, userId);
    }
}

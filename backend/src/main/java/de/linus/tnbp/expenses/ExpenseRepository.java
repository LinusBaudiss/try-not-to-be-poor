package de.linus.tnbp.expenses;

import de.linus.tnbp.expenses.Expenses.Expense;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class ExpenseRepository {
    private final JdbcTemplate jdbc;
    ExpenseRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    BigDecimal monthTotal(UUID userId, LocalDate month) {
        return jdbc.queryForObject("""
            SELECT COALESCE(SUM(amount_cents), 0) FROM expenses.expenses
            WHERE user_id = ? AND recorded_on >= ? AND recorded_on < ?
            """, BigDecimal.class, userId, month, month.plusMonths(1));
    }

    List<Expense> all(UUID userId) {
        return jdbc.query("""
            SELECT id, name, amount_cents, recorded_on FROM expenses.expenses
            WHERE user_id = ? ORDER BY recorded_on DESC, id
            """, (row, index) -> new Expense(row.getObject("id", UUID.class), row.getString("name"),
                row.getLong("amount_cents"), row.getObject("recorded_on", LocalDate.class)), userId);
    }

    Expense find(UUID userId, UUID expenseId) {
        return jdbc.query("""
            SELECT id, name, amount_cents, recorded_on FROM expenses.expenses
            WHERE user_id = ? AND id = ?
            """, (row, index) -> new Expense(row.getObject("id", UUID.class), row.getString("name"),
                row.getLong("amount_cents"), row.getObject("recorded_on", LocalDate.class)), userId, expenseId)
            .stream().findFirst().orElseThrow(Expenses.NotFound::new);
    }

    void update(UUID userId, Expense expense) {
        if (jdbc.update("UPDATE expenses.expenses SET name = ?, amount_cents = ? WHERE user_id = ? AND id = ?",
            expense.name(), expense.amountCents(), userId, expense.id()) != 1) throw new Expenses.NotFound();
    }

    void delete(UUID userId, UUID expenseId) {
        if (jdbc.update("DELETE FROM expenses.expenses WHERE user_id = ? AND id = ?", userId, expenseId) != 1)
            throw new Expenses.NotFound();
    }

    void insert(UUID userId, Expense expense) {
        jdbc.update("INSERT INTO expenses.expenses (id, user_id, name, amount_cents, recorded_on) VALUES (?, ?, ?, ?, ?)",
            expense.id(), userId, expense.name(), expense.amountCents(), expense.recordedOn());
    }
}

package de.linus.tnbp.finance;

import de.linus.tnbp.budget.Budgets;
import de.linus.tnbp.expenses.Expenses;
import de.linus.tnbp.savingsgoals.SavingsGoals;
import de.linus.tnbp.shared.FinanceTransactions;
import de.linus.tnbp.shared.Money;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Äußere Anwendungsfälle: nur öffentliche Modulzugänge, keine Fach-SQL-Abfragen. */
@Service
public class FinanceApplication {
    public record Summary(LocalDate month, Long budgetCents, long expensesCents, Long remainingCents) {}
    private final FinanceTransactions transactions;
    private final Expenses expenses;
    private final Budgets budgets;
    private final SavingsGoals goals;

    public FinanceApplication(FinanceTransactions transactions, Expenses expenses, Budgets budgets, SavingsGoals goals) {
        this.transactions = transactions;
        this.expenses = expenses;
        this.budgets = budgets;
        this.goals = goals;
    }

    public Long currentBudget(UUID userId) {
        return transactions.read(userId, context -> budgets.current(context, context.month()));
    }
    public long saveBudget(UUID userId, Long amountCents) {
        Budgets.validate(amountCents);
        return transactions.mutate(userId, context -> budgets.save(context, amountCents));
    }
    public List<Expenses.Expense> allExpenses(UUID userId) {
        return transactions.read(userId, expenses::all);
    }
    public Expenses.Expense saveExpense(UUID userId, String name, Long amountCents) {
        Expenses.validate(name, amountCents);
        return transactions.mutate(userId, context -> expenses.save(context, name, amountCents));
    }
    public Expenses.Expense updateExpense(UUID userId, UUID id, String name, Long amountCents) {
        Expenses.validate(name, amountCents);
        return transactions.mutate(userId, context -> expenses.update(context, id, name, amountCents));
    }
    public void deleteExpense(UUID userId, UUID id) {
        transactions.mutate(userId, context -> { expenses.delete(context, id); return null; });
    }
    public Summary currentSummary(UUID userId) {
        return transactions.read(userId, context -> {
            Long budget = budgets.current(context, context.month());
            long total = expenses.monthTotal(context, context.month());
            return new Summary(context.month(), budget, total, budget == null ? null : Money.subtract(budget, total));
        });
    }
    public List<SavingsGoals.Goal> allGoals(UUID userId) {
        return transactions.read(userId, goals::all);
    }
    public SavingsGoals.Goal saveGoal(UUID userId, String name, Long targetAmountCents, LocalDate targetDate) {
        SavingsGoals.validate(name, targetAmountCents, targetDate);
        return transactions.mutate(userId, context -> goals.save(context, name, targetAmountCents, targetDate));
    }
    public SavingsGoals.Goal progressGoal(UUID userId, UUID id, Long progressCents) {
        SavingsGoals.validateProgress(progressCents);
        return transactions.mutate(userId, context -> goals.progress(context, id, progressCents));
    }
    /** Geschlossenes v2-Gate unter derselben Kontosperre wie sämtliche Finanzmutationen. */
    public SavingsGoals.Goal progressGoalV2(UUID userId, UUID id, Long progressCents) {
        SavingsGoals.validateSignedProgress(progressCents);
        return transactions.mutate(userId, context -> {
            if (progressCents < 0) {
                goals.requireGoal(context, id);
                throw new FeatureNotAvailable();
            }
            return goals.progress(context, id, progressCents);
        });
    }
    public static final class FeatureNotAvailable extends RuntimeException {}
    public SavingsGoals.Goal updateGoal(UUID userId, UUID id, String name, Long targetAmountCents, LocalDate targetDate) {
        SavingsGoals.validate(name, targetAmountCents, targetDate);
        return transactions.mutate(userId, context -> goals.update(context, id, name, targetAmountCents, targetDate));
    }
    public void deleteGoal(UUID userId, UUID id) {
        transactions.mutate(userId, context -> { goals.delete(context, id); return null; });
    }
}

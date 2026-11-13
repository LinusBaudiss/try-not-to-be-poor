package de.linus.tnbp.finance;

import de.linus.tnbp.budget.Budgets;
import de.linus.tnbp.expenses.Expenses;
import de.linus.tnbp.savingsgoals.SavingsGoals;
import de.linus.tnbp.monthlysurplus.MonthlySurplus;
import de.linus.tnbp.shared.ApiVersionState;
import de.linus.tnbp.shared.FinanceTransactions;
import de.linus.tnbp.shared.FinanceContext;
import de.linus.tnbp.shared.Money;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Äußere Anwendungsfälle: nur öffentliche Modulzugänge, keine Fach-SQL-Abfragen. */
@Service
public class FinanceApplication {
    public record Summary(LocalDate month, Long budgetCents, long expensesCents, Long remainingCents) {}
    public record MonthlyOverview(boolean active, LocalDate activationMonth, LocalDate currentMonth,
        UUID selectedGoalId, long pendingCents, List<SavingsGoals.Goal> goals) {}
    private final FinanceTransactions transactions;
    private final Expenses expenses;
    private final Budgets budgets;
    private final SavingsGoals goals;
    private final ApiVersionState versions;
    private final MonthlySurplus monthlySurplus;
    private final MonthlyAutomationReadiness automationReadiness;

    public FinanceApplication(FinanceTransactions transactions, Expenses expenses, Budgets budgets, SavingsGoals goals, ApiVersionState versions,
            MonthlySurplus monthlySurplus, MonthlyAutomationReadiness automationReadiness) {
        this.transactions = transactions;
        this.expenses = expenses;
        this.budgets = budgets;
        this.goals = goals;
        this.versions = versions;
        this.monthlySurplus = monthlySurplus;
        this.automationReadiness = automationReadiness;
    }

    public boolean signedProgressAvailable() { return versions.signedProgressAvailable(); }
    public boolean monthlyAutomationAvailable() { return automationReadiness.available() && versions.monthlyAutomationAvailable(); }
    public MonthlySurplus.Activation monthlyActivation(UUID userId) {
        return transactions.read(userId, monthlySurplus::state);
    }
    public MonthlySurplus.Activation activateMonthlyAutomation(UUID userId) {
        return transactions.mutate(userId, context -> {
            if (!automationReadiness.available() || !versions.lockMonthlyAutomation(context)) throw new FeatureNotAvailable();
            return monthlySurplus.activate(context);
        });
    }
    public long monthlyPending(UUID userId) {
        return transactions.read(userId, monthlySurplus::pending);
    }
    public MonthlyOverview monthlyOverview(UUID userId) {
        return transactions.read(userId, this::monthlyOverview);
    }
    private MonthlyOverview monthlyOverview(FinanceContext context) {
        var activation = monthlySurplus.state(context);
        UUID selected = monthlySurplus.selected(context, context.month());
        if (selected != null && !goals.exists(context, selected)) selected = null;
        return new MonthlyOverview(activation.active(), activation.activationMonth(), context.month(), selected,
            monthlySurplus.pending(context), goals.all(context));
    }
    public MonthlyOverview selectMonthlyGoal(UUID userId, UUID goalId) {
        if (goalId == null) throw new InvalidSelection();
        return transactions.mutate(userId, context -> {
            // Keine Nachholwirkung für eine fremde oder fehlende Zielwahl.
            goals.requireGoal(context, goalId);
            if (!automationReadiness.available() || !versions.lockMonthlyAutomation(context)) throw new FeatureNotAvailable();
            var activation = monthlySurplus.state(context);
            if (!activation.active()) throw new AutomationNotActive();
            for (LocalDate month = activation.activationMonth(); month.isBefore(context.month()); month = month.plusMonths(1))
                closeMonthlySurplusMonth(context, month);
            long pending = monthlySurplus.pending(context);
            goals.applyDifference(context, goalId, pending);
            // Nullmonate ebenfalls binden; Herkunftsbeträge bleiben erhalten.
            monthlySurplus.bindOpen(context, goalId);
            monthlySurplus.select(context, goalId);
            versions.markMonthlyEffect(context);
            return monthlyOverview(context);
        });
    }
    public static final class InvalidSelection extends RuntimeException {}
    public static final class AutomationNotActive extends RuntimeException {}
    /** Interner Einmonatsfall für vertrauenswürdige Koordination; kein HTTP-Auslöser. */
    public boolean closeMonthlySurplusMonth(UUID userId, LocalDate month) {
        return transactions.mutate(userId, context -> {
            if (!automationReadiness.available() || !versions.lockMonthlyAutomation(context)) throw new FeatureNotAvailable();
            return closeMonthlySurplusMonth(context, month);
        });
    }
    private boolean closeMonthlySurplusMonth(FinanceContext context, LocalDate month) {
        if (!monthlySurplus.needsClosing(context, month)) return false;
        Long budget = budgets.current(context, month);
        long total = expenses.monthTotal(context, month);
        UUID selected = monthlySurplus.selected(context, month);
        boolean consumed = selected != null && !goals.exists(context, selected);
        Long surplus = MonthlySurplus.surplus(budget, total);
        if (selected != null && !consumed && surplus != null) goals.applyDifference(context, selected, surplus);
        boolean created = monthlySurplus.closeMonth(context, month, budget, total, selected, consumed);
        if (created) versions.markMonthlyEffect(context);
        return created;
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
        return transactions.mutate(userId, context -> {
            var previous = expenses.find(context, id);
            LocalDate month = previous.recordedOn().withDayOfMonth(1);
            boolean correction = previous.amountCents() != amountCents && monthlySurplus.requiresCorrection(context, month);
            var result = expenses.update(context, id, name, amountCents);
            if (correction) correctMonthlySurplusMonth(context, month);
            return result;
        });
    }
    public void deleteExpense(UUID userId, UUID id) {
        transactions.mutate(userId, context -> {
            var previous = expenses.find(context, id);
            LocalDate month = previous.recordedOn().withDayOfMonth(1);
            boolean correction = monthlySurplus.requiresCorrection(context, month);
            expenses.delete(context, id);
            if (correction) correctMonthlySurplusMonth(context, month);
            return null;
        });
    }
    private void correctMonthlySurplusMonth(FinanceContext context, LocalDate month) {
        // Erforderliche Korrekturen dürfen auch bei abgeschaltetem Gate nie übersprungen werden.
        if (!automationReadiness.available() || !versions.lockMonthlyAutomation(context)) throw new FeatureNotAvailable();
        var previous = monthlySurplus.record(context, month);
        if (previous == null) {
            closeMonthlySurplusMonth(context, month);
            return;
        }
        Long surplus = MonthlySurplus.surplus(budgets.current(context, month), expenses.monthTotal(context, month));
        boolean consumed = previous.consumed() || previous.goalId() != null && !goals.exists(context, previous.goalId());
        if (previous.goalId() != null && !consumed) {
            long difference = Money.subtract(surplus == null ? 0 : surplus, previous.surplusCents() == null ? 0 : previous.surplusCents());
            goals.applyDifference(context, previous.goalId(), difference);
        }
        monthlySurplus.correct(context, month, surplus, consumed);
        versions.markMonthlyEffect(context);
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
    /** Frisches v2-Gate unter derselben Kontosperre wie sämtliche Finanzmutationen. */
    public SavingsGoals.Goal progressGoalV2(UUID userId, UUID id, Long progressCents) {
        SavingsGoals.validateSignedProgress(progressCents);
        return transactions.mutate(userId, context -> {
            if (progressCents < 0) {
                goals.requireGoal(context, id);
                if (!versions.lockSignedProgress(context)) throw new FeatureNotAvailable();
                versions.markSignedProgress(context);
            }
            return goals.signedProgress(context, id, progressCents);
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

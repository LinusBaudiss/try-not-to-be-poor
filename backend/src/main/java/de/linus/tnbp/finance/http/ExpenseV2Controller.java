package de.linus.tnbp.finance.http;

import de.linus.tnbp.finance.FinanceApplication;
import de.linus.tnbp.expenses.Expenses;
import de.linus.tnbp.contract.v2.api.ExpensesApi;
import de.linus.tnbp.contract.v2.model.ExpenseRequest;
import de.linus.tnbp.contract.v2.model.ExpenseResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2")
public class ExpenseV2Controller implements ExpensesApi {
    private final FinanceApplication expenses;
    public ExpenseV2Controller(FinanceApplication expenses) { this.expenses = expenses; }
    @Override public ResponseEntity<List<ExpenseResponse>> getExpenses() {
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(expenses.allExpenses(userId()).stream().map(this::response).toList());
    }
    @Override public ResponseEntity<ExpenseResponse> postExpense(ExpenseRequest input) {
        return ResponseEntity.status(201).header("Cache-Control", "no-store")
            .body(response(expenses.saveExpense(userId(), input.getName(), input.getAmountCents())));
    }
    @Override public ResponseEntity<ExpenseResponse> putExpense(UUID expenseId, ExpenseRequest input) {
        return ResponseEntity.ok().header("Cache-Control", "no-store")
            .body(response(expenses.updateExpense(userId(), expenseId, input.getName(), input.getAmountCents())));
    }
    @Override public ResponseEntity<Void> deleteExpense(UUID expenseId) {
        expenses.deleteExpense(userId(), expenseId);
        return ResponseEntity.noContent().header("Cache-Control", "no-store").build();
    }
    private UUID userId() { return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName()); }
    private ExpenseResponse response(Expenses.Expense expense) {
        return new ExpenseResponse(expense.id(), expense.name(), expense.amountCents(), expense.recordedOn());
    }
}

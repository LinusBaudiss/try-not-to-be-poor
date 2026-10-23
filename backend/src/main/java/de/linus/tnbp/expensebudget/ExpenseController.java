package de.linus.tnbp.expensebudget;

import de.linus.tnbp.contract.api.ExpensesApi;
import de.linus.tnbp.contract.model.ExpenseRequest;
import de.linus.tnbp.contract.model.ExpenseResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ExpenseController implements ExpensesApi {
    private final ExpenseService expenses;
    public ExpenseController(ExpenseService expenses) { this.expenses = expenses; }
    @Override public ResponseEntity<List<ExpenseResponse>> getExpenses() {
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(expenses.all(userId()).stream().map(this::response).toList());
    }
    @Override public ResponseEntity<ExpenseResponse> postExpense(ExpenseRequest input) {
        return ResponseEntity.status(201).header("Cache-Control", "no-store")
            .body(response(expenses.save(userId(), input.getName(), input.getAmountCents())));
    }
    @Override public ResponseEntity<ExpenseResponse> putExpense(UUID expenseId, ExpenseRequest input) {
        return ResponseEntity.ok().header("Cache-Control", "no-store")
            .body(response(expenses.update(userId(), expenseId, input.getName(), input.getAmountCents())));
    }
    @Override public ResponseEntity<Void> deleteExpense(UUID expenseId) {
        expenses.delete(userId(), expenseId);
        return ResponseEntity.noContent().header("Cache-Control", "no-store").build();
    }
    private UUID userId() { return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName()); }
    private ExpenseResponse response(ExpenseRepository.Expense expense) {
        return new ExpenseResponse(expense.id(), expense.name(), expense.amountCents(), expense.recordedOn());
    }
}

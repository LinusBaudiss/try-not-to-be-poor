package de.linus.tnbp.expensebudget;

import de.linus.tnbp.contract.api.BudgetApi;
import de.linus.tnbp.contract.model.BudgetRequest;
import de.linus.tnbp.contract.model.BudgetResponse;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class BudgetController implements BudgetApi {
    private final BudgetService budgets;
    public BudgetController(BudgetService budgets) { this.budgets = budgets; }

    @Override public ResponseEntity<BudgetResponse> getBudget() {
        return response(budgets.current(userId()));
    }
    @Override public ResponseEntity<BudgetResponse> putBudget(BudgetRequest input) {
        return response(budgets.save(userId(), input.getAmountCents()));
    }
    private UUID userId() { return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName()); }
    private ResponseEntity<BudgetResponse> response(Long amountCents) {
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(new BudgetResponse().amountCents(amountCents));
    }
}

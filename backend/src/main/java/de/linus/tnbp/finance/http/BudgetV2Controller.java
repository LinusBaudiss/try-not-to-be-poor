package de.linus.tnbp.finance.http;

import de.linus.tnbp.finance.FinanceApplication;
import de.linus.tnbp.contract.v2.api.BudgetApi;
import de.linus.tnbp.contract.v2.model.BudgetRequest;
import de.linus.tnbp.contract.v2.model.BudgetResponse;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2")
public class BudgetV2Controller implements BudgetApi {
    private final FinanceApplication budgets;
    public BudgetV2Controller(FinanceApplication budgets) { this.budgets = budgets; }

    @Override public ResponseEntity<BudgetResponse> getBudget() {
        return response(budgets.currentBudget(userId()));
    }
    @Override public ResponseEntity<BudgetResponse> putBudget(BudgetRequest input) {
        return response(budgets.saveBudget(userId(), input.getAmountCents()));
    }
    private UUID userId() { return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName()); }
    private ResponseEntity<BudgetResponse> response(Long amountCents) {
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(new BudgetResponse().amountCents(amountCents));
    }
}

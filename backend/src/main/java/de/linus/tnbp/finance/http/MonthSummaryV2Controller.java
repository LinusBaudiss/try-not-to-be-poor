package de.linus.tnbp.finance.http;

import de.linus.tnbp.finance.FinanceApplication;
import de.linus.tnbp.contract.v2.api.MonthSummaryApi;
import de.linus.tnbp.contract.v2.model.MonthSummaryResponse;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2")
public class MonthSummaryV2Controller implements MonthSummaryApi {
    private final FinanceApplication summaries;
    public MonthSummaryV2Controller(FinanceApplication summaries) { this.summaries = summaries; }
    @Override public ResponseEntity<MonthSummaryResponse> getMonthSummary() {
        UUID userId = UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
        var result = summaries.currentSummary(userId);
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(new MonthSummaryResponse()
            .month(result.month()).budgetCents(result.budgetCents()).expensesCents(result.expensesCents()).remainingCents(result.remainingCents()));
    }
}

package de.linus.tnbp.expensebudget;

import de.linus.tnbp.contract.api.MonthSummaryApi;
import de.linus.tnbp.contract.model.MonthSummaryResponse;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class MonthSummaryController implements MonthSummaryApi {
    private final MonthSummaryService summaries;
    public MonthSummaryController(MonthSummaryService summaries) { this.summaries = summaries; }
    @Override public ResponseEntity<MonthSummaryResponse> getMonthSummary() {
        UUID userId = UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
        var result = summaries.current(userId);
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(new MonthSummaryResponse()
            .month(result.month()).budgetCents(result.budgetCents()).expensesCents(result.expensesCents()).remainingCents(result.remainingCents()));
    }
}

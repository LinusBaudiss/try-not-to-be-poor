package de.linus.tnbp.savingsgoals;

import de.linus.tnbp.contract.api.SavingsGoalsApi;
import de.linus.tnbp.contract.model.SavingsGoalRequest;
import de.linus.tnbp.contract.model.SavingsGoalResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class SavingsGoalController implements SavingsGoalsApi {
    private final SavingsGoalService goals;
    public SavingsGoalController(SavingsGoalService goals) { this.goals = goals; }
    @Override public ResponseEntity<List<SavingsGoalResponse>> getSavingsGoals() {
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(goals.all(userId()).stream().map(this::response).toList());
    }
    @Override public ResponseEntity<SavingsGoalResponse> postSavingsGoal(SavingsGoalRequest input) {
        return ResponseEntity.status(201).header("Cache-Control", "no-store")
            .body(response(goals.save(userId(), input.getName(), input.getTargetAmountCents(), input.getTargetDate())));
    }
    private UUID userId() { return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName()); }
    private SavingsGoalResponse response(SavingsGoalRepository.Goal goal) {
        return new SavingsGoalResponse(goal.id(), goal.name(), goal.targetAmountCents(), goal.progressCents()).targetDate(goal.targetDate());
    }
}

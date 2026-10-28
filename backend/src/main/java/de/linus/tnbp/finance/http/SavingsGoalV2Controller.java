package de.linus.tnbp.finance.http;

import de.linus.tnbp.finance.FinanceApplication;
import de.linus.tnbp.savingsgoals.SavingsGoals;
import de.linus.tnbp.contract.v2.api.SavingsGoalsApi;
import de.linus.tnbp.contract.v2.model.SavingsGoalRequest;
import de.linus.tnbp.contract.v2.model.SavingsGoalProgressRequest;
import de.linus.tnbp.contract.v2.model.SavingsGoalResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2")
public class SavingsGoalV2Controller implements SavingsGoalsApi {
    private final FinanceApplication goals;
    public SavingsGoalV2Controller(FinanceApplication goals) { this.goals = goals; }
    @Override public ResponseEntity<List<SavingsGoalResponse>> getSavingsGoals() {
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(goals.allGoals(userId()).stream().map(this::response).toList());
    }
    @Override public ResponseEntity<SavingsGoalResponse> postSavingsGoal(SavingsGoalRequest input) {
        return ResponseEntity.status(201).header("Cache-Control", "no-store")
            .body(response(goals.saveGoal(userId(), input.getName(), input.getTargetAmountCents(), input.getTargetDate())));
    }
    @Override public ResponseEntity<SavingsGoalResponse> putSavingsGoalProgress(UUID id, SavingsGoalProgressRequest input) {
        return ResponseEntity.ok().header("Cache-Control", "no-store")
            .body(response(goals.progressGoalV2(userId(), id, input.getProgressCents())));
    }
    @Override public ResponseEntity<SavingsGoalResponse> putSavingsGoal(UUID id, SavingsGoalRequest input) {
        return ResponseEntity.ok().header("Cache-Control", "no-store")
            .body(response(goals.updateGoal(userId(), id, input.getName(), input.getTargetAmountCents(), input.getTargetDate())));
    }
    @Override public ResponseEntity<Void> deleteSavingsGoal(UUID id) {
        goals.deleteGoal(userId(), id);
        return ResponseEntity.noContent().header("Cache-Control", "no-store").build();
    }
    private UUID userId() { return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName()); }
    private SavingsGoalResponse response(SavingsGoals.Goal goal) {
        return new SavingsGoalResponse(goal.id(), goal.name(), goal.targetAmountCents(), goal.progressCents()).targetDate(goal.targetDate());
    }
}

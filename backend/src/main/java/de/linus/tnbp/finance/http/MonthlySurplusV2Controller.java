package de.linus.tnbp.finance.http;

import de.linus.tnbp.contract.v2.api.MonthlySurplusApi;
import de.linus.tnbp.contract.v2.model.MonthlySurplusActivationResponse;
import de.linus.tnbp.finance.FinanceApplication;
import de.linus.tnbp.monthlysurplus.MonthlySurplus;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2")
public class MonthlySurplusV2Controller implements MonthlySurplusApi {
    private final FinanceApplication finance;
    public MonthlySurplusV2Controller(FinanceApplication finance) { this.finance = finance; }
    @Override public ResponseEntity<MonthlySurplusActivationResponse> getMonthlySurplusActivation() {
        return response(finance.monthlyActivation(userId()));
    }
    @Override public ResponseEntity<MonthlySurplusActivationResponse> postMonthlySurplusActivation() {
        return response(finance.activateMonthlyAutomation(userId()));
    }
    private UUID userId() { return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName()); }
    private ResponseEntity<MonthlySurplusActivationResponse> response(MonthlySurplus.Activation state) {
        return ResponseEntity.ok().header("Cache-Control", "no-store")
            .body(new MonthlySurplusActivationResponse(state.active(), state.activationMonth()));
    }
}

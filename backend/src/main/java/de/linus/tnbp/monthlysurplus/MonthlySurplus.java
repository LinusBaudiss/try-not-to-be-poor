package de.linus.tnbp.monthlysurplus;

import de.linus.tnbp.shared.FinanceContext;
import java.time.LocalDate;
import org.springframework.stereotype.Service;

/** Eigener Datenbesitzer für den ausdrücklichen, unveränderlichen Automatikstart. */
@Service
public class MonthlySurplus {
    public record Activation(boolean active, LocalDate activationMonth) {}
    private final ActivationRepository activations;
    MonthlySurplus(ActivationRepository activations) { this.activations = activations; }
    public Activation state(FinanceContext context) {
        context.requireRead();
        LocalDate month = activations.month(context.userId());
        return new Activation(month != null, month);
    }
    public Activation activate(FinanceContext context) {
        context.requireWrite();
        activations.insert(context.userId(), context.month());
        return state(context);
    }
}

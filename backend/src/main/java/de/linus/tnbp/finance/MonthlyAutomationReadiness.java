package de.linus.tnbp.finance;

import org.springframework.stereotype.Component;

/** Erst die gemeinsame Lebenszyklusabnahme darf diesen geschlossenen Auslieferungsstand ersetzen. */
@Component
public class MonthlyAutomationReadiness {
    public boolean available() { return false; }
}

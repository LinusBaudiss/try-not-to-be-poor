package de.linus.tnbp.finance.http;

import de.linus.tnbp.contract.v2.api.CapabilitiesApi;
import de.linus.tnbp.contract.v2.model.CapabilitiesResponse;
import de.linus.tnbp.contract.v2.model.CapabilitiesError;
import de.linus.tnbp.finance.FinanceApplication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2")
public class CapabilitiesV2Controller implements CapabilitiesApi {
    private final FinanceApplication versions;
    public CapabilitiesV2Controller(FinanceApplication versions) { this.versions = versions; }
    @Override public ResponseEntity<CapabilitiesResponse> getCapabilities() {
        return ResponseEntity.ok().header("Cache-Control", "no-store")
            .body(new CapabilitiesResponse(versions.signedProgressAvailable()).monthlyAutomationAvailable(versions.monthlyAutomationAvailable()));
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<CapabilitiesError> unavailable() {
        org.slf4j.LoggerFactory.getLogger(CapabilitiesV2Controller.class).error("Funktionszustand konnte nicht geladen werden; Fehlerkategorie=CAPABILITIES_UNAVAILABLE");
        return ResponseEntity.internalServerError().header("Cache-Control", "no-store")
            .body(new CapabilitiesError(CapabilitiesError.CodeEnum.CAPABILITIES_UNAVAILABLE,
                "Der Funktionszustand konnte nicht geprüft werden. Versuche es erneut."));
    }
}

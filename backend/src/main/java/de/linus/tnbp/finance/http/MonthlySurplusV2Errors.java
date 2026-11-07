package de.linus.tnbp.finance.http;

import de.linus.tnbp.contract.v2.model.MonthlySurplusError;
import de.linus.tnbp.contract.v2.model.MonthlySurplusFeatureNotAvailableError;
import de.linus.tnbp.finance.FinanceApplication;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = MonthlySurplusV2Controller.class)
class MonthlySurplusV2Errors {
    @ExceptionHandler(FinanceApplication.FeatureNotAvailable.class)
    ResponseEntity<MonthlySurplusFeatureNotAvailableError> unavailable() {
        return ResponseEntity.status(409).header("Cache-Control", "no-store").body(new MonthlySurplusFeatureNotAvailableError(
            MonthlySurplusFeatureNotAvailableError.CodeEnum.FEATURE_NOT_AVAILABLE, "Die Monatsautomatik ist derzeit nicht verfügbar."));
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<MonthlySurplusError> unconfirmed(jakarta.servlet.http.HttpServletRequest request) {
        org.slf4j.LoggerFactory.getLogger(MonthlySurplusV2Errors.class)
            .error("Automatikanfrage nicht bestätigt; Fehlerkategorie=MONTHLY_SURPLUS_UNAVAILABLE");
        return ResponseEntity.internalServerError().header("Cache-Control", "no-store").body(new MonthlySurplusError(
            MonthlySurplusError.CodeEnum.MONTHLY_SURPLUS_UNAVAILABLE,
            request.getServletPath().equals("/api/v2/monthly-surplus/pending")
                ? "Deine Vormerkung konnte nicht geladen werden. Versuche es erneut."
                : "Die Automatikanfrage wurde nicht bestätigt. Lade den aktuellen Aktivierungszustand vor einem weiteren Versuch."));
    }
}

package de.linus.tnbp.finance.http;

import de.linus.tnbp.contract.v2.model.MonthlySurplusError;
import de.linus.tnbp.contract.v2.model.MonthlySurplusFeatureNotAvailableError;
import de.linus.tnbp.contract.v2.model.MonthlySurplusSelectionError;
import de.linus.tnbp.finance.FinanceApplication;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = MonthlySurplusV2Controller.class)
class MonthlySurplusV2Errors {
    @ExceptionHandler({FinanceApplication.InvalidSelection.class,
        org.springframework.web.bind.MethodArgumentNotValidException.class,
        org.springframework.http.converter.HttpMessageNotReadableException.class})
    ResponseEntity<MonthlySurplusSelectionError> invalid() {
        return selection(400, MonthlySurplusSelectionError.CodeEnum.INVALID_SELECTION, "Wähle ein eigenes vorhandenes Sparziel aus.");
    }
    @ExceptionHandler(de.linus.tnbp.savingsgoals.SavingsGoals.NotFound.class)
    ResponseEntity<MonthlySurplusSelectionError> missing() {
        return selection(404, MonthlySurplusSelectionError.CodeEnum.GOAL_NOT_FOUND, "Das Sparziel wurde nicht gefunden.");
    }
    @ExceptionHandler(FinanceApplication.AutomationNotActive.class)
    ResponseEntity<MonthlySurplusSelectionError> inactive() {
        return selection(409, MonthlySurplusSelectionError.CodeEnum.AUTOMATION_NOT_ACTIVE, "Aktiviere zuerst ausdrücklich deine Monatsautomatik.");
    }
    @ExceptionHandler(ArithmeticException.class)
    ResponseEntity<?> amount(jakarta.servlet.http.HttpServletRequest request) {
        if (!request.getServletPath().equals("/api/v2/monthly-surplus/selection")) return unconfirmed(request);
        return selection(409, MonthlySurplusSelectionError.CodeEnum.AMOUNT_LIMIT_EXCEEDED,
            "Die vollständige Übernahme würde die zulässige Betragsgrenze überschreiten. Prüfe den Gesamtfortschritt deiner Ziele.");
    }
    private ResponseEntity<MonthlySurplusSelectionError> selection(int status, MonthlySurplusSelectionError.CodeEnum code, String message) {
        return ResponseEntity.status(status).header("Cache-Control", "no-store").body(new MonthlySurplusSelectionError(code, message));
    }
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
                : request.getServletPath().equals("/api/v2/monthly-surplus/selection")
                ? "Die Auswahl wurde nicht bestätigt. Lade die gemeinsame Automatikübersicht vor einem weiteren Versuch."
                : request.getServletPath().equals("/api/v2/monthly-surplus")
                ? "Deine Automatikübersicht konnte nicht geladen werden. Versuche es erneut."
                : "Die Automatikanfrage wurde nicht bestätigt. Lade den aktuellen Aktivierungszustand vor einem weiteren Versuch."));
    }
}

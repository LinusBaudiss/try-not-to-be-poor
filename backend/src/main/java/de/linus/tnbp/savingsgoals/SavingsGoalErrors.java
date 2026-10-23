package de.linus.tnbp.savingsgoals;

import de.linus.tnbp.contract.model.SavingsGoalError;
import java.util.Map;
import java.util.LinkedHashMap;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.transaction.TransactionException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.ErrorResponse;
import tools.jackson.core.JacksonException;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = SavingsGoalController.class)
class SavingsGoalErrors {
    @ExceptionHandler(SavingsGoalService.InvalidGoal.class)
    ResponseEntity<SavingsGoalError> invalid(SavingsGoalService.InvalidGoal failure) {
        return bad(SavingsGoalError.CodeEnum.VALIDATION_FAILED, "Prüfe das Sparziel.", failure.fields);
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<SavingsGoalError> binding(MethodArgumentNotValidException failure) {
        Map<String, String> fields = new LinkedHashMap<>();
        failure.getBindingResult().getFieldErrors().forEach(error -> field(fields, error.getField()));
        return bad(SavingsGoalError.CodeEnum.VALIDATION_FAILED, "Prüfe das Sparziel.", fields);
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<SavingsGoalError> malformed(HttpMessageNotReadableException failure) {
        Map<String, String> fields = new LinkedHashMap<>();
        for (Throwable cause = failure.getCause(); cause != null; cause = cause.getCause()) {
            if (cause instanceof JacksonException parser && !parser.getPath().isEmpty()) {
                field(fields, parser.getPath().getFirst().getPropertyName());
                break;
            }
        }
        return bad(SavingsGoalError.CodeEnum.VALIDATION_FAILED, "Die Anfrage konnte nicht verarbeitet werden. Prüfe die Eingaben.", fields);
    }
    private void field(Map<String, String> fields, String name) {
        if ("name".equals(name)) fields.put("name", "Gib einen Namen als Text ein.");
        if ("targetDate".equals(name)) fields.put("targetDate", "Gib ein gültiges Kalenderdatum im Format JJJJ-MM-TT ein.");
        if ("targetAmountCents".equals(name)) fields.put("targetAmountCents", "Gib einen positiven Betrag bis 90.071.992.547.409,91 Euro in ganzen Cent ein.");
    }
    private ResponseEntity<SavingsGoalError> bad(SavingsGoalError.CodeEnum code, String message, Map<String, String> fields) {
        return ResponseEntity.badRequest().header("Cache-Control", "no-store").body(new SavingsGoalError(code, message, fields));
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<SavingsGoalError> unavailable(Exception failure) {
        HttpStatusCode status = failure instanceof ErrorResponse protocol
            ? protocol.getStatusCode() : HttpStatus.INTERNAL_SERVER_ERROR;
        HttpHeaders headers = failure instanceof ErrorResponse protocol ? protocol.getHeaders() : HttpHeaders.EMPTY;
        if (!status.is5xxServerError()) {
            return ResponseEntity.status(status).headers(headers).header("Cache-Control", "no-store")
                .body(new SavingsGoalError(SavingsGoalError.CodeEnum.VALIDATION_FAILED, "Die Anfrage konnte nicht verarbeitet werden.", Map.of()));
        }
        String category = failure instanceof DataAccessException || failure instanceof TransactionException ? "DATENBANK" : "ANWENDUNG";
        LoggerFactory.getLogger(SavingsGoalErrors.class).error("Sparzielanfrage fehlgeschlagen; Fehlerkategorie={}", category);
        return ResponseEntity.status(status).headers(headers).header("Cache-Control", "no-store").body(new SavingsGoalError(
            SavingsGoalError.CodeEnum.SAVINGS_GOAL_UNAVAILABLE, "Die Sparzielanfrage wurde nicht bestätigt. Versuche es erneut.", Map.of()));
    }
}

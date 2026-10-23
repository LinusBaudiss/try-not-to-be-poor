package de.linus.tnbp.expensebudget;

import de.linus.tnbp.contract.model.ExpenseError;
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
@RestControllerAdvice(assignableTypes = ExpenseController.class)
class ExpenseErrors {
    @ExceptionHandler(ExpenseService.InvalidExpense.class)
    ResponseEntity<ExpenseError> invalid(ExpenseService.InvalidExpense failure) {
        return bad(ExpenseError.CodeEnum.VALIDATION_FAILED, "Prüfe die Ausgabe.", failure.fields);
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ExpenseError> binding(MethodArgumentNotValidException failure) {
        Map<String, String> fields = new LinkedHashMap<>();
        failure.getBindingResult().getFieldErrors().forEach(error -> field(fields, error.getField()));
        return bad(ExpenseError.CodeEnum.VALIDATION_FAILED, "Prüfe die Ausgabe.", fields);
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ExpenseError> malformed(HttpMessageNotReadableException failure) {
        Map<String, String> fields = new LinkedHashMap<>();
        for (Throwable cause = failure.getCause(); cause != null; cause = cause.getCause()) {
            if (cause instanceof JacksonException parser && !parser.getPath().isEmpty()) {
                field(fields, parser.getPath().getFirst().getPropertyName());
                break;
            }
        }
        return bad(ExpenseError.CodeEnum.VALIDATION_FAILED, "Die Anfrage konnte nicht verarbeitet werden. Prüfe die Eingaben.", fields);
    }
    private void field(Map<String, String> fields, String name) {
        if ("name".equals(name)) fields.put("name", "Gib einen Namen als Text ein.");
        if ("amountCents".equals(name)) fields.put("amountCents", "Gib einen positiven Betrag bis 90.071.992.547.409,91 Euro in ganzen Cent ein.");
    }
    @ExceptionHandler(ExpenseService.MonthLimit.class)
    ResponseEntity<ExpenseError> limit() {
        return bad(ExpenseError.CodeEnum.MONTH_LIMIT_EXCEEDED, "Die Monatssumme würde die zulässige Centgrenze überschreiten.",
            Map.of("amountCents", "Dieser Betrag überschreitet die zulässige Monatssumme."));
    }
    private ResponseEntity<ExpenseError> bad(ExpenseError.CodeEnum code, String message, Map<String, String> fields) {
        return ResponseEntity.badRequest().header("Cache-Control", "no-store").body(new ExpenseError(code, message, fields));
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ExpenseError> unavailable(Exception failure) {
        HttpStatusCode status = failure instanceof ErrorResponse protocol
            ? protocol.getStatusCode() : HttpStatus.INTERNAL_SERVER_ERROR;
        HttpHeaders headers = failure instanceof ErrorResponse protocol ? protocol.getHeaders() : HttpHeaders.EMPTY;
        if (!status.is5xxServerError()) {
            return ResponseEntity.status(status).headers(headers).header("Cache-Control", "no-store")
                .body(new ExpenseError(ExpenseError.CodeEnum.VALIDATION_FAILED, "Die Anfrage konnte nicht verarbeitet werden.", Map.of()));
        }
        String category = failure instanceof DataAccessException || failure instanceof TransactionException ? "DATENBANK" : "ANWENDUNG";
        LoggerFactory.getLogger(ExpenseErrors.class).error("Ausgabenanfrage fehlgeschlagen; Fehlerkategorie={}", category);
        return ResponseEntity.status(status).headers(headers).header("Cache-Control", "no-store").body(new ExpenseError(
            ExpenseError.CodeEnum.EXPENSE_UNAVAILABLE, "Die Ausgabenanfrage wurde nicht bestätigt. Versuche es erneut.", Map.of()));
    }
}

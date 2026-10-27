package de.linus.tnbp.finance.http;

import de.linus.tnbp.budget.Budgets;
import de.linus.tnbp.contract.v2.model.BudgetError;
import java.util.Map;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.HttpHeaders;
import org.springframework.web.ErrorResponse;
import org.springframework.dao.DataAccessException;
import org.springframework.transaction.TransactionException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = BudgetV2Controller.class)
class BudgetV2Errors {
    @ExceptionHandler({Budgets.InvalidAmount.class, HttpMessageNotReadableException.class, MethodArgumentNotValidException.class})
    ResponseEntity<BudgetError> invalid() {
        return ResponseEntity.badRequest().header("Cache-Control", "no-store").body(new BudgetError(
            BudgetError.CodeEnum.VALIDATION_FAILED, "Prüfe den Budgetbetrag.",
            Map.of("amountCents", "Gib einen Betrag von 0 bis 90.071.992.547.409,91 Euro in ganzen Cent ein.")));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<BudgetError> unavailable(Exception failure) {
        HttpStatusCode status = failure instanceof ErrorResponse protocol ? protocol.getStatusCode() : HttpStatus.INTERNAL_SERVER_ERROR;
        HttpHeaders headers = failure instanceof ErrorResponse protocol ? protocol.getHeaders() : HttpHeaders.EMPTY;
        if (!status.is5xxServerError()) {
            return ResponseEntity.status(status).headers(headers).header("Cache-Control", "no-store").body(new BudgetError(
                BudgetError.CodeEnum.VALIDATION_FAILED, "Die Anfrage konnte nicht verarbeitet werden.", Map.of()));
        }
        String category = failure instanceof DataAccessException || failure instanceof TransactionException ? "DATENBANK" : "ANWENDUNG";
        LoggerFactory.getLogger(BudgetV2Errors.class).error("Budgetanfrage fehlgeschlagen; Fehlerkategorie={}", category);
        return ResponseEntity.internalServerError().header("Cache-Control", "no-store").body(new BudgetError(
            BudgetError.CodeEnum.BUDGET_UNAVAILABLE, "Die Budgetanfrage wurde nicht bestätigt. Lade das aktuelle Budget und prüfe den gespeicherten Stand, bevor du erneut speicherst.", Map.of()));
    }
}

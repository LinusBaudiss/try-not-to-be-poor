package de.linus.tnbp.expensebudget;

import de.linus.tnbp.contract.model.BudgetError;
import java.util.Map;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataAccessException;
import org.springframework.transaction.TransactionException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = BudgetController.class)
class BudgetErrors {
    @ExceptionHandler({BudgetService.InvalidAmount.class, HttpMessageNotReadableException.class, MethodArgumentNotValidException.class})
    ResponseEntity<BudgetError> invalid() {
        return ResponseEntity.badRequest().header("Cache-Control", "no-store").body(new BudgetError(
            BudgetError.CodeEnum.VALIDATION_FAILED, "Prüfe den Budgetbetrag.",
            Map.of("amountCents", "Gib einen Betrag von 0 bis 90.071.992.547.409,91 Euro in ganzen Cent ein.")));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<BudgetError> unavailable(Exception failure) {
        String category = failure instanceof DataAccessException || failure instanceof TransactionException ? "DATENBANK" : "ANWENDUNG";
        LoggerFactory.getLogger(BudgetErrors.class).error("Budgetanfrage fehlgeschlagen; Fehlerkategorie={}", category);
        return ResponseEntity.internalServerError().header("Cache-Control", "no-store").body(new BudgetError(
            BudgetError.CodeEnum.BUDGET_UNAVAILABLE, "Die Budgetanfrage wurde nicht bestätigt. Versuche es erneut.", Map.of()));
    }
}

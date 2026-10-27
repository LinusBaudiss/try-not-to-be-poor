package de.linus.tnbp.finance.http;

import de.linus.tnbp.contract.v2.model.MonthSummaryError;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = MonthSummaryV2Controller.class)
class MonthSummaryV2Errors {
    @ExceptionHandler(Exception.class)
    ResponseEntity<MonthSummaryError> unavailable() {
        LoggerFactory.getLogger(MonthSummaryV2Errors.class).error("Monatsübersicht konnte nicht geladen werden.");
        return ResponseEntity.internalServerError().header("Cache-Control", "no-store").body(new MonthSummaryError(
            MonthSummaryError.CodeEnum.MONTH_SUMMARY_UNAVAILABLE, "Die Monatsübersicht konnte nicht geladen werden. Versuche es erneut."));
    }
}

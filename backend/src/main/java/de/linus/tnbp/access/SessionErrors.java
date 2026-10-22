package de.linus.tnbp.access;

import de.linus.tnbp.contract.model.SessionError;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = SessionController.class)
class SessionErrors {
    @ExceptionHandler(Exception.class)
    ResponseEntity<SessionError> failed(Exception failure, HttpServletRequest request) {
        int status = failure instanceof SessionFailure session ? session.status
            : failure instanceof org.springframework.http.converter.HttpMessageNotReadableException
                || failure instanceof org.springframework.web.bind.MethodArgumentNotValidException ? 401 : 500;
        if (status == 500) LoggerFactory.getLogger(SessionErrors.class).error("Sitzungsanfrage fehlgeschlagen; Fehlerkategorie=ANWENDUNG");
        var response = ResponseEntity.status(status).header("Cache-Control", "no-store");
        if (status == 401 && request.getServletPath().endsWith("/refresh"))
            response.header("Set-Cookie", SessionHttp.cookie("", 0));
        return response.body(new SessionError(status >= 500 ? SessionError.CodeEnum.SESSION_UNAVAILABLE : SessionError.CodeEnum.SESSION_REJECTED,
            status >= 500 ? "Sitzung konnte nicht bestätigt werden. Melde dich erneut an."
                : "Anmeldung nicht möglich. Prüfe E-Mail-Adresse und Passwort."));
    }
}

package de.linus.tnbp.access;

import de.linus.tnbp.contract.model.ApiError;
import java.util.Map;
import java.util.LinkedHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.transaction.TransactionException;
import org.springframework.web.ErrorResponse;

@RestControllerAdvice
class RegistrationErrors {
    private static final Logger LOG = LoggerFactory.getLogger(RegistrationErrors.class);
    @ExceptionHandler(RegistrationFailure.class)
    ResponseEntity<ApiError> failed(RegistrationFailure failure) {
        boolean fields = !failure.fieldErrors().isEmpty();
        return ResponseEntity.badRequest().body(new ApiError(
            fields ? ApiError.CodeEnum.VALIDATION_FAILED : ApiError.CodeEnum.REGISTRATION_FAILED,
            fields ? "Prüfe deine Eingaben." : "Registrierung nicht möglich. Prüfe deine Angaben und den Registrierungslink.",
            failure.fieldErrors()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> missingFields(MethodArgumentNotValidException failure) {
        Map<String, String> fields = new LinkedHashMap<>();
        failure.getBindingResult().getFieldErrors().forEach(error -> {
            if (error.getField().equals("email")) fields.put("email", "Gib eine gültige E-Mail-Adresse ein.");
            if (error.getField().equals("password")) fields.put("password", "Verwende 15 bis 64 Zeichen.");
        });
        return failed(new RegistrationFailure(fields));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> malformed() {
        return ResponseEntity.badRequest().body(new ApiError(ApiError.CodeEnum.VALIDATION_FAILED,
            "Prüfe deine Eingaben.", Map.of()));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> unavailable(Exception failure) {
        HttpStatusCode status = failure instanceof ErrorResponse protocol
            ? protocol.getStatusCode() : HttpStatus.INTERNAL_SERVER_ERROR;
        HttpHeaders headers = failure instanceof ErrorResponse protocol ? protocol.getHeaders() : HttpHeaders.EMPTY;
        if (!status.is5xxServerError()) {
            return ResponseEntity.status(status).headers(headers)
                .body(new ApiError(ApiError.CodeEnum.VALIDATION_FAILED, "Die Anfrage konnte nicht verarbeitet werden.", Map.of()));
        }
        String category = failure instanceof DataAccessException || failure instanceof TransactionException
            ? "DATENBANK" : "ANWENDUNG";
        LOG.error("Registrierung fehlgeschlagen; Fehlerkategorie={}", category);
        return ResponseEntity.status(status).headers(headers).body(new ApiError(ApiError.CodeEnum.SERVER_ERROR,
            "Das Konto konnte nicht gespeichert werden. Versuche es erneut.", Map.of()));
    }
}

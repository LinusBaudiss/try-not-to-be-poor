package de.linus.tnbp.access;

import de.linus.tnbp.contract.api.AccessApi;
import de.linus.tnbp.contract.model.RegistrationCreated;
import de.linus.tnbp.contract.model.RegistrationRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/api/v1")
public class RegistrationController implements AccessApi {
    private final RegistrationService registration;

    public RegistrationController(RegistrationService registration) {
        this.registration = registration;
    }

    @Override
    public ResponseEntity<RegistrationCreated> register(RegistrationRequest request) {
        registration.register(request.getRegistrationToken(), request.getEmail(), request.getPassword());
        return ResponseEntity.status(HttpStatus.CREATED).body(new RegistrationCreated("Dein Konto wurde angelegt."));
    }
}

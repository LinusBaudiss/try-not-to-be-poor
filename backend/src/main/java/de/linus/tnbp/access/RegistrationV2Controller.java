package de.linus.tnbp.access;

import de.linus.tnbp.contract.v2.api.AccessApi;
import de.linus.tnbp.contract.v2.model.RegistrationCreated;
import de.linus.tnbp.contract.v2.model.RegistrationRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/api/v2")
public class RegistrationV2Controller implements AccessApi {
    private final RegistrationService registration;

    public RegistrationV2Controller(RegistrationService registration) {
        this.registration = registration;
    }

    @Override
    public ResponseEntity<RegistrationCreated> register(RegistrationRequest request) {
        registration.register(request.getRegistrationToken(), request.getEmail(), request.getPassword());
        return ResponseEntity.status(HttpStatus.CREATED).body(new RegistrationCreated("Dein Konto wurde angelegt."));
    }
}

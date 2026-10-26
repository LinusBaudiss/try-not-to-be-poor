package de.linus.tnbp.access;

import de.linus.tnbp.TnbpApplication;
import org.springframework.boot.test.context.SpringBootTest;

/** Führt dieselben HTTP-/PostgreSQL-Abnahmen über den v2-Adapter aus. */
@SpringBootTest(classes = {TnbpApplication.class, RegistrationIT.TimeConfiguration.class},
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RegistrationV2IT extends RegistrationIT {
    @Override String version() { return "v2"; }
}

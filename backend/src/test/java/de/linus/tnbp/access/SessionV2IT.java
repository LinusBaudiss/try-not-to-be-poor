package de.linus.tnbp.access;

import de.linus.tnbp.TnbpApplication;
import org.springframework.boot.test.context.SpringBootTest;

/** Führt dieselben HTTP-/PostgreSQL-Abnahmen über den v2-Adapter aus. */
@SpringBootTest(classes = {TnbpApplication.class, SessionIT.Time.class},
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SessionV2IT extends SessionIT {
    @Override String version() { return "v2"; }
}

package de.linus.tnbp.access;

import de.linus.tnbp.TnbpApplication;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.SpringApplication;

/** Lokale Browser-Test-API mit flüchtiger Datenbank; niemals Produktivdaten. */
public final class E2eServer {
    public static void main(String[] args) throws Exception {
        List<String> settings = new ArrayList<>();
        PostgresFixture.configure((key, value) -> settings.add("--" + key + "=" + value));
        settings.add("--server.address=127.0.0.1");
        settings.add("--server.port=8080");
        settings.add("--registration.link.enabled=true");
        settings.add("--registration.link.sha256=" + RegistrationTest.sha256(RegistrationTest.TOKEN));
        settings.add("--registration.link.issued-at=" + Instant.now());
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try { PostgresFixture.POSTGRES.close(); } catch (java.io.IOException ignored) { /* Prozess endet. */ }
        }));
        SpringApplication.run(TnbpApplication.class, settings.toArray(String[]::new));
    }
}

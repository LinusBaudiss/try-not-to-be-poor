package de.linus.tnbp.access;

import de.linus.tnbp.TnbpApplication;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.SpringApplication;

/** Lokale Browser-Test-API mit flüchtiger Datenbank; niemals Produktivdaten. */
public final class E2eServer {
    public static void main(String[] args) throws Exception {
        String persistent = System.getenv("E2E_PERSISTENT_DATABASE_DIR");
        if (persistent != null) { persistent(java.nio.file.Path.of(persistent)); return; }
        List<String> settings = new ArrayList<>();
        PostgresFixture.configure((key, value) -> settings.add("--" + key + "=" + value));
        settings.add("--server.address=127.0.0.1");
        settings.add("--server.port=8080");
        settings.add("--registration.link.enabled=true");
        settings.add("--access.session.signing-key=" + java.util.Base64.getEncoder().encodeToString(new byte[32]));
        settings.add("--access.session.issuer=tnbp-test");
        settings.add("--access.session.audience=tnbp-spa-test");
        settings.add("--access.session.origin=https://localhost:4200");
        settings.add("--registration.link.sha256=" + RegistrationTest.sha256(RegistrationTest.TOKEN));
        settings.add("--registration.link.issued-at=" + Instant.now());
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try { PostgresFixture.POSTGRES.close(); } catch (java.io.IOException ignored) { /* Prozess endet. */ }
        }));
        SpringApplication.run(TnbpApplication.class, settings.toArray(String[]::new));
    }

    private static void persistent(java.nio.file.Path folder) throws Exception {
        java.nio.file.Files.createDirectories(folder);
        java.nio.file.Files.setPosixFilePermissions(folder, java.nio.file.attribute.PosixFilePermissions.fromString("rwx------"));
        final var guardFolder=folder.resolve("guard-"+java.util.UUID.randomUUID());
        var environment = new java.util.LinkedHashMap<String, String>();
        environment.put("E2E_GUARD_STATE_DIR",guardFolder.toAbsolutePath().toString());
        environment.put("DB_URL", PostgresFixture.URL);
        environment.put("DB_ADMIN_USER", "postgres"); environment.put("DB_ADMIN_PASSWORD", "postgres");
        environment.put("DB_RUNTIME_USER", "tnbp_runtime"); environment.put("DB_RUNTIME_PASSWORD", "runtime-test-only");
        environment.put("DB_MIGRATION_USER", "tnbp_migrator"); environment.put("DB_MIGRATION_PASSWORD", "migration-test-only");
        environment.put("SESSION_SIGNING_KEY", java.util.Base64.getEncoder().encodeToString(new byte[32]));
        environment.put("SESSION_ISSUER", "tnbp-test"); environment.put("SESSION_AUDIENCE", "tnbp-spa-test");
        environment.put("SESSION_ORIGIN", "https://localhost:4200");
        environment.put("REGISTRATION_LINK_ENABLED", "true");
        environment.put("REGISTRATION_LINK_SHA256", RegistrationTest.sha256(RegistrationTest.TOKEN));
        environment.put("REGISTRATION_LINK_ISSUED_AT", Instant.now().toString());
        var json = tools.jackson.databind.json.JsonMapper.builder().build().writeValueAsString(environment);
        java.nio.file.Files.writeString(folder.resolve("environment.json"), json);
        java.nio.file.Files.setPosixFilePermissions(folder.resolve("environment.json"), java.nio.file.attribute.PosixFilePermissions.fromString("rw-------"));
        var root = java.nio.file.Path.of(System.getProperty("user.dir")).toAbsolutePath();
        if (root.getFileName().toString().equals("backend")) root = root.getParent();
        final var project = root;
        var command = List.of("python3", root.resolve("scripts/api-release.py").toString(), "start", "--release",
            root.resolve("backend/target/tnbp-0.1.0-SNAPSHOT.jar").toString(), "--state-dir", guardFolder.toString());
        var builder = new ProcessBuilder(command).directory(root.toFile()).inheritIO();
        builder.environment().putAll(environment);
        var process = builder.start();
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try {
                var stop = new ProcessBuilder("python3", project.resolve("scripts/api-release.py").toString(), "stop", "--release",
                    project.resolve("backend/target/tnbp-0.1.0-SNAPSHOT.jar").toString(), "--state-dir", guardFolder.toString()).inheritIO();
                stop.environment().putAll(environment);
                stop.start().waitFor(20, java.util.concurrent.TimeUnit.SECONDS);
                process.destroy();
                PostgresFixture.POSTGRES.close();
            } catch (Exception ignored) { /* Ausschließlich flüchtige Testprozesse. */ }
        }));
        int result=process.waitFor();
        var record=guardFolder.resolve("instance.json");
        boolean controlledStop=java.nio.file.Files.exists(record) && Boolean.TRUE.equals(
            tools.jackson.databind.json.JsonMapper.builder().build().readValue(java.nio.file.Files.readString(record),java.util.Map.class).get("stopped"));
        if(result!=0 && !controlledStop) throw new IllegalStateException("Administrativer Test-API-Start fehlgeschlagen: "+result);
        // Während eines erfolgreichen Versionswechsels endet der erste Guard;
        // der PostgreSQL-Eigentümer bleibt bis zum Test-Shutdown bestehen.
        new java.util.concurrent.CountDownLatch(1).await();
    }
}

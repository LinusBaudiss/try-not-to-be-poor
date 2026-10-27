package de.linus.tnbp.access;

import static org.assertj.core.api.Assertions.assertThat;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.ThrowableProxyUtil;
import ch.qos.logback.core.AppenderBase;
import de.linus.tnbp.TnbpApplication;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import com.zaxxer.hikari.HikariDataSource;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest(classes = {de.linus.tnbp.TnbpApplication.class, RegistrationIT.TimeConfiguration.class},
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ExtendWith(OutputCaptureExtension.class)
class RegistrationIT {
    String version() { return "v1"; }
    String accessPath() { return "/api/" + version() + "/access/"; }
    static final String PASSWORD = "  Grüner 🦊 im Baum  ";
    static final Instant ISSUED = RegistrationTest.ISSUED;
    static final String TOKEN = RegistrationTest.TOKEN;
    static final MutableClock CLOCK = new MutableClock(ISSUED);
    private static final JsonMapper JSON = JsonMapper.builder().build();
    @LocalServerPort int port;
    @Autowired PasswordEncoder encoder;
    static volatile int connectionsDuringHash;
    static volatile boolean transactionDuringHash;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry properties) throws Exception {
        PostgresFixture.configure((key, value) -> properties.add(key, () -> value));
        properties.add("registration.link.enabled", () -> "true");
        properties.add("registration.link.sha256", () -> {
            try { return RegistrationTest.sha256(TOKEN); } catch (Exception e) { throw new IllegalStateException(e); }
        });
        properties.add("registration.link.issued-at", () -> ISSUED.toString());
    }

    @TestConfiguration
    static class TimeConfiguration {
        @Bean @Primary Clock testClock() { return CLOCK; }

        @Bean @Primary
        PasswordEncoder observedEncoder(@Qualifier("passwordEncoder") PasswordEncoder delegate, HikariDataSource dataSource) {
            return new PasswordEncoder() {
                @Override public String encode(CharSequence rawPassword) {
                    connectionsDuringHash = dataSource.getHikariPoolMXBean() == null ? 0 : dataSource.getHikariPoolMXBean().getActiveConnections();
                    transactionDuringHash = TransactionSynchronizationManager.isActualTransactionActive();
                    return delegate.encode(rawPassword);
                }
                @Override public boolean matches(CharSequence rawPassword, String encodedPassword) {
                    return delegate.matches(rawPassword, encodedPassword);
                }
            };
        }
    }

    @BeforeEach
    void reset() {
        PostgresFixture.ADMIN.execute("TRUNCATE access.accounts CASCADE");
        CLOCK.now = ISSUED;
    }

    HttpResponse<String> register(String token, String email, String password) throws Exception {
        return registerAt(port, token, email, password);
    }

    HttpResponse<String> registerAt(int destinationPort, String token, String email, String password) throws Exception {
        var body = new java.util.LinkedHashMap<String, Object>();
        body.put("registrationToken", token);
        body.put("email", email);
        body.put("password", password);
        return postAt(destinationPort, JSON.writeValueAsString(body));
    }

    HttpResponse<String> post(String body) throws Exception {
        return postAt(port, body);
    }

    HttpResponse<String> postAt(int destinationPort, String body) throws Exception {
        return HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://localhost:" + destinationPort + accessPath() + "registrations"))
            .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
    }

    int count() {
        return PostgresFixture.ADMIN.queryForObject("SELECT count(*) FROM access.accounts", Integer.class);
    }

    @Test
    void mehrereLinkinhaberErhaltenUnabhaengigePersistenteKontenOhneSitzung() throws Exception {
        assertThat(PostgresFixture.ADMIN.queryForObject("SHOW server_version", String.class)).startsWith("18.6");
        var first = register(TOKEN, "  Person@Example.org  ", PASSWORD);
        assertThat(first.statusCode()).isEqualTo(201);
        assertThat(first.headers().allValues("Set-Cookie")).isEmpty();
        assertThat(first.body()).doesNotContain("token", "password", "session");
        assertThat(register(TOKEN, "andere@example.org", PASSWORD).statusCode()).isEqualTo(201);
        assertThat(count()).isEqualTo(2);
        var accounts = PostgresFixture.ADMIN.queryForList("SELECT id, email, password_hash, created_at FROM access.accounts ORDER BY email");
        assertThat(accounts.get(0).get("id")).isNotEqualTo(accounts.get(1).get("id"));
        assertThat(accounts.get(0).get("password_hash")).isNotEqualTo(accounts.get(1).get("password_hash"));
        for (var account : accounts) {
            assertThat(encoder.matches(PASSWORD, (String) account.get("password_hash"))).isTrue();
            assertThat(encoder.matches(PASSWORD.strip(), (String) account.get("password_hash"))).isFalse();
            assertThat(account.get("created_at")).isNotNull();
        }
        assertThat(accounts).extracting(row -> row.get("email")).containsExactly("andere@example.org", "person@example.org");
    }

    @Test
    void feldfehlerSindHilfreichUndUnabhaengigVomKontobestand() throws Exception {
        assertThat(register(TOKEN, "person@example.org", PASSWORD).statusCode()).isEqualTo(201);
        var existing = register(TOKEN, "person@example.org", "🦊".repeat(14));
        var unknown = register(TOKEN, "neu@example.org", "🦊".repeat(14));
        assertThat(existing.statusCode()).isEqualTo(400);
        if (version().equals("v2")) assertThat(existing.headers().firstValue("Cache-Control")).hasValue("no-store");
        assertThat(existing.body()).isEqualTo(unknown.body()).contains("password", "15 bis 64");
        assertThat(register(TOKEN, "kaputt", "🦊".repeat(65)).body()).contains("email", "password");
        assertThat(register(TOKEN, "neu@example.org", "Mailcreated5240").body()).contains("zu häufig");
        assertThat(register(TOKEN, "neu@example.org", "123456789012345").body()).contains("zu häufig");
        assertThat(count()).isEqualTo(1);
    }

    @Test
    void argon2BelegtVorDemEinfuegenKeineDatenbankverbindung() throws Exception {
        assertThat(register(TOKEN, "ohne-lange-transaktion@example.org", PASSWORD).statusCode()).isEqualTo(201);
        assertThat(connectionsDuringHash).isZero();
        assertThat(transactionDuringHash).isFalse();
        assertThat(count()).isEqualTo(1);
    }

    @Test
    void jsonLesegrenzenStoppenFesteUndChunkedAnfragenVorDerPasswortpruefung() throws Exception {
        String hugeString = JSON.writeValueAsString(Map.of("registrationToken", TOKEN, "email", "gross@example.org", "password", "x".repeat(100_000)));
        String hugeDocument = JSON.writeValueAsString(Map.of("registrationToken", TOKEN, "email", "e".repeat(20_000), "password", "p".repeat(20_000)));
        for (String body : List.of(hugeString, hugeDocument)) {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            for (boolean chunked : new boolean[] {false, true}) {
                var publisher = chunked ? HttpRequest.BodyPublishers.ofInputStream(() -> new ByteArrayInputStream(bytes))
                    : HttpRequest.BodyPublishers.ofByteArray(bytes);
                assertThat(publisher.contentLength()).isEqualTo(chunked ? -1 : bytes.length);
                var response = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).build().send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + accessPath() + "registrations"))
                    .header("Content-Type", "application/json").POST(publisher).build(), HttpResponse.BodyHandlers.ofString());
                assertThat(response.statusCode()).as("Chunked=%s", chunked).isEqualTo(400);
                assertThat(response.body()).contains("VALIDATION_FAILED").doesNotContain("\"password\"");
                assertThat(count()).isZero();
            }
        }
    }

    @Test
    void alleRequestfelderLehnenZahlenUndBooleanStattStringsAb() throws Exception {
        for (String field : List.of("registrationToken", "email", "password")) {
            for (Object value : List.of(123456789012345L, 123456789012345.5, true, false)) {
                Map<String, Object> body = new java.util.LinkedHashMap<>(Map.of("registrationToken", TOKEN, "email", "typ@example.org", "password", PASSWORD));
                body.put(field, value);
                var response = post(JSON.writeValueAsString(body));
                assertThat(response.statusCode()).as("%s=%s", field, value).isEqualTo(400);
                assertThat(response.body()).contains("VALIDATION_FAILED");
                assertThat(count()).isZero();
            }
        }
    }

    @Test
    void frameworkProtokollfehlerBehaltenIhrenHttpStatus() throws Exception {
        var response = HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + accessPath() + "registrations"))
            .header("Content-Type", "text/plain").POST(HttpRequest.BodyPublishers.ofString("keine JSON-Anfrage")).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(415);
        if (version().equals("v2")) assertThat(response.headers().firstValue("Cache-Control")).hasValue("no-store");
        assertThat(response.body()).doesNotContain("SERVER_ERROR");
        assertThat(count()).isZero();
    }

    @Test
    void ungueltigeEmailUndGrenzenErzeugenKeinKonto() throws Exception {
        for (String email : List.of("", "kaputt", "zwei@@example.org", "a b@example.org", "x".repeat(243) + "@example.org")) {
            var result = register(TOKEN, email, PASSWORD);
            assertThat(result.statusCode()).as(email).isEqualTo(400);
            assertThat(result.body()).contains("email");
        }
        assertThat(count()).isZero();
    }

    @Test
    void emailMit254ZeichenWirdAngenommenUnd255Abgelehnt() throws Exception {
        String boundary = "a".repeat(64) + "@" + "b".repeat(63) + "." + "c".repeat(63) + "." + "d".repeat(61);
        assertThat(boundary).hasSize(254);
        assertThat(register(TOKEN, boundary, PASSWORD).statusCode()).isEqualTo(201);
        assertThat(register(TOKEN, boundary + "d", PASSWORD).statusCode()).isEqualTo(400);
        assertThat(count()).isEqualTo(1);
    }

    @Test
    void gueltige15Und64CodepunkteSowieNfcWerdenVollstaendigGespeichert() throws Exception {
        for (int length : new int[] {15, 64}) {
            String password = "🦊".repeat(length);
            String email = "grenze" + length + "@example.org";
            assertThat(register(TOKEN, email, password).statusCode()).isEqualTo(201);
            String hash = PostgresFixture.ADMIN.queryForObject("SELECT password_hash FROM access.accounts WHERE email = ?", String.class, email);
            assertThat(encoder.matches(password, hash)).isTrue();
        }
        assertThat(register(TOKEN, "nfc@example.org", "e\u0301".repeat(15)).statusCode()).isEqualTo(201);
        String hash = PostgresFixture.ADMIN.queryForObject("SELECT password_hash FROM access.accounts WHERE email = 'nfc@example.org'", String.class);
        assertThat(encoder.matches("é".repeat(15), hash)).isTrue();
        assertThat(encoder.matches("e\u0301".repeat(15), hash)).isFalse();
    }

    @Test
    void fehlendeFalscheZukuenftigeUndAbgelaufeneLinksSindNeutral() throws Exception {
        var invalid = register("b".repeat(43), "neu@example.org", PASSWORD);
        assertThat(invalid.statusCode()).isEqualTo(400);
        assertThat(register(null, "neu@example.org", PASSWORD).body()).isEqualTo(invalid.body());
        assertThat(register("", "neu@example.org", PASSWORD).body()).isEqualTo(invalid.body());
        CLOCK.now = ISSUED.minusNanos(1);
        assertThat(register(TOKEN, "neu@example.org", PASSWORD).body()).isEqualTo(invalid.body());
        CLOCK.now = ISSUED.plusSeconds(30 * 86400L);
        assertThat(register(TOKEN, "neu@example.org", PASSWORD).body()).isEqualTo(invalid.body());
        assertThat(count()).isZero();
    }

    @Test
    void doppelteEmailIstNeutralUndParalleleAnfragenErzeugenHoechstensEinKonto() throws Exception {
        try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
            var one = pool.submit(() -> register(TOKEN, " Parallel@Example.org ", PASSWORD));
            var two = pool.submit(() -> register(TOKEN, "parallel@example.org", PASSWORD));
            List<Integer> statuses = new ArrayList<>(List.of(one.get().statusCode(), two.get().statusCode()));
            statuses.sort(Integer::compareTo);
            assertThat(statuses).containsExactly(201, 400);
        }
        assertThat(count()).isEqualTo(1);
        assertThat(register(TOKEN, "PARALLEL@example.org", PASSWORD).body())
            .isEqualTo(register("b".repeat(43), "neu@example.org", PASSWORD).body());
    }

    @Test
    void commitFehlerBestaetigtKeinenErfolgUndRolltDasKontoZurueck(CapturedOutput logs) throws Exception {
        PostgresFixture.ADMIN.execute("""
            CREATE FUNCTION access.reject_test_commit() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN RAISE EXCEPTION 'InterneGeheimeDatenbankNachricht'; RETURN NEW; END $$
            """);
        PostgresFixture.ADMIN.execute("""
            CREATE CONSTRAINT TRIGGER reject_test_commit AFTER INSERT ON access.accounts
            DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION access.reject_test_commit()
            """);
        try (var applicationLogs = new ApplicationLogs()) {
            var result = register(TOKEN, "commit@example.org", PASSWORD);
            assertThat(result.statusCode()).isEqualTo(500);
            if (version().equals("v2")) assertThat(result.headers().firstValue("Cache-Control")).hasValue("no-store");
            assertThat(result.body()).contains("SERVER_ERROR").doesNotContain("wurde angelegt");
            assertThat(count()).isZero();
            assertThat(applicationLogs.output()).contains("Fehlerkategorie=DATENBANK")
                .doesNotContain("InterneGeheimeDatenbankNachricht", "commit@example.org", TOKEN, PASSWORD);
            assertThat(logs.getAll()).doesNotContain("commit@example.org", TOKEN, PASSWORD);
        } finally {
            PostgresFixture.ADMIN.execute("DROP TRIGGER reject_test_commit ON access.accounts");
            PostgresFixture.ADMIN.execute("DROP FUNCTION access.reject_test_commit()");
        }
    }

    @Test
    void unerwarteteAnwendungsfehlerProtokollierenNurDieBereinigteKategorie(CapturedOutput logs) {
        var result = new RegistrationErrors().unavailable(new IllegalStateException("GeheimeExceptionNachricht:" + TOKEN + PASSWORD));
        assertThat(result.getStatusCode().value()).isEqualTo(500);
        assertThat(logs.getAll()).contains("Fehlerkategorie=ANWENDUNG")
            .doesNotContain("GeheimeExceptionNachricht", TOKEN, PASSWORD);
    }

    @Test
    void laufzeitrolleIstGetrenntUndAndereRoutenSindGeschlossen() throws Exception {
        var runtime = new org.springframework.jdbc.core.JdbcTemplate(new org.springframework.jdbc.datasource.DriverManagerDataSource(PostgresFixture.URL, "tnbp_runtime", "runtime-test-only"));
        assertThat(runtime.queryForObject("SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = current_user", Boolean.class)).isFalse();
        assertThat(runtime.queryForObject("SELECT has_table_privilege(current_user, 'access.accounts', 'DELETE')", Boolean.class)).isFalse();
        var response = HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + accessPath() + "accounts")).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(403);
    }

    @Test
    void logsEnthaltenKeinePasswoerterLinkgeheimnisseOderRequestBodys(CapturedOutput logs) throws Exception {
        try (var applicationLogs = new ApplicationLogs()) {
            assertThat(register(TOKEN, "protokoll@example.org", PASSWORD).statusCode()).isEqualTo(201);
            assertThat(register(TOKEN, "protokoll@example.org", PASSWORD).statusCode()).isEqualTo(400);
            var malformed = post("{\"registrationToken\":\"" + TOKEN + "\",\"email\":\"protokoll@example.org\",\"password\":\"LoggeDiesesPasswortNiemals\",\"unbekannt\":true}");
            assertThat(malformed.statusCode()).isEqualTo(400);
            assertThat(malformed.body()).contains("VALIDATION_FAILED");
            assertThat(applicationLogs.output()).doesNotContain(TOKEN, PASSWORD, "LoggeDiesesPasswortNiemals", "protokoll@example.org");
            assertThat(logs.getAll()).doesNotContain(TOKEN, PASSWORD, "LoggeDiesesPasswortNiemals", "Using generated security password");
        }
    }

    @Test
    void logPruefungUnterscheidetDatenbankprozessUndAnwendung(CapturedOutput console) {
        String marker = "SynthetischeLogquellenProbe";
        try (var applicationLogs = new ApplicationLogs()) {
            LoggerFactory.getLogger(EmbeddedPostgres.class).error(marker);
            assertThat(console.getAll()).contains(marker);
            assertThat(applicationLogs.output()).doesNotContain(marker);

            LoggerFactory.getLogger(RegistrationErrors.class).error(marker);
            assertThat(applicationLogs.output()).contains(marker);

            LoggerFactory.getLogger(org.springframework.jdbc.core.JdbcTemplate.class)
                .error("SynthetischeFrameworkProbe", new IllegalStateException("SynthetischeExceptionProbe"));
            assertThat(applicationLogs.output()).contains("SynthetischeFrameworkProbe", "SynthetischeExceptionProbe");
        }
    }

    @Test
    void rotationWiderrufUndApiNeustartErhaltenBereitsGespeicherteKonten() throws Exception {
        assertThat(register(TOKEN, "bleibt@example.org", PASSWORD).statusCode()).isEqualTo(201);
        String originalId = PostgresFixture.ADMIN.queryForObject("SELECT id::text FROM access.accounts", String.class);
        for (boolean enabled : new boolean[] {true, false}) {
            var app = new SpringApplication(TnbpApplication.class);
            app.setDefaultProperties(Map.of("server.port", "0", "spring.main.banner-mode", "off"));
            List<String> args = new ArrayList<>();
            PostgresFixture.configure((key, value) -> args.add("--" + key + "=" + value));
            args.add("--registration.link.enabled=" + enabled);
            args.add("--registration.link.sha256=" + RegistrationTest.sha256("b".repeat(43)));
            args.add("--registration.link.issued-at=" + Instant.now());
            try (var restarted = app.run(args.toArray(String[]::new))) {
                int restartedPort = Integer.parseInt(restarted.getEnvironment().getRequiredProperty("local.server.port"));
                assertThat(registerAt(restartedPort, TOKEN, "neu@example.org", PASSWORD).statusCode()).isEqualTo(400);
                var current = registerAt(restartedPort, "b".repeat(43), "rotierterlink@example.org", PASSWORD);
                assertThat(current.statusCode()).isEqualTo(enabled ? 201 : 400);
                assertThat(PostgresFixture.ADMIN.queryForObject("SELECT id::text FROM access.accounts WHERE email='bleibt@example.org'", String.class)).isEqualTo(originalId);
            }
        }
        assertThat(count()).isEqualTo(2);
    }

    @Test
    void fehlendeUndFrueherAbgelaufeneLinkkonfigurationSperrenHttpRegistrierung() throws Exception {
        for (boolean missing : new boolean[] {true, false}) {
            var app = new SpringApplication(TnbpApplication.class);
            List<String> args = new ArrayList<>(List.of("--server.port=0", "--spring.main.banner-mode=off"));
            PostgresFixture.configure((key, value) -> args.add("--" + key + "=" + value));
            if (!missing) {
                args.add("--registration.link.enabled=true");
                args.add("--registration.link.sha256=" + RegistrationTest.sha256(TOKEN));
                args.add("--registration.link.issued-at=" + Instant.now().minusSeconds(120));
                args.add("--registration.link.expires-at=" + Instant.now().minusSeconds(60));
            }
            try (var restarted = app.run(args.toArray(String[]::new))) {
                int restartedPort = Integer.parseInt(restarted.getEnvironment().getRequiredProperty("local.server.port"));
                var rejected = registerAt(restartedPort, TOKEN, "neu@example.org", PASSWORD);
                assertThat(rejected.statusCode()).isEqualTo(400);
                assertThat(rejected.body()).contains("REGISTRATION_FAILED").doesNotContain("email", "vorhanden");
                assertThat(count()).isZero();
            }
        }
    }

    @Test
    void fehlendeRlsForceRlsOderUeberzaehligesSchemaCreateVerhindernDenStart() {
        String[][] cases = {
            {"ALTER TABLE expenses.expenses DISABLE ROW LEVEL SECURITY", "ALTER TABLE expenses.expenses ENABLE ROW LEVEL SECURITY",
                "Die Finanzschemas benötigen minimale Laufzeitrechte und erzwungene RLS."},
            {"ALTER TABLE budget.budgets NO FORCE ROW LEVEL SECURITY", "ALTER TABLE budget.budgets FORCE ROW LEVEL SECURITY",
                "Die Finanzschemas benötigen minimale Laufzeitrechte und erzwungene RLS."},
            {"GRANT CREATE ON SCHEMA savings_goals TO tnbp_runtime", "REVOKE CREATE ON SCHEMA savings_goals FROM tnbp_runtime",
                "Die Laufzeitrolle darf weder privilegiert noch Tabellenbesitzer sein."}
        };
        for (String[] testCase : cases) {
            try {
                PostgresFixture.ADMIN.execute(testCase[0]);
                var app = new SpringApplication(TnbpApplication.class);
                List<String> args = new ArrayList<>(List.of("--server.port=0", "--spring.main.banner-mode=off"));
                PostgresFixture.configure((key, value) -> args.add("--" + key + "=" + value));
                org.assertj.core.api.Assertions.assertThatThrownBy(() -> {
                    try (var unexpected = app.run(args.toArray(String[]::new))) { /* Schließt einen irrtümlich erlaubten Start. */ }
                }).as(testCase[0]).isInstanceOf(IllegalStateException.class).hasStackTraceContaining(testCase[2]);
            } finally { PostgresFixture.ADMIN.execute(testCase[1]); }
        }
    }

    @Test
    void privilegierteUndBesitzendeLaufzeitrollenVerhindernDenStart() {
        PostgresFixture.ADMIN.execute("CREATE ROLE tnbp_budget_owner_test LOGIN PASSWORD 'budget-role-test-only' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE");
        try {
            PostgresFixture.ADMIN.execute("CREATE ROLE tnbp_budget_member_test LOGIN PASSWORD 'budget-role-test-only' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE");
            PostgresFixture.ADMIN.execute("CREATE TABLE budget.role_owner_probe (id INTEGER)");
            PostgresFixture.ADMIN.execute("ALTER TABLE budget.role_owner_probe OWNER TO tnbp_budget_owner_test");
            PostgresFixture.ADMIN.execute("GRANT tnbp_budget_owner_test TO tnbp_budget_member_test");
            PostgresFixture.ADMIN.execute("CREATE ROLE tnbp_savings_owner_test LOGIN PASSWORD 'budget-role-test-only' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE");
            PostgresFixture.ADMIN.execute("CREATE ROLE tnbp_savings_member_test LOGIN PASSWORD 'budget-role-test-only' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE");
            PostgresFixture.ADMIN.execute("CREATE TABLE savings_goals.role_owner_probe (id INTEGER)");
            PostgresFixture.ADMIN.execute("ALTER TABLE savings_goals.role_owner_probe OWNER TO tnbp_savings_owner_test");
            PostgresFixture.ADMIN.execute("GRANT tnbp_savings_owner_test TO tnbp_savings_member_test");
            for (String role : List.of("postgres", "tnbp_migrator", "tnbp_budget_owner_test", "tnbp_budget_member_test", "tnbp_savings_owner_test", "tnbp_savings_member_test")) {
                var app = new SpringApplication(TnbpApplication.class);
                List<String> args = new ArrayList<>(List.of("--server.port=0", "--spring.main.banner-mode=off"));
                PostgresFixture.configure((key, value) -> {
                    String setting = switch (key) {
                        case "spring.datasource.username" -> role;
                        case "spring.datasource.password" -> switch (role) {
                            case "postgres" -> "postgres";
                            case "tnbp_migrator" -> "migration-test-only";
                            default -> "budget-role-test-only";
                        };
                        default -> value;
                    };
                    args.add("--" + key + "=" + setting);
                });
                org.assertj.core.api.Assertions.assertThatThrownBy(() -> {
                    try (var unexpected = app.run(args.toArray(String[]::new))) { /* Schließt einen irrtümlich erlaubten Start. */ }
                }).isInstanceOf(IllegalStateException.class)
                    .hasStackTraceContaining("Die Laufzeitrolle darf weder privilegiert noch Tabellenbesitzer sein.");
            }
        } finally {
            PostgresFixture.ADMIN.execute("DROP TABLE IF EXISTS savings_goals.role_owner_probe");
            PostgresFixture.ADMIN.execute("DROP ROLE IF EXISTS tnbp_savings_member_test");
            PostgresFixture.ADMIN.execute("DROP ROLE IF EXISTS tnbp_savings_owner_test");
            PostgresFixture.ADMIN.execute("DROP TABLE IF EXISTS budget.role_owner_probe");
            PostgresFixture.ADMIN.execute("DROP ROLE IF EXISTS tnbp_budget_member_test");
            PostgresFixture.ADMIN.execute("DROP ROLE tnbp_budget_owner_test");
        }
    }

    /** Erfasst Anwendungs- und Frameworklogs; PostgreSQL-Prozesslogs bleiben getrennt. */
    static final class ApplicationLogs extends AppenderBase<ILoggingEvent> implements AutoCloseable {
        private final Logger root = (Logger) LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME);
        private final StringBuilder messages = new StringBuilder();

        ApplicationLogs() {
            setContext(root.getLoggerContext());
            start();
            root.addAppender(this);
        }

        @Override
        protected void append(ILoggingEvent event) {
            if (event.getLoggerName().startsWith("io.zonky.test.db.postgres.embedded.")) return;
            messages.append(event.getFormattedMessage()).append('\n');
            if (event.getThrowableProxy() != null) {
                messages.append(ThrowableProxyUtil.asString(event.getThrowableProxy()));
            }
        }

        synchronized String output() {
            return messages.toString();
        }

        @Override
        public void close() {
            root.detachAppender(this);
            stop();
        }
    }

    static final class MutableClock extends Clock {
        volatile Instant now;
        MutableClock(Instant now) { this.now = now; }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }
}

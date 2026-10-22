package de.linus.tnbp.access;

import static org.assertj.core.api.Assertions.*;
import java.net.URI;
import java.net.http.*;
import java.time.Clock;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SessionIT {
    static final RegistrationIT.MutableClock CLOCK = new RegistrationIT.MutableClock(SessionTest.NOW);
    static final String ORIGIN = "https://localhost:4200";
    static final String PASSWORD = "  Grüner 🦊 im Baum  ";
    static final JsonMapper JSON = JsonMapper.builder().build();
    @LocalServerPort int port;
    @Autowired PasswordEncoder encoder;
    UUID user;
    @DynamicPropertySource static void settings(DynamicPropertyRegistry registry) {
        PostgresFixture.configure((key, value) -> registry.add(key, () -> value));
        registry.add("access.session.signing-key", () -> SessionTest.KEY_TEXT);
        registry.add("access.session.issuer", () -> "test-issuer");
        registry.add("access.session.audience", () -> "test-audience");
        registry.add("access.session.origin", () -> ORIGIN);
    }
    @TestConfiguration static class Time {
        @Bean @Primary Clock sessionClock() { return CLOCK; }
    }
    @BeforeEach void reset() {
        PostgresFixture.ADMIN.execute("TRUNCATE access.accounts CASCADE");
        CLOCK.now = SessionTest.NOW;
        user = UUID.randomUUID();
        PostgresFixture.ADMIN.update("INSERT INTO access.accounts VALUES (?, ?, ?, ?)", user, "person@example.org", encoder.encode(PASSWORD), CLOCK.now.atOffset(java.time.ZoneOffset.UTC));
    }

    final class Browser {
        int destination = port;
        String csrfCookie = "", csrf = "", refreshCookie = "";
        String access;
        Browser() throws Exception { loadCsrf(); }
        void loadCsrf() throws Exception {
            var response = get("csrf", null);
            csrf = JSON.readTree(response.body()).get("token").asString();
            String nextCookie = cookie(response, "__Host-tnbp-csrf");
            if (!nextCookie.isEmpty()) csrfCookie = nextCookie;
            assertThat(response.headers().firstValue("Cache-Control")).hasValue("no-store");
        }
        HttpResponse<String> login(String email, String password) throws Exception {
            return mutation("login", JSON.writeValueAsString(Map.of("email", email, "password", password)), ORIGIN, csrf, true);
        }
        HttpResponse<String> post(String action) throws Exception { return mutation(action, "", ORIGIN, csrf, true); }
        HttpResponse<String> mutation(String action, String body, String origin, String header, boolean updateCookie) throws Exception {
            var request = HttpRequest.newBuilder(URI.create("http://localhost:" + destination + "/api/v1/access/" + action))
                .header("Content-Type", "application/json").header("Cookie", csrfCookie + "; " + refreshCookie);
            if (origin != null) request.header("Origin", origin);
            if (header != null) request.header("X-CSRF-TOKEN", header);
            var response = HttpClient.newHttpClient().send(request.POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
            if (updateCookie) {
                String next = cookie(response, SessionHttp.COOKIE);
                if (!next.isEmpty()) refreshCookie = next;
                if (response.statusCode() == 200) access = JSON.readTree(response.body()).path("accessToken").asString();
            }
            return response;
        }
        HttpResponse<String> get(String path, String bearer) throws Exception {
            var request = HttpRequest.newBuilder(URI.create("http://localhost:" + destination + "/api/v1/access/" + path)).GET();
            if (!csrfCookie.isEmpty()) request.header("Cookie", csrfCookie);
            if (bearer != null) request.header("Authorization", "Bearer " + bearer);
            return HttpClient.newHttpClient().send(request.build(), HttpResponse.BodyHandlers.ofString());
        }
    }
    static String cookie(HttpResponse<?> response, String name) {
        return response.headers().allValues("Set-Cookie").stream().filter(value -> value.startsWith(name + "="))
            .map(value -> value.split(";", 2)[0]).findFirst().orElse("");
    }
    Browser loggedIn() throws Exception {
        var browser = new Browser(); assertThat(browser.login(" Person@Example.Org ", PASSWORD).statusCode()).isEqualTo(200); return browser;
    }

    @Test void loginCookieIdentitaetNormalisierungUndNeutraleFehler() throws Exception {
        var browser = new Browser();
        var wrong = browser.login("person@example.org", PASSWORD.strip());
        assertThat(wrong.statusCode()).isEqualTo(401);
        assertThat(wrong.body()).isEqualTo(browser.login("unbekannt@example.org", PASSWORD).body());
        var response = browser.login(" Person@Example.Org ", PASSWORD);
        assertThat(response.statusCode()).isEqualTo(200);
        String setCookie = response.headers().firstValue("Set-Cookie").orElseThrow();
        assertThat(setCookie).contains("__Host-tnbp-refresh=", "Secure", "HttpOnly", "SameSite=Strict", "Path=/").doesNotContain("Domain=");
        assertThat(response.headers().firstValue("Cache-Control")).hasValue("no-store");
        assertThat(JSON.readTree(browser.get("me", browser.access).body()).get("userId").asString()).isEqualTo(user.toString());
        assertThat(browser.get("me", null).statusCode()).isEqualTo(401);
        String raw = browser.refreshCookie.split("=", 2)[1];
        assertThat(Base64.getUrlDecoder().decode(raw)).hasSize(32);
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT token_hash FROM access.refresh_tokens", String.class)).isEqualTo(SessionService.hash(raw)).doesNotContain(raw);
    }

    @Test void nfcWirdOhneTrimmenOderAbschneidenGeprueft() throws Exception {
        PostgresFixture.ADMIN.update("UPDATE access.accounts SET password_hash = ?", encoder.encode("é".repeat(15)));
        var browser = new Browser();
        assertThat(browser.login("person@example.org", "e\u0301".repeat(15)).statusCode()).isEqualTo(200);
        assertThat(browser.login("person@example.org", "é".repeat(15) + "x").statusCode()).isEqualTo(401);
    }

    @Test void rotationReplayUndLogoutWiderrufenDauerhaftAberNichtAccessJwt() throws Exception {
        var browser = loggedIn(); String original = browser.refreshCookie;
        assertThat(browser.post("refresh").statusCode()).isEqualTo(200);
        String next = browser.refreshCookie;
        assertThat(next).isNotEqualTo(original);
        browser.refreshCookie = original;
        var replay = browser.post("refresh");
        assertThat(replay.statusCode()).isEqualTo(401);
        assertThat(replay.headers().allValues("Set-Cookie")).anyMatch(value -> value.contains("Max-Age=0"));
        browser.refreshCookie = next;
        assertThat(browser.post("refresh").statusCode()).isEqualTo(401);
        assertThat(browser.get("me", browser.access).statusCode()).isEqualTo(200);
        CLOCK.now = SessionTest.NOW.plusSeconds(600);
        assertThat(browser.get("me", browser.access).statusCode()).isEqualTo(401);
        CLOCK.now = SessionTest.NOW;
        browser = loggedIn(); String access = browser.access; String logoutCookie = browser.refreshCookie;
        assertThat(browser.post("logout").statusCode()).isEqualTo(204);
        browser.refreshCookie = logoutCookie;
        assertThat(browser.post("refresh").statusCode()).isEqualTo(401);
        assertThat(browser.get("me", access).statusCode()).isEqualTo(200);
    }

    @Test void inaktivitaetsUndAbsoluteGrenzenSindExklusiv() throws Exception {
        var browser = loggedIn();
        CLOCK.now = SessionTest.NOW.plus(Duration.ofDays(30)).minusSeconds(1);
        assertThat(browser.post("refresh").statusCode()).isEqualTo(200);
        CLOCK.now = CLOCK.now.plus(Duration.ofDays(30));
        assertThat(browser.post("refresh").statusCode()).isEqualTo(401);
        CLOCK.now = SessionTest.NOW; browser = loggedIn();
        for (int days : new int[] {29, 58, 87}) {
            CLOCK.now = SessionTest.NOW.plus(Duration.ofDays(days));
            assertThat(browser.post("refresh").statusCode()).isEqualTo(200);
        }
        CLOCK.now = SessionTest.NOW.plus(Duration.ofDays(90));
        assertThat(browser.post("refresh").statusCode()).isEqualTo(401);
    }

    @Test void csrfUndOriginBlockierenAlleMutationenOhneZustandsaenderung() throws Exception {
        var browser = loggedIn();
        String body = JSON.writeValueAsString(Map.of("email", "person@example.org", "password", PASSWORD));
        for (String action : List.of("login", "refresh", "logout")) {
            for (String origin : Arrays.asList(null, "https://boese.example", ORIGIN + "/", ORIGIN)) {
                String csrf = ORIGIN.equals(origin) ? null : browser.csrf;
                assertThat(browser.mutation(action, body, origin, csrf, false).statusCode()).isEqualTo(403);
            }
            assertThat(browser.mutation(action, body, ORIGIN, "falsch", false).statusCode()).isEqualTo(403);
        }
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT count(*) FROM access.session_families", Integer.class)).isEqualTo(1);
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT revoked FROM access.session_families", Boolean.class)).isFalse();
        assertThat(browser.post("refresh").statusCode()).isEqualTo(200);
    }

    @Test void parallelesRefreshWiderruftAuchDenBereitsErzeugtenNachfolger() throws Exception {
        var browser = loggedIn();
        try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
            var one = pool.submit(() -> browser.mutation("refresh", "", ORIGIN, browser.csrf, false));
            var two = pool.submit(() -> browser.mutation("refresh", "", ORIGIN, browser.csrf, false));
            var results = List.of(one.get(), two.get());
            assertThat(results).extracting(HttpResponse::statusCode).containsExactlyInAnyOrder(200, 401);
            browser.refreshCookie = results.stream().filter(result -> result.statusCode() == 200).map(result -> cookie(result, SessionHttp.COOKIE)).findFirst().orElseThrow();
            assertThat(browser.post("refresh").statusCode()).isEqualTo(401);
        }
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT revoked FROM access.session_families", Boolean.class)).isTrue();
    }

    @Test void commitFehlerBestaetigtWederLoginNochRotation() throws Exception {
        var browser = loggedIn(); String oldCookie = browser.refreshCookie;
        PostgresFixture.ADMIN.execute("CREATE FUNCTION access.reject_session_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SynthetischesGeheimnis'; RETURN NEW; END $$");
        PostgresFixture.ADMIN.execute("CREATE CONSTRAINT TRIGGER reject_session_commit AFTER INSERT ON access.refresh_tokens DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION access.reject_session_commit()");
        try {
            for (String action : List.of("login", "refresh")) {
                var result = action.equals("login") ? browser.login("person@example.org", PASSWORD) : browser.post(action);
                assertThat(result.statusCode()).isEqualTo(500);
                assertThat(result.body()).doesNotContain("SynthetischesGeheimnis", PASSWORD, "accessToken");
                assertThat(cookie(result, SessionHttp.COOKIE)).isEmpty();
            }
        } finally {
            PostgresFixture.ADMIN.execute("DROP TRIGGER reject_session_commit ON access.refresh_tokens");
            PostgresFixture.ADMIN.execute("DROP FUNCTION access.reject_session_commit()");
        }
        assertThat(browser.refreshCookie).isEqualTo(oldCookie);
        assertThat(browser.post("refresh").statusCode()).isEqualTo(200);
    }

    @Test void replayAntwortKommtErstNachBestaetigtemWiderruf() throws Exception {
        var browser = loggedIn(); String original = browser.refreshCookie;
        assertThat(browser.post("refresh").statusCode()).isEqualTo(200);
        String successor = browser.refreshCookie;
        PostgresFixture.ADMIN.execute("CREATE FUNCTION access.reject_revoke_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'GeheimerWiderruffehler'; RETURN NEW; END $$");
        PostgresFixture.ADMIN.execute("CREATE CONSTRAINT TRIGGER reject_revoke_commit AFTER UPDATE ON access.session_families DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (NEW.revoked) EXECUTE FUNCTION access.reject_revoke_commit()");
        try {
            browser.refreshCookie = original;
            var result = browser.post("refresh");
            assertThat(result.statusCode()).isEqualTo(500);
            assertThat(result.body()).doesNotContain("GeheimerWiderruffehler");
            assertThat(PostgresFixture.ADMIN.queryForObject("SELECT revoked FROM access.session_families", Boolean.class)).isFalse();
        } finally {
            PostgresFixture.ADMIN.execute("DROP TRIGGER reject_revoke_commit ON access.session_families");
            PostgresFixture.ADMIN.execute("DROP FUNCTION access.reject_revoke_commit()");
        }
        assertThat(browser.post("refresh").statusCode()).isEqualTo(401);
        browser.refreshCookie = successor;
        assertThat(browser.post("refresh").statusCode()).isEqualTo(401);
    }

    @Test void externerSchluesselUndRefreshUeberlebenApiNeustart() throws Exception {
        // Beide API-Instanzen erhalten dieselbe kontrollierte, noch gültige Zeit.
        CLOCK.now = java.time.Instant.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
        var browser = loggedIn();
        String preRestartJwt = browser.access;
        var app = new SpringApplication(de.linus.tnbp.TnbpApplication.class, Time.class);
        var args = new ArrayList<>(List.of("--server.port=0", "--access.session.signing-key=" + SessionTest.KEY_TEXT,
            "--access.session.issuer=test-issuer", "--access.session.audience=test-audience", "--access.session.origin=" + ORIGIN));
        PostgresFixture.configure((key, value) -> args.add("--" + key + "=" + value));
        try (var restarted = app.run(args.toArray(String[]::new))) {
            browser.destination = Integer.parseInt(restarted.getEnvironment().getRequiredProperty("local.server.port"));
            assertThat(browser.get("me", preRestartJwt).statusCode()).isEqualTo(200);
            assertThat(JSON.readTree(browser.get("me", preRestartJwt).body()).get("userId").asString()).isEqualTo(user.toString());
            browser.loadCsrf();
            assertThat(browser.post("refresh").statusCode()).isEqualTo(200);
            assertThat(browser.get("me", browser.access).statusCode()).isEqualTo(200);
        }
    }

    @Test void kontowechselWiderruftDieVorherigeFamilieUndBestaetigtNeueIdentitaet() throws Exception {
        var browser = loggedIn(); String oldCookie = browser.refreshCookie;
        UUID replacement = UUID.randomUUID();
        PostgresFixture.ADMIN.update("INSERT INTO access.accounts VALUES (?, ?, ?, ?)", replacement,
            "andere@example.org", encoder.encode(PASSWORD), CLOCK.now.atOffset(java.time.ZoneOffset.UTC));
        assertThat(browser.login("andere@example.org", PASSWORD).statusCode()).isEqualTo(200);
        String newCookie = browser.refreshCookie;
        assertThat(JSON.readTree(browser.get("me", browser.access).body()).get("userId").asString()).isEqualTo(replacement.toString());
        browser.refreshCookie = oldCookie;
        assertThat(browser.post("refresh").statusCode()).isEqualTo(401);
        browser.refreshCookie = newCookie;
        assertThat(browser.post("refresh").statusCode()).isEqualTo(200);
        assertThat(JSON.readTree(browser.get("me", browser.access).body()).get("userId").asString()).isEqualTo(replacement.toString());
    }

    @Test void fehlendeSitzungskonfigurationMeldet503VorDerOriginPruefung() throws Exception {
        var app = new SpringApplication(de.linus.tnbp.TnbpApplication.class);
        var args = new ArrayList<>(List.of("--server.port=0", "--access.session.signing-key=" + SessionTest.KEY_TEXT,
            "--access.session.issuer=test-issuer", "--access.session.audience=test-audience", "--access.session.origin="));
        PostgresFixture.configure((key, value) -> args.add("--" + key + "=" + value));
        try (var incomplete = app.run(args.toArray(String[]::new))) {
            int destination = Integer.parseInt(incomplete.getEnvironment().getRequiredProperty("local.server.port"));
            for (String action : List.of("login", "refresh", "logout")) {
                var request = HttpRequest.newBuilder(URI.create("http://localhost:" + destination + "/api/v1/access/" + action))
                    .header("Origin", "https://fremd.example").POST(HttpRequest.BodyPublishers.noBody()).build();
                var response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
                assertThat(response.statusCode()).isEqualTo(503);
                assertThat(response.body()).contains("SESSION_UNAVAILABLE");
                assertThat(JSON.readTree(response.body()).get("message").asString()).contains("bestätigt");
                assertThat(response.headers().firstValue("Cache-Control")).hasValue("no-store");
            }
        }
        // Dieselbe verbotene Origin bleibt bei vollständiger Konfiguration ein 403.
        var configured = new Browser();
        assertThat(configured.mutation("logout", "", "https://fremd.example", configured.csrf, false).statusCode()).isEqualTo(403);
    }

    @Test void bearerIdentitaetspruefungVerwirftKeinenCsrfHandshake() throws Exception {
        var browser = loggedIn();
        browser.loadCsrf();
        var identity = browser.get("me", browser.access);
        assertThat(identity.statusCode()).isEqualTo(200);
        assertThat(cookie(identity, "__Host-tnbp-csrf")).isEmpty();
        assertThat(browser.post("refresh").statusCode()).isEqualTo(200);
    }

    @Test void laufzeitrechteErlaubenKeineLoeschungOderHashAenderung() {
        var runtime = new org.springframework.jdbc.core.JdbcTemplate(new org.springframework.jdbc.datasource.DriverManagerDataSource(PostgresFixture.URL, "tnbp_runtime", "runtime-test-only"));
        assertThatThrownBy(() -> runtime.execute("DELETE FROM access.refresh_tokens")).isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThatThrownBy(() -> runtime.execute("UPDATE access.accounts SET password_hash='kaputt'")).isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThatThrownBy(() -> runtime.execute("TRUNCATE access.session_families CASCADE")).isInstanceOf(org.springframework.dao.DataAccessException.class);
    }
}

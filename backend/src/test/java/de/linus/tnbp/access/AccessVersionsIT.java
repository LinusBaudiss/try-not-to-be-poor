package de.linus.tnbp.access;

import static org.assertj.core.api.Assertions.assertThat;

import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import de.linus.tnbp.TnbpApplication;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/** Zusätzliche Nachweise für den gemeinsamen Bestand und die Adaptergrenzen. */
@SpringBootTest(classes = {TnbpApplication.class, SessionIT.Time.class},
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AccessVersionsIT {
    @LocalServerPort int port;
    @Autowired PasswordEncoder encoder;
    private final SessionIT fixture = new SessionIT();

    @DynamicPropertySource static void settings(DynamicPropertyRegistry registry) {
        SessionIT.settings(registry);
        registry.add("registration.link.enabled", () -> "true");
        registry.add("registration.link.sha256", () -> SessionService.hash(RegistrationIT.TOKEN));
        registry.add("registration.link.issued-at", () -> SessionTest.NOW.toString());
    }

    @BeforeEach void reset() {
        fixture.port = port;
        fixture.encoder = encoder;
        fixture.reset();
    }

    SessionIT.Browser browser(String version) throws Exception {
        var browser = fixture.new Browser();
        browser.apiVersion = version;
        browser.loadCsrf();
        return browser;
    }

    @Test void kontoanlageUndIdentitaetNutzenInBeidenRichtungenDenselbenBestand() throws Exception {
        for (String version : List.of("v1", "v2")) {
            String email = version + "@example.org";
            var registration = HttpClient.newHttpClient().send(HttpRequest.newBuilder(
                    URI.create("http://localhost:" + port + "/api/" + version + "/access/registrations"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(SessionIT.JSON.writeValueAsString(Map.of(
                    "registrationToken", RegistrationIT.TOKEN, "email", email, "password", SessionIT.PASSWORD))))
                .build(), HttpResponse.BodyHandlers.ofString());
            assertThat(registration.statusCode()).isEqualTo(201);
            assertThat(registration.headers().allValues("Set-Cookie")).isEmpty();
            if (version.equals("v2")) assertThat(registration.headers().firstValue("Cache-Control")).hasValue("no-store");
            String id = PostgresFixture.ADMIN.queryForObject("SELECT id::text FROM access.accounts WHERE email = ?", String.class, email);
            var browser = browser(other(version));
            var login = browser.login(email, SessionIT.PASSWORD);
            assertThat(login.statusCode()).isEqualTo(200);
            assertThat(SessionIT.JSON.readTree(login.body()).get("userId").asString()).isEqualTo(id);
            assertThat(java.time.OffsetDateTime.parse(SessionIT.JSON.readTree(login.body()).get("expiresAt").asString()).toInstant())
                .isEqualTo(SessionTest.NOW.plusSeconds(600));
            for (String identityVersion : List.of("v1", "v2")) {
                browser.apiVersion = identityVersion;
                assertThat(browser.get("me", browser.access).statusCode()).isEqualTo(200);
                assertThat(SessionIT.JSON.readTree(browser.get("me", browser.access).body()).get("userId").asString()).isEqualTo(id);
            }
        }
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT count(*) FROM access.accounts", Integer.class)).isEqualTo(3);
    }

    @Test void rotationUndReplayWiderrufenVersionsuebergreifendDieGemeinsameFamilie() throws Exception {
        for (String version : List.of("v1", "v2")) {
            var browser = browser(version);
            assertThat(browser.login("person@example.org", SessionIT.PASSWORD).statusCode()).isEqualTo(200);
            String original = browser.refreshCookie;
            browser.apiVersion = other(version);
            assertThat(browser.post("refresh").statusCode()).isEqualTo(200);
            String successor = browser.refreshCookie;
            assertThat(successor).isNotEqualTo(original);
            browser.apiVersion = version;
            browser.refreshCookie = original;
            assertThat(browser.post("refresh").statusCode()).isEqualTo(401);
            browser.apiVersion = other(version);
            browser.refreshCookie = successor;
            assertThat(browser.post("refresh").statusCode()).isEqualTo(401);
        }
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT count(*) FROM access.session_families WHERE NOT revoked", Integer.class)).isZero();
    }

    @Test void parallelerRefreshDurchBeideAdapterWiderruftAuchDenNachfolger() throws Exception {
        var one = browser("v1");
        assertThat(one.login("person@example.org", SessionIT.PASSWORD).statusCode()).isEqualTo(200);
        var two = browser("v2");
        two.csrfCookie = one.csrfCookie;
        two.csrf = one.csrf;
        two.refreshCookie = one.refreshCookie;
        try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
            var first = pool.submit(() -> one.mutation("refresh", "", SessionIT.ORIGIN, one.csrf, false));
            var second = pool.submit(() -> two.mutation("refresh", "", SessionIT.ORIGIN, two.csrf, false));
            var results = List.of(first.get(), second.get());
            assertThat(results).extracting(HttpResponse::statusCode).containsExactlyInAnyOrder(200, 401);
            String successor = results.stream().filter(response -> response.statusCode() == 200)
                .map(response -> SessionIT.cookie(response, SessionHttp.COOKIE)).findFirst().orElseThrow();
            for (var browser : List.of(one, two)) {
                browser.refreshCookie = successor;
                assertThat(browser.post("refresh").statusCode()).isEqualTo(401);
            }
        }
    }

    @Test void logoutWiderruftBeideAdapterAberAccessBleibtBisZurExklusivenGrenzeGueltig() throws Exception {
        for (String version : List.of("v1", "v2")) {
            var browser = browser(version);
            assertThat(browser.login("person@example.org", SessionIT.PASSWORD).statusCode()).isEqualTo(200);
            String refresh = browser.refreshCookie;
            browser.apiVersion = other(version);
            var logout = browser.post("logout");
            assertThat(logout.statusCode()).isEqualTo(204);
            assertThat(SessionIT.cookie(logout, SessionHttp.COOKIE)).isEqualTo(SessionHttp.COOKIE + "=");
            assertThat(logout.headers().allValues("Set-Cookie")).anyMatch(value -> value.contains("Max-Age=0"));
            for (String nextVersion : List.of("v1", "v2")) {
                browser.apiVersion = nextVersion;
                browser.refreshCookie = refresh;
                assertThat(browser.post("refresh").statusCode()).isEqualTo(401);
                assertThat(browser.get("me", browser.access).statusCode()).isEqualTo(200);
                SessionIT.CLOCK.now = SessionTest.NOW.plusSeconds(600);
                assertThat(browser.get("me", browser.access).statusCode()).isEqualTo(401);
                SessionIT.CLOCK.now = SessionTest.NOW;
            }
        }
    }

    @Test void logoutOhneOderMitUnbekanntemRefreshCookieBleibtIdempotent() throws Exception {
        for (String version : List.of("v1", "v2")) {
            var browser = browser(version);
            for (String refresh : List.of("", SessionHttp.COOKIE + "=" + "x".repeat(43))) {
                browser.refreshCookie = refresh;
                var logout = browser.post("logout");
                assertThat(logout.statusCode()).isEqualTo(204);
                assertThat(logout.body()).isEmpty();
                assertThat(logout.headers().firstValue("Cache-Control")).hasValue("no-store");
                assertThat(SessionIT.cookie(logout, SessionHttp.COOKIE)).isEqualTo(SessionHttp.COOKIE + "=");
                assertThat(logout.headers().allValues("Set-Cookie")).anyMatch(value -> value.contains("Max-Age=0"));
            }
        }
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT count(*) FROM access.session_families", Integer.class)).isZero();
    }

    @Test void logoutCommitfehlerBestaetigtKeinenWiderrufUndLoeschtKeinCookie() throws Exception {
        var browser = browser("v1");
        assertThat(browser.login("person@example.org", SessionIT.PASSWORD).statusCode()).isEqualTo(200);
        String refresh = browser.refreshCookie;
        browser.apiVersion = "v2";
        PostgresFixture.ADMIN.execute("CREATE FUNCTION access.reject_logout_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'GeheimerLogoutfehler'; RETURN NEW; END $$");
        PostgresFixture.ADMIN.execute("CREATE CONSTRAINT TRIGGER reject_logout_commit AFTER UPDATE ON access.session_families DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (NEW.revoked) EXECUTE FUNCTION access.reject_logout_commit()");
        try (var applicationLogs = new RegistrationIT.ApplicationLogs()) {
            var result = browser.post("logout");
            assertThat(result.statusCode()).isEqualTo(500);
            assertThat(result.headers().firstValue("Cache-Control")).hasValue("no-store");
            assertThat(result.body()).contains("SESSION_UNAVAILABLE").doesNotContain("GeheimerLogoutfehler", SessionIT.PASSWORD, "accessToken");
            assertThat(SessionIT.cookie(result, SessionHttp.COOKIE)).isEmpty();
            assertThat(applicationLogs.output()).contains("Fehlerkategorie=ANWENDUNG")
                .doesNotContain("GeheimerLogoutfehler", SessionIT.PASSWORD, refresh, browser.access);
            assertThat(PostgresFixture.ADMIN.queryForObject("SELECT revoked FROM access.session_families", Boolean.class)).isFalse();
        } finally {
            PostgresFixture.ADMIN.execute("DROP TRIGGER reject_logout_commit ON access.session_families");
            PostgresFixture.ADMIN.execute("DROP FUNCTION access.reject_logout_commit()");
        }
        browser.apiVersion = "v1";
        assertThat(browser.refreshCookie).isEqualTo(refresh);
        assertThat(browser.post("refresh").statusCode()).isEqualTo(200);
    }

    @Test void identitaetLehntNurCookiesUndManipulierteJwtClaimsAb() throws Exception {
        var browser = browser("v2");
        assertThat(browser.login("person@example.org", SessionIT.PASSWORD).statusCode()).isEqualTo(200);
        var cookiesOnly = HttpClient.newHttpClient().send(HttpRequest.newBuilder(
                URI.create("http://localhost:" + port + "/api/v2/access/me"))
            .header("Cookie", browser.csrfCookie + "; " + browser.refreshCookie).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(cookiesOnly.statusCode()).isEqualTo(401);
        var claims = SignedJWT.parse(browser.access).getJWTClaimsSet();
        List<JWTClaimsSet> invalid = new ArrayList<>(List.of(
            new JWTClaimsSet.Builder(claims).issuer("fremd").build(),
            new JWTClaimsSet.Builder(claims).audience("fremd").build(),
            new JWTClaimsSet.Builder(claims).subject("fremd").build(),
            new JWTClaimsSet.Builder(claims).subject("1-1-1-1-1").build(),
            new JWTClaimsSet.Builder(claims).issueTime(Date.from(SessionTest.NOW.plusSeconds(1))).build(),
            new JWTClaimsSet.Builder(claims).notBeforeTime(Date.from(SessionTest.NOW.plusSeconds(1))).build(),
            new JWTClaimsSet.Builder(claims).expirationTime(Date.from(SessionTest.NOW)).build(),
            new JWTClaimsSet.Builder(claims).expirationTime(Date.from(SessionTest.NOW.plusSeconds(601))).build(),
            new JWTClaimsSet.Builder(claims).claim("exp", null).build()));
        byte[] key = Base64.getDecoder().decode(SessionTest.KEY_TEXT);
        List<String> tokens = new ArrayList<>(List.of("kaputt"));
        for (var claim : invalid) tokens.add(sign(claim, JWSAlgorithm.HS256, key));
        byte[] wrongKey = key.clone();
        wrongKey[0] = 1;
        tokens.add(sign(claims, JWSAlgorithm.HS256, wrongKey));
        tokens.add(sign(claims, JWSAlgorithm.HS384, new byte[64]));
        for (String token : tokens) {
            var result = browser.get("me", token);
            assertThat(result.statusCode()).isEqualTo(401);
            assertThat(result.headers().firstValue("Cache-Control")).hasValue("no-store");
            assertThat(result.body()).contains("SESSION_REJECTED").doesNotContain(token, fixture.user.toString());
        }
        assertThat(browser.get("me", browser.access).statusCode()).isEqualTo(200);
    }

    @Test void unbekannteRoutenUndFalscheMethodenBleibenAuchMitJwtGesperrt() throws Exception {
        var browser = browser("v2");
        assertThat(browser.login("person@example.org", SessionIT.PASSWORD).statusCode()).isEqualTo(200);
        for (String route : List.of("/api/v2/access/accounts", "/api/v2/access/login/extra", "/api/v2/expense-budget/budget", "/api/v2/savings-goals")) {
            for (boolean authenticated : List.of(false, true)) {
                var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + route)).GET();
                if (authenticated) request.header("Authorization", "Bearer " + browser.access);
                var result = HttpClient.newHttpClient().send(request.build(), HttpResponse.BodyHandlers.ofString());
                assertThat(result.statusCode()).isEqualTo(403);
                assertThat(result.headers().firstValue("Cache-Control")).hasValue("no-store");
            }
        }
        assertThat(browser.get("login", browser.access).statusCode()).isEqualTo(403);
        assertThat(browser.mutation("me", "", SessionIT.ORIGIN, browser.csrf, false).statusCode()).isEqualTo(401);
        var wrongMethod = HttpClient.newHttpClient().send(HttpRequest.newBuilder(
                URI.create("http://localhost:" + port + "/api/v2/access/me"))
            .header("Authorization", "Bearer " + browser.access)
            .header("Cookie", browser.csrfCookie).header("X-CSRF-TOKEN", browser.csrf)
            .header("Origin", SessionIT.ORIGIN).POST(HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(wrongMethod.statusCode()).isEqualTo(403);
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT count(*) FROM access.session_families", Integer.class)).isEqualTo(1);
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT revoked FROM access.session_families", Boolean.class)).isFalse();
    }

    private static String other(String version) { return version.equals("v1") ? "v2" : "v1"; }

    private static String sign(JWTClaimsSet claims, JWSAlgorithm algorithm, byte[] key) throws Exception {
        var jwt = new SignedJWT(new JWSHeader.Builder(algorithm).type(JOSEObjectType.JWT).build(), claims);
        jwt.sign(new MACSigner(key));
        return jwt.serialize();
    }
}

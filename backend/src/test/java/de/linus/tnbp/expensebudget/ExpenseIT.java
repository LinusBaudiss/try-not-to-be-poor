package de.linus.tnbp.expensebudget;

import static org.assertj.core.api.Assertions.*;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.*;
import de.linus.tnbp.access.PostgresFixture;
import de.linus.tnbp.finance.FinanceApplication;
import de.linus.tnbp.shared.Money;
import de.linus.tnbp.expenses.Expenses;
import java.net.URI;
import java.net.http.*;
import java.sql.Connection;
import java.time.*;
import java.util.*;
import javax.sql.DataSource;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ExtendWith(OutputCaptureExtension.class)
class ExpenseIT {
    static final Instant NOW = Instant.parse("2026-10-23T10:00:00Z");
    static final byte[] KEY = new byte[32];
    static final MutableClock CLOCK = new MutableClock(NOW);
    static final JsonMapper JSON = JsonMapper.builder().build();
    String path() { return "/api/v1/expense-budget/expenses"; }
    @LocalServerPort int port;
    @Autowired DataSource source;
    @Autowired JdbcTemplate jdbc;
    @Autowired FinanceApplication service;
    @Autowired FinanceApplication budgets;
    @Autowired FinanceApplication summaries;
    UUID first, second;

    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        PostgresFixture.configure((key, value) -> registry.add(key, () -> value));
        registry.add("access.session.signing-key", () -> Base64.getEncoder().encodeToString(KEY));
        registry.add("access.session.issuer", () -> "expense-test");
        registry.add("access.session.audience", () -> "expense-spa");
        registry.add("access.session.origin", () -> "https://localhost:4200");
    }
    @TestConfiguration static class Time {
        @Bean @Primary Clock expenseClock() { return CLOCK; }
    }
    static final class MutableClock extends Clock {
        volatile Instant now;
        MutableClock(Instant now) { this.now = now; }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(now, zone); }
        @Override public Instant instant() { return now; }
    }
    @BeforeEach void reset() {
        PostgresFixture.ADMIN.execute("TRUNCATE access.accounts CASCADE");
        CLOCK.now = NOW;
        first = UUID.randomUUID(); second = UUID.randomUUID();
        for (UUID user : List.of(first, second)) PostgresFixture.ADMIN.update(
            "INSERT INTO access.accounts VALUES (?, ?, ?, ?)", user, user + "@example.org", "$argon2id$synthetic", NOW.atOffset(ZoneOffset.UTC));
    }
    String token(UUID user) throws Exception {
        return sign(new JWTClaimsSet.Builder().issuer("expense-test").audience("expense-spa").subject(user.toString())
            .issueTime(Date.from(CLOCK.now)).notBeforeTime(Date.from(CLOCK.now)).expirationTime(Date.from(CLOCK.now.plusSeconds(600))).build(), KEY);
    }
    String sign(JWTClaimsSet claims, byte[] key) throws Exception {
        var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(new MACSigner(key)); return jwt.serialize();
    }
    HttpResponse<String> call(String method, String body, String bearer) throws Exception {
        return call(method, body, bearer, "");
    }
    HttpResponse<String> call(String method, String body, String bearer, String query) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path() + query));
        if (bearer != null) request.header("Authorization", "Bearer " + bearer);
        if (body != null) request.header("Content-Type", "application/json");
        // Ein fremder Eigentümerheader wird niemals zur Autorisierung verwendet.
        request.header("X-User-Id", second.toString());
        var response = HttpClient.newHttpClient().send(request.method(method, body == null ? HttpRequest.BodyPublishers.noBody()
            : HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.headers().firstValue("Cache-Control")).hasValue("no-store");
        return response;
    }
    HttpResponse<String> save(UUID user, long cents) throws Exception {
        return call("POST", "{\"name\":\"  Brot 🥖  \",\"amountCents\":" + cents + "}", token(user));
    }
    int count(UUID user) throws Exception { return JSON.readTree(call("GET", null, token(user)).body()).size(); }

    @Test void speichernIstGetrimmtBestaetigtUndHistorieUmfasstAlleEigenenMonate() throws Exception {
        assertThat(call("GET", null, token(first)).body()).isEqualTo("[]");
        CLOCK.now = Instant.parse("2026-06-30T21:59:59Z");
        var june = save(first, 115);
        assertThat(june.statusCode()).isEqualTo(201);
        var entry = JSON.readTree(june.body());
        assertThat(UUID.fromString(entry.get("id").asText())).isNotNull();
        assertThat(entry.get("name").asText()).isEqualTo("Brot 🥖");
        assertThat(entry.get("amountCents").asLong()).isEqualTo(115);
        assertThat(entry.get("recordedOn").asText()).isEqualTo("2026-06-30");
        CLOCK.now = Instant.parse("2026-06-30T22:00:00Z");
        assertThat(save(first, 1).statusCode()).isEqualTo(201);
        assertThat(save(first, 2).statusCode()).isEqualTo(201);
        save(second, 987654);
        var list = JSON.readTree(call("GET", null, token(first), "?userId=" + second).body());
        assertThat(list.size()).isEqualTo(3);
        assertThat(list.get(0).get("recordedOn").asText()).isEqualTo("2026-07-01");
        assertThat(list.get(1).get("recordedOn").asText()).isEqualTo("2026-07-01");
        assertThat(list.get(0).get("id").asText()).isLessThan(list.get(1).get("id").asText());
        assertThat(list.get(2)).isEqualTo(entry);
        assertThat(count(second)).isEqualTo(1);
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT count(*) FROM expenses.expenses WHERE user_id = ?", Integer.class, first)).isEqualTo(3);
    }

    @Test void jsonTypenFeldfehlerUndFremdeEigentuemerOderDatumsfelderErzeugenKeineMutation() throws Exception {
        for (String value : List.of("null", "0", "-1", "9007199254740992", "9223372036854775808", "1.01", "1.0", "1e2", "\"100\"", "true", "[]", "{}")) {
            var rejected = call("POST", "{\"name\":\"Brot\",\"amountCents\":" + value + "}", token(first));
            assertThat(rejected.statusCode()).as(value).isEqualTo(400);
            fields(rejected, "amountCents");
        }
        for (String value : List.of("null", "\"\"", "\"   \"", "\"\\u00a0\"", "12", "1.5", "true", "[]", "{}")) {
            String body = "{\"name\":" + value + ",\"amountCents\":1}";
            var rejected = call("POST", body, token(first));
            assertThat(rejected.statusCode()).as(body).isEqualTo(400);
            fields(rejected, "name");
        }
        for (String body : List.of("{}", "null", "{", "{\"name\":\"Brot\"}", "{\"amountCents\":1}",
            "{\"name\":\"Brot\",\"amountCents\":1,\"userId\":\"" + second + "\"}",
            "{\"name\":\"Brot\",\"amountCents\":1,\"user_id\":\"" + second + "\"}",
            "{\"name\":\"Brot\",\"amountCents\":1,\"recordedOn\":\"2000-01-01\"}",
            "{\"name\":\"Brot\",\"amountCents\":1,\"id\":\"" + UUID.randomUUID() + "\"}")) {
            var rejected = call("POST", body, token(first));
            assertThat(rejected.statusCode()).as(body).isEqualTo(400);
            if (body.equals("{}")) fields(rejected, "name", "amountCents");
            else if (body.equals("{\"name\":\"Brot\"}")) fields(rejected, "amountCents");
            else if (body.equals("{\"amountCents\":1}")) fields(rejected, "name");
            else fields(rejected);
        }
        assertThat(count(first)).isZero(); assertThat(count(second)).isZero();
    }

    void fields(HttpResponse<String> response, String... expected) {
        var fields = JSON.readTree(response.body()).get("fieldErrors");
        assertThat(fields.size()).as(response.body()).isEqualTo(expected.length);
        for (String field : expected) assertThat(fields.has(field)).as(response.body()).isTrue();
    }

    @Test void nullzeichenImNichtleerenNamenIstEinFeldfehlerOhneMutation() throws Exception {
        var rejected = call("POST", "{\"name\":\"Bro\\u0000t\",\"amountCents\":1}", token(first));
        assertThat(rejected.statusCode()).isEqualTo(400);
        fields(rejected, "name");
        assertThat(JSON.readTree(rejected.body()).get("fieldErrors").get("name").asText()).contains("Nullzeichen");
        assertThat(count(first)).isZero();
    }

    @Test void nichtUnterstuetzterMedientypBehaeltProtokollstatusUndHeaderOhneMutation() throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path()))
            .header("Authorization", "Bearer " + token(first)).header("Content-Type", "text/plain")
            .POST(HttpRequest.BodyPublishers.ofString("{\"name\":\"Brot\",\"amountCents\":1}")).build();
        var rejected = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(rejected.statusCode()).isEqualTo(415);
        assertThat(rejected.headers().firstValue("Cache-Control")).hasValue("no-store");
        assertThat(rejected.headers().firstValue("Accept").orElse("")).contains("application/json");
        fields(rejected);
        assertThat(count(first)).isZero();
    }

    @Test void monatssummeUndRestBleibenExaktUndAndereKontenOderMonateSindUnabhaengig() throws Exception {
        long max = Money.MAX_CENTS;
        CLOCK.now = Instant.parse("2026-10-31T22:59:59Z");
        assertThat(save(first, max).statusCode()).isEqualTo(201);
        var rejected = save(first, 1);
        assertThat(rejected.statusCode()).isEqualTo(400);
        assertThat(rejected.body()).contains("MONTH_LIMIT_EXCEEDED");
        assertThat(save(second, max).statusCode()).isEqualTo(201);
        CLOCK.now = Instant.parse("2026-10-31T23:00:00Z");
        assertThat(save(first, max - 1).statusCode()).isEqualTo(201);
        assertThat(save(first, 1).statusCode()).isEqualTo(201);
        assertThat(save(first, 1).statusCode()).isEqualTo(400);
        assertThat(count(first)).isEqualTo(3);
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT sum(amount_cents) FROM expenses.expenses WHERE user_id = ? AND recorded_on = DATE '2026-11-01'", java.math.BigDecimal.class, first))
            .isEqualByComparingTo(java.math.BigDecimal.valueOf(max));
    }

    @Test void wartendeErfassungBestimmtDatumUndMonatssummeErstNachDerKontosperre() throws Exception {
        CLOCK.now = Instant.parse("2026-10-31T22:59:59Z");
        assertThat(save(first, Money.MAX_CENTS).statusCode()).isEqualTo(201);
        String bearer = token(first);
        try (var executor = java.util.concurrent.Executors.newSingleThreadExecutor()) {
            // Die innere Ressource gibt die Sperre auch bei fehlgeschlagenen Assertions vor executor.close frei.
            try (Connection holder = source.getConnection()) {
                holder.setAutoCommit(false);
                int holderPid;
                try (var statement = holder.createStatement(); var result = statement.executeQuery("SELECT pg_backend_pid()")) {
                    result.next(); holderPid = result.getInt(1);
                }
                try (var statement = holder.prepareStatement("SELECT pg_advisory_xact_lock(hashtextextended(?, 14))")) {
                    statement.setString(1, first.toString()); statement.execute();
                }
                var pending = executor.submit(() -> call("POST", "{\"name\":\"Neuer Monat\",\"amountCents\":" + Money.MAX_CENTS + "}", bearer));
                long deadline = System.nanoTime() + java.util.concurrent.TimeUnit.SECONDS.toNanos(5);
                boolean waiting = false;
                while (!waiting && System.nanoTime() < deadline) {
                    waiting = Boolean.TRUE.equals(PostgresFixture.ADMIN.queryForObject("""
                        SELECT EXISTS (SELECT 1 FROM pg_stat_activity
                        WHERE wait_event_type = 'Lock' AND wait_event = 'advisory'
                          AND ? = ANY(pg_blocking_pids(pid)))
                        """, Boolean.class, holderPid));
                    if (!waiting) Thread.sleep(10);
                }
                assertThat(waiting).as("POST wartet nachweislich auf die gehaltene Kontosperre").isTrue();
                assertThat(pending.isDone()).isFalse();
                CLOCK.now = Instant.parse("2026-10-31T23:00:00Z");
                holder.commit();
                var saved = pending.get(10, java.util.concurrent.TimeUnit.SECONDS);
                assertThat(saved.statusCode()).isEqualTo(201);
                assertThat(JSON.readTree(saved.body()).get("recordedOn").asText()).isEqualTo("2026-11-01");
                assertThat(save(first, 1).statusCode()).isEqualTo(400);
                assertThat(PostgresFixture.ADMIN.queryForObject("SELECT sum(amount_cents) FROM expenses.expenses WHERE user_id = ? AND recorded_on = DATE '2026-11-01'", java.math.BigDecimal.class, first))
                    .isEqualByComparingTo(java.math.BigDecimal.valueOf(Money.MAX_CENTS));
            }
        }
    }

    @Test void paralleleErfassungenPruefenUndSchreibenUnterDerselbenKontosperre() throws Exception {
        assertThat(save(first, Money.MAX_CENTS - 5).statusCode()).isEqualTo(201);
        String bearer = token(first);
        try (var executor = java.util.concurrent.Executors.newFixedThreadPool(12)) {
            var gate = new java.util.concurrent.CountDownLatch(1);
            var results = new ArrayList<java.util.concurrent.Future<Integer>>();
            for (int index = 0; index < 12; index++) results.add(executor.submit(() -> {
                gate.await(); return call("POST", "{\"name\":\"Parallel\",\"amountCents\":1}", bearer).statusCode();
            }));
            gate.countDown();
            var codes = new ArrayList<Integer>();
            for (var future : results) codes.add(future.get(30, java.util.concurrent.TimeUnit.SECONDS));
            assertThat(codes).containsOnly(201, 400);
            assertThat(codes.stream().filter(code -> code == 201).count()).isEqualTo(5);
            assertThat(count(first)).isEqualTo(6);
        }
    }

    @Test void jwtPruefungUndCookieAlleinVerweigernBeideRouten() throws Exception {
        var claims = SignedJWT.parse(token(first)).getJWTClaimsSet();
        byte[] wrongKey = KEY.clone(); wrongKey[0] = 1;
        var bearers = new ArrayList<String>(Arrays.asList(null, "ungueltig", sign(claims, wrongKey),
            sign(new JWTClaimsSet.Builder(claims).issuer("fremd").build(), KEY),
            sign(new JWTClaimsSet.Builder(claims).audience("fremd").build(), KEY),
            sign(new JWTClaimsSet.Builder(claims).subject("1-1-1-1-1").build(), KEY),
            sign(new JWTClaimsSet.Builder(claims).expirationTime(Date.from(CLOCK.now)).build(), KEY)));
        for (String bearer : bearers) for (String method : List.of("GET", "POST")) {
            var rejected = call(method, method.equals("POST") ? "{\"name\":\"Brot\",\"amountCents\":1}" : null, bearer);
            assertThat(rejected.statusCode()).isEqualTo(401);
            assertThat(rejected.body()).doesNotContain("amountCents", first.toString());
        }
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path()))
            .header("Cookie", "__Host-tnbp-refresh=synthetisch; __Host-tnbp-csrf=synthetisch")
            .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString("{\"name\":\"Brot\",\"amountCents\":1}")).build();
        assertThat(HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(401);
        assertThat(save(first, 1).statusCode()).isEqualTo(201); // Bearer benötigt kein Cookie/CSRF.
    }

    @Test void commitFehlerBestaetigtNichtsUndVeraendertKeinenBestand(CapturedOutput output) throws Exception {
        save(first, 123);
        PostgresFixture.ADMIN.execute("CREATE FUNCTION expenses.reject_expense_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'GeheimerAusgabenfehler'; RETURN NEW; END $$");
        PostgresFixture.ADMIN.execute("CREATE CONSTRAINT TRIGGER reject_expense_commit AFTER INSERT ON expenses.expenses DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION expenses.reject_expense_commit()");
        try {
            var rejected = save(first, 876543210);
            assertThat(rejected.statusCode()).isEqualTo(500);
            assertThat(rejected.body()).contains("EXPENSE_UNAVAILABLE").doesNotContain("GeheimerAusgabenfehler", "876543210");
            assertThat(count(first)).isEqualTo(1);
        } finally {
            PostgresFixture.ADMIN.execute("DROP TRIGGER reject_expense_commit ON expenses.expenses");
            PostgresFixture.ADMIN.execute("DROP FUNCTION expenses.reject_expense_commit()");
        }
        assertThat(output.getAll()).contains("Ausgabenanfrage fehlgeschlagen; Fehlerkategorie=DATENBANK")
            .doesNotContain("GeheimerAusgabenfehler", "876543210", "INSERT INTO expense_budget");
        assertThat(save(first, 1).statusCode()).isEqualTo(201);
    }

    @Test void rlsFiltertFremdesVerweigertFremdeInsertsUndKontextLaeuftMitTransaktionAus() throws Exception {
        save(first, 123);
        var runtimeSource = new DriverManagerDataSource(PostgresFixture.URL, "tnbp_runtime", "runtime-test-only");
        try (Connection connection = runtimeSource.getConnection()) {
            assertThat(count(connection)).isZero();
            connection.setAutoCommit(false);
            context(connection, second); assertThat(count(connection)).isZero();
            try (var statement = connection.prepareStatement("INSERT INTO expenses.expenses VALUES (?, ?, 'Fremd', 1, DATE '2026-10-23')")) {
                statement.setObject(1, UUID.randomUUID()); statement.setObject(2, first);
                assertThatThrownBy(statement::executeUpdate).isInstanceOf(java.sql.SQLException.class);
            }
            connection.rollback(); assertThat(count(connection)).isZero();
            context(connection, first); assertThat(count(connection)).isEqualTo(1);
            connection.commit(); assertThat(count(connection)).isZero();
            context(connection, first); assertThat(count(connection)).isEqualTo(1);
            connection.rollback(); assertThat(count(connection)).isZero();
        }
        service.allExpenses(first); service.saveExpense(second, "Zweitkonto", 1L);
        var connections = new ArrayList<Connection>();
        try {
            for (int i = 0; i < 8; i++) connections.add(source.getConnection());
            for (var connection : connections) assertThat(count(connection)).isZero();
        } finally { for (var connection : connections) connection.close(); }
    }
    long count(Connection connection) throws Exception {
        try (var statement = connection.createStatement(); var result = statement.executeQuery("SELECT count(*) FROM expenses.expenses")) {
            result.next(); return result.getLong(1);
        }
    }
    void context(Connection connection, UUID user) throws Exception {
        try (var statement = connection.prepareStatement("SELECT set_config('app.user_id', ?, true)")) {
            statement.setString(1, user.toString()); statement.execute();
        }
    }
    @Test void minimaleRechteForceRlsUndConstraintsSindWirksam() {
        var runtime = new JdbcTemplate(new DriverManagerDataSource(PostgresFixture.URL, "tnbp_runtime", "runtime-test-only"));
        assertThat(PostgresFixture.ADMIN.queryForObject("SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid = 'expenses.expenses'::regclass", Boolean.class)).isTrue();
        assertThat(runtime.queryForObject("SELECT rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb FROM pg_roles WHERE rolname = current_user", Boolean.class)).isFalse();
        assertThat(runtime.queryForObject("SELECT pg_has_role(current_user, relowner, 'MEMBER') FROM pg_class WHERE oid = 'expenses.expenses'::regclass", Boolean.class)).isFalse();
        assertThat(runtime.update("DELETE FROM expenses.expenses")).isZero();
        assertThat(runtime.update("UPDATE expenses.expenses SET name = name")).isZero();
        for (String sql : List.of("UPDATE expenses.expenses SET id = id", "UPDATE expenses.expenses SET user_id = user_id",
            "UPDATE expenses.expenses SET recorded_on = recorded_on",
            "ALTER TABLE expenses.expenses DISABLE ROW LEVEL SECURITY", "CREATE TABLE expenses.forbidden (id integer)",
            "INSERT INTO expenses.expenses VALUES ('" + UUID.randomUUID() + "', '" + first + "', 'Kontextlos', 1, CURRENT_DATE)"))
            assertThatThrownBy(() -> runtime.execute(sql)).isInstanceOf(DataAccessException.class);
        for (String value : List.of("'Brot', 0", "'Brot', -1", "'Brot', 9007199254740992", "'', 1", "'   ', 1"))
            assertThatThrownBy(() -> PostgresFixture.ADMIN.execute("INSERT INTO expenses.expenses VALUES ('" + UUID.randomUUID() + "', '" + first + "', " + value + ", CURRENT_DATE)"))
                .isInstanceOf(DataAccessException.class);
        for (String name : List.of("\t", "\n\r", "\u00a0", "\u1680", "\u2003", "\u2007", "\u2028", "\u2029", "\u202f", "\u205f", "\u3000", "\uFEFF", " \t\u00a0\u2003 "))
            assertThatThrownBy(() -> PostgresFixture.ADMIN.update("INSERT INTO expenses.expenses VALUES (?, ?, ?, 1, CURRENT_DATE)", UUID.randomUUID(), first, name))
                .as("Nur Trimzeichen im Namen").isInstanceOf(DataAccessException.class);
        assertThatThrownBy(() -> PostgresFixture.ADMIN.execute("INSERT INTO expenses.expenses VALUES ('" + UUID.randomUUID() + "', '" + UUID.randomUUID() + "', 'Unbekannt', 1, CURRENT_DATE)"))
            .isInstanceOf(DataAccessException.class);
    }

    String expenseId(HttpResponse<String> response) { return JSON.readTree(response.body()).get("id").asText(); }
    HttpResponse<String> update(UUID user, String id, String name, long cents) throws Exception {
        return call("PUT", JSON.writeValueAsString(Map.of("name", name, "amountCents", cents)), token(user), "/" + id);
    }

    @Test void bearbeitungUndLoeschungBewahrenMetadatenUndVerwendenDenUrspruenglichenMonat() throws Exception {
        CLOCK.now = Instant.parse("2026-10-31T22:59:59Z");
        String oldId = expenseId(save(first, 123));
        String otherOld = expenseId(save(first, Money.MAX_CENTS - 123));
        CLOCK.now = Instant.parse("2026-10-31T23:00:00Z");
        budgets.saveBudget(first, 1000L);
        String currentId = expenseId(save(first, 250));
        assertThat(update(first, oldId, "Erhöhung", 124).statusCode()).isEqualTo(400);
        assertThat(summaries.currentSummary(first).remainingCents()).isEqualTo(750);
        var edited = update(first, oldId, "  Korrigiert  ", 100);
        assertThat(edited.statusCode()).isEqualTo(200);
        var value = JSON.readTree(edited.body());
        assertThat(value.get("id").asText()).isEqualTo(oldId);
        assertThat(value.get("recordedOn").asText()).isEqualTo("2026-10-31");
        assertThat(value.get("name").asText()).isEqualTo("Korrigiert");
        assertThat(value.get("amountCents").asLong()).isEqualTo(100);
        assertThat(update(first, otherOld, "Rest alter Monat", Money.MAX_CENTS - 100).statusCode()).isEqualTo(200);
        assertThat(summaries.currentSummary(first).remainingCents()).isEqualTo(750);
        assertThat(call("DELETE", null, token(first), "/" + oldId).statusCode()).isEqualTo(204);
        assertThat(summaries.currentSummary(first).remainingCents()).isEqualTo(750);
        assertThat(update(first, currentId, "Neuer Betrag", 400).statusCode()).isEqualTo(200);
        assertThat(summaries.currentSummary(first).remainingCents()).isEqualTo(600);
        var deleted = call("DELETE", null, token(first), "/" + currentId);
        assertThat(deleted.statusCode()).isEqualTo(204); assertThat(deleted.body()).isEmpty();
        assertThat(summaries.currentSummary(first).remainingCents()).isEqualTo(1000);
        assertThat(count(first)).isEqualTo(1);
    }

    @Test void fremdeUndFehlendeIdsSindIdentischNeutralOhneMutation() throws Exception {
        String own = expenseId(save(first, 100)), foreign = expenseId(save(second, 987654));
        String foreignHistory = call("GET", null, token(second)).body();
        for (String method : List.of("PUT", "DELETE")) {
            String body = method.equals("PUT") ? "{\"name\":\"Korrektur\",\"amountCents\":1}" : null;
            var hidden = call(method, body, token(first), "/" + foreign);
            var absent = call(method, body, token(first), "/" + UUID.randomUUID());
            assertThat(hidden.statusCode()).isEqualTo(404);
            assertThat(absent.statusCode()).isEqualTo(404);
            assertThat(hidden.body()).isEqualTo(absent.body()).doesNotContain(foreign, own, "987654", second.toString());
            assertThat(hidden.body()).contains("EXPENSE_NOT_FOUND");
            assertThat(call("GET", null, token(second)).body()).isEqualTo(foreignHistory);
        }
        assertThat(count(first)).isEqualTo(1); assertThat(count(second)).isEqualTo(1);
        assertThat(call("DELETE", null, token(first), "/" + own).statusCode()).isEqualTo(204);
        assertThat(update(first, own, "Weg", 1).statusCode()).isEqualTo(404);
        assertThat(call("DELETE", null, token(first), "/" + own).statusCode()).isEqualTo(404);
    }

    @Test void putLehntStriktesJsonUndUngueltigeFelderOhneRundungAb() throws Exception {
        String id = expenseId(save(first, 123));
        String before = call("GET", null, token(first)).body();
        for (String value : List.of("null", "0", "-1", "9007199254740992", "9223372036854775808", "1.01", "1.0", "1e2", "\"100\"", "true", "[]", "{}")) {
            var rejected = call("PUT", "{\"name\":\"Brot\",\"amountCents\":" + value + "}", token(first), "/" + id);
            assertThat(rejected.statusCode()).as(value).isEqualTo(400); fields(rejected, "amountCents");
        }
        for (String value : List.of("null", "\"\"", "\"   \"", "\"\\u00a0\"", "\"Bro\\u0000t\"", "12", "1.5", "true", "[]", "{}")) {
            var rejected = call("PUT", "{\"name\":" + value + ",\"amountCents\":1}", token(first), "/" + id);
            assertThat(rejected.statusCode()).as(value).isEqualTo(400); fields(rejected, "name");
        }
        for (String field : List.of("id", "userId", "user_id", "recordedOn")) {
            var rejected = call("PUT", "{\"name\":\"Brot\",\"amountCents\":1,\"" + field + "\":\"" + id + "\"}", token(first), "/" + id);
            assertThat(rejected.statusCode()).isEqualTo(400);
        }
        for (String body : List.of("{}", "null", "{", "{\"name\":\"Brot\"}", "{\"amountCents\":1}"))
            assertThat(call("PUT", body, token(first), "/" + id).statusCode()).isEqualTo(400);
        assertThat(call("GET", null, token(first)).body()).isEqualTo(before);
    }

    @Test void mutationsRoutenPruefenJwtUndAkzeptierenKeineCookiesAllein() throws Exception {
        String id = expenseId(save(first, 123));
        var claims = SignedJWT.parse(token(first)).getJWTClaimsSet();
        byte[] wrongKey = KEY.clone(); wrongKey[0] = 1;
        var invalid = Arrays.asList(null, "ungueltig", sign(claims, wrongKey),
            sign(new JWTClaimsSet.Builder(claims).issuer("fremd").build(), KEY),
            sign(new JWTClaimsSet.Builder(claims).audience("fremd").build(), KEY),
            sign(new JWTClaimsSet.Builder(claims).subject("1-1-1-1-1").build(), KEY),
            sign(new JWTClaimsSet.Builder(claims).expirationTime(Date.from(CLOCK.now)).build(), KEY));
        for (String method : List.of("PUT", "DELETE")) {
            String body = method.equals("PUT") ? "{\"name\":\"Brot\",\"amountCents\":1}" : null;
            for (String bearer : invalid) assertThat(call(method, body, bearer, "/" + id).statusCode()).isEqualTo(401);
            var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path() + "/" + id))
                .header("Cookie", "__Host-tnbp-refresh=synthetisch; __Host-tnbp-csrf=synthetisch")
                .header("Content-Type", "application/json").method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body)).build();
            var rejected = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
            assertThat(rejected.statusCode()).isEqualTo(401);
            assertThat(rejected.headers().firstValue("Cache-Control")).hasValue("no-store");
        }
        assertThat(count(first)).isEqualTo(1);
        assertThat(update(first, id, "Bearer allein", 1).statusCode()).isEqualTo(200);
        assertThat(call("DELETE", null, token(first), "/" + id).statusCode()).isEqualTo(204);
    }

    @Test void commitFehlerBeiPutUndDeleteBestaetigtNichtsUndRolltZurueck(CapturedOutput output) throws Exception {
        String id = expenseId(save(first, 123));
        String before = call("GET", null, token(first)).body();
        PostgresFixture.ADMIN.execute("CREATE FUNCTION expenses.reject_mutation_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'GeheimeKorrektur'; RETURN NEW; END $$");
        PostgresFixture.ADMIN.execute("CREATE CONSTRAINT TRIGGER reject_mutation_commit AFTER UPDATE OR DELETE ON expenses.expenses DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION expenses.reject_mutation_commit()");
        try {
            for (String method : List.of("PUT", "DELETE")) {
                var rejected = call(method, method.equals("PUT") ? "{\"name\":\"GeheimerEntwurf\",\"amountCents\":876543210}" : null, token(first), "/" + id);
                assertThat(rejected.statusCode()).isEqualTo(500);
                assertThat(rejected.body()).contains("EXPENSE_UNAVAILABLE").doesNotContain("GeheimeKorrektur", "GeheimerEntwurf", "876543210");
                assertThat(call("GET", null, token(first)).body()).isEqualTo(before);
            }
        } finally {
            PostgresFixture.ADMIN.execute("DROP TRIGGER reject_mutation_commit ON expenses.expenses");
            PostgresFixture.ADMIN.execute("DROP FUNCTION expenses.reject_mutation_commit()");
        }
        assertThat(output.getAll()).doesNotContain("GeheimeKorrektur", "GeheimerEntwurf", "876543210");
    }

    @Test void parallelePostPutDeleteHaltenDieErsatzsummeAtomarInnerhalbDerGrenze() throws Exception {
        save(first, Money.MAX_CENTS - 5);
        String editId = expenseId(save(first, 1)), deleteId = expenseId(save(first, 1));
        String bearer = token(first);
        try (var executor = java.util.concurrent.Executors.newFixedThreadPool(12)) {
            var gate = new java.util.concurrent.CountDownLatch(1);
            var results = new ArrayList<java.util.concurrent.Future<Integer>>();
            for (int index = 0; index < 10; index++) results.add(executor.submit(() -> {
                gate.await(); return call("POST", "{\"name\":\"Parallel\",\"amountCents\":1}", bearer).statusCode();
            }));
            results.add(executor.submit(() -> { gate.await(); return update(first, editId, "Ersetzt", 4).statusCode(); }));
            results.add(executor.submit(() -> { gate.await(); return call("DELETE", null, bearer, "/" + deleteId).statusCode(); }));
            gate.countDown();
            var codes = new ArrayList<Integer>();
            for (var result : results) codes.add(result.get(30, java.util.concurrent.TimeUnit.SECONDS));
            assertThat(codes.subList(0, 10)).allSatisfy(code -> assertThat(code).isIn(201, 400));
            assertThat(codes.get(10)).isIn(200, 400);
            assertThat(codes.get(11)).isEqualTo(204);
            long actual = PostgresFixture.ADMIN.queryForObject("SELECT sum(amount_cents) FROM expenses.expenses WHERE user_id = ?", java.math.BigDecimal.class, first).longValueExact();
            assertThat(actual).isLessThanOrEqualTo(Money.MAX_CENTS);
            assertThat(summaries.currentSummary(first).expensesCents()).isEqualTo(actual);
            assertThat(actual).isEqualTo(Money.MAX_CENTS - 5 + (codes.get(10) == 200 ? 4 : 1)
                + codes.subList(0, 10).stream().filter(code -> code == 201).count());
        }
    }

    @Test void wartendesPutLiestErstUnterKontosperreUndDeleteVerwendetDieselbeSperre() throws Exception {
        CLOCK.now = Instant.parse("2026-10-31T22:59:59Z");
        String id = expenseId(save(first, 1));
        String bearer = token(first);
        try (var executor = java.util.concurrent.Executors.newFixedThreadPool(2)) {
            try (Connection holder = source.getConnection()) {
                holder.setAutoCommit(false);
                try (var statement = holder.prepareStatement("SELECT pg_advisory_xact_lock(hashtextextended(?, 14))")) {
                    statement.setString(1, first.toString()); statement.execute();
                }
                var put = executor.submit(() -> call("PUT", "{\"name\":\"Nach Sperre\",\"amountCents\":2}", bearer, "/" + id));
                var delete = executor.submit(() -> call("DELETE", null, bearer, "/" + id));
                long deadline = System.nanoTime() + java.util.concurrent.TimeUnit.SECONDS.toNanos(5);
                int waiting = 0;
                while (waiting < 2 && System.nanoTime() < deadline) {
                    waiting = PostgresFixture.ADMIN.queryForObject("SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND wait_event = 'advisory'", Integer.class);
                    if (waiting < 2) Thread.sleep(10);
                }
                assertThat(waiting).isEqualTo(2);
                assertThat(put.isDone()).isFalse(); assertThat(delete.isDone()).isFalse();
                CLOCK.now = Instant.parse("2026-10-31T23:00:00Z");
                holder.commit();
                var edited = put.get(10, java.util.concurrent.TimeUnit.SECONDS);
                assertThat(edited.statusCode()).isIn(200, 404);
                if (edited.statusCode() == 200) assertThat(JSON.readTree(edited.body()).get("recordedOn").asText()).isEqualTo("2026-10-31");
                assertThat(delete.get(10, java.util.concurrent.TimeUnit.SECONDS).statusCode()).isEqualTo(204);
                assertThat(count(first)).isZero();
            }
        }
    }

    @Test void rlsErlaubtNurEigeneKorrekturenUndZweiAenderbareSpalten() throws Exception {
        String own = expenseId(save(first, 123)), foreign = expenseId(save(second, 456));
        String foreignHistory = call("GET", null, token(second)).body();
        var runtimeSource = new DriverManagerDataSource(PostgresFixture.URL, "tnbp_runtime", "runtime-test-only");
        try (Connection connection = runtimeSource.getConnection()) {
            connection.setAutoCommit(false);
            for (UUID owner : List.of(second, first)) {
                context(connection, owner);
                String hidden = owner.equals(first) ? foreign : own;
                try (var statement = connection.prepareStatement("UPDATE expenses.expenses SET name = 'Fremd', amount_cents = 1 WHERE id = ?")) {
                    statement.setObject(1, UUID.fromString(hidden)); assertThat(statement.executeUpdate()).isZero();
                }
                try (var statement = connection.prepareStatement("DELETE FROM expenses.expenses WHERE id = ?")) {
                    statement.setObject(1, UUID.fromString(hidden)); assertThat(statement.executeUpdate()).isZero();
                }
                connection.commit();
            }
            context(connection, first);
            try (var statement = connection.prepareStatement("UPDATE expenses.expenses SET name = 'Erlaubt', amount_cents = 321 WHERE id = ?")) {
                statement.setObject(1, UUID.fromString(own)); assertThat(statement.executeUpdate()).isEqualTo(1);
            }
            connection.commit();
            assertThat(count(connection)).isZero();
            context(connection, first);
            try (var statement = connection.prepareStatement("DELETE FROM expenses.expenses WHERE id = ?")) {
                statement.setObject(1, UUID.fromString(own)); assertThat(statement.executeUpdate()).isEqualTo(1);
            }
            connection.commit(); assertThat(count(connection)).isZero();
        }
        assertThat(count(first)).isZero(); assertThat(count(second)).isEqualTo(1);
        assertThat(call("GET", null, token(second)).body()).isEqualTo(foreignHistory);
    }

    @Test void ungueltigeIdsVerwendenBeiPutUndDeleteDenselbenNeutralen404() throws Exception {
        String id = expenseId(save(first, 123));
        for (String method : List.of("PUT", "DELETE")) {
            String body = method.equals("PUT") ? "{\"name\":\"Korrektur\",\"amountCents\":1}" : null;
            var absent = call(method, body, token(first), "/" + UUID.randomUUID());
            for (String malformed : List.of("keine-uuid", "1-1-1-1-1", "00000000-0000-4000-8000-00000000000x")) {
                var rejected = call(method, body, token(first), "/" + malformed);
                assertThat(rejected.statusCode()).isEqualTo(404);
                assertThat(rejected.body()).isEqualTo(absent.body());
            }
        }
        assertThat(count(first)).isEqualTo(1);
        assertThat(JSON.readTree(call("GET", null, token(first)).body()).get(0).get("id").asText()).isEqualTo(id);
    }

    @Test void wartendesPutVerwendetDenBetragNachErhaltDerKontosperreFuerDieErsatzsumme() throws Exception {
        long max = Money.MAX_CENTS;
        String id = expenseId(save(first, 10));
        save(first, max - 10);
        String bearer = token(first);
        try (var executor = java.util.concurrent.Executors.newSingleThreadExecutor()) {
            try (Connection holder = source.getConnection()) {
                holder.setAutoCommit(false);
                int holderPid;
                try (var statement = holder.createStatement(); var result = statement.executeQuery("SELECT pg_backend_pid()")) {
                    result.next(); holderPid = result.getInt(1);
                }
                context(holder, first);
                try (var statement = holder.prepareStatement("SELECT pg_advisory_xact_lock(hashtextextended(?, 14))")) {
                    statement.setString(1, first.toString()); statement.execute();
                }
                var pending = executor.submit(() -> call("PUT", "{\"name\":\"Zu groß\",\"amountCents\":19}", bearer, "/" + id));
                long deadline = System.nanoTime() + java.util.concurrent.TimeUnit.SECONDS.toNanos(5);
                boolean waiting = false;
                while (!waiting && System.nanoTime() < deadline) {
                    waiting = Boolean.TRUE.equals(PostgresFixture.ADMIN.queryForObject("""
                        SELECT EXISTS (SELECT 1 FROM pg_stat_activity
                        WHERE wait_event_type = 'Lock' AND wait_event = 'advisory'
                          AND ? = ANY(pg_blocking_pids(pid)))
                        """, Boolean.class, holderPid));
                    if (!waiting) Thread.sleep(10);
                }
                assertThat(waiting).as("PUT wartet nachweislich auf die gehaltene Kontosperre").isTrue();
                assertThat(pending.isDone()).isFalse();
                try (var statement = holder.prepareStatement("UPDATE expenses.expenses SET amount_cents = 1 WHERE user_id = ? AND id = ?")) {
                    statement.setObject(1, first); statement.setObject(2, UUID.fromString(id));
                    assertThat(statement.executeUpdate()).isEqualTo(1);
                }
                holder.commit();
                var rejected = pending.get(10, java.util.concurrent.TimeUnit.SECONDS);
                assertThat(rejected.statusCode()).isEqualTo(400);
                assertThat(rejected.body()).contains("MONTH_LIMIT_EXCEEDED");
                assertThat(PostgresFixture.ADMIN.queryForObject("SELECT sum(amount_cents) FROM expenses.expenses WHERE user_id = ?", java.math.BigDecimal.class, first))
                    .isEqualByComparingTo(java.math.BigDecimal.valueOf(max - 9));
                assertThat(PostgresFixture.ADMIN.queryForObject("SELECT amount_cents FROM expenses.expenses WHERE id = ?", Long.class, UUID.fromString(id))).isEqualTo(1);
            }
        }
    }
    @Test void sommerUndWinterzeitBewahrenServerseitigeKalendertage() throws Exception {
        var cases = Map.of(
            "2026-03-28T23:00:00Z", "2026-03-29",
            "2026-03-29T00:59:59Z", "2026-03-29",
            "2026-03-29T01:00:00Z", "2026-03-29",
            "2026-10-24T22:00:00Z", "2026-10-25",
            "2026-10-25T00:59:59Z", "2026-10-25",
            "2026-10-25T01:00:00Z", "2026-10-25",
            "2026-10-25T22:59:59Z", "2026-10-25",
            "2026-10-25T23:00:00Z", "2026-10-26");
        for (var entry : cases.entrySet()) {
            CLOCK.now = Instant.parse(entry.getKey());
            var created = save(first, 1);
            assertThat(created.statusCode()).as(entry.getKey()).isEqualTo(201);
            assertThat(JSON.readTree(created.body()).get("recordedOn").asText()).isEqualTo(entry.getValue());
        }
        assertThat(count(first)).isEqualTo(cases.size());
    }

}

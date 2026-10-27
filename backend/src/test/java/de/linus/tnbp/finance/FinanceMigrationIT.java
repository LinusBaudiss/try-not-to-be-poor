package de.linus.tnbp.finance;

import static org.assertj.core.api.Assertions.*;
import de.linus.tnbp.access.PostgresFixture;
import java.nio.file.Files;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.net.http.HttpClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

class FinanceMigrationIT {
    private static final JsonMapper JSON = JsonMapper.builder().build();
    @ParameterizedTest @ValueSource(booleans = {false, true})
    void frischerUndBefuellterV8StandVerwendenDieselbeVerlustfreieMigration(boolean existing) throws Exception {
        String name = "migration_" + UUID.randomUUID().toString().replace("-", "");
        var server = new JdbcTemplate(PostgresFixture.POSTGRES.getPostgresDatabase());
        server.execute("CREATE DATABASE " + name + " OWNER tnbp_migrator");
        String url = "jdbc:postgresql://localhost:" + PostgresFixture.POSTGRES.getPort() + "/" + name;
        var admin = new JdbcTemplate(new DriverManagerDataSource(url, "postgres", "postgres"));
        try {
            Flyway.configure().dataSource(url, "tnbp_migrator", "migration-test-only")
                .schemas("access").defaultSchema("access").target("8").load().migrate();
            if (existing) {
                for (int index = 0; index < 2; index++) {
                    UUID user = UUID.randomUUID();
                    admin.update("INSERT INTO access.accounts VALUES (?, ?, '$argon2id$synthetic', TIMESTAMPTZ '2026-01-01Z')", user, user + "@example.org");
                    for (int month = 7; month <= 9; month++) {
                        admin.update("INSERT INTO expense_budget.budgets VALUES (?, ?, ?)", user, LocalDate.of(2026, month, 1), index * 1000L + month);
                        admin.update("INSERT INTO expense_budget.expenses VALUES (?, ?, ?, ?, ?)", UUID.randomUUID(), user, "Bestand 🥖 " + month,
                            month * 10L, LocalDate.of(2026, month, 20));
                    }
                    admin.update("INSERT INTO savings_goals.goals VALUES (?, ?, 'Altziel', 12345, ?, ?)", UUID.randomUUID(), user,
                        index == 0 ? 0 : 20000, index == 0 ? null : LocalDate.of(2020, 2, 29));
                }
            }
            var accounts = admin.queryForList("SELECT * FROM access.accounts ORDER BY id");
            var expenses = admin.queryForList("SELECT * FROM expense_budget.expenses ORDER BY id");
            var budgets = admin.queryForList("SELECT * FROM expense_budget.budgets ORDER BY user_id, valid_from");
            var goals = admin.queryForList("SELECT * FROM savings_goals.goals ORDER BY id");
            var expenseOid = admin.queryForObject("SELECT 'expense_budget.expenses'::regclass::oid", Long.class);
            var budgetOid = admin.queryForObject("SELECT 'expense_budget.budgets'::regclass::oid", Long.class);
            var migratorPassword = admin.queryForObject("SELECT rolpassword FROM pg_authid WHERE rolname = 'tnbp_migrator'", String.class);
            var runtimePassword = admin.queryForObject("SELECT rolpassword FROM pg_authid WHERE rolname = 'tnbp_runtime'", String.class);
            // Administrativer Rechteabgleich funktioniert bereits vor und nach V9.
            provision(admin);
            Flyway.configure().dataSource(url, "tnbp_migrator", "migration-test-only")
                .schemas("access").defaultSchema("access").load().migrate();
            // Wiederholte Provisionierung entfernt auch versehentlich erweiterte Rechte.
            admin.execute("GRANT CREATE ON SCHEMA expenses TO tnbp_runtime");
            admin.execute("GRANT UPDATE (user_id, recorded_on) ON expenses.expenses TO tnbp_runtime");
            admin.execute("GRANT DELETE ON budget.budgets TO tnbp_runtime");
            admin.execute("GRANT UPDATE (user_id) ON budget.budgets TO PUBLIC");
            provision(admin); provision(admin);
            assertThat(admin.queryForList("SELECT * FROM access.accounts ORDER BY id")).isEqualTo(accounts);
            assertThat(admin.queryForList("SELECT * FROM expenses.expenses ORDER BY id")).isEqualTo(expenses);
            assertThat(admin.queryForList("SELECT * FROM budget.budgets ORDER BY user_id, valid_from")).isEqualTo(budgets);
            assertThat(admin.queryForList("SELECT * FROM savings_goals.goals ORDER BY id")).isEqualTo(goals);
            assertThat(admin.queryForObject("SELECT 'expenses.expenses'::regclass::oid", Long.class)).isEqualTo(expenseOid);
            assertThat(admin.queryForObject("SELECT 'budget.budgets'::regclass::oid", Long.class)).isEqualTo(budgetOid);
            assertThat(admin.queryForObject("SELECT to_regnamespace('expense_budget') IS NULL AND to_regnamespace('monthlysurplus') IS NULL", Boolean.class)).isTrue();
            assertThat(admin.queryForObject("SELECT rolpassword FROM pg_authid WHERE rolname = 'tnbp_migrator'", String.class)).isEqualTo(migratorPassword);
            assertThat(admin.queryForObject("SELECT rolpassword FROM pg_authid WHERE rolname = 'tnbp_runtime'", String.class)).isEqualTo(runtimePassword);
            var runtime = new JdbcTemplate(new DriverManagerDataSource(url, "tnbp_runtime", "runtime-test-only"));
            for (String table : List.of("expenses.expenses", "budget.budgets", "savings_goals.goals")) {
                assertThat(runtime.queryForObject("SELECT count(*) FROM " + table, Integer.class)).isZero();
                assertThat(admin.queryForObject("SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid = ?::regclass", Boolean.class, table)).isTrue();
                assertThat(runtime.queryForObject("SELECT has_column_privilege(current_user, ?, 'user_id', 'UPDATE')", Boolean.class, table)).isFalse();
            }
            assertThat(runtime.queryForObject("SELECT has_table_privilege(current_user, 'budget.budgets', 'DELETE')", Boolean.class)).isFalse();
            assertThat(runtime.queryForObject("SELECT has_schema_privilege(current_user, 'expenses', 'CREATE')", Boolean.class)).isFalse();
            assertThat(runtime.queryForObject("SELECT has_column_privilege(current_user, 'expenses.expenses', 'recorded_on', 'UPDATE')", Boolean.class)).isFalse();
            assertThat(admin.queryForObject("SELECT rolcreaterole OR rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = 'tnbp_migrator'", Boolean.class)).isFalse();
            assertThat(runtime.queryForObject("SELECT pg_has_role(current_user, 'tnbp_migrator', 'MEMBER')", Boolean.class)).isFalse();
            restartPackagedRelease(url, admin, accounts, expenses, budgets, goals);
        } finally { server.execute("DROP DATABASE " + name + " WITH (FORCE)"); }
    }

    private void restartPackagedRelease(String url, JdbcTemplate admin, List<Map<String, Object>> accounts,
            List<Map<String, Object>> expenses, List<Map<String, Object>> budgets, List<Map<String, Object>> goals) throws Exception {
        // Fester Paketinhalt aus der package-Phase, kein boot:run oder Klassenpfad-Ersatz.
        var jar = ArchitectureTest.projectRoot().resolve("backend/target/tnbp-0.1.0-SNAPSHOT.jar");
        assertThat(jar).isRegularFile();
        int port;
        try (var reservation = new java.net.ServerSocket(0)) { port = reservation.getLocalPort(); }
        var log = Files.createTempFile("tnbp-finance-release-", ".log");
        byte[] key = new byte[32];
        var builder = new ProcessBuilder(java.nio.file.Path.of(System.getProperty("java.home"), "bin/java").toString(),
            "-jar", jar.toString(), "--server.address=127.0.0.1", "--server.port=" + port,
            "--spring.datasource.url=" + url, "--spring.datasource.username=tnbp_runtime", "--spring.datasource.password=runtime-test-only",
            "--spring.flyway.url=" + url, "--spring.flyway.user=tnbp_migrator", "--spring.flyway.password=migration-test-only",
            "--access.session.signing-key=" + java.util.Base64.getEncoder().encodeToString(key),
            "--access.session.issuer=finance-release", "--access.session.audience=finance-release-spa",
            "--access.session.origin=https://localhost:4200");
        builder.redirectErrorStream(true).redirectOutput(log.toFile());
        var process = builder.start();
        try {
            var client = java.net.http.HttpClient.newHttpClient();
            String origin = "http://127.0.0.1:" + port;
            boolean ready = false;
            long deadline = System.nanoTime() + java.util.concurrent.TimeUnit.SECONDS.toNanos(30);
            while (process.isAlive() && !ready && System.nanoTime() < deadline) {
                try {
                    var response = client.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(origin + "/api/v2/access/csrf"))
                        .timeout(java.time.Duration.ofSeconds(1)).GET().build(), java.net.http.HttpResponse.BodyHandlers.ofString());
                    ready = response.statusCode() == 200;
                } catch (java.io.IOException ignored) { /* Bis zum tatsächlichen Listenerstart. */ }
                if (!ready) Thread.sleep(25);
            }
            assertThat(ready).as("Paket startet mit migriertem Schema und bestehenden Rollen: %s", Files.readString(log)).isTrue();
            for (var account : accounts) {
                var now = java.time.Instant.now();
                var claims = new com.nimbusds.jwt.JWTClaimsSet.Builder().issuer("finance-release").audience("finance-release-spa")
                    .subject(account.get("id").toString()).issueTime(java.util.Date.from(now)).notBeforeTime(java.util.Date.from(now))
                    .expirationTime(java.util.Date.from(now.plusSeconds(600))).build();
                var jwt = new com.nimbusds.jwt.SignedJWT(new com.nimbusds.jose.JWSHeader(com.nimbusds.jose.JWSAlgorithm.HS256), claims);
                jwt.sign(new com.nimbusds.jose.crypto.MACSigner(key));
                UUID user = (UUID) account.get("id");
                var ownExpenses = expenses.stream().filter(row -> row.get("user_id").equals(user)).toList();
                var ownBudgets = budgets.stream().filter(row -> row.get("user_id").equals(user)).toList();
                var ownGoals = goals.stream().filter(row -> row.get("user_id").equals(user)).toList();
                LocalDate month = now.atZone(java.time.ZoneId.of("Europe/Berlin")).toLocalDate().withDayOfMonth(1);
                Long budget = ownBudgets.stream().filter(row -> !date(row.get("valid_from")).isAfter(month))
                    .max(java.util.Comparator.comparing(row -> date(row.get("valid_from"))))
                    .map(row -> ((Number) row.get("amount_cents")).longValue()).orElse(null);
                long total = ownExpenses.stream().filter(row -> !date(row.get("recorded_on")).isBefore(month)
                    && date(row.get("recorded_on")).isBefore(month.plusMonths(1)))
                    .mapToLong(row -> ((Number) row.get("amount_cents")).longValue()).sum();
                String bearer = jwt.serialize();
                assertThat(finance(client, origin, bearer, "GET", "/expense-budget/budget", null))
                    .isEqualTo(json(nullableMap("amountCents", budget)));
                assertThat(finance(client, origin, bearer, "GET", "/expense-budget/expenses", null).valueStream().toList())
                    .containsExactlyInAnyOrderElementsOf(ownExpenses.stream().map(this::expenseResponse).toList());
                assertThat(finance(client, origin, bearer, "GET", "/expenses", null))
                    .isEqualTo(finance(client, origin, bearer, "GET", "/expense-budget/expenses", null));
                var summary = new LinkedHashMap<String, Object>();
                summary.put("month", month.toString()); summary.put("budgetCents", budget); summary.put("expensesCents", total);
                summary.put("remainingCents", budget == null ? null : budget - total);
                assertThat(finance(client, origin, bearer, "GET", "/expense-budget/month-summary", null)).isEqualTo(json(summary));
                assertThat(finance(client, origin, bearer, "GET", "/savings-goals", null).valueStream().toList())
                    .containsExactlyInAnyOrderElementsOf(ownGoals.stream().map(this::goalResponse).toList());

                long changedBudget = budget == null ? 123 : budget + 123;
                var expectedBudget = json(Map.of("amountCents", changedBudget));
                assertThat(finance(client, origin, bearer, "PUT", "/expense-budget/budget", Map.of("amountCents", changedBudget))).isEqualTo(expectedBudget);
                assertThat(finance(client, origin, bearer, "GET", "/expense-budget/budget", null)).isEqualTo(expectedBudget);
                assertThat(admin.queryForObject("SELECT amount_cents FROM budget.budgets WHERE user_id = ? AND valid_from = ?", Long.class, user, month)).isEqualTo(changedBudget);
                for (var historical : ownBudgets) {
                    if (date(historical.get("valid_from")).isBefore(month))
                        assertThat(admin.queryForObject("SELECT amount_cents FROM budget.budgets WHERE user_id = ? AND valid_from = ?", Long.class,
                            user, date(historical.get("valid_from")))).isEqualTo(historical.get("amount_cents"));
                }

                var changedExpense = new LinkedHashMap<>(ownExpenses.getFirst());
                changedExpense.put("name", "Migriert geprüft 🥖");
                changedExpense.put("amount_cents", ((Number) changedExpense.get("amount_cents")).longValue() + 3);
                assertThat(finance(client, origin, bearer, "PUT", "/expenses/" + changedExpense.get("id"),
                    Map.of("name", changedExpense.get("name"), "amountCents", changedExpense.get("amount_cents")))).isEqualTo(expenseResponse(changedExpense));
                assertThat(admin.queryForMap("SELECT * FROM expenses.expenses WHERE user_id = ? AND id = ?", user, changedExpense.get("id"))).isEqualTo(changedExpense);
                assertThat(finance(client, origin, bearer, "GET", "/expense-budget/expenses", null).valueStream().toList())
                    .containsExactlyInAnyOrderElementsOf(ownExpenses.stream().map(row -> expenseResponse(row.get("id").equals(changedExpense.get("id")) ? changedExpense : row)).toList());

                assertThat(finance(client, origin, bearer, "GET", "/expenses", null))
                    .isEqualTo(finance(client, origin, bearer, "GET", "/expense-budget/expenses", null));

                var changedGoal = new LinkedHashMap<>(ownGoals.getFirst());
                changedGoal.put("progress_cents", 17L); // Absolutes Ersetzen, auch nach vorherigem Überziel-Fortschritt.
                assertThat(finance(client, origin, bearer, "PUT", "/savings-goals/" + changedGoal.get("id") + "/progress",
                    Map.of("progressCents", 17))).isEqualTo(goalResponse(changedGoal));
                assertThat(admin.queryForMap("SELECT * FROM savings_goals.goals WHERE user_id = ? AND id = ?", user, changedGoal.get("id"))).isEqualTo(changedGoal);
                assertThat(finance(client, origin, bearer, "GET", "/savings-goals", null).valueStream().toList())
                    .containsExactly(goalResponse(changedGoal));
            }
        } finally {
            process.destroy();
            if (!process.waitFor(5, java.util.concurrent.TimeUnit.SECONDS)) { process.destroyForcibly(); process.waitFor(); }
            Files.deleteIfExists(log);
        }
    }

    private JsonNode finance(HttpClient client, String origin, String bearer, String method, String path, Object body) throws Exception {
        var request = java.net.http.HttpRequest.newBuilder(java.net.URI.create(origin + (path.startsWith("/expenses") ? "/api/v2" : "/api/v1") + path))
            .header("Authorization", "Bearer " + bearer);
        if (body != null) request.header("Content-Type", "application/json");
        var response = client.send(request.method(method, body == null ? java.net.http.HttpRequest.BodyPublishers.noBody()
            : java.net.http.HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body))).build(), java.net.http.HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).as("%s %s: %s", method, path, response.body()).isEqualTo(200);
        assertThat(response.headers().firstValue("Cache-Control")).hasValue("no-store");
        return JSON.readTree(response.body());
    }

    private JsonNode expenseResponse(Map<String, Object> row) {
        return json(Map.of("id", row.get("id").toString(), "name", row.get("name"), "amountCents", row.get("amount_cents"),
            "recordedOn", row.get("recorded_on").toString()));
    }

    private JsonNode goalResponse(Map<String, Object> row) {
        var response = new LinkedHashMap<String, Object>();
        response.put("id", row.get("id").toString()); response.put("name", row.get("name"));
        response.put("targetAmountCents", row.get("target_amount_cents")); response.put("progressCents", row.get("progress_cents"));
        response.put("targetDate", row.get("target_date") == null ? null : row.get("target_date").toString());
        return json(response);
    }

    private static Map<String, Object> nullableMap(String key, Object value) {
        var result = new LinkedHashMap<String, Object>(); result.put(key, value); return result;
    }
    private static JsonNode json(Object value) { return JSON.readTree(JSON.writeValueAsString(value)); }
    private static LocalDate date(Object value) { return LocalDate.parse(value.toString()); }

    private void provision(JdbcTemplate admin) throws Exception {
        String sql = Files.readString(ArchitectureTest.projectRoot().resolve("deploy/provision-finance-grants.sql"));
        admin.execute(sql.lines().filter(line -> !line.startsWith("\\")).collect(java.util.stream.Collectors.joining("\n")));
    }
}

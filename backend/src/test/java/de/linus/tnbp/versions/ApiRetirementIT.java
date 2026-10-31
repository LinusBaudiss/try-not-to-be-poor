package de.linus.tnbp.versions;

import static org.assertj.core.api.Assertions.*;
import de.linus.tnbp.TnbpApplication;
import java.net.URI;
import java.net.http.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.web.server.context.WebServerApplicationContext;

class ApiRetirementIT {
    @Test void jedeV1OperationWirdVorSecurityUndFachcodeAbgewiesenV2BleibtNutzbar() throws Exception {
        try (var db = new VersionDatabase()) {
            db.retire();
            var application = new SpringApplication(TnbpApplication.class);
            try (var context = application.run("--server.address=127.0.0.1", "--server.port=0",
                    "--spring.datasource.url=" + db.url, "--spring.datasource.username=tnbp_runtime", "--spring.datasource.password=runtime-test-only",
                    "--spring.flyway.url=" + db.url, "--spring.flyway.user=tnbp_migrator", "--spring.flyway.password=migration-test-only",
                    "--api.version.mode=retired", "--api.version.release-sha256=" + VersionDatabase.HASH,
                    "--access.session.signing-key=" + java.util.Base64.getEncoder().encodeToString(new byte[32]),
                    "--access.session.issuer=transition-it", "--access.session.audience=transition-spa-it",
                    "--access.session.origin=https://localhost:4200",
                    "--api.version.instance-id=" + UUID.randomUUID())) {
                int port = ((WebServerApplicationContext) context).getWebServer().getPort();
                var client = HttpClient.newHttpClient();
                try (var locked = db.admin.getDataSource().getConnection()) {
                locked.setAutoCommit(false);
                // Jeder Fach-/Zugangslesezugriff würde hier tatsächlich warten.
                locked.createStatement().execute("LOCK TABLE access.accounts, access.session_families, access.refresh_tokens, expenses.expenses, budget.budgets, savings_goals.goals IN ACCESS EXCLUSIVE MODE");
                String bearer = ReleaseTransitionIT.token(UUID.randomUUID());
                for (String path : new String[]{"/access/csrf", "/access/login", "/access/refresh", "/access/logout", "/access/registrations", "/access/me",
                        "/expense-budget/budget", "/expense-budget/expenses", "/expense-budget/expenses/" + UUID.randomUUID(),
                        "/expense-budget/month-summary", "/savings-goals", "/savings-goals/" + UUID.randomUUID(), "/savings-goals/" + UUID.randomUUID() + "/progress"}) {
                    for (String method : new String[]{"GET", "POST", "PUT", "DELETE"}) {
                        var response = client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/v1" + path))
                            .timeout(java.time.Duration.ofSeconds(2)).header("Authorization", "Bearer " + bearer)
                            .method(method, HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
                        assertThat(response.statusCode()).as(method + path).isEqualTo(401);
                        assertThat(response.body()).contains("CLIENT_UPDATE_REQUIRED", "\"updateUrl\":\"/aktualisieren\"").doesNotContain("userId", "amountCents");
                        assertThat(response.headers().firstValue("Cache-Control")).hasValue("no-store");
                    }
                }
                locked.rollback();
                }
                var v2 = client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/v2/access/csrf")).GET().build(), HttpResponse.BodyHandlers.ofString());
                assertThat(v2.statusCode()).isEqualTo(200);
                assertThat(v2.body()).contains("token");
                assertThat(v2.headers().firstValue("Cache-Control")).hasValue("no-store");
            }
        }
    }
}

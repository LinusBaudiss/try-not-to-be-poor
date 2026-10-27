package de.linus.tnbp.expensebudget;

import static org.assertj.core.api.Assertions.assertThat;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Import;

/** Dieselbe echte PostgreSQL-Matrix prüft v1 und v2. */
@Import(BudgetIT.Time.class)
class BudgetV2IT extends BudgetIT {
    @Override String path() { return "/api/v2/budget"; }

    @Test void versionenTeilenBestandUndNurVorgeseheneMethodenSindOffen() throws Exception {
        assertThat(save(first, 123).statusCode()).isEqualTo(200);
        var client = HttpClient.newHttpClient();
        var legacy = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/expense-budget/budget"))
            .header("Authorization", "Bearer " + token(first)).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(legacy.statusCode()).isEqualTo(200);
        assertThat(legacy.body()).isEqualTo(call("GET", null, token(first)).body());
        var write = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path()))
            .header("Authorization", "Bearer " + token(first)).header("Content-Type", "text/plain")
            .PUT(HttpRequest.BodyPublishers.ofString("{\"amountCents\":5}")).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(write.statusCode()).isEqualTo(415);
        assertThat(write.headers().firstValue("Cache-Control")).hasValue("no-store");
        assertThat(write.headers().firstValue("Accept")).hasValue("application/json");
        for (String route : List.of("/api/v2/budget/extra", "/api/v2/month-summary/extra", "/api/v2/unbekannt")) {
            var denied = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + route))
                .header("Authorization", "Bearer " + token(first)).GET().build(), HttpResponse.BodyHandlers.ofString());
            assertThat(denied.statusCode()).as(route).isEqualTo(403);
        }
        assertThat(call("POST", "{}", token(first)).statusCode()).isEqualTo(403);
        assertThat(call("DELETE", null, token(first)).statusCode()).isEqualTo(403);
        assertThat(amount(call("GET", null, token(first)))).isEqualTo(123);
    }
}

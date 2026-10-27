package de.linus.tnbp.expensebudget;

import static org.assertj.core.api.Assertions.assertThat;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Import;

/** Prüft die vollständige HTTP-, RLS-, Betrags-, Kalender- und Commitmatrix über v2. */
@Import(ExpenseIT.Time.class)
class ExpenseV2IT extends ExpenseIT {
    @Override String path() { return "/api/v2/expenses"; }

    @Test void beideVersionenTeilenBestaetigteEintraegeUndV2OeffnetKeineWeiterenRouten() throws Exception {
        String id = expenseId(save(first, 123));
        var client = HttpClient.newHttpClient();
        var v1 = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/expense-budget/expenses"))
            .header("Authorization", "Bearer " + token(first)).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(v1.statusCode()).isEqualTo(200);
        assertThat(v1.body()).isEqualTo(call("GET", null, token(first)).body());
        assertThat(update(first, id, "Über v2 geändert", 234).statusCode()).isEqualTo(200);
        for (String route : List.of("/api/v2/expenses/" + id, "/api/v2/expenses/" + id + "/extra", "/api/v2/budget", "/api/v2/unbekannt")) {
            var denied = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + route))
                .header("Authorization", "Bearer " + token(first)).GET().build(), HttpResponse.BodyHandlers.ofString());
            assertThat(denied.statusCode()).as(route).isEqualTo(403);
            assertThat(denied.headers().firstValue("Cache-Control")).hasValue("no-store");
        }
        // Die Bearer-Ausnahmen für Ausgaben dürfen den Sitzungs-CSRF-Schutz nicht abschalten.
        for (String version : List.of("v1", "v2")) for (String action : List.of("login", "refresh", "logout")) {
            var denied = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/" + version + "/access/" + action))
                .header("Origin", "https://localhost:4200").header("Authorization", "Bearer " + token(first))
                .POST(HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
            assertThat(denied.statusCode()).as(version + "/" + action).isEqualTo(403);
            assertThat(denied.headers().firstValue("Cache-Control")).hasValue("no-store");
        }
        assertThat(count(first)).isEqualTo(1);
    }
}

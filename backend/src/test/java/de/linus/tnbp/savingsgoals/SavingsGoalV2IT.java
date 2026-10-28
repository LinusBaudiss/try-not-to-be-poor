package de.linus.tnbp.savingsgoals;

import static org.assertj.core.api.Assertions.*;
import java.net.URI;
import java.net.http.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Import;

/** Dieselbe echte PostgreSQL-/HTTP-Matrix wie v1, ergänzt um das geschlossene signierte Gate. */
@Import(SavingsGoalIT.Time.class)
class SavingsGoalV2IT extends SavingsGoalIT {
    @Override String path() { return "/api/v2/savings-goals"; }

    @Test void beideVersionenTeilenBestandUndNegativeWerteBleibenOhneDatenwirkungGesperrt() throws Exception {
        String id = goal(first);
        assertThat(progress(id, "{\"progressCents\":7000}", token(first)).statusCode()).isEqualTo(200);
        String before = call("GET", null, token(first)).body();
        for (long cents : new long[] {-1, -3000, -9007199254740991L}) {
            var rejected = progress(id, "{\"progressCents\":" + cents + "}", token(first));
            assertThat(rejected.statusCode()).isEqualTo(409);
            assertThat(JSON.readTree(rejected.body()).get("code").asText()).isEqualTo("FEATURE_NOT_AVAILABLE");
            assertThat(call("GET", null, token(first)).body()).isEqualTo(before);
        }
        for (String value : List.of("-9007199254740992", "-9223372036854775808", "-1.0", "-1e1", "\"-1\""))
            assertThat(progress(id, "{\"progressCents\":" + value + "}", token(first)).statusCode()).isEqualTo(400);
        String other = goal(second);
        var foreign = progress(other, "{\"progressCents\":-1}", token(first));
        var missing = progress(UUID.randomUUID().toString(), "{\"progressCents\":-1}", token(first));
        assertThat(foreign.statusCode()).isEqualTo(404);
        assertThat(foreign.body()).isEqualTo(missing.body());
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/savings-goals"))
            .header("Authorization", "Bearer " + token(first)).GET().build();
        assertThat(HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString()).body()).isEqualTo(before);
    }

    @Test void gemischteVersionenPflegenDenselbenBestandInBeidenRichtungen() throws Exception {
        for (String creator : List.of("v1", "v2")) {
            String editor = creator.equals("v1") ? "v2" : "v1";
            var created = version(creator, "POST", "", "{\"name\":\"Bestand\",\"targetAmountCents\":10000,\"targetDate\":\"2028-02-29\"}");
            assertThat(created.statusCode()).isEqualTo(201);
            String id = JSON.readTree(created.body()).get("id").asText();
            assertThat(version(editor, "GET", "", null).body()).isEqualTo(version(creator, "GET", "", null).body());
            var edited = version(editor, "PUT", "/" + id, "{\"name\":\"Bearbeitet\",\"targetAmountCents\":20000,\"targetDate\":null}");
            assertThat(edited.statusCode()).isEqualTo(200);
            var progress = version(creator, "PUT", "/" + id + "/progress", "{\"progressCents\":15000}");
            assertThat(progress.statusCode()).isEqualTo(200);
            assertThat(JSON.readTree(progress.body()).get("name").asText()).isEqualTo("Bearbeitet");
            assertThat(JSON.readTree(progress.body()).get("targetAmountCents").asLong()).isEqualTo(20000);
            String state = version(editor, "GET", "", null).body();
            assertThat(state).isEqualTo(version(creator, "GET", "", null).body());
            assertThat(JSON.readTree(state).get(0).get("progressCents").asLong()).isEqualTo(15000);
            var replaced = version(editor, "PUT", "/" + id + "/progress", "{\"progressCents\":7000}");
            assertThat(replaced.statusCode()).isEqualTo(200);
            assertThat(version(creator, "GET", "", null).body()).isEqualTo(version(editor, "GET", "", null).body());
            assertThat(version(creator, "DELETE", "/" + id, null).statusCode()).isEqualTo(204);
            assertThat(version(editor, "GET", "", null).body()).isEqualTo("[]");
            assertThat(version(creator, "GET", "", null).body()).isEqualTo("[]");
        }
    }

    private HttpResponse<String> version(String version, String method, String suffix, String body) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/" + version + "/savings-goals" + suffix))
            .header("Authorization", "Bearer " + token(first));
        if (body != null) request.header("Content-Type", "application/json");
        var response = HttpClient.newHttpClient().send(request.method(method, body == null
            ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.headers().firstValue("Cache-Control")).hasValue("no-store");
        return response;
    }

    @Test void methodenUndMedientypenSindExplizitBegrenzt() throws Exception {
        String id = goal(first), bearer = token(first);
        for (String suffix : List.of("", "/" + id, "/" + id + "/progress")) {
            for (String method : List.of("PATCH", "POST", "PUT", "DELETE", "GET")) {
                if (suffix.isEmpty() && List.of("GET", "POST").contains(method)
                    || suffix.equals("/" + id) && List.of("PUT", "DELETE").contains(method)
                    || suffix.endsWith("/progress") && method.equals("PUT")) continue;
                assertThat(call(method, null, bearer, suffix).statusCode()).as(method + suffix).isIn(403, 405);
            }
        }
        for (String suffix : List.of("", "/" + id, "/" + id + "/progress")) {
            var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path() + suffix))
                .header("Authorization", "Bearer " + bearer).header("Content-Type", "text/plain")
                .method(suffix.isEmpty() ? "POST" : "PUT", HttpRequest.BodyPublishers.ofString("{}" )).build();
            var response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
            assertThat(response.statusCode()).isEqualTo(415);
            assertThat(response.headers().firstValue("Cache-Control")).hasValue("no-store");
        }
        assertThat(count(first)).isEqualTo(1);
    }
}

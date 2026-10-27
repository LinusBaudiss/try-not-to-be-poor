package de.linus.tnbp.expensebudget;

import static org.assertj.core.api.Assertions.assertThat;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.ZonedDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Import;

/** Dieselbe echte PostgreSQL-Matrix prüft v1 und v2. */
@Import(MonthSummaryIT.Time.class)
class MonthSummaryV2IT extends MonthSummaryIT {
    @Override String path() { return "/api/v2/month-summary"; }

    @Test void erfolgreicheAntwortLiefertHttpServerzeitFuerDenBrowserkalender() throws Exception {
        var response = call("GET", null, token(first));
        assertThat(response.statusCode()).isEqualTo(200);
        var serverTime = ZonedDateTime.parse(response.headers().firstValue("Date").orElseThrow(), DateTimeFormatter.RFC_1123_DATE_TIME);
        assertThat(serverTime.getOffset()).isEqualTo(ZoneOffset.UTC);
    }

    @Test void fehlendesBudgetMitAusgabenUndSommerWinterKalenderBleibenExakt() throws Exception {
        expense(first, "2026-10-23", 1234);
        summary(null, 1234, null, "2026-10-01");
        CLOCK.now = java.time.Instant.parse("2026-03-31T21:59:59Z");
        expense(first, "2026-03-31", 23);
        summary(null, 23, null, "2026-03-01");
        CLOCK.now = java.time.Instant.parse("2026-03-31T22:00:00Z");
        summary(null, 0, null, "2026-04-01");
        CLOCK.now = java.time.Instant.parse("2026-10-25T00:59:59Z");
        summary(null, 1234, null, "2026-10-01");
        CLOCK.now = java.time.Instant.parse("2026-10-25T01:00:00Z");
        summary(null, 1234, null, "2026-10-01");
        var legacy = HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/expense-budget/month-summary"))
            .header("Authorization", "Bearer " + token(first)).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(legacy.statusCode()).isEqualTo(200);
        assertThat(legacy.body()).isEqualTo(call("GET", null, token(first)).body());
    }
}

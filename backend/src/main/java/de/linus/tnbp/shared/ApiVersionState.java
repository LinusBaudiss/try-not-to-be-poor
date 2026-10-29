package de.linus.tnbp.shared;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.sql.init.dependency.DependsOnDatabaseInitialization;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.DependsOn;

/** Dauerhafte Versionsbarriere; wird bereits beim Aufbau der HTTP-Sicherheitskette geprüft. */
@Component
@DependsOnDatabaseInitialization
@DependsOn("databaseRoleVerifier")
public final class ApiVersionState {
    private final JdbcTemplate jdbc;
    private final boolean retired;

    public ApiVersionState(JdbcTemplate jdbc, @Value("${api.version.mode:compatible}") String mode,
            @Value("${api.version.release-sha256:}") String releaseHash,
            @Value("${api.version.instance-id:}") String instance) {
        this.jdbc = jdbc;
        var states = jdbc.queryForList("SELECT * FROM api_version.state WHERE singleton");
        if (states.size() != 1 || !(states.getFirst().get("v1_retired") instanceof Boolean value))
            throw new IllegalStateException("Eindeutiger Versionszustand erforderlich.");
        retired = value;
        var state = states.getFirst();
        if (!(state.get("signed_progress_used") instanceof Boolean signed)
                || !(state.get("monthly_effects_used") instanceof Boolean monthly) || (signed || monthly) && !retired)
            throw new IllegalStateException("Widersprüchlicher Nutzungszustand.");
        if (retired || state.get("stopped_instance") != null || state.get("retired_at") != null
                || state.get("release_sha256") != null || state.get("schema_sha256") != null || state.get("roles_sha256") != null) {
            if (!(state.get("stopped_instance") instanceof java.util.UUID) || state.get("retired_at") == null
                    || !hash(state.get("release_sha256")) || !hash(state.get("schema_sha256")) || !hash(state.get("roles_sha256")))
                throw new IllegalStateException("Vollständiger technischer Stilllegungsbeleg erforderlich.");
        }
        if (!(mode.equals("compatible") || mode.equals("retired")) || retired != mode.equals("retired"))
            throw new IllegalStateException("Versionskonfiguration widerspricht dem dauerhaften Zustand.");
        if (retired) {
            java.util.UUID.fromString(instance);
            if (!releaseHash.matches("[0-9a-f]{64}") || !releaseHash.equals(states.getFirst().get("release_sha256")))
                throw new IllegalStateException("Der Release benötigt einen passenden Stilllegungsnachweis.");
        }
    }

    public boolean v1Retired() { return retired; }

    private static boolean hash(Object value) { return value instanceof String text && text.matches("[0-9a-f]{64}"); }

    public void markSignedProgress(FinanceContext context) { mark(context, "signed-progress"); }
    public void markMonthlyEffect(FinanceContext context) { mark(context, "monthly-effect"); }

    private void mark(FinanceContext context, String kind) {
        context.requireWrite();
        jdbc.query("SELECT api_version.mark_usage(?)", row -> {}, kind);
    }
}

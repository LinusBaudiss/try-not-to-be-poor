package de.linus.tnbp.versions;

import static org.assertj.core.api.Assertions.*;
import de.linus.tnbp.shared.ApiVersionState;
import de.linus.tnbp.shared.FinanceTransactions;
import java.time.Clock;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

class ApiVersionStateIT {
    @Test void jederBelegbestandteilWirdInSqlUndBeimFruehenJavaStartErzwungen() {
        try (var db = new VersionDatabase()) {
            db.retire();
            for (String field : new String[]{"release_sha256", "schema_sha256", "roles_sha256", "stopped_instance", "retired_at"})
                assertThatThrownBy(() -> db.admin.execute("UPDATE api_version.state SET " + field + "=NULL"))
                    .as(field).isInstanceOf(org.springframework.dao.DataAccessException.class);
            // Beschädigten Wiederherstellungsstand unabhängig von den SQL-Checks simulieren.
            for (String constraint : db.admin.queryForList("SELECT conname FROM pg_constraint WHERE conrelid='api_version.state'::regclass AND contype='c'", String.class))
                db.admin.execute("ALTER TABLE api_version.state DROP CONSTRAINT \"" + constraint + "\"");
            var complete = db.admin.queryForMap("SELECT * FROM api_version.state");
            for (String field : new String[]{"release_sha256", "schema_sha256", "roles_sha256", "stopped_instance", "retired_at"}) {
                db.admin.execute("UPDATE api_version.state SET " + field + "=NULL");
                assertThatThrownBy(() -> new ApiVersionState(db.runtime, "retired", VersionDatabase.HASH, UUID.randomUUID().toString()))
                    .as(field).isInstanceOf(IllegalStateException.class);
                db.admin.update("UPDATE api_version.state SET " + field + "=?", complete.get(field));
            }
        }
    }
    @Test void minimaleRechteUndFehlenderNachweisBleibenGeschlossen() {
        try (var db = new VersionDatabase()) {
            var state = new ApiVersionState(db.runtime, "compatible", "", "");
            assertThat(state.v1Retired()).isFalse();
            assertThatThrownBy(() -> new ApiVersionState(db.runtime, "retired", VersionDatabase.HASH, UUID.randomUUID().toString()))
                .isInstanceOf(IllegalStateException.class);
            for (String sql : new String[]{"UPDATE api_version.state SET v1_retired=true", "DELETE FROM api_version.state",
                    "SELECT * FROM api_version.lifecycle", "UPDATE api_version.lifecycle SET active=false",
                    "DELETE FROM api_version.lifecycle", "TRUNCATE api_version.lifecycle",
                    "TRUNCATE api_version.state", "INSERT INTO api_version.state(singleton) VALUES (true)",
                    "SELECT api_version.set_retirement(true,gen_random_uuid(),repeat('a',64),repeat('a',64),repeat('a',64))",
                    "SELECT api_version.mark_usage('signed-progress')"})
                assertThatThrownBy(() -> db.runtime.execute(sql)).as(sql).isInstanceOf(org.springframework.dao.DataAccessException.class);
            assertThat(db.runtime.queryForObject("SELECT has_schema_privilege(current_user,'api_version','CREATE')", Boolean.class)).isFalse();
            assertThat(db.admin.queryForObject("SELECT proconfig::text FROM pg_proc WHERE oid='api_version.mark_usage(text)'::regprocedure", String.class))
                .contains("search_path=pg_catalog, api_version");
            assertThat(db.admin.queryForObject("SELECT EXISTS(SELECT FROM pg_proc p, aclexplode(p.proacl) a WHERE p.oid='api_version.mark_usage(text)'::regprocedure AND a.grantee=0)", Boolean.class)).isFalse();
            db.admin.execute("DELETE FROM api_version.state WHERE false");
            assertThatThrownBy(() -> db.admin.execute("DELETE FROM api_version.state")).hasMessageContaining("dauerhaft");
            db.admin.execute("ALTER TABLE api_version.state DISABLE TRIGGER monotone_usage");
            db.admin.execute("DELETE FROM api_version.state");
            assertThatThrownBy(() -> new ApiVersionState(db.runtime, "compatible", "", "")).isInstanceOf(IllegalStateException.class);
        }
    }

    @Test void markerTeilenAeusserenCommitRollbackUndDauerhafteRuecknahmegrenze() {
        try (var db = new VersionDatabase()) {
            db.retire();
            var state = new ApiVersionState(db.runtime, "retired", VersionDatabase.HASH, UUID.randomUUID().toString());
            var transactions = new FinanceTransactions(db.runtime, Clock.systemUTC(), new DataSourceTransactionManager(db.runtimeSource));
            assertThatThrownBy(() -> transactions.mutate(UUID.randomUUID(), context -> {
                state.markSignedProgress(context);
                state.markMonthlyEffect(context);
                throw new IllegalStateException("Abbruch vor Commit");
            })).hasMessage("Abbruch vor Commit");
            assertThat(db.admin.queryForObject("SELECT signed_progress_used OR monthly_effects_used FROM api_version.state", Boolean.class)).isFalse();
            assertThatThrownBy(() -> transactions.read(UUID.randomUUID(), context -> { state.markSignedProgress(context); return null; }))
                .isInstanceOf(IllegalStateException.class);
            transactions.mutate(UUID.randomUUID(), context -> { state.markSignedProgress(context); state.markMonthlyEffect(context); return null; });
            assertThat(db.admin.queryForObject("SELECT signed_progress_used AND monthly_effects_used FROM api_version.state", Boolean.class)).isTrue();
            assertThatThrownBy(() -> db.admin.execute("UPDATE api_version.state SET signed_progress_used=false")).hasMessageContaining("dauerhaft");
            assertThatThrownBy(() -> db.admin.execute("SELECT api_version.set_retirement(false,gen_random_uuid(),repeat('b',64),repeat('b',64),repeat('b',64))"))
                .hasMessageContaining("Rücknahme");
            assertThatThrownBy(() -> new ApiVersionState(db.runtime, "compatible", "", "")).isInstanceOf(IllegalStateException.class);
            assertThatThrownBy(() -> new ApiVersionState(db.runtime, "retired", "b".repeat(64), UUID.randomUUID().toString()))
                .isInstanceOf(IllegalStateException.class);
        }
    }
}

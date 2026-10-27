package de.linus.tnbp.shared;

import java.time.Clock;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

/** Technische Kontogrenze; besitzt weder Fachzustand noch Finanzabläufe. */
@Component
public final class FinanceTransactions {
    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final TransactionTemplate mutations;
    private final TransactionTemplate reads;

    public FinanceTransactions(JdbcTemplate jdbc, Clock clock, PlatformTransactionManager manager) {
        this.jdbc = jdbc;
        this.clock = clock;
        mutations = new TransactionTemplate(manager);
        mutations.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
        reads = new TransactionTemplate(manager);
        reads.setReadOnly(true);
        reads.setIsolationLevel(TransactionDefinition.ISOLATION_REPEATABLE_READ);
    }

    public <T> T mutate(UUID userId, Function<FinanceContext, T> work) { return execute(userId, true, work); }
    public <T> T read(UUID userId, Function<FinanceContext, T> work) { return execute(userId, false, work); }

    private <T> T execute(UUID userId, boolean write, Function<FinanceContext, T> work) {
        Objects.requireNonNull(userId, "Verifiziertes Konto erforderlich.");
        // Kein stilles Joinen: Nur der äußere Aufruf darf den Commit bestätigen.
        if (FinanceContext.bound() || TransactionSynchronizationManager.isActualTransactionActive())
            throw new IllegalStateException("Eine Finanztransaktion darf nicht verschachtelt werden.");
        return (write ? mutations : reads).execute(status -> {
            String previous = jdbc.queryForObject("SELECT current_setting('app.user_id', true)", String.class);
            if (previous != null && !previous.isEmpty())
                throw new IllegalStateException("Unerwarteter Kontokontext auf der Verbindung.");
            jdbc.queryForObject("SELECT set_config('app.user_id', ?, true)", String.class, userId.toString());
            if (write) {
                // Kanonische UUID, identischer Seed und dieselbe Sperre auch für leere Konten.
                jdbc.query("SELECT pg_advisory_xact_lock(hashtextextended(?, 14))", row -> {}, userId.toString());
            }
            var connection = jdbc.execute((ConnectionCallback<java.sql.Connection>) DataSourceUtils::getTargetConnection);
            String role = jdbc.queryForObject("SELECT current_user", String.class);
            // Genau eine Uhrabfrage, bei Mutationen erst nach dem Sperrerwerb.
            var context = new FinanceContext(userId, clock.instant(), write, connection, role, jdbc);
            FinanceContext.bind(context);
            try {
                T result = work.apply(context);
                context.requireRead();
                return result;
            }
            finally { FinanceContext.clear(); }
        }); // TransactionTemplate liefert erst nach dem erfolgreichen äußeren Commit.
    }
}

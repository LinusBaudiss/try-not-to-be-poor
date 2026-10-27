package de.linus.tnbp.shared;

import java.sql.Connection;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Nur innerhalb der äußeren Kontotransaktion verwendbarer Ausführungskontext. */
public final class FinanceContext {
    private static final ThreadLocal<FinanceContext> CURRENT = new ThreadLocal<>();
    private static final ZoneId BERLIN = ZoneId.of("Europe/Berlin");
    private final UUID userId;
    private final Instant instant;
    private final LocalDate day;
    private final boolean writable;
    private final Connection connection;
    private final String role;
    private final JdbcTemplate jdbc;

    FinanceContext(UUID userId, Instant instant, boolean writable, Connection connection, String role, JdbcTemplate jdbc) {
        this.userId = userId;
        this.instant = instant;
        this.day = instant.atZone(BERLIN).toLocalDate();
        this.writable = writable;
        this.connection = connection;
        this.role = role;
        this.jdbc = jdbc;
    }

    public UUID userId() { return userId; }
    public Instant instant() { return instant; }
    public LocalDate day() { return day; }
    public LocalDate month() { return day.withDayOfMonth(1); }

    public void requireRead() { require(false); }
    public void requireWrite() { require(true); }

    private void require(boolean write) {
        if (CURRENT.get() != this || !TransactionSynchronizationManager.isActualTransactionActive() || write && !writable)
            throw new IllegalStateException("Kein passender Finanztransaktionskontext.");
        boolean sameConnection = Boolean.TRUE.equals(jdbc.execute((ConnectionCallback<Boolean>) current ->
            DataSourceUtils.getTargetConnection(current) == connection));
        Boolean sameIdentity = jdbc.queryForObject("SELECT current_user = ? AND current_setting('app.user_id', true) = ?",
            Boolean.class, role, userId.toString());
        if (!sameConnection || !Boolean.TRUE.equals(sameIdentity))
            throw new IllegalStateException("Der Finanztransaktionskontext wurde gewechselt.");
    }

    static void bind(FinanceContext context) { CURRENT.set(context); }
    static void clear() { CURRENT.remove(); }
    static boolean bound() { return CURRENT.get() != null; }
}

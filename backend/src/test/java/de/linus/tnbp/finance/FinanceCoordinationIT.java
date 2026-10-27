package de.linus.tnbp.finance;

import static org.assertj.core.api.Assertions.*;
import de.linus.tnbp.access.PostgresFixture;
import de.linus.tnbp.budget.Budgets;
import de.linus.tnbp.expenses.Expenses;
import de.linus.tnbp.savingsgoals.SavingsGoals;
import de.linus.tnbp.shared.FinanceContext;
import de.linus.tnbp.shared.FinanceTransactions;
import de.linus.tnbp.shared.Money;
import java.sql.Connection;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import javax.sql.DataSource;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest
class FinanceCoordinationIT {
    static final Instant NOW = Instant.parse("2026-10-31T22:59:59Z");
    static final CountingClock CLOCK = new CountingClock();
    @Autowired FinanceApplication application;
    @Autowired FinanceTransactions transactions;
    @Autowired Expenses expenses;
    @Autowired Budgets budgets;
    @Autowired SavingsGoals goals;
    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource source;
    UUID first, second;

    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        PostgresFixture.configure((key, value) -> registry.add(key, () -> value));
    }
    @TestConfiguration static class Time {
        @Bean @Primary Clock financeClock() { return CLOCK; }
    }
    static final class CountingClock extends Clock {
        volatile Instant now = NOW;
        final AtomicInteger calls = new AtomicInteger();
        @Override public ZoneId getZone() { return ZoneId.of("Pacific/Honolulu"); }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(now, zone); }
        @Override public Instant instant() { calls.incrementAndGet(); return now; }
    }
    @BeforeEach void reset() {
        PostgresFixture.ADMIN.execute("TRUNCATE access.accounts CASCADE");
        CLOCK.now = NOW; CLOCK.calls.set(0);
        first = UUID.randomUUID(); second = UUID.randomUUID();
        for (UUID user : List.of(first, second)) PostgresFixture.ADMIN.update(
            "INSERT INTO access.accounts VALUES (?, ?, '$argon2id$synthetic', CURRENT_TIMESTAMP)", user, user + "@example.org");
    }

    enum Mutation { CREATE_EXPENSE, UPDATE_EXPENSE, DELETE_EXPENSE, BUDGET, CREATE_GOAL, UPDATE_GOAL, DELETE_GOAL, PROGRESS }

    @Test void monatsprojektionNormalisiertEinDatumInDerMonatsmitteAufDenGanzenKalendermonat() {
        String[] days = {"2026-09-01", "2026-09-30", "2026-10-01", "2026-10-14", "2026-10-31"};
        long[] amounts = {10, 20, 40, 80, 160};
        for (int index = 0; index < days.length; index++) PostgresFixture.ADMIN.update(
            "INSERT INTO expenses.expenses VALUES (?, ?, 'Monatsgrenze', ?, ?::date)", UUID.randomUUID(), first, amounts[index], days[index]);
        PostgresFixture.ADMIN.update("INSERT INTO expenses.expenses VALUES (?, ?, 'Fremdes Konto', 999, DATE '2026-09-15')", UUID.randomUUID(), second);
        assertThat(transactions.<Long>read(first, context -> expenses.monthTotal(context, LocalDate.of(2026, 9, 15)))).isEqualTo(30L);
        assertThat(transactions.<Long>read(first, context -> expenses.monthTotal(context, LocalDate.of(2026, 10, 15)))).isEqualTo(280L);
    }

    @ParameterizedTest @EnumSource(Mutation.class)
    void alleAchtPfadeWartenAufDieselbeKontosperreUndLesenZeitErstDanach(Mutation path) throws Exception {
        var expense = application.saveExpense(first, "Vorher", 100L);
        var goal = application.saveGoal(first, "Vorher", 1000L, LocalDate.of(2020, 2, 29));
        CLOCK.calls.set(0);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor();
             Connection blocker = PostgresFixture.ADMIN.getDataSource().getConnection()) {
            blocker.setAutoCommit(false);
            int holder = holdAccount(blocker, first);
            var pending = executor.submit(() -> {
                switch (path) {
                    case CREATE_EXPENSE -> application.saveExpense(first, "Neu", 200L);
                    case UPDATE_EXPENSE -> application.updateExpense(first, expense.id(), "Neu", 200L);
                    case DELETE_EXPENSE -> application.deleteExpense(first, expense.id());
                    case BUDGET -> application.saveBudget(first, 2000L);
                    case CREATE_GOAL -> application.saveGoal(first, "Neu", 2000L, LocalDate.of(2000, 2, 29));
                    case UPDATE_GOAL -> application.updateGoal(first, goal.id(), "Neu", 2000L, null);
                    case DELETE_GOAL -> application.deleteGoal(first, goal.id());
                    case PROGRESS -> application.progressGoal(first, goal.id(), 2000L);
                }
                return true;
            });
            awaitAdvisory(holder);
            assertThat(pending.isDone()).isFalse();
            assertThat(CLOCK.calls.get()).as("kein Kalenderkontext vor Sperrerwerb").isZero();
            // Anderes Konto wird unter derselben gehaltenen Sperre tatsächlich fertig.
            var independent = executor.submit(() -> application.saveBudget(second, 5L));
            assertThat(independent.get(5, TimeUnit.SECONDS)).isEqualTo(5);
            CLOCK.calls.set(0);
            CLOCK.now = Instant.parse("2026-10-31T23:00:00Z");
            // Auch der Fachzustand muss nach der Sperre neu gelesen werden.
            if (path == Mutation.UPDATE_GOAL || path == Mutation.PROGRESS) {
                try (var st = blocker.prepareStatement("UPDATE savings_goals.goals SET progress_cents = 123, name = 'Nach Sperre' WHERE id = ?")) {
                    st.setObject(1, goal.id()); st.executeUpdate();
                }
            }
            blocker.commit();
            assertThat(pending.get(5, TimeUnit.SECONDS)).isTrue();
            assertThat(CLOCK.calls.get()).as("genau ein Zeitpunkt je Mutation").isEqualTo(1);
            if (path == Mutation.CREATE_EXPENSE)
                assertThat(application.allExpenses(first)).filteredOn(item -> item.name().equals("Neu"))
                    .extracting(Expenses.Expense::recordedOn).containsExactly(LocalDate.of(2026, 11, 1));
            if (path == Mutation.UPDATE_EXPENSE)
                assertThat(application.allExpenses(first).getFirst().recordedOn()).isEqualTo(expense.recordedOn());
            if (path == Mutation.BUDGET)
                assertThat(PostgresFixture.ADMIN.queryForObject("SELECT valid_from FROM budget.budgets WHERE user_id = ?", LocalDate.class, first))
                    .isEqualTo(LocalDate.of(2026, 11, 1));
            if (path == Mutation.UPDATE_GOAL)
                assertThat(application.allGoals(first).getFirst().progressCents()).isEqualTo(123);
            if (path == Mutation.PROGRESS) {
                var updated = application.allGoals(first).getFirst();
                assertThat(updated.name()).isEqualTo("Nach Sperre");
                assertThat(updated.progressCents()).isEqualTo(2000);
            }
        }
    }

    @Test void auchEinLeeresKontoSerialisiertOhneBestehendeZeile() throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor();
             Connection blocker = PostgresFixture.ADMIN.getDataSource().getConnection()) {
            blocker.setAutoCommit(false);
            int holder = holdAccount(blocker, first);
            var pending = executor.submit(() -> application.saveGoal(first, "Erstes Ziel", 1L, null));
            awaitAdvisory(holder);
            assertThat(pending.isDone()).isFalse();
            assertThat(CLOCK.calls.get()).isZero();
            blocker.commit();
            assertThat(pending.get(5, TimeUnit.SECONDS).progressCents()).isZero();
        }
    }

    @Test void alleModuleSchreibenAufDerselbenVerbindungUndRollenBeiSpaetemFehlerZurueck() {
        createProbe();
        try {
            transactions.mutate(first, context -> {
                budgets.save(context, 1000L);
                expenses.save(context, "Gemeinsam", 100L);
                goals.save(context, "Gemeinsam", 500L, null);
                return null;
            });
            var rows = PostgresFixture.ADMIN.queryForList("SELECT * FROM public.finance_probe");
            assertThat(rows).hasSize(3);
            for (String field : List.of("pid", "transaction_id", "account"))
                assertThat(rows.stream().map(row -> row.get(field)).distinct().toList()).hasSize(1);
            assertThat(rows).allSatisfy(row -> {
                assertThat(row.get("account")).isEqualTo(first.toString());
                assertThat(row.get("isolation_level")).isEqualTo("read committed");
                assertThat(row.get("read_only")).isEqualTo("off");
            });
            assertThatThrownBy(() -> transactions.mutate(second, context -> {
                budgets.save(context, 1000L);
                expenses.save(context, "Rollback", 100L);
                goals.save(context, "Rollback", 500L, null);
                throw new IllegalStateException("Gezielter Fehler nach drei Modulschreibzugriffen");
            })).isInstanceOf(IllegalStateException.class);
            assertNoFinanceRows(second);
            assertThat(PostgresFixture.ADMIN.queryForObject("SELECT count(*) FROM public.finance_probe", Integer.class)).isEqualTo(3);
        } finally { dropProbe(); }
    }

    @Test void commitFehlerNimmtDenGesamtenModuluebergreifendenVorgangZurueck() {
        PostgresFixture.ADMIN.execute("CREATE FUNCTION budget.fail_finance_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetischer Commitfehler'; END $$");
        PostgresFixture.ADMIN.execute("CREATE CONSTRAINT TRIGGER fail_finance_commit AFTER INSERT ON budget.budgets DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION budget.fail_finance_commit()");
        try {
            assertThatThrownBy(() -> transactions.mutate(first, context -> {
                budgets.save(context, 1000L); expenses.save(context, "Unbestaetigt", 100L); goals.save(context, "Unbestaetigt", 500L, null);
                return true;
            })).isInstanceOf(RuntimeException.class);
            assertNoFinanceRows(first);
        } finally {
            PostgresFixture.ADMIN.execute("DROP TRIGGER fail_finance_commit ON budget.budgets");
            PostgresFixture.ADMIN.execute("DROP FUNCTION budget.fail_finance_commit()");
        }
    }

    @Test void kontextWechselVerschachtelungAbgelaufenerKontextUndSchreibenImReadWerdenAbgewiesen() {
        assertThatThrownBy(() -> application.currentBudget(null)).isInstanceOf(NullPointerException.class);
        assertThatThrownBy(() -> expenses.all(null)).isInstanceOf(NullPointerException.class);
        var escaped = new AtomicReference<FinanceContext>();
        transactions.read(first, context -> { escaped.set(context); return budgets.current(context, context.month()); });
        assertThatThrownBy(() -> budgets.current(escaped.get(), escaped.get().month())).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> transactions.read(second, context -> expenses.all(escaped.get()))).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> transactions.read(first, context -> budgets.save(context, 1L))).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> transactions.mutate(first, context -> application.saveBudget(second, 1L))).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> transactions.mutate(first, context -> {
            budgets.save(context, 100L);
            jdbc.queryForObject("SELECT set_config('app.user_id', ?, true)", String.class, second.toString());
            return goals.save(context, "Fremder Kontext", 100L, null);
        })).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> transactions.mutate(first, context -> {
            budgets.save(context, 100L);
            jdbc.queryForObject("SELECT set_config('app.user_id', ?, true)", String.class, second.toString());
            return true; // Auch ein Wechsel nach dem letzten Modulzugriff darf nicht committen.
        })).isInstanceOf(IllegalStateException.class);
        assertNoFinanceRows(first); assertNoFinanceRows(second);
    }

    @Test void poolVerbindungenEnthaltenNachCommitUndRollbackKeinenKontokontext() throws Exception {
        application.saveBudget(first, 100L);
        assertThatThrownBy(() -> transactions.mutate(second, context -> {
            expenses.save(context, "Fehler", 1L); throw new IllegalStateException();
        })).isInstanceOf(IllegalStateException.class);
        var connections = new ArrayList<Connection>();
        try {
            for (int i = 0; i < 8; i++) connections.add(source.getConnection());
            for (Connection connection : connections) {
                try (var st = connection.createStatement(); var rs = st.executeQuery("SELECT NULLIF(current_setting('app.user_id', true), '') IS NULL")) {
                    rs.next(); assertThat(rs.getBoolean(1)).isTrue();
                }
                for (String table : List.of("budget.budgets", "expenses.expenses", "savings_goals.goals")) {
                    try (var st = connection.createStatement(); var rs = st.executeQuery("SELECT count(*) FROM " + table)) {
                        rs.next(); assertThat(rs.getInt(1)).isZero();
                    }
                }
            }
        } finally { for (Connection connection : connections) connection.close(); }
    }

    @Test void commitZwischenGetrenntenProjektionenBleibtImGemeinsamenReadOnlyRepeatableReadSnapshot() throws Exception {
        application.saveBudget(first, 1000L); application.saveExpense(first, "Vorher", 100L);
        var budgetRead = new CountDownLatch(1);
        var writerCommitted = new CountDownLatch(1);
        var snapshotBudgets = org.mockito.Mockito.spy(budgets);
        org.mockito.Mockito.doAnswer(invocation -> {
            Object result = invocation.callRealMethod();
            assertThat(jdbc.queryForObject("SHOW transaction_isolation", String.class)).isEqualTo("repeatable read");
            assertThat(jdbc.queryForObject("SHOW transaction_read_only", String.class)).isEqualTo("on");
            budgetRead.countDown();
            assertThat(writerCommitted.await(5, TimeUnit.SECONDS)).isTrue();
            return result;
        }).when(snapshotBudgets).current(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
        var reader = new FinanceApplication(transactions, expenses, snapshotBudgets, goals);
        CLOCK.calls.set(0);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var pending = executor.submit(() -> reader.currentSummary(first));
            try {
                assertThat(budgetRead.await(5, TimeUnit.SECONDS)).isTrue();
                transactions.mutate(first, context -> { budgets.save(context, 2000L); expenses.save(context, "Nachher", 200L); return null; });
            } finally { writerCommitted.countDown(); }
            assertThat(pending.get(5, TimeUnit.SECONDS)).isEqualTo(new FinanceApplication.Summary(LocalDate.of(2026, 10, 1), 1000L, 100L, 900L));
            assertThat(CLOCK.calls.get()).isEqualTo(2); // Ein Zeitpunkt für Leser und einer für Schreiber.
        }
        assertThat(application.currentSummary(first)).isEqualTo(new FinanceApplication.Summary(LocalDate.of(2026, 10, 1), 2000L, 300L, 1700L));
    }

    @Test void summenueberlaufRolltAuchVorangegangeneModulschreibzugriffeZurueckUndFortschrittBleibtNichtnegativ() {
        application.saveExpense(first, "Maximum", Money.MAX_CENTS);
        assertThatThrownBy(() -> transactions.mutate(first, context -> {
            budgets.save(context, 5L); goals.save(context, "Rollback", 1L, null); return expenses.save(context, "Zu viel", 1L);
        })).isInstanceOf(Expenses.MonthLimit.class);
        assertThat(application.currentBudget(first)).isNull(); assertThat(application.allGoals(first)).isEmpty();
        var goal = application.saveGoal(first, "Bestand", 1L, null);
        assertThatThrownBy(() -> application.progressGoal(first, goal.id(), -1L)).isInstanceOf(SavingsGoals.InvalidGoal.class);
        assertThat(application.allGoals(first).getFirst().progressCents()).isZero();
        assertThat(application.currentSummary(first).expensesCents()).isEqualTo(Money.MAX_CENTS);
    }

    private int holdAccount(Connection connection, UUID user) throws Exception {
        try (var st = connection.prepareStatement("SELECT pg_advisory_xact_lock(hashtextextended(?, 14)), pg_backend_pid()")) {
            st.setString(1, user.toString());
            try (var rs = st.executeQuery()) { rs.next(); return rs.getInt(2); }
        }
    }
    private void awaitAdvisory(int holder) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        boolean waiting;
        do {
            waiting = Boolean.TRUE.equals(PostgresFixture.ADMIN.queryForObject("SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE wait_event = 'advisory' AND ? = ANY(pg_blocking_pids(pid)))", Boolean.class, holder));
            if (!waiting) Thread.sleep(10);
        } while (!waiting && System.nanoTime() < deadline);
        assertThat(waiting).as("Finanzmutation wartet nachweislich auf dieselbe Seed-14-Kontosperre").isTrue();
    }
    private void assertNoFinanceRows(UUID user) {
        for (String table : List.of("budget.budgets", "expenses.expenses", "savings_goals.goals"))
            assertThat(PostgresFixture.ADMIN.queryForObject("SELECT count(*) FROM " + table + " WHERE user_id = ?", Integer.class, user)).isZero();
    }
    private void createProbe() {
        PostgresFixture.ADMIN.execute("CREATE TABLE public.finance_probe (table_name text, pid integer, transaction_id bigint, account text, isolation_level text, read_only text)");
        PostgresFixture.ADMIN.execute("GRANT INSERT ON public.finance_probe TO tnbp_runtime");
        PostgresFixture.ADMIN.execute("CREATE FUNCTION public.finance_probe() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO public.finance_probe VALUES (TG_TABLE_SCHEMA, pg_backend_pid(), txid_current(), current_setting('app.user_id'), current_setting('transaction_isolation'), current_setting('transaction_read_only')); RETURN NEW; END $$");
        for (String table : List.of("budget.budgets", "expenses.expenses", "savings_goals.goals"))
            PostgresFixture.ADMIN.execute("CREATE TRIGGER finance_probe AFTER INSERT ON " + table + " FOR EACH ROW EXECUTE FUNCTION public.finance_probe()");
    }
    private void dropProbe() {
        for (String table : List.of("budget.budgets", "expenses.expenses", "savings_goals.goals"))
            PostgresFixture.ADMIN.execute("DROP TRIGGER finance_probe ON " + table);
        PostgresFixture.ADMIN.execute("DROP FUNCTION public.finance_probe()");
        PostgresFixture.ADMIN.execute("DROP TABLE public.finance_probe");
    }
}

package de.linus.tnbp.access;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
class DatabaseRoleVerifier implements ApplicationRunner {
    private final JdbcTemplate jdbc;

    DatabaseRoleVerifier(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        Boolean unsafe = jdbc.queryForObject("""
            SELECT r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb
                OR EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                           WHERE n.nspname IN ('access', 'expense_budget', 'savings_goals') AND pg_has_role(current_user, c.relowner, 'MEMBER'))
            FROM pg_roles r WHERE r.rolname = current_user
            """, Boolean.class);
        if (!Boolean.FALSE.equals(unsafe)) {
            throw new IllegalStateException("Die Laufzeitrolle darf weder privilegiert noch Tabellenbesitzer sein.");
        }
    }
}

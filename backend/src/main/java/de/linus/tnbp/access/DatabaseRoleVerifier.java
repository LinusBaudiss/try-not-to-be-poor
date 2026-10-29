package de.linus.tnbp.access;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.sql.init.dependency.DependsOnDatabaseInitialization;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@DependsOnDatabaseInitialization
class DatabaseRoleVerifier implements InitializingBean {
    private final JdbcTemplate jdbc;

    DatabaseRoleVerifier(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void afterPropertiesSet() {
        verify();
    }

    void verify() {
        Boolean unsafe = jdbc.queryForObject("""
            SELECT r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb
                OR EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                           WHERE n.nspname IN ('access', 'expenses', 'budget', 'savings_goals', 'api_version') AND pg_has_role(current_user, c.relowner, 'MEMBER'))
                OR EXISTS (SELECT 1 FROM pg_namespace n
                           WHERE n.nspname IN ('access', 'expenses', 'budget', 'savings_goals', 'api_version')
                             AND (pg_has_role(current_user, n.nspowner, 'MEMBER') OR has_schema_privilege(current_user, n.oid, 'CREATE')))
            FROM pg_roles r WHERE r.rolname = current_user
            """, Boolean.class);
        if (!Boolean.FALSE.equals(unsafe)) {
            throw new IllegalStateException("Die Laufzeitrolle darf weder privilegiert noch Tabellenbesitzer sein.");
        }
        Boolean protectedFinance = jdbc.queryForObject("""
            SELECT count(*) = 3 AND bool_and(c.relrowsecurity AND c.relforcerowsecurity
                AND has_schema_privilege(current_user, n.oid, 'USAGE'))
            FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE (n.nspname, c.relname) IN (('expenses', 'expenses'), ('budget', 'budgets'), ('savings_goals', 'goals'))
            """, Boolean.class);
        if (!Boolean.TRUE.equals(protectedFinance)) {
            throw new IllegalStateException("Die Finanzschemas benötigen minimale Laufzeitrechte und erzwungene RLS.");
        }
        Boolean protectedVersion = jdbc.queryForObject("""
            SELECT has_table_privilege(current_user, 'api_version.state', 'SELECT')
              AND NOT has_table_privilege(current_user, 'api_version.state', 'INSERT,UPDATE,DELETE,TRUNCATE')
              AND NOT has_any_column_privilege(current_user, 'api_version.state', 'INSERT,UPDATE')
              AND NOT has_table_privilege(current_user, 'api_version.lifecycle', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
              AND NOT has_any_column_privilege(current_user, 'api_version.lifecycle', 'INSERT,UPDATE')
              AND NOT has_function_privilege(current_user, 'api_version.set_retirement(boolean,uuid,text,text,text)', 'EXECUTE')
              AND has_function_privilege(current_user, 'api_version.mark_usage(text)', 'EXECUTE')
            """, Boolean.class);
        if (!Boolean.TRUE.equals(protectedVersion))
            throw new IllegalStateException("Der Versionszustand benötigt minimale Laufzeitrechte.");
    }
}

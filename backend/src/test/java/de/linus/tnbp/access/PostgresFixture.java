package de.linus.tnbp.access;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.io.IOException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

/** Echte PostgreSQL-18.6-Instanz ausschließlich mit synthetischen Testdaten. */
final class PostgresFixture {
    static final EmbeddedPostgres POSTGRES = start();
    static final String URL = "jdbc:postgresql://localhost:" + POSTGRES.getPort() + "/tnbp";
    static final JdbcTemplate ADMIN = new JdbcTemplate(new DriverManagerDataSource(URL, "postgres", "postgres"));

    private static EmbeddedPostgres start() {
        try {
            var postgres = EmbeddedPostgres.builder().setPort(0).start();
            var admin = new JdbcTemplate(postgres.getPostgresDatabase());
            admin.execute("CREATE ROLE tnbp_migrator LOGIN PASSWORD 'migration-test-only' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE");
            admin.execute("CREATE ROLE tnbp_runtime LOGIN PASSWORD 'runtime-test-only' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE");
            admin.execute("CREATE DATABASE tnbp OWNER tnbp_migrator");
            return postgres;
        } catch (IOException e) {
            throw new IllegalStateException("Test-PostgreSQL konnte nicht gestartet werden.", e);
        }
    }

    static void configure(java.util.function.BiConsumer<String, String> property) {
        property.accept("spring.datasource.url", URL);
        property.accept("spring.datasource.username", "tnbp_runtime");
        property.accept("spring.datasource.password", "runtime-test-only");
        property.accept("spring.flyway.url", URL);
        property.accept("spring.flyway.user", "tnbp_migrator");
        property.accept("spring.flyway.password", "migration-test-only");
    }

    private PostgresFixture() {}
}

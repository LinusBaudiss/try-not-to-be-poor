package de.linus.tnbp.versions;

import de.linus.tnbp.access.PostgresFixture;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

final class VersionDatabase implements AutoCloseable {
    final String name = "versions_" + UUID.randomUUID().toString().replace("-", "");
    final String url;
    final JdbcTemplate server;
    final JdbcTemplate admin;
    final DriverManagerDataSource runtimeSource;
    final JdbcTemplate runtime;
    static final String HASH = "a".repeat(64);

    VersionDatabase() { this("10"); }
    VersionDatabase(String target) { this(PostgresFixture.POSTGRES, target); }
    VersionDatabase(io.zonky.test.db.postgres.embedded.EmbeddedPostgres postgres, String target) {
        url = "jdbc:postgresql://localhost:" + postgres.getPort() + "/" + name;
        server = new JdbcTemplate(postgres.getPostgresDatabase());
        server.execute("CREATE DATABASE " + name + " OWNER tnbp_migrator");
        Flyway.configure().dataSource(url, "tnbp_migrator", "migration-test-only")
            .schemas("access").defaultSchema("access").target(target).load().migrate();
        admin = new JdbcTemplate(new DriverManagerDataSource(url, "postgres", "postgres"));
        runtimeSource = new DriverManagerDataSource(url, "tnbp_runtime", "runtime-test-only");
        runtime = new JdbcTemplate(runtimeSource);
    }
    void retire() {
        admin.query("SELECT api_version.set_retirement(true, ?, ?, ?, ?)", row -> {}, UUID.randomUUID(), HASH, HASH, HASH);
    }
    @Override public void close() { server.execute("DROP DATABASE " + name + " WITH (FORCE)"); }
}

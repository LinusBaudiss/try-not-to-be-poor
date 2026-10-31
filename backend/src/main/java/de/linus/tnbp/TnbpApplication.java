package de.linus.tnbp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class TnbpApplication {
    public static void main(String[] args) {
        if (java.util.Arrays.asList(args).contains("--api.version.migrate-only=true")) {
            // Kein Spring-Kontext: kein Listener, Controller oder Finanzzugang.
            // Der geschützte Administrator verbindet bei gesperrten Loginrollen;
            // sämtliche DDL läuft mit den unveränderten Migratorrechten.
            String role = System.getenv().getOrDefault("DB_MIGRATION_USER", "tnbp_migrator");
            org.flywaydb.core.Flyway.configure()
                .dataSource(System.getenv().getOrDefault("DB_URL", "jdbc:postgresql://localhost:5432/tnbp"),
                    System.getenv().getOrDefault("DB_ADMIN_USER", "tnbp_admin"), System.getenv("DB_ADMIN_PASSWORD"))
                .initSql("SET ROLE \"" + role.replace("\"", "\"\"") + "\"")
                .schemas("access").defaultSchema("access").load().migrate();
            return;
        }
        SpringApplication.run(TnbpApplication.class, args);
    }
}

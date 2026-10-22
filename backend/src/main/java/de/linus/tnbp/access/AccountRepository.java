package de.linus.tnbp.access;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AccountRepository {
    private final JdbcTemplate jdbc;

    public AccountRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Credentials(UUID id, String passwordHash) {}

    public java.util.Optional<Credentials> findCredentials(String email) {
        return jdbc.query("SELECT id, password_hash FROM access.accounts WHERE email = ?",
            (row, index) -> new Credentials(row.getObject("id", UUID.class), row.getString("password_hash")), email)
            .stream().findFirst();
    }

    public void insert(UUID id, String normalizedEmail, String passwordHash, Instant createdAt) {
        jdbc.update("INSERT INTO access.accounts (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
            id, normalizedEmail, passwordHash, OffsetDateTime.ofInstant(createdAt, ZoneOffset.UTC));
    }
}

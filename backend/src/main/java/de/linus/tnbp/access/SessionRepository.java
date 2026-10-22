package de.linus.tnbp.access;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SessionRepository {
    private final JdbcTemplate jdbc;
    public SessionRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    record Family(UUID id, UUID userId, Instant created, Instant lastUsed, boolean revoked) {}
    record Token(UUID familyId, boolean consumed) {}

    Optional<Token> token(String hash) {
        return jdbc.query("SELECT family_id, consumed FROM access.refresh_tokens WHERE token_hash = ?",
            (r, i) -> new Token(r.getObject("family_id", UUID.class), r.getBoolean("consumed")), hash).stream().findFirst();
    }
    Family lock(UUID id) {
        return jdbc.queryForObject("SELECT * FROM access.session_families WHERE id = ? FOR UPDATE", (r, i) ->
            new Family(r.getObject("id", UUID.class), r.getObject("user_id", UUID.class),
                r.getTimestamp("created_at").toInstant(), r.getTimestamp("last_used_at").toInstant(), r.getBoolean("revoked")), id);
    }
    void create(UUID id, UUID userId, Instant now) {
        jdbc.update("INSERT INTO access.session_families (id, user_id, created_at, last_used_at) VALUES (?, ?, ?, ?)",
            id, userId, at(now), at(now));
    }
    void addToken(String hash, UUID family) {
        jdbc.update("INSERT INTO access.refresh_tokens (token_hash, family_id) VALUES (?, ?)", hash, family);
    }
    void consume(String hash) { jdbc.update("UPDATE access.refresh_tokens SET consumed = TRUE WHERE token_hash = ?", hash); }
    void touch(UUID family, Instant now) {
        jdbc.update("UPDATE access.session_families SET last_used_at = ? WHERE id = ?", at(now), family);
    }
    void revoke(UUID family) { jdbc.update("UPDATE access.session_families SET revoked = TRUE WHERE id = ?", family); }
    private static OffsetDateTime at(Instant instant) { return instant.atOffset(ZoneOffset.UTC); }
}

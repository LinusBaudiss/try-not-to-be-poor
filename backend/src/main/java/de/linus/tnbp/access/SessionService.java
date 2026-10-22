package de.linus.tnbp.access;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class SessionService {
    private final AccountRepository accounts;
    private final SessionRepository sessions;
    private final PasswordEncoder encoder;
    private final PasswordPolicy passwords;
    private final SessionJwt jwt;
    private final Clock clock;
    private final TransactionTemplate transaction;
    private final SecureRandom random = new SecureRandom();
    private final String dummyHash;
    record Issued(String accessToken, Instant expiresAt, UUID userId, String refreshToken, long cookieSeconds) {
        @Override public String toString() { return "Issued[geschützt]"; }
    }

    public SessionService(AccountRepository accounts, SessionRepository sessions, PasswordEncoder encoder,
            PasswordPolicy passwords, SessionJwt jwt, Clock clock, PlatformTransactionManager manager) {
        this.accounts = accounts; this.sessions = sessions; this.encoder = encoder;
        this.passwords = passwords; this.jwt = jwt; this.clock = clock;
        this.transaction = new TransactionTemplate(manager);
        this.dummyHash = encoder.encode(UUID.randomUUID().toString());
    }

    Issued login(String email, String password, String previous) {
        if (!jwt.available()) throw new SessionFailure(503);
        var account = accounts.findCredentials(email == null ? "" : email.strip().toLowerCase(Locale.ROOT));
        boolean matches = encoder.matches(passwords.normalize(password), account.map(AccountRepository.Credentials::passwordHash).orElse(dummyHash));
        if (account.isEmpty() || !matches) throw new SessionFailure(401);
        return transaction.execute(status -> {
            revoke(previous);
            Instant now = clock.instant();
            UUID family = UUID.randomUUID();
            sessions.create(family, account.get().id(), now);
            return issue(family, account.get().id(), now, now);
        });
    }

    Issued refresh(String token) {
        if (!jwt.available()) throw new SessionFailure(503);
        String hash = hash(token);
        // Ein abgelehntes Replay muss den Widerruf vor der 401-Antwort committen.
        Issued issued = transaction.execute(status -> {
            var initial = sessions.token(hash);
            if (initial.isEmpty()) return null;
            var family = sessions.lock(initial.get().familyId());
            var current = sessions.token(hash).orElseThrow();
            Instant now = clock.instant();
            if (family.revoked() || current.consumed() || !now.isBefore(family.lastUsed().plus(Duration.ofDays(30)))
                    || !now.isBefore(family.created().plus(Duration.ofDays(90))) || now.isBefore(family.lastUsed())) {
                sessions.revoke(family.id());
                return null;
            }
            sessions.consume(hash);
            sessions.touch(family.id(), now);
            return issue(family.id(), family.userId(), family.created(), now);
        });
        if (issued == null) throw new SessionFailure(401);
        return issued;
    }

    void logout(String token) { transaction.executeWithoutResult(status -> revoke(token)); }

    private void revoke(String token) {
        sessions.token(hash(token)).ifPresent(existing -> {
            sessions.lock(existing.familyId());
            sessions.revoke(existing.familyId());
        });
    }

    private Issued issue(UUID family, UUID userId, Instant created, Instant now) {
        byte[] bytes = new byte[32]; random.nextBytes(bytes);
        String refresh = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessions.addToken(hash(refresh), family);
        long remaining = Math.min(Duration.ofDays(30).toSeconds(), Duration.between(now, created.plus(Duration.ofDays(90))).toSeconds());
        return new Issued(jwt.issue(userId, now), now.truncatedTo(java.time.temporal.ChronoUnit.SECONDS).plus(SessionJwt.LIFETIME), userId, refresh, remaining);
    }

    static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest((token == null ? "" : token).getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException impossible) { throw new IllegalStateException(); }
    }
}

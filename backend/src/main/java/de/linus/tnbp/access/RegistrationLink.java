package de.linus.tnbp.access;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("registration.link")
public record RegistrationLink(boolean enabled, String sha256, Instant issuedAt, Instant expiresAt) {
    private static final Duration MAX_AGE = Duration.ofDays(30);

    public boolean accepts(String token, Instant now) {
        if (!enabled || sha256 == null || !sha256.matches("[0-9a-fA-F]{64}") || issuedAt == null
                || now.isBefore(issuedAt) || token == null || !token.matches("[A-Za-z0-9_-]{43}")) {
            return false;
        }
        Instant maximum = issuedAt.plus(MAX_AGE);
        Instant end = expiresAt != null && expiresAt.isBefore(maximum) ? expiresAt : maximum;
        if (!now.isBefore(end)) {
            return false;
        }
        try {
            byte[] actual = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.US_ASCII));
            return MessageDigest.isEqual(HexFormat.of().parseHex(sha256), actual);
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 ist nicht verfügbar.", impossible);
        }
    }

    @Override
    public String toString() {
        return "RegistrationLink[geschützt]";
    }
}

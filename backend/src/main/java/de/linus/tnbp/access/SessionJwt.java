package de.linus.tnbp.access;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

@Component
class SessionJwt implements JwtDecoder {
    static final Duration LIFETIME = Duration.ofMinutes(10);
    private final SessionSettings settings;
    private final Clock clock;
    private final byte[] key;

    SessionJwt(SessionSettings settings, Clock clock) {
        this.settings = settings;
        this.clock = clock;
        byte[] decoded = null;
        try {
            decoded = Base64.getDecoder().decode(settings.signingKey() == null ? "" : settings.signingKey());
        } catch (IllegalArgumentException ignored) { /* Unvollständige Konfiguration sperrt Sitzungen. */ }
        this.key = decoded != null && decoded.length >= 32 ? decoded : null;
    }

    boolean available() {
        return key != null && settings.issuer() != null && !settings.issuer().isBlank()
            && settings.audience() != null && !settings.audience().isBlank()
            && settings.origin() != null && settings.origin().matches("https://[^/]+(:[0-9]+)?");
    }

    String issue(UUID userId, Instant now) {
        if (!available()) throw new SessionFailure(503);
        try {
            var claims = new JWTClaimsSet.Builder().issuer(settings.issuer()).audience(settings.audience())
                .subject(userId.toString()).issueTime(Date.from(now)).notBeforeTime(Date.from(now))
                .expirationTime(Date.from(now.plus(LIFETIME))).jwtID(UUID.randomUUID().toString()).build();
            var jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.HS256).type(JOSEObjectType.JWT).build(), claims);
            jwt.sign(new MACSigner(key));
            return jwt.serialize();
        } catch (JOSEException failure) { throw new SessionFailure(503); }
    }

    @Override
    public Jwt decode(String token) {
        try {
            if (!available()) throw new IllegalArgumentException();
            var jwt = SignedJWT.parse(token);
            if (!JWSAlgorithm.HS256.equals(jwt.getHeader().getAlgorithm()) || !jwt.verify(new MACVerifier(key)))
                throw new IllegalArgumentException();
            var claims = jwt.getJWTClaimsSet();
            Instant now = clock.instant();
            Instant issued = claims.getIssueTime().toInstant();
            Instant start = claims.getNotBeforeTime().toInstant();
            Instant end = claims.getExpirationTime().toInstant();
            String subject = claims.getSubject();
            if (!settings.issuer().equals(claims.getIssuer()) || !List.of(settings.audience()).equals(claims.getAudience())
                    || !UUID.fromString(subject).toString().equals(subject) || issued.isAfter(now) || start.isAfter(now)
                    || !now.isBefore(end) || !end.isAfter(issued) || Duration.between(issued, end).compareTo(LIFETIME) > 0)
                throw new IllegalArgumentException();
            return new Jwt(token, issued, end, Map.of("alg", "HS256"), claims.getClaims());
        } catch (Exception failure) { throw new BadJwtException("Ungültige Sitzung."); }
    }
}

package de.linus.tnbp.access;

import static org.assertj.core.api.Assertions.*;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SessionTest {
    static final byte[] KEY = new byte[32];
    static final String KEY_TEXT = Base64.getEncoder().encodeToString(KEY);
    static final Instant NOW = Instant.parse("2026-10-22T18:00:00Z");
    static final SessionSettings SETTINGS = new SessionSettings(KEY_TEXT, "test-issuer", "test-audience", "https://localhost:4200");
    final SessionJwt jwt = new SessionJwt(SETTINGS, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test void signierteTokensHabenZehnMinutenUndUuidIdentitaet() {
        UUID user = UUID.randomUUID();
        var decoded = jwt.decode(jwt.issue(user, NOW));
        assertThat(decoded.getSubject()).isEqualTo(user.toString());
        assertThat(decoded.getExpiresAt()).isEqualTo(NOW.plusSeconds(600));
        assertThatThrownBy(() -> new SessionJwt(SETTINGS, Clock.fixed(NOW.plusSeconds(600), ZoneOffset.UTC))
            .decode(decoded.getTokenValue())).isInstanceOf(org.springframework.security.oauth2.jwt.BadJwtException.class);
    }

    @Test void andererDecoderMitDemselbenExternenSchluesselAkzeptiertVorhandenesJwt() {
        UUID user = UUID.randomUUID();
        String beforeRestart = jwt.issue(user, NOW);
        var restarted = new SessionJwt(SETTINGS, Clock.fixed(NOW.plusSeconds(60), ZoneOffset.UTC));
        assertThat(restarted.decode(beforeRestart).getSubject()).isEqualTo(user.toString());
    }

    @Test void manipulationAlgorithmusAusstellerZielgruppeZeitgrenzenUndSubWerdenGeprueft() throws Exception {
        String token = jwt.issue(UUID.randomUUID(), NOW);
        String[] parts = token.split("\\.");
        String tampered = parts[0] + "." + parts[1].substring(0, parts[1].length()-1) + "A." + parts[2];
        assertThatThrownBy(() -> jwt.decode(tampered)).isInstanceOf(org.springframework.security.oauth2.jwt.BadJwtException.class);
        var good = SignedJWT.parse(token).getJWTClaimsSet();
        var bad = java.util.List.of(
            new JWTClaimsSet.Builder(good).issuer("wrong").build(),
            new JWTClaimsSet.Builder(good).audience("wrong").build(),
            new JWTClaimsSet.Builder(good).subject("1-1-1-1-1").build(),
            new JWTClaimsSet.Builder(good).issueTime(Date.from(NOW.plusSeconds(1))).build(),
            new JWTClaimsSet.Builder(good).notBeforeTime(Date.from(NOW.plusSeconds(1))).build(),
            new JWTClaimsSet.Builder(good).expirationTime(Date.from(NOW)).build(),
            new JWTClaimsSet.Builder(good).expirationTime(Date.from(NOW.plusSeconds(601))).build());
        for (var claims : bad) {
            String signed = signed(claims, JWSAlgorithm.HS256, KEY);
            assertThatThrownBy(() -> jwt.decode(signed)).isInstanceOf(org.springframework.security.oauth2.jwt.BadJwtException.class);
        }
        assertThatThrownBy(() -> jwt.decode(signed(good, JWSAlgorithm.HS384, new byte[48])))
            .isInstanceOf(org.springframework.security.oauth2.jwt.BadJwtException.class);
        byte[] other = KEY.clone(); other[0] = 1;
        assertThatThrownBy(() -> jwt.decode(signed(good, JWSAlgorithm.HS256, other)))
            .isInstanceOf(org.springframework.security.oauth2.jwt.BadJwtException.class);
    }

    @Test void fehlenderOderZuKurzerSchluesselSperrtSitzungen() {
        for (String key : new String[] {"", "ungueltig", Base64.getEncoder().encodeToString(new byte[31])}) {
            var disabled = new SessionJwt(new SessionSettings(key, "issuer", "audience", "https://localhost"), Clock.systemUTC());
            assertThat(disabled.available()).isFalse();
            assertThatThrownBy(() -> disabled.issue(UUID.randomUUID(), NOW)).isInstanceOf(SessionFailure.class);
        }
    }

    private static String signed(JWTClaimsSet claims, JWSAlgorithm algorithm, byte[] key) throws Exception {
        var token = new SignedJWT(new JWSHeader(algorithm), claims); token.sign(new MACSigner(key)); return token.serialize();
    }
}

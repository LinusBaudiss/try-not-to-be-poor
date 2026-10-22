package de.linus.tnbp.access;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;

class RegistrationTest {
    static final String TOKEN = "a".repeat(43);
    static final Instant ISSUED = Instant.parse("2026-10-01T12:00:00Z");
    private final PasswordPolicy policy = new PasswordPolicy();

    RegistrationTest() throws Exception {}

    static String sha256(String value) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.US_ASCII)));
    }

    @ParameterizedTest(name = "Passwort mit {0} Unicode-Codepunkten: gültig={1}")
    @CsvSource({"14,false", "15,true", "64,true", "65,false"})
    void passwortLaengengrenzenInCodepunkten(int count, boolean valid) {
        assertThat(policy.error(policy.normalize("🦊".repeat(count))) == null).isEqualTo(valid);
    }

    @Test
    void leerzeichenUndUnicodeWerdenNichtGetrimmt() {
        String password = "  Grüner 🦊 im Baum  ";
        assertThat(policy.normalize(password)).isEqualTo(password);
        assertThat(policy.error(password)).isNull();
    }

    @Test
    void nfcWirdVorDemZaehlenAngewendet() {
        String password = "e\u0301".repeat(15);
        assertThat(policy.normalize(password)).isEqualTo("é".repeat(15));
        assertThat(policy.error(policy.normalize(password))).isNull();
        assertThat(policy.error(policy.normalize("e\u0301".repeat(14)))).isNotNull();
    }

    @Test
    void lokaleVersionierteSperrlisteVerhindertHaeufigePasswoerter() {
        assertThat(policy.error("Mailcreated5240")).contains("zu häufig");
        assertThat(policy.error("123456789012345")).contains("zu häufig");
    }

    @ParameterizedTest
    @ValueSource(strings = {"Langes Passwort\nmit Steuerzeichen", "Langes Passwort\u0000mit Null", "Langes Passwort\u200Bmit Formatzeichen"})
    void nichtDruckbareZeichenWerdenAbgelehnt(String password) {
        assertThat(policy.error(password)).contains("druckbare");
    }

    @Test
    void argon2idSalztUndVerifiziertDasVollstaendigePasswort() {
        var encoder = new Argon2PasswordEncoder(16, 32, 1, 19456, 2);
        for (String password : new String[] {"  Grüner 🦊 im Baum  ", "🦊".repeat(64)}) {
            String first = encoder.encode(password);
            String second = encoder.encode(password);
            assertThat(first).startsWith("$argon2id$").isNotEqualTo(second);
            assertThat(encoder.matches(password, first)).isTrue();
            assertThat(encoder.matches(password, second)).isTrue();
            assertThat(encoder.matches(password.strip(), first)).isEqualTo(password.equals(password.strip()));
            assertThat(encoder.matches(password.substring(0, password.offsetByCodePoints(0, password.codePointCount(0, password.length()) - 1)), first)).isFalse();
        }
    }

    static Stream<Arguments> linkCases() throws Exception {
        String hash = sha256(TOKEN);
        RegistrationLink active = new RegistrationLink(true, hash, ISSUED, null);
        return Stream.of(
            Arguments.of("Ausgabezeit einschließlich", active, TOKEN, ISSUED, true),
            Arguments.of("Vor Ausgabezeit", active, TOKEN, ISSUED.minusNanos(1), false),
            Arguments.of("Unmittelbar vor 30 Tagen", active, TOKEN, ISSUED.plusSeconds(30 * 86400L).minusNanos(1), true),
            Arguments.of("Exakte Ablaufgrenze 30 Tage", active, TOKEN, ISSUED.plusSeconds(30 * 86400L), false),
            Arguments.of("Nach Ablauf", active, TOKEN, ISSUED.plusSeconds(31 * 86400L), false),
            Arguments.of("Fehlendes Geheimnis", active, null, ISSUED, false),
            Arguments.of("Leeres Geheimnis", active, "", ISSUED, false),
            Arguments.of("Falsches Geheimnis", active, "b".repeat(43), ISSUED, false),
            Arguments.of("Widerrufen", new RegistrationLink(false, hash, ISSUED, null), TOKEN, ISSUED, false),
            Arguments.of("Fehlende Konfiguration", new RegistrationLink(false, null, null, null), TOKEN, ISSUED, false),
            Arguments.of("Aktiv aber ohne Hash", new RegistrationLink(true, null, ISSUED, null), TOKEN, ISSUED, false),
            Arguments.of("Aktiv aber ohne Ausgabe", new RegistrationLink(true, hash, null, null), TOKEN, ISSUED, false),
            Arguments.of("Frühere Ablaufgrenze", new RegistrationLink(true, hash, ISSUED, ISSUED.plusSeconds(5)), TOKEN, ISSUED.plusSeconds(5), false),
            Arguments.of("Spätere Ablaufkonfiguration verlängert nicht", new RegistrationLink(true, hash, ISSUED, ISSUED.plusSeconds(40 * 86400L)), TOKEN, ISSUED.plusSeconds(30 * 86400L), false),
            Arguments.of("Rotation sperrt alten Link", new RegistrationLink(true, sha256("b".repeat(43)), ISSUED, null), TOKEN, ISSUED, false)
        );
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("linkCases")
    void linkZeitgrenzenUndKonfiguration(String name, RegistrationLink link, String token, Instant now, boolean accepted) {
        assertThat(link.accepts(token, now)).as(name).isEqualTo(accepted);
    }
}

package de.linus.tnbp.access;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Locale;
import java.util.HashSet;
import java.util.Set;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class PasswordPolicy {
    private final Set<String> blocked;

    public PasswordPolicy() throws IOException {
        Set<String> entries = new HashSet<>();
        for (String file : new String[] {"password-blocklist.txt", "password-blocklist-supplement.txt"}) {
            try (var reader = new BufferedReader(new InputStreamReader(
                    new ClassPathResource("access/" + file).getInputStream(), StandardCharsets.UTF_8))) {
                reader.lines().map(PasswordPolicy::blocklistKey).forEach(entries::add);
            }
        }
        blocked = Set.copyOf(entries);
    }

    public String normalize(String password) {
        return password == null ? "" : Normalizer.normalize(password, Normalizer.Form.NFC);
    }

    public String error(String normalized) {
        int length = normalized.codePointCount(0, normalized.length());
        if (length < 15 || length > 64) {
            return "Verwende 15 bis 64 Zeichen. Leerzeichen und Unicode sind erlaubt.";
        }
        if (normalized.codePoints().anyMatch(PasswordPolicy::notPrintable)) {
            return "Verwende druckbare Zeichen; Steuerzeichen sind nicht erlaubt.";
        }
        if (blocked.contains(blocklistKey(normalized))) {
            return "Dieses Passwort ist zu häufig. Wähle ein anderes Passwort.";
        }
        return null;
    }

    private static String blocklistKey(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFC).toLowerCase(Locale.ROOT);
    }

    private static boolean notPrintable(int codePoint) {
        int type = Character.getType(codePoint);
        return type == Character.CONTROL || type == Character.FORMAT || type == Character.SURROGATE
            || type == Character.UNASSIGNED || type == Character.PRIVATE_USE
            || type == Character.LINE_SEPARATOR || type == Character.PARAGRAPH_SEPARATOR;
    }
}

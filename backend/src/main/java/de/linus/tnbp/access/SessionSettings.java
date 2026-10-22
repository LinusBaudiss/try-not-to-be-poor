package de.linus.tnbp.access;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("access.session")
public record SessionSettings(String signingKey, String issuer, String audience, String origin) {
    @Override public String toString() { return "SessionSettings[geschützt]"; }
}

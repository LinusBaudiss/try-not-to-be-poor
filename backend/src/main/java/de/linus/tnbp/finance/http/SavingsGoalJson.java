package de.linus.tnbp.finance.http;

import de.linus.tnbp.contract.model.SavingsGoalRequest;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.annotation.JsonDeserialize;
import tools.jackson.databind.deser.std.StdDeserializer;

@Configuration
class SavingsGoalJson {
    @Bean
    JsonMapperBuilderCustomizer savingsGoalCalendarDate() {
        return builder -> builder.addMixIn(SavingsGoalRequest.class, CalendarDateInput.class)
            .addMixIn(de.linus.tnbp.contract.v2.model.SavingsGoalRequest.class, CalendarDateInput.class);
    }
    abstract static class CalendarDateInput {
        @JsonDeserialize(using = CalendarDateDeserializer.class)
        public abstract LocalDate getTargetDate();
    }
    /** Lokale Vertragsregel: keine Zeitpunkte, Arrays, Typumwandlung oder Datumsnormalisierung. */
    public static final class CalendarDateDeserializer extends StdDeserializer<LocalDate> {
        public CalendarDateDeserializer() { super(LocalDate.class); }
        @Override public LocalDate deserialize(JsonParser parser, DeserializationContext context) {
            if (!parser.hasToken(JsonToken.VALUE_STRING))
                return context.reportInputMismatch(LocalDate.class, "Kalenderdatum als ISO-Text erforderlich.");
            String value = parser.getString();
            if (!value.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}"))
                return context.reportInputMismatch(LocalDate.class, "Kalenderdatum im Format JJJJ-MM-TT erforderlich.");
            try { return LocalDate.parse(value); }
            catch (DateTimeParseException failure) {
                return context.reportInputMismatch(LocalDate.class, "Ungültiges Kalenderdatum.");
            }
        }
    }
}

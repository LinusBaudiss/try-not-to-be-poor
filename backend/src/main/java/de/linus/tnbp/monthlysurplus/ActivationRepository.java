package de.linus.tnbp.monthlysurplus;

import java.time.LocalDate;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class ActivationRepository {
    private final JdbcTemplate jdbc;
    ActivationRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    LocalDate month(UUID userId) {
        return jdbc.query("SELECT activation_month FROM monthly_surplus.activations WHERE user_id = ?",
            (row, index) -> row.getObject(1, LocalDate.class), userId).stream().findFirst().orElse(null);
    }
    void insert(UUID userId, LocalDate month) {
        jdbc.update("INSERT INTO monthly_surplus.activations(user_id, activation_month) VALUES (?, ?) ON CONFLICT (user_id) DO NOTHING",
            userId, month);
    }
}

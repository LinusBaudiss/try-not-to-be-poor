package de.linus.tnbp.monthlysurplus;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class DeletedGoalRepository {
    private final JdbcTemplate jdbc;
    DeletedGoalRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    boolean exists(UUID userId, UUID goalId) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM monthly_surplus.deleted_goals WHERE user_id = ? AND goal_id = ?)",
            Boolean.class, userId, goalId));
    }
    void insert(UUID userId, UUID goalId) {
        jdbc.update("INSERT INTO monthly_surplus.deleted_goals(user_id, goal_id) VALUES (?, ?) ON CONFLICT DO NOTHING", userId, goalId);
    }
}

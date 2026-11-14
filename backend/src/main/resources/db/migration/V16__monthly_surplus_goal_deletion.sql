-- Die Herkunft bleibt auch ohne Live-Ziel dauerhaft erkennbar; keine Zielfinanzwerte.
CREATE TABLE monthly_surplus.deleted_goals (
    user_id uuid NOT NULL REFERENCES monthly_surplus.activations(user_id),
    goal_id uuid NOT NULL,
    PRIMARY KEY (user_id, goal_id)
);
ALTER TABLE monthly_surplus.deleted_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_surplus.deleted_goals FORCE ROW LEVEL SECURITY;
CREATE POLICY own_deleted_goal ON monthly_surplus.deleted_goals
    USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
    WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
REVOKE ALL ON monthly_surplus.deleted_goals FROM PUBLIC, tnbp_runtime;
GRANT SELECT, INSERT ON monthly_surplus.deleted_goals TO tnbp_runtime;
-- Eine explizite Leerung überdeckt ältere Auswahlen ab dem noch offenen Monat.
ALTER TABLE monthly_surplus.selections ALTER COLUMN goal_id DROP NOT NULL;

CREATE TABLE monthly_surplus.selections (
    user_id uuid NOT NULL REFERENCES monthly_surplus.activations(user_id),
    effective_month date NOT NULL CHECK (effective_month >= DATE '0001-01-01'
        AND effective_month <= DATE '9999-12-01' AND EXTRACT(DAY FROM effective_month) = 1),
    -- Dauerhafte Referenz, bewusst kein Fremdschlüssel auf den Live-Zielbestand.
    goal_id uuid NOT NULL,
    PRIMARY KEY (user_id, effective_month)
);
ALTER TABLE monthly_surplus.selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_surplus.selections FORCE ROW LEVEL SECURITY;
CREATE POLICY own_selection ON monthly_surplus.selections
    USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
    WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
REVOKE ALL ON monthly_surplus.selections FROM PUBLIC, tnbp_runtime;
GRANT SELECT, INSERT, UPDATE (goal_id) ON monthly_surplus.selections TO tnbp_runtime;

ALTER TABLE monthly_surplus.month_records
    ADD COLUMN goal_id uuid,
    ADD COLUMN consumed boolean NOT NULL DEFAULT false,
    ADD CONSTRAINT month_record_binding CHECK (NOT consumed OR goal_id IS NOT NULL);
-- NULL surplus bleibt ohne Budget; goal_id hält auch dort eine historische Auswahl fest.
-- Offen ist ausschließlich ein budgetierter, noch ungebundener Nachweis.
GRANT UPDATE (goal_id) ON monthly_surplus.month_records TO tnbp_runtime;

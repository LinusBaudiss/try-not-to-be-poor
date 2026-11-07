CREATE TABLE monthly_surplus.month_records (
    user_id uuid NOT NULL REFERENCES monthly_surplus.activations(user_id),
    origin_month date NOT NULL CHECK (origin_month >= DATE '0001-01-01'
        AND origin_month <= DATE '9999-12-01' AND EXTRACT(DAY FROM origin_month) = 1),
    -- NULL: ohne Budget; einschließlich 0: offener budgetierter Monat.
    surplus_cents bigint CHECK (surplus_cents BETWEEN 0 AND 9007199254740991),
    PRIMARY KEY (user_id, origin_month)
);
ALTER TABLE monthly_surplus.month_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_surplus.month_records FORCE ROW LEVEL SECURITY;
CREATE POLICY own_month_record ON monthly_surplus.month_records
    USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
    WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
REVOKE ALL ON monthly_surplus.month_records FROM PUBLIC, tnbp_runtime;
GRANT SELECT, INSERT ON monthly_surplus.month_records TO tnbp_runtime;

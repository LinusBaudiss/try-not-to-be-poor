CREATE SCHEMA savings_goals;
REVOKE ALL ON SCHEMA savings_goals FROM PUBLIC;

CREATE TABLE savings_goals.goals (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES access.accounts(id),
    -- Derselbe Trimzeichensatz wie SavingsGoalService.space / JavaScript trim.
    name TEXT NOT NULL CHECK (length(btrim(name,
        U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')) > 0),
    target_amount_cents BIGINT NOT NULL CHECK (target_amount_cents BETWEEN 1 AND 9007199254740991),
    progress_cents BIGINT NOT NULL DEFAULT 0 CHECK (progress_cents BETWEEN 0 AND 9007199254740991),
    target_date DATE CHECK (target_date BETWEEN DATE '0001-01-01' AND DATE '9999-12-31')
);
CREATE INDEX goals_owner_id ON savings_goals.goals (user_id, id);
REVOKE ALL ON savings_goals.goals FROM PUBLIC;
ALTER TABLE savings_goals.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals.goals FORCE ROW LEVEL SECURITY;
CREATE POLICY own_goals ON savings_goals.goals TO tnbp_runtime
    USING (user_id = NULLIF(current_setting('app.user_id', true), '')::UUID)
    WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::UUID);
GRANT SELECT, INSERT ON savings_goals.goals TO tnbp_runtime;
GRANT USAGE ON SCHEMA savings_goals TO tnbp_runtime;

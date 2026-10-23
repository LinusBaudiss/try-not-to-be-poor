CREATE SCHEMA expense_budget;
REVOKE ALL ON SCHEMA expense_budget FROM PUBLIC;

CREATE TABLE expense_budget.budgets (
    user_id UUID NOT NULL REFERENCES access.accounts(id),
    valid_from DATE NOT NULL CHECK (EXTRACT(DAY FROM valid_from) = 1),
    amount_cents BIGINT NOT NULL CHECK (amount_cents BETWEEN 0 AND 9007199254740991),
    PRIMARY KEY (user_id, valid_from)
);
REVOKE ALL ON expense_budget.budgets FROM PUBLIC;
ALTER TABLE expense_budget.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_budget.budgets FORCE ROW LEVEL SECURITY;
CREATE POLICY own_budget ON expense_budget.budgets TO tnbp_runtime
    USING (user_id = NULLIF(current_setting('app.user_id', true), '')::UUID)
    WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::UUID);
GRANT USAGE ON SCHEMA expense_budget TO tnbp_runtime;
GRANT SELECT, INSERT ON expense_budget.budgets TO tnbp_runtime;
GRANT UPDATE (amount_cents) ON expense_budget.budgets TO tnbp_runtime;

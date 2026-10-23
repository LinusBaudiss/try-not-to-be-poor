CREATE TABLE expense_budget.expenses (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES access.accounts(id),
    -- Derselbe Trimzeichensatz wie ExpenseService.space / JavaScript trim.
    name TEXT NOT NULL CHECK (length(btrim(name,
        U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')) > 0),
    amount_cents BIGINT NOT NULL CHECK (amount_cents BETWEEN 1 AND 9007199254740991),
    recorded_on DATE NOT NULL
);
CREATE INDEX expenses_owner_date ON expense_budget.expenses (user_id, recorded_on DESC, id);
REVOKE ALL ON expense_budget.expenses FROM PUBLIC;
ALTER TABLE expense_budget.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_budget.expenses FORCE ROW LEVEL SECURITY;
CREATE POLICY own_expenses ON expense_budget.expenses TO tnbp_runtime
    USING (user_id = NULLIF(current_setting('app.user_id', true), '')::UUID)
    WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::UUID);
GRANT SELECT, INSERT ON expense_budget.expenses TO tnbp_runtime;

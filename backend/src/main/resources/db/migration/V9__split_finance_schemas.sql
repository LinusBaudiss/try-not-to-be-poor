CREATE SCHEMA expenses;
CREATE SCHEMA budget;
REVOKE ALL ON SCHEMA expenses, budget FROM PUBLIC;

-- SET SCHEMA erhält Zeilen, IDs, Constraints, Indizes, Eigentümer, RLS und ACLs.
ALTER TABLE expense_budget.expenses SET SCHEMA expenses;
ALTER TABLE expense_budget.budgets SET SCHEMA budget;
GRANT USAGE ON SCHEMA expenses, budget TO tnbp_runtime;

-- Kein zweiter Datenbestand und kein weiter beschreibbarer alter Namensraum.
REVOKE ALL ON SCHEMA expense_budget FROM tnbp_runtime;
DROP SCHEMA expense_budget;

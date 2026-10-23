-- Nur korrigierbare Felder freigeben; ID, Eigentümer und Kalenderdatum bleiben geschützt.
GRANT UPDATE (name, amount_cents), DELETE ON expense_budget.expenses TO tnbp_runtime;

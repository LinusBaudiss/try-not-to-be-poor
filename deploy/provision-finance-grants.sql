\set ON_ERROR_STOP on
-- Administrativ wiederholbar, vor dem API-Start auch auf vorhandenen Volumes.
-- Keine Rollenanlage, Passwortrotation oder CREATEROLE-Rechte für den Migrator.
DO $grants$
DECLARE
    schema_name text;
    relation_name text;
    relation regclass;
    columns text;
BEGIN
    FOREACH schema_name IN ARRAY ARRAY['expense_budget', 'expenses', 'budget', 'savings_goals'] LOOP
        IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = schema_name) THEN
            EXECUTE format('REVOKE ALL ON SCHEMA %I FROM PUBLIC, tnbp_runtime', schema_name);
            EXECUTE format('GRANT USAGE ON SCHEMA %I TO tnbp_runtime', schema_name);
        END IF;
    END LOOP;
    FOREACH relation_name IN ARRAY ARRAY['expense_budget.expenses', 'expense_budget.budgets',
                                         'expenses.expenses', 'budget.budgets', 'savings_goals.goals'] LOOP
        relation := to_regclass(relation_name);
        IF relation IS NULL THEN CONTINUE; END IF;
        SELECT string_agg(quote_ident(attname), ', ') INTO columns
            FROM pg_attribute WHERE attrelid = relation AND attnum > 0 AND NOT attisdropped;
        EXECUTE format('REVOKE ALL ON TABLE %s FROM PUBLIC, tnbp_runtime', relation);
        EXECUTE format('REVOKE ALL (%s) ON TABLE %s FROM PUBLIC, tnbp_runtime', columns, relation);
        EXECUTE format('GRANT SELECT, INSERT ON TABLE %s TO tnbp_runtime', relation);
        IF relation_name LIKE '%.budgets' THEN
            EXECUTE format('GRANT UPDATE (amount_cents) ON TABLE %s TO tnbp_runtime', relation);
        ELSIF relation_name LIKE '%.expenses' THEN
            EXECUTE format('GRANT UPDATE (name, amount_cents), DELETE ON TABLE %s TO tnbp_runtime', relation);
        ELSE
            EXECUTE format('GRANT UPDATE (name, target_amount_cents, target_date, progress_cents), DELETE ON TABLE %s TO tnbp_runtime', relation);
        END IF;
    END LOOP;
END
$grants$;

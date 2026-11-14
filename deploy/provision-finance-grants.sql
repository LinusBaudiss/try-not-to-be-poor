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
    FOREACH schema_name IN ARRAY ARRAY['expense_budget', 'expenses', 'budget', 'savings_goals', 'monthly_surplus'] LOOP
        IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = schema_name) THEN
            EXECUTE format('REVOKE ALL ON SCHEMA %I FROM PUBLIC, tnbp_runtime', schema_name);
            EXECUTE format('GRANT USAGE ON SCHEMA %I TO tnbp_runtime', schema_name);
        END IF;
    END LOOP;
    FOREACH relation_name IN ARRAY ARRAY['expense_budget.expenses', 'expense_budget.budgets',
                                         'expenses.expenses', 'budget.budgets', 'savings_goals.goals', 'monthly_surplus.activations', 'monthly_surplus.month_records', 'monthly_surplus.selections', 'monthly_surplus.deleted_goals'] LOOP
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
        ELSIF relation_name = 'savings_goals.goals' THEN
            EXECUTE format('GRANT UPDATE (name, target_amount_cents, target_date, progress_cents), DELETE ON TABLE %s TO tnbp_runtime', relation);
        ELSIF relation_name = 'monthly_surplus.selections' THEN
            EXECUTE format('GRANT UPDATE (goal_id) ON TABLE %s TO tnbp_runtime', relation);
        ELSIF relation_name = 'monthly_surplus.month_records' AND EXISTS (
            SELECT 1 FROM pg_attribute WHERE attrelid = relation AND attname = 'goal_id' AND NOT attisdropped) THEN
            EXECUTE format('GRANT UPDATE (goal_id, surplus_cents, consumed) ON TABLE %s TO tnbp_runtime', relation);
        END IF;
    END LOOP;
    IF to_regprocedure('api_version.monthly_automation_available(boolean,uuid,text,text,text,timestamptz)') IS NOT NULL THEN
        REVOKE ALL ON FUNCTION api_version.monthly_automation_available(boolean,uuid,text,text,text,timestamptz) FROM PUBLIC, tnbp_runtime;
        GRANT EXECUTE ON FUNCTION api_version.monthly_automation_available(boolean,uuid,text,text,text,timestamptz) TO tnbp_runtime;
    END IF;
END
$grants$;

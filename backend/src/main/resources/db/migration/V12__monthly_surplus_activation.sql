CREATE SCHEMA monthly_surplus;
REVOKE ALL ON SCHEMA monthly_surplus FROM PUBLIC;
CREATE TABLE monthly_surplus.activations (
    user_id uuid PRIMARY KEY REFERENCES access.accounts(id),
    activation_month date NOT NULL CHECK (activation_month >= DATE '0001-01-01'
        AND activation_month <= DATE '9999-12-01' AND EXTRACT(DAY FROM activation_month) = 1)
);
ALTER TABLE monthly_surplus.activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_surplus.activations FORCE ROW LEVEL SECURITY;
CREATE POLICY own_activation ON monthly_surplus.activations
    USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
    WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
REVOKE ALL ON monthly_surplus.activations FROM PUBLIC, tnbp_runtime;
GRANT USAGE ON SCHEMA monthly_surplus TO tnbp_runtime;
GRANT SELECT, INSERT ON monthly_surplus.activations TO tnbp_runtime;

-- Unabhängige technische Versionsprüfung; die fachliche Gesamtbereitschaft bleibt im Code geschlossen.
-- Die Zeilensperre hält den geprüften Stilllegungsbeleg bis zum äußeren Commit stabil.
CREATE FUNCTION api_version.monthly_automation_available(lock_state boolean, stopped uuid,
    release_hash text, schema_hash text, roles_hash text, retired_on timestamptz) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, api_version, pg_temp AS $$
DECLARE current_state api_version.state%ROWTYPE;
BEGIN
    IF lock_state THEN
        SELECT * INTO current_state FROM api_version.state WHERE singleton FOR UPDATE;
    ELSE
        SELECT * INTO current_state FROM api_version.state WHERE singleton;
    END IF;
    RETURN FOUND AND stopped IS NOT NULL AND retired_on IS NOT NULL
        AND release_hash IS NOT NULL AND release_hash ~ '^[0-9a-f]{64}$'
        AND schema_hash IS NOT NULL AND schema_hash ~ '^[0-9a-f]{64}$'
        AND roles_hash IS NOT NULL AND roles_hash ~ '^[0-9a-f]{64}$'
        AND current_state.v1_retired
        AND current_state.stopped_instance IS NOT DISTINCT FROM stopped
        AND current_state.release_sha256 IS NOT DISTINCT FROM release_hash
        AND current_state.schema_sha256 IS NOT DISTINCT FROM schema_hash
        AND current_state.roles_sha256 IS NOT DISTINCT FROM roles_hash
        AND current_state.retired_at IS NOT DISTINCT FROM retired_on;
END $$;
REVOKE ALL ON FUNCTION api_version.monthly_automation_available(boolean,uuid,text,text,text,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api_version.monthly_automation_available(boolean,uuid,text,text,text,timestamptz) TO tnbp_runtime;

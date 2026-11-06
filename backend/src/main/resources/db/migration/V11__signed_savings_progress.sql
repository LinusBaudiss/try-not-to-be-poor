-- Nur die ausdrücklich ersetzte Fortschrittsregel ändern; alle Bestandswerte bleiben erhalten.
ALTER TABLE savings_goals.goals DROP CONSTRAINT goals_progress_cents_check;
ALTER TABLE savings_goals.goals ADD CONSTRAINT goals_progress_cents_check
    CHECK (progress_cents BETWEEN -9007199254740991 AND 9007199254740991);

-- Enger technischer Zugang: kein UPDATE-Recht auf der Versionstabelle für die Laufzeitrolle.
-- Bei Mutationen serialisiert dieselbe Zeilensperre mit set_retirement/mark_usage bis zum Commit.
CREATE FUNCTION api_version.signed_progress_available(lock_state boolean, stopped uuid,
    release_hash text, schema_hash text, roles_hash text, retired_on timestamptz) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, api_version, pg_temp AS $$
DECLARE current_state api_version.state%ROWTYPE;
BEGIN
    IF lock_state THEN
        SELECT * INTO current_state FROM api_version.state WHERE singleton FOR UPDATE;
    ELSE
        SELECT * INTO current_state FROM api_version.state WHERE singleton;
    END IF;
    IF NOT FOUND OR stopped IS NULL OR retired_on IS NULL
        OR release_hash IS NULL OR release_hash !~ '^[0-9a-f]{64}$'
        OR schema_hash IS NULL OR schema_hash !~ '^[0-9a-f]{64}$'
        OR roles_hash IS NULL OR roles_hash !~ '^[0-9a-f]{64}$'
        OR NOT current_state.v1_retired
        OR current_state.stopped_instance IS DISTINCT FROM stopped
        OR current_state.release_sha256 IS DISTINCT FROM release_hash
        OR current_state.schema_sha256 IS DISTINCT FROM schema_hash
        OR current_state.roles_sha256 IS DISTINCT FROM roles_hash
        OR current_state.retired_at IS DISTINCT FROM retired_on THEN
        RETURN false;
    END IF;
    -- Auch ein gleichnamiger abgeschwächter oder nicht validierter Constraint öffnet das Gate nicht.
    RETURN EXISTS (SELECT FROM pg_catalog.pg_constraint c
        WHERE c.conrelid = 'savings_goals.goals'::pg_catalog.regclass AND c.conname = 'goals_progress_cents_check'
        AND c.contype = 'c' AND c.convalidated
        AND pg_catalog.regexp_replace(pg_catalog.pg_get_constraintdef(c.oid), '[[:space:]()]|::bigint|''', '', 'g') =
            'CHECKprogress_cents>=-9007199254740991ANDprogress_cents<=9007199254740991');
END $$;
REVOKE ALL ON FUNCTION api_version.signed_progress_available(boolean,uuid,text,text,text,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api_version.signed_progress_available(boolean,uuid,text,text,text,timestamptz) TO tnbp_runtime;

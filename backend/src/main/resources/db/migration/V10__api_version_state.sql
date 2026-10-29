CREATE SCHEMA api_version;
REVOKE ALL ON SCHEMA api_version FROM PUBLIC;

-- Ausschließlich technische Metadaten, keine Nutzer- oder Finanzdaten.
CREATE TABLE api_version.state (
    singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
    v1_retired boolean NOT NULL DEFAULT false,
    signed_progress_used boolean NOT NULL DEFAULT false,
    monthly_effects_used boolean NOT NULL DEFAULT false,
    stopped_instance uuid,
    release_sha256 text,
    schema_sha256 text,
    roles_sha256 text,
    retired_at timestamptz,
    CHECK (NOT (signed_progress_used OR monthly_effects_used) OR v1_retired),
    CHECK (NOT v1_retired OR (stopped_instance IS NOT NULL AND retired_at IS NOT NULL
        AND release_sha256 IS NOT NULL AND schema_sha256 IS NOT NULL AND roles_sha256 IS NOT NULL
        AND release_sha256 ~ '^[0-9a-f]{64}$' AND schema_sha256 ~ '^[0-9a-f]{64}$' AND roles_sha256 ~ '^[0-9a-f]{64}$'))
);
INSERT INTO api_version.state (singleton) VALUES (true);
REVOKE ALL ON api_version.state FROM PUBLIC, tnbp_runtime;
GRANT USAGE ON SCHEMA api_version TO tnbp_runtime;
GRANT SELECT ON api_version.state TO tnbp_runtime;

-- Ein DB-gebundener Lebenszyklus verhindert parallele Starts/Zertifizierungen
-- mit versehentlich verschiedenen lokalen Metadatenverzeichnissen. Nur Admin.
CREATE TABLE api_version.lifecycle (
    singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
    active boolean NOT NULL DEFAULT false,
    owner_sha256 text CHECK (owner_sha256 ~ '^[0-9a-f]{64}$'),
    CHECK (NOT active OR owner_sha256 IS NOT NULL)
);
INSERT INTO api_version.lifecycle(singleton) VALUES (true);
REVOKE ALL ON api_version.lifecycle FROM PUBLIC, tnbp_runtime;

CREATE FUNCTION api_version.protect_usage() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, api_version AS $$
BEGIN
    IF TG_OP = 'DELETE' OR (OLD.signed_progress_used AND NOT NEW.signed_progress_used)
        OR (OLD.monthly_effects_used AND NOT NEW.monthly_effects_used) THEN
        RAISE EXCEPTION 'Der technische Nutzungsnachweis ist dauerhaft.';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER monotone_usage BEFORE UPDATE OR DELETE ON api_version.state
    FOR EACH ROW EXECUTE FUNCTION api_version.protect_usage();

-- Nur der geschützte Betriebsweg darf nach Prozess-/DB-Nachweis stilllegen/rücknehmen.
CREATE FUNCTION api_version.set_retirement(retired boolean, instance uuid,
    release_hash text, schema_hash text, roles_hash text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, api_version AS $$
BEGIN
    IF instance IS NULL OR release_hash IS NULL OR release_hash !~ '^[0-9a-f]{64}$'
        OR schema_hash IS NULL OR schema_hash !~ '^[0-9a-f]{64}$'
        OR roles_hash IS NULL OR roles_hash !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'Vollständiger technischer Nachweis erforderlich.';
    END IF;
    PERFORM 1 FROM api_version.state WHERE singleton FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Versionszustand fehlt.'; END IF;
    IF NOT retired AND EXISTS (SELECT FROM api_version.state WHERE signed_progress_used OR monthly_effects_used) THEN
        RAISE EXCEPTION 'Rücknahme nach Nutzung ausgeschlossen.';
    END IF;
    IF NOT retired AND NOT EXISTS (SELECT FROM api_version.state WHERE v1_retired) THEN
        RAISE EXCEPTION 'Rücknahme benötigt eine bestätigte Stilllegung.';
    END IF;
    UPDATE api_version.state SET v1_retired = retired, stopped_instance = instance,
        release_sha256 = release_hash, schema_sha256 = schema_hash, roles_sha256 = roles_hash,
        retired_at = CASE WHEN retired THEN clock_timestamp() ELSE retired_at END;
END $$;

CREATE FUNCTION api_version.mark_usage(kind text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, api_version AS $$
BEGIN
    IF kind IS NULL OR kind NOT IN ('signed-progress', 'monthly-effect') THEN
        RAISE EXCEPTION 'Unbekannter technischer Nutzungsmarker.';
    END IF;
    PERFORM 1 FROM api_version.state WHERE singleton AND v1_retired FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'v1 ist nicht nachweislich stillgelegt.'; END IF;
    UPDATE api_version.state SET
        signed_progress_used = signed_progress_used OR kind = 'signed-progress',
        monthly_effects_used = monthly_effects_used OR kind = 'monthly-effect';
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA api_version FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api_version.mark_usage(text) TO tnbp_runtime;

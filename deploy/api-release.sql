\set ON_ERROR_STOP on
-- Der geschützte Betriebsweg benötigt den bestehenden vollständigen DB-Admin.
-- Keine delegierte Hilfsrolle: Admission, Prozessnachweis und die ausschließlich
-- synthetische Altzertifizierung einschließlich Cleanup brauchen volle Rechte.
-- Web-/Job-/Migratorrollen erhalten keine zusätzlichen Rechte.
DO $$ BEGIN
  IF NOT (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) THEN
    RAISE EXCEPTION 'Vollständiger geschützter Datenbankadministrator erforderlich';
  END IF;
END $$;

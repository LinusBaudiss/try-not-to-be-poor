#!/usr/bin/env sh
set -eu
psql --set ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
\getenv migration_password DB_MIGRATION_PASSWORD
\getenv runtime_password DB_RUNTIME_PASSWORD
SELECT format('CREATE ROLE tnbp_migrator LOGIN PASSWORD %L NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE', :'migration_password') \gexec
SELECT format('CREATE ROLE tnbp_runtime LOGIN PASSWORD %L NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE', :'runtime_password') \gexec
ALTER DATABASE tnbp OWNER TO tnbp_migrator;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
SQL

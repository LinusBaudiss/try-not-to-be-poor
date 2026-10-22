CREATE TABLE access.accounts (
    id UUID PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT accounts_email_unique UNIQUE (email),
    CONSTRAINT accounts_email_normalized CHECK (email = lower(btrim(email))),
    CONSTRAINT accounts_argon2id CHECK (password_hash LIKE '$argon2id$%')
);

REVOKE ALL ON SCHEMA access FROM PUBLIC;
REVOKE ALL ON access.accounts FROM PUBLIC;
GRANT USAGE ON SCHEMA access TO tnbp_runtime;
GRANT INSERT ON access.accounts TO tnbp_runtime;

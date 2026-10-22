CREATE TABLE access.session_families (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES access.accounts(id),
    created_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE access.refresh_tokens (
    token_hash CHAR(64) PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES access.session_families(id),
    consumed BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX refresh_tokens_family ON access.refresh_tokens(family_id);
REVOKE ALL ON access.session_families, access.refresh_tokens FROM PUBLIC;
GRANT SELECT (id, email, password_hash) ON access.accounts TO tnbp_runtime;
GRANT SELECT, INSERT ON access.session_families, access.refresh_tokens TO tnbp_runtime;
GRANT UPDATE (last_used_at, revoked) ON access.session_families TO tnbp_runtime;
GRANT UPDATE (consumed) ON access.refresh_tokens TO tnbp_runtime;
-- Die vollständige Hashhistorie bleibt für Replay-Erkennung bestehen, auch nach Widerruf.
-- Bereinigung und Aufbewahrung werden vor echten Nutzerdaten festgelegt.

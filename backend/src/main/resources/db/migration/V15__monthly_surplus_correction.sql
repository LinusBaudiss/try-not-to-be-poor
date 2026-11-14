-- Korrekturen ändern ausschließlich Betrag/Verbrauch; Herkunft und Bindung bleiben erhalten.
GRANT UPDATE (surplus_cents, consumed) ON monthly_surplus.month_records TO tnbp_runtime;

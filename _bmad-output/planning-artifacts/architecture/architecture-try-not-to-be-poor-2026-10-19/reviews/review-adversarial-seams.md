# Adversarial seams review — recheck

**Artifact:** `ARCHITECTURE-SPINE.md`  
**Lens:** Can independently implemented child units both satisfy the adopted decisions while producing consequentially different behavior or data?

## Verdict

Both previously reported seams are closed. AD-3 now defines logout behavior and caps access-token validity; AD-5 makes the savings-goal target date explicitly date-only from OpenAPI through PostgreSQL. I found no remaining material divergence in these seams.

## Rechecked findings

### Resolved — Access JWT behavior after logout (AD-3, line 65)

The spine now says logout revokes the active refresh-token family, an already-issued access JWT remains valid until expiry, the maximum lifetime is 15 minutes, and v1 has no access-token denylist. This removes the choice between immediate access-token revocation and validity through expiry, while retaining the intended stateless access path. The implementation stories still need a concrete access lifetime at or below 15 minutes and refresh lifetime/rotation-reuse details.

Minor wording cleanup: Deferred currently says to decide “Access-/Refresh-Laufzeiten” before auth stories (line 153). That can mean select the exact access lifetime within the 15-minute cap, but could be made clearer as “konkrete Access-Laufzeit (maximal 15 Minuten) und Refresh-Laufzeit”. This is not a remaining architecture gap.

### Resolved — Savings-goal target-date meaning (AD-5, line 77)

The optional target date is now explicitly an OpenAPI `format: date`, Java `LocalDate`, PostgreSQL `DATE`; the value is preserved unchanged and is not converted as an instant. Independently implemented goal forms/storage layers therefore cannot shift the selected calendar date through timezone conversion.

## Other seams checked

- **Module ownership:** AD-1 assigns account/refresh data to `access`, expenses and the continuing budget to `expense-budget`, and goals to `savings-goals`; cross-module writes pass through public application functions.
- **API shape:** AD-2 makes one OpenAPI artifact the shared source and requires generated or mechanically checked DTO/types. The added CI gate requires validation and contract checks to pass before release.
- **Tenant/data boundary:** AD-4 requires owner IDs to come from verified JWT `sub`, applies the same owner predicate at query and RLS layers, and restricts the DB runtime role.
- **Money/current-month calculation:** AD-5 fixes integer Euro cents, EUR-only v1, the same safe integer bound across JSON/Java/PostgreSQL, Berlin month boundaries, and the current-month residual-budget formula. Product limits and negative-result presentation are expressly deferred.
- **Deployment:** AD-1 and AD-6 require separate SPA/API artifacts behind one Caddy origin; only the proxy is public and the database remains private. Exact VPS sizing and operations settings are gated before production data.


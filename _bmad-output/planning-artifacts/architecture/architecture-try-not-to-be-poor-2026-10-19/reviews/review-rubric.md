# Rubric review — Architecture Spine

**Initial verdict: Needs targeted edits before finalization. Delta verdict: Pass.** Rechecked the requested follow-up edits: all three earlier findings remain closed. The revised derived-total rule and compatibility gate close the additional boundary questions. The spine covers the initiative-level v1 scope, fixes the major data, API, and deployment boundaries, and names the remaining deferrals.

## Findings

### Medium — AD-2 leaves the contract enforcement path as an unresolved alternative — CLOSED

Initially, Angular types and Spring DTOs could either be generated or mechanically checked, while the tooling and CI rule were deferred until separate releases. The revised AD-2 now requires CI to validate OpenAPI, check both implementations, block incompatible v1 changes, and prevent release when checks fail. The Deferred section moves tool selection and OAS 3.2.1 compatibility verification before the first implementation story, and API/client changes must pass those checks. This closes the finding; the remaining tool choice is bounded and will be resolved before implementation.

### Medium — AD-5 does not align the JSON and database integer ranges — CLOSED

Initially, the database integer type and cross-layer bound were unspecified. AD-5 now pins a symmetric JavaScript-safe-cent range and requires matching JSON, Java validation, and PostgreSQL `BIGINT` constraints. Product-specific sign and tighter limits remain deferred separately. This closes the finding.

### Low — The stack table has one moving version and conflates Maven with Maven Wrapper — CLOSED

Initially, Node was not patch-pinned and the Maven distribution was labeled as the wrapper version. The revised table pins Node 24.22.0 and labels Maven 3.10.0 as the distribution used by Maven Wrapper. Both match the releases current on 2026-10-19 ([Node.js releases](https://nodejs.org/en/blog/release), [Maven release history](https://maven.apache.org/docs/history.html)). The other recently changing entries checked current on that date: Docker Engine 29.9.1 ([official release notes](https://docs.docker.com/engine/release-notes/29)), Compose 5.6.0 ([official releases](https://github.com/docker/compose/releases)), and Caddy 2.11.7 ([official releases](https://github.com/caddyserver/caddy/releases)).

## Checklist assessment

- **Coverage and input scope:** Good. The capability map includes FR-1 through FR-11. It preserves the PRD’s complete historical expense list, single continuing monthly budget and current-month calculation, manually maintained goal total, Europe/Berlin date semantics, and the rule that the registration link grants registration to its holders. The UX’s responsive behavior remains in scope; its viewports are explicitly deferred until implementation planning.
- **Architecture decisions and divergence prevention:** AD-1 through AD-6 establish useful boundaries: two independently deployed artifacts, three backend ownership modules, access JWT plus rotating refresh cookie, user ownership from verified `sub`, RLS with a restricted runtime role, aligned integer money representation, and a single German-host deployment with private API/database ports. AD-2 makes the contract gate a release condition; AD-5 now also bounds exact aggregate calculations and JSON output.
- **Deferred items:** Appropriately gated. Link lifecycle is before distribution; account/data lifecycle is before real data; token timings/reuse/CSRF details are before auth stories; input and goal lifecycle are before acceptance; backup and recovery details are before production data. OpenAPI tooling and CI/CD are now settled before the first implementation story, with support verified for the selected OAS version and Angular 22/Spring Boot 4.1.1, or an interoperable OAS version chosen before implementation.
- **Technology currency:** The listed Angular, Node.js, Spring Boot, Java, Maven distribution, PostgreSQL, OpenAPI, Docker Engine, Docker Compose, and Caddy versions are pinned and appear current for 2026-10-19 based on official project sources.
- **Operational/environmental envelope:** Present and sufficiently explicit for this initiative: German Hetzner target, self-managed VPS, Compose, Caddy TLS/static hosting/proxy, private API and database, external encrypted backup and restore prerequisite, and accepted single-host failure domain. VPS size, DNS, backup cadence/retention, recovery targets, and monitoring are explicit deferrals rather than silent omissions. Host patching and secret provisioning could be recorded with those operations decisions before production.
- **Diagrams and internal consistency:** Both Mermaid flowcharts are syntactically plausible and match the prose: browser-only Angular, Caddy as the public edge, one API modular monolith, and a shared PostgreSQL database. The diagrams show all modules reaching PostgreSQL, consistent with module-owned data and RLS rather than direct frontend access. No scope contradiction with the PRD or UX was found.

## Delta recheck

**Scope:** only AD-2’s CI contract gate and toolchain timing; AD-5’s cent range/storage; and the Node/Maven labels in the Stack table.

- **AD-2 contract gate — closed.** CI now validates the contract, checks Angular and Spring against it, blocks incompatible v1 changes, and gates artifact release. Tool/CI choice moved to before the first implementation story; support for OAS 3.2.1 must be confirmed then, with an interoperable alternative selected if needed.
- **AD-5 money range — closed.** The same signed safe-integer-cent range is now required in JSON, Java validation, and PostgreSQL `BIGINT` constraints. Product-level sign/limit decisions remain separately deferred.
- **Stack pin/labels — closed.** Node is pinned to 24.22.0; Maven 3.10.0 is correctly named as the Maven distribution used by the wrapper.

**Remaining material gap in the reviewed edits:** None.

## Second delta recheck

**Scope:** AD-5's newly added derived-total constraints and the Deferred compatibility gate for OAS, Angular, and Spring Boot.

- **AD-5 derived totals — closed.** The rule now requires exact arithmetic for month sums and remaining budget, rejects mutations whose stored or computed cent values exceed the shared safe-integer range, and emits only in-range JSON numbers. This closes the residual risk of individually valid expense rows producing an unsafe sum.
- **Deferred toolchain compatibility — closed.** Before the first implementation story, the selected tools must demonstrate support for the selected OAS version and compatibility with Angular 22/Spring Boot 4.1.1; if OAS 3.2.1 support is unreliable, an interoperable OAS version must be chosen. AD-2 then makes contract checks a release condition. The tool-choice deferral is time-bounded before implementation, so it no longer leaves a cross-artifact gap.
- **Earlier findings — remain closed.** The CI contract gate, cent storage/input range, and exact Node/Maven pins and labels are unchanged.

**Remaining material gap in this recheck:** None.

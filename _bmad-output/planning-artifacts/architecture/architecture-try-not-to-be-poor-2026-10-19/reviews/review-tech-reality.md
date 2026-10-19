# Technology/currentness review — Architecture Spine

**Reviewed artifact:** `ARCHITECTURE-SPINE.md`  
**Review date:** 2026-10-19  
**Lens:** Current versions, official starter/build guidance, and fit with the accepted two-deployable design. All technical checks below use primary project/vendor sources.

## Verdict

**Pass; no open findings in the reviewed areas.** Maven 3.10.0 and Node 24.22.0 are current on 2026-10-19. The latest AD-2 revision gates OAS-version support and compatibility with Angular 22 / Spring Boot 4.1.1 before the first implementation story, with a fallback spec version if required. The latest AD-5 revision covers both persisted and computed cents, requires exact arithmetic and rejects mutations whose stored or computed values would exceed the safe range. The two findings from the previous pass are closed.

## Findings

### F-1 — Resolved: verify OAS tooling against spec and framework targets before implementation

OpenAPI 3.2.1 was published 2026-09-10 and is current on the spine date. OpenAPI Generator’s own compatibility table lists 3.1 as beta support and does not claim 3.2 support. Its listed Angular generator targets Angular 9–19, while this spine selects Angular 22. The updated Deferred text explicitly requires choosing tools before implementation, proving support for the selected OAS version and compatibility with Angular 22 / Spring Boot 4.1.1, and selecting an interoperable OAS revision if 3.2.1 support is unreliable. That closes the compatibility concern at architecture level.

Sources: [OpenAPI 3.2.1 specification and release date](https://spec.openapis.org/oas/v3.2.1.html), [OpenAPI Generator compatibility and generator matrix](https://github.com/OpenAPITools/openapi-generator).

### F-2 — Resolved: safe-integer bound covers derived sums

The previous AD-5 revision bounded stored individual fields but did not state how aggregates remain representable. The current rule now applies the ±9,007,199,254,740,991 range to both persisted and computed cent values, requires exact API arithmetic, rejects mutations that would exceed the bound, and serializes only in-range JSON numbers. That addresses the identified `SUM(bigint)`/JavaScript precision seam while retaining integer EUR cents. Specific safe arithmetic and transaction implementation can be settled in code under this invariant.

Sources: [ECMAScript `Number.MAX_SAFE_INTEGER`](https://tc39.es/ecma262/2023/multipage/numbers-and-dates.html#sec-number.max_safe_integer), [PostgreSQL 18 aggregate functions](https://www.postgresql.org/docs/18/functions-aggregate.html), [Java 25 `Math.addExact`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Math.html#addExact(long,long)).

## Stack verification matrix

| Spine entry | Verification as of 2026-10-19 | Fit / note |
| --- | --- | --- |
| Angular 22.2.3 | npm registry marks 22.2.3 `latest`; Angular v22 is Active. The official compatibility table permits Node 24.15+ for v22. | Current supported Angular line; Angular 22.2.3 is an appropriate exact app/CLI version pin. |
| Node.js 24.22.0 LTS | Official Node.js release announcement lists v24.22.0 as LTS, dated 2026-10-14; v26 is Current. | Current latest LTS patch on the spine date and satisfies Angular v22’s Node 24 compatibility range. |
| Spring Boot 4.1.1 | Official Spring site lists 4.1.1 as Stable; its release announcement is dated 2026-08-20. Requirements are Java 17–26 and Maven 3.6.3+. | Current stable framework, compatible with Java 25 and Maven. Suitable for the chosen standalone REST API and modular monolith. |
| Java 25 LTS | Oracle’s Java SE roadmap lists Java 25 as LTS; Java 27 is non-LTS. | Correct current LTS line and supported by Spring Boot 4.1.1. Vendor/distribution remains intentionally unpinned. |
| Maven distribution via Maven Wrapper 3.10.0 | Official Maven download page calls 3.10.0 the latest and recommended release; it was released 2026-09-27. Maven 3.10.0 needs JDK 8+, and Spring Boot 4.1.1 accepts Maven 3.6.3+. | Current stable Maven distribution and compatible with Java 25 / Spring Boot 4.1.1. The label distinguishes the distribution pinned by the wrapper from the wrapper scripts' own version. |
| PostgreSQL 18.6 | Official versioning page lists 18.6 as the current minor and supported through 2030-11-14. Release notes date 18.6 to 2026-08-13. | Current supported relational store. The AD-4 runtime-role constraints are aligned with PostgreSQL’s RLS model. |
| OpenAPI 3.2.1 | Official specification page identifies 3.2.1, published 2026-09-10, as current. | Deferred gate now explicitly proves spec and Angular/Spring tool compatibility before implementation, with interoperable-version fallback. Previous finding is closed. |
| Docker Engine 29.9.1 | Official Engine v29 release notes show 29.9.1 dated 2026-10-14. | Current on the spine date and suitable for the accepted single-host Compose operation. |
| Docker Compose 5.6.0 | Official Docker Compose GitHub release page marks v5.6.0 latest, released 2026-10-02. | Current Compose release; accepted deployment shape is supported. |
| Caddy 2.11.7 | Official Caddy release page marks v2.11.7 latest, released 2026-10-03. | Current reverse proxy/static server choice for same-origin `/api/v1` routing and HTTPS termination. |

Primary sources: [Angular versions](https://angular.dev/reference/versions), [Angular release schedule/support](https://angular.dev/reference/releases), [Angular package registry](https://www.npmjs.com/package/@angular/core?activeTab=versions), [Node.js 24.22.0 LTS announcement](https://nodejs.org/en/blog/release/v24.22.0), [Node release schedule](https://nodejs.org/en/about/previous-releases), [Spring Boot system requirements](https://docs.spring.io/spring-boot/system-requirements.html), [Spring Boot project/stable releases](https://spring.io/projects/spring-boot), [Java SE roadmap](https://www.oracle.com/java/technologies/java-se-support-roadmap.html), [Maven downloads](https://maven.apache.org/download.cgi), [Maven release history](https://maven.apache.org/docs/history.html), [PostgreSQL versioning](https://www.postgresql.org/support/versioning/), [PostgreSQL 18.6 release notes](https://www.postgresql.org/docs/release/18.6/), [Docker Engine 29 release notes](https://docs.docker.com/engine/release-notes/29/), [Compose releases](https://github.com/docker/compose/releases), [Caddy releases](https://github.com/caddyserver/caddy/releases).

## Starter and deployment fit

- **Angular SPA and static artifact:** The Angular CLI’s `ng new` SSR option is opt-in (`--ssr`); the architecture’s explicit SSR exclusion is therefore coherent. The official deployment guide describes client-rendered Angular apps as suitable for static hosting, with routed applications configured to fall back to `index.html`. Caddy can serve the Angular build while proxying `/api/v1` to Spring on the private Compose network. Sources: [Angular CLI `ng new`](https://angular.dev/cli/new), [Angular deployment](https://angular.dev/tools/cli/deployment).
- **Spring starter:** Spring Boot 4.1.1 is stable and officially bootstrapped through Spring Initializr. Its system requirements support the selected Java 25 and Maven build. No evidence of a starter/framework conflict with an independently deployed HTTP API was found. Sources: [Spring Boot project/Initializr](https://spring.io/projects/spring-boot), [system requirements](https://docs.spring.io/spring-boot/system-requirements.html).
- **Two artifacts and Compose:** The static browser build and Spring Boot application remain independently buildable/releasable even though Caddy and PostgreSQL are runtime services in the same Compose deployment. This matches the accepted two-deployable requirement; the stack does not accidentally merge UI and API into one artifact.
- **Germany/VPS:** Hetzner documents Falkenstein and Nuremberg as German Cloud locations. The host remains self-managed, consistent with the spine’s operational caveat and deferred sizing/backups/monitoring gates. Sources: [Hetzner Cloud locations](https://docs.hetzner.com/cloud/general/locations/), [Hetzner data protection](https://docs.hetzner.com/general/company-and-policy/data-protection-at-hetzner/).

## Disposition

No stack redesign is indicated. Maven and Node pins are current, and the revised OAS gate and exact-cent invariant resolve the previous findings. The other checked versions and Angular/Spring/Compose/Hetzner decisions are supported by current official sources and fit the accepted design.

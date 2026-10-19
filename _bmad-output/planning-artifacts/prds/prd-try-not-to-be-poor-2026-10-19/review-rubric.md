# PRD Quality Review — Try Not to Be Poor

## Overall verdict

This is a coherent, useful draft for a small private user group: the central journey is concrete, personal data separation is treated as a core requirement, and the FRs generally connect to observable outcomes. The main risks before downstream work are a few unresolved data-access and lifecycle decisions, loose boundaries for monetary inputs and savings-goal lifecycle, and a success measure that confirms visibility but not the intended financial effect. It is ready to inform UX and architecture, with those open points carried forward explicitly.

## Decision-readiness — adequate

The core product decisions are stated clearly: signup is open to anyone holding the registration link (FR-1); data is private per account (FR-2–3); expenses are manual and dated automatically in Europe/Berlin (FR-4); the budget carries forward and excludes income (FR-7–8); and goal progress is a manually maintained total (FR-9–10). The PRD also distinguishes the desired outcome of having more money left from a result the product can promise (Vision, §7), which is an honest framing.

Several meaningful questions are surfaced with owners and revisit conditions in §9. For a personal pilot, those can reasonably flow into architecture and release planning rather than block the whole PRD. However, the lifetime and revocation of the registration link and the handling of personal financial data are material decisions for a product whose private-circle boundary depends on a shared link. The PRD correctly leaves them open, but they should remain explicit gates before the link is shared broadly or real users rely on the service.

### Findings
- **medium** Registration-link lifecycle is unresolved (§4.1 FR-1; §9, question 5) — Anyone with the link can register, while expiry and revocation are deferred to architecture. That choice directly shapes how the intended small private circle is enforced. *Fix:* Resolve the link's lifetime and revocation behavior in architecture before inviting the group, and reflect the chosen user-visible behavior in the requirement.
- **medium** Personal-data lifecycle remains open (§8; §9, question 2) — Export, retention, deletion, and account recovery are listed as matters to clarify before a real-data release, but the PRD does not state which are required in v1. *Fix:* Make an explicit release-scope decision on each item before implementation is considered ready for real users.

## Substance over theater — strong

The vision is specific to the stated product: manual personal expense capture, a remaining monthly budget, and personally maintained savings goals. It does not claim novelty or promise a guaranteed financial result. The one named journey (UJ-1) explains a real first-use and return-use path, and the data-isolation requirements are substantive because they constrain a central product boundary. The privacy and quality section stays focused on this boundary rather than padding the PRD with generic claims such as “highly scalable.”

The “Try Not to Be Poor” name and its deliberately provocative quality are acknowledged without inventing a product voice that the user has not chosen (§1). The success section is also candid that the broader financial outcome cannot yet be measured from a baseline.

### Findings

No substantive findings.

## Strategic coherence — adequate

The PRD has a clear thesis: making personal spending and savings progress visible may help users understand their finances and leave more money at month end (§1). Expense capture, the monthly remaining-budget view, and goal progress all support that visibility. The v1 scope is consistent with a small personal product, and manual entry is explained as the intended basis of the first version rather than presented as a temporary technical shortcut.

The success criteria mainly establish whether users can see the relevant information (SM-1 and SM-2). That is an appropriate first validation step, but it does not yet show whether visibility changes spending behavior; SM-C1 is an observation rather than a defined guardrail. The PRD openly states this limitation, so it is a validation gap to carry forward, not an unsupported claim.

### Findings
- **low** Success measures stop at visibility (§7) — SM-1 and SM-2 test whether the overview and goal progress can be recognized, while SM-C1 says to observe whether entry effort impedes continued use without stating how that observation will be assessed. *Fix:* During the first one or two months of use, define a lightweight check for continued manual entry and decide whether any longer-term comparison is worth collecting; keep the financial outcome explicitly exploratory unless a baseline is agreed.

## Done-ness clarity — thin

Most FRs contain verifiable consequences, and IDs FR-1 through FR-11 are stable and contiguous. The strongest examples are FR-3's prohibition on exposing another account's records and FR-8's explicit rest-budget formula and update behavior. Those give architecture and story work a solid starting point.

Some requirements still leave boundaries that can lead to incompatible implementations. The PRD does not specify acceptable amount values or precision for expenses, budgets, and goals; nor does it state what a user can do when an existing savings goal's name, target, or date needs correction. FR-11's “bedienbar” criterion also leaves the responsive requirement at a broad capability statement. These can be resolved in UX and architecture, but the resulting requirements should be made testable before implementation stories are treated as ready.

### Findings
- **medium** Monetary input boundaries are unspecified (§4.2 FR-4; §4.3 FR-7; §4.4 FR-9–10) — The PRD requires euro amounts but does not define accepted precision or whether zero, negative, or over-target values are valid. These cases affect validation and displayed calculations. *Fix:* Define the accepted value range and precision for expense, budget, goal, and current-progress amounts, including whether progress may exceed the target.
- **medium** Savings-goal lifecycle is incomplete (§4.4 FR-9–10; §6.1) — v1 allows creating a goal and changing its current total, but it does not say whether its name, target, or date can be changed, or whether a goal can be deleted. *Fix:* Decide which goal lifecycle operations belong in v1 and express the chosen operations as observable requirements; if creation-only is intentional, state that explicitly.
- **low** Responsive usability has no concrete completion check (§4.5 FR-11; §8) — “bedienbar” on smartphone and desktop does not identify a checkable outcome or viewport expectation. *Fix:* Let UX define a small set of device-size and core-task acceptance checks, then reference them from FR-11.

## Scope honesty — adequate

The PRD explicitly says what is excluded: shared views, business finance, income-based calculation, and automatic bank import (§5). It also names categories and recurring expenses as deferred rather than letting a reader assume they exist (§6.2). The two assumptions in §4.3 and §10 are tagged and indexed, and their implications are understandable. Five open questions are owner-assigned and include revisit conditions; for the stated private small-group use, that is a manageable and honest amount of unfinished product detail.

The v1 list includes the central expense, budget, and savings capabilities without implying that the application imports or verifies bank balances. No silent scope reduction or unsupported promise is apparent. The unresolved decisions around user-data lifecycle and registration-link control are made visible in the decision-readiness findings above.

### Findings

No additional scope findings.

## Downstream usability — adequate

The glossary defines the important domain terms, all FR IDs are unique and contiguous, and UJ-1 has a named protagonist with context inline. Success metrics link back to FRs, and the referenced FRs resolve. Each requirement section has enough local context to be useful to UX, architecture, and story-writing workflows. The frontmatter clearly marks this as a draft.

One cross-section ambiguity remains: FR-4 assigns every expense a Europe/Berlin date, but FR-5's table only requires name and amount to be visible, while the glossary calls the view a “Monatsübersicht.” The PRD does not say whether the table is all-time or month-filtered, or whether the date/month is displayed. This could cause UX and story work to interpret the central expense list differently.

### Findings
- **medium** Expense-list time scope and date visibility are unclear (§3 “Monatsübersicht”; §4.2 FR-4–5; UJ-1) — Each expense has a date and the budget calculation is month-specific, but the table's required columns mention only name and amount and its time scope is not defined. *Fix:* Specify whether the table shows all expenses or a selected month, and whether the assigned date is visible, so the historical list and monthly budget can be interpreted consistently.

## Shape fit — strong

This is a small consumer-facing product where the main task is a meaningful experience, so a user journey is load-bearing; UJ-1 is appropriately included and has a named protagonist. A single journey is proportionate to the one confirmed user role and current use case rather than an artificial persona set. The PRD's moderate rigor is justified by account-based access to private financial data and by its intended use as input to UX, architecture, and implementation. The privacy requirements appropriately receive more detail than secondary capabilities.

### Findings

No shape-fit findings.

## Mechanical notes

- Glossary terms are mostly consistent: Nutzerkonto, Ausgabe, Monatsbudget, Restbudget, Sparziel, and Europe/Berlin each have stable meanings. The date appears in FR-4 and the glossary, but is not required as a visible table field; see the downstream finding.
- FR IDs run once from FR-1 to FR-11. UJ-1 is unique. SM-1, SM-2, and the separately labeled counter-metric SM-C1 are distinct; the counter-metric label is intentional and does not indicate a gap.
- Cross-references to FR-5, FR-8, and FR-10 in the success criteria resolve. No broken internal references observed.
- Both inline `[ASSUMPTION]` tags in FR-8 and §10 are represented in the Assumptions section. The negative-rest-budget assumption is explicitly paired with an open question about presentation.
- The only user journey has a named protagonist (Linus) and inline context.
- No separate `addendum.md` is present in this PRD workspace. The PRD identifies the source brief and its data-isolation addendum in §0.

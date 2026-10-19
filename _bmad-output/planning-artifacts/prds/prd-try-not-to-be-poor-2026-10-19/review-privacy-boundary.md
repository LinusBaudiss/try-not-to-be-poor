# Privacy boundary review

**Verdict:** The PRD states the per-account data boundary clearly. One medium-priority access-boundary decision remains open before real users' financial data is used.

## Medium — registration-link lifecycle is open

Sections 4.1 (FR-1–FR-3), 8, and 9.5 distinguish two things correctly: the owner confirmed that anyone who has the registration link may register, while the product is intended for a small private circle; the PRD also explicitly says that the circle depends on whom Linus shares the link with. This is a confirmed access policy, not an invitation-only policy, and should not be silently tightened in downstream work.

The unresolved question is whether the link remains usable indefinitely and how registration can be stopped or the link revoked/replaced. That leaves the practical boundary of the private circle dependent on an unbounded bearer link. Resolve and document the intended link lifecycle before release with real financial data (at minimum, whether the link expires and whether Linus can disable or replace it).

## Data isolation

No material requirement gap found in the reviewed scope: FR-2 and FR-3 require each account to see and change only its own expenses, budget, and goals; FR-4–FR-10 repeatedly assign those records and calculations to the account owner. The explicit no-shared-views scope is consistent with those requirements. The concrete access-control design remains appropriately assigned to architecture.

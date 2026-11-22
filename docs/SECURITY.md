# Security

The public application uses a publishable key and a column allowlist. A read-only database check confirmed that the anonymous role lacks access to event author IDs, profiles, and the review application RPC. This check covers grants. Role-specific RLS behavior requires integration fixtures.

Before enabling registration and uploads, verify the following in an isolated environment.

- Confirmed institution-domain email is required for entering identity review. Manual approval remains the source of verified-member status.
- Account ownership and moderator or admin privilege must derive from trusted database state.
- Verification evidence must be protected by owner and authorized reviewer policies, an explicit path format and file validation, and recorded retention and deletion rules.
- Application acceptance and invitation acceptance must lock the same team row and enforce capacity and uniqueness in the transaction.
- Test anonymous, unverified, verified, team member, team leader, moderator, admin, and super admin capabilities with representative fixtures.

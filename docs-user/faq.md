# FAQ

## Is this production-ready?

No. It is a working MVP/local stack with known production blockers.

## Can I store real personal data?

Only after addressing the security and privacy issues in `docs/security.md` and `docs/known-issues.md`.

## Is there real AI?

The agents are deterministic TypeScript functions. Optional MemPalace support exists for external memory writes, but it is off by default.

## Does delete permanently remove data?

No. Contact delete is a soft delete. Related history and audit records remain in the database.

## Can I use mobile and desktop?

Yes, but they are thin shells and do not match the full web feature set.

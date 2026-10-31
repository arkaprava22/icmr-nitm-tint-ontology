# Phase 2 Step 10: Tamper-Evident Audit and Provenance

This step makes workflow history verifiable and usable by both governance administrators and contributing practitioners.

## Hash-chain design

Every audit event stores:

- actor or automated-system identity;
- action and contribution identifier;
- exact timestamp and structured detail;
- the previous event hash; and
- a SHA-256 hash over the complete canonical event plus the previous hash.

Before a new event is appended, the application verifies the full chain. If any stored event or linkage has changed, the mutation fails instead of extending a compromised history. SQLite row insertion order is the chain order, avoiding ambiguity when timestamps match.

Existing pilot events are backfilled only when every pre-existing event is unhashed. A partially hashed chain is never silently rewritten.

## Monitoring

The administrator audit screen shows chain status, verified event count, latest verification time, recent actions, actors, affected contributions, event detail, and shortened hash identifiers. Full hashes remain in the database.

## Practitioner provenance

Practitioners can open an activity timeline for their own contributions from the revision screen. Ownership is checked before any timeline data is returned. The timeline includes creation, automated checks, submission, review decisions, revisions, and publication.

## Scope

The chain provides tamper evidence, not external notarization. Production deployment should periodically anchor the latest hash in a separately controlled store, protect database backups, synchronize trusted time, and define incident procedures for integrity failures.

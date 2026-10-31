# Phase 2 Step 5: Practitioner Contributions

This step adds authenticated practitioner access and a structured contribution workflow.

## Pilot workflow

1. A verified practitioner signs in with a local pilot account.
2. The practitioner records a focused remedy or health-use claim, preparation, population, safety context, evidence, and conflict disclosure.
3. The application saves an auditable relational draft before writing RDF.
4. RDF is written to a contribution-specific named graph under the configured submission prefix.
5. The contribution remains a draft and is never copied into the public graph without a later review decision.

## Development storage

The production data model remains the Prisma/PostgreSQL schema. Because PostgreSQL is not available in the current local environment, this pilot uses Node's embedded SQLite database at `.runtime/tint-dev.sqlite` for identities, sessions, draft metadata, and audit events. This adapter is development-only and can be replaced without changing the contribution workflow.

Passwords are stored with scrypt hashes and unique salts. Session cookies are opaque, HTTP-only, same-site, time-limited tokens; only a SHA-256 digest is stored. Repeated failed sign-ins are temporarily rate-limited.

## Pilot account

Local credentials are supplied through `DEV_PRACTITIONER_EMAIL` and `DEV_PRACTITIONER_PASSWORD`. The example environment file contains non-production defaults for development testing only.

## Publication boundary

Successful ontology synchronization means only that the draft reached its isolated submission graph. It does not indicate clinical validation, endorsement, or publication. Review, revision, approval, and public-graph promotion are later workflow steps.

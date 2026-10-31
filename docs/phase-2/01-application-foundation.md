# Phase 2, Step 1: Application Foundation

## Selected structure

- Next.js App Router and TypeScript for the public and professional portals
- PostgreSQL for identity, credentials, workflow, assignments, decisions, and audit events
- Prisma for the relational schema and migrations
- RDF store integration reserved for Step 2
- Pilot JSON and RDF remain development-only fixtures

## Data boundary

PostgreSQL does not duplicate the clinical knowledge graph. A contribution stores
the submission graph IRI and proposed entity IRI; the complete ontology content
stays in the RDF store. This keeps review workflow transactional while preserving
semantic querying and graph provenance.

## Local configuration

Copy `.env.example` to `.env` and provide a PostgreSQL connection string before
using database-backed screens. The public shell and health endpoint run without a
database; they report that persistence is not configured.

## Step 1 completion checks

- Dependency installation succeeds
- Prisma Client generation and schema validation succeed
- Type checking, linting, and production build succeed
- Public application shell renders on desktop and mobile
- `/api/health` reports service configuration without exposing secrets


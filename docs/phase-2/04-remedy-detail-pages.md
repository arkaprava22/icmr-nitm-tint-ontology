# Phase 2, Step 4: Remedy and Claim Detail Pages

## Route

`/remedies/{opaque-remedy-id}?lang=en|hi`

Remedy identifiers are validated before querying. The graph is selected by the
server's publication-boundary rules; a URL cannot select a graph or supply an IRI.

## Detail content

- preferred, alternative, and botanical names;
- medical tradition, record status, and overall risk tier;
- proposed claims with target, intended outcome, population, and review status;
- all linked safety statements and machine-readable safety codes;
- linked evidence type, citation, assessment, and validation status;
- entity and named-graph provenance;
- bilingual navigation, labels, warnings, and workflow status.

Pilot evidence and safety text remains explicitly marked as unvalidated. No
dosage or preparation instruction is invented when the graph lacks approved data.

## API

`GET /api/remedies/{id}?lang=en|hi` returns the same aggregated record for future
clients. Invalid, unknown, and non-permitted identifiers receive a 404 response.

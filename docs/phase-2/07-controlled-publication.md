# Phase 2 Step 7: Controlled Publication and Administration

This step introduces a separate, privileged publication boundary after practitioner contribution and independent review.

## Publication flow

1. Only contributions with an approved review decision enter the publication queue.
2. An authenticated administrator inspects the contributor, reviewer, rationale, risk tier, and source graph.
3. The administrator records a publication note and explicitly confirms public release.
4. RDF is copied from the immutable submission graph into the public graph.
5. Draft publication and validation markers are transformed to `statusPublished` and `reviewed` in the public copy.
6. The relational contribution becomes `PUBLISHED` and an audit event records the administrator and time.

The operation is retry-safe at the RDF layer. The source submission graph is retained for provenance and later comparison.

## Security controls

- Administrator authorization is checked inside every Server Action.
- The server reloads the contribution and requires `APPROVED` plus successful ontology synchronization.
- Graph identifiers are validated against the configured submission and public graph boundaries.
- Review approval never publishes automatically.
- Publication cannot be repeated after the relational status changes.

## Pilot administrator

Development credentials use `DEV_ADMIN_EMAIL` and `DEV_ADMIN_PASSWORD`. The `.env.example` values are local fixtures only and must be replaced by managed identity and stronger authentication for deployment.

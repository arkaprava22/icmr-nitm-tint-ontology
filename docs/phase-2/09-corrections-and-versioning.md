# Phase 2 Step 9: Practitioner Corrections and Versioning

This step completes the correction loop for validation failures and reviewer change requests.

## Revision workflow

1. Practitioners may edit only their own `DRAFT` or `CHANGES_REQUESTED` contributions.
2. Reviewer feedback is displayed above the correction form when changes were requested.
3. Saving snapshots the complete previous relational record and retains its named ontology graph.
4. A new revision number and submission graph are created.
5. The contribution returns to `DRAFT`; prior submission, synchronization, and validation states are cleared.
6. The new RDF graph is synchronized and automatically validated.
7. A passing revision may be resubmitted for independent review.

## Preservation and audit

Earlier versions are never overwritten. Each revision records its prior graph IRI, relational snapshot, author, revision number, and timestamp. The main contribution points only to the current revision graph, while the audit log records the transition between versions.

## Authorization and state safety

Ownership and editable status are checked again inside the Server Action and database transaction. Submitted, approved, rejected, or published records cannot be altered through the revision route. A synchronization failure preserves the new revision in a recoverable failed state without damaging the earlier graph.

## Pilot correction

The legacy ginger contribution can now be opened from the practitioner dashboard and supplied with the missing Hindi title. Saving creates revision 2, preserves revision 1, reruns automated checks, and enables resubmission when all requirements pass.

# Phase 2 Step 8: Automated Validation and Readiness Gates

This step introduces structural ontology validation throughout the contribution, review, and publication workflow.

## Automated checks

Every synchronized submission graph is checked for:

- a health-use claim;
- English and Hindi preferred labels;
- a linked remedy and symptom or health-condition target;
- medical-system, intended-outcome, and population context;
- evidence with a source citation;
- a safety statement with an assessment note;
- publication status; and
- contributor provenance.

These checks implement the application's current SHACL-aligned safe subset. They assess structural readiness, not clinical truth or evidence quality. Human review remains mandatory.

## Workflow gates

- A new draft is validated immediately after ontology synchronization.
- Existing drafts can rerun checks from the practitioner dashboard.
- Failed or untested drafts cannot be submitted for review.
- Reviewer decisions require a passed validation state.
- Publication reruns validation against the source graph immediately before RDF promotion.

Each run stores its timestamp, status, issue list, and audit event. Contributors receive an actionable first issue on the dashboard, while reviewers see the latest validation result beside the submitted record.

## Multilingual requirement

The practitioner form now captures both English and Hindi claim titles. Existing development drafts without a Hindi label correctly fail validation and remain blocked until a future correction workflow updates their RDF.

## Remaining validation work

The current gate covers deterministic structural requirements. Later iterations should add full SHACL report persistence, duplicate and terminology checks, language quality review, source-identifier verification, risk-specific reviewer rules, and next-review-date requirements.

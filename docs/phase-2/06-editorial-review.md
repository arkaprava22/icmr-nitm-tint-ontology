# Phase 2 Step 6: Editorial Review and Moderation

This step completes the first controlled editorial loop for practitioner contributions.

## Workflow

1. A practitioner explicitly submits a synchronized draft for review.
2. The submission enters the reviewer queue without entering public search.
3. A verified reviewer inspects the complete structured record, including safety, evidence, population, preparation, and conflict disclosure.
4. The reviewer must confirm both safety and evidence checks and provide a written rationale.
5. The reviewer may approve, request changes, or reject the submission.
6. Every submission and decision is recorded in the audit log.

Approval in this pilot means editorial assessment is complete. It does not publish RDF to the public graph. Publication remains a separate privileged operation for a later step.

## Independence and authorization

Practitioner and reviewer sessions use role-specific authorization checks on both pages and Server Actions. The workflow store rejects self-review and accepts decisions only for actively submitted records.

## Pilot reviewer

Development credentials are configured with `DEV_REVIEWER_EMAIL` and `DEV_REVIEWER_PASSWORD`. The defaults in `.env.example` are local test fixtures and must not be used in production.

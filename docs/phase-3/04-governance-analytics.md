# Phase 3 Step 4: Governance Analytics

This step adds an administrator analytics dashboard for monitoring the health of the knowledge workflow.

## Purpose

Governance users need a single view of operational risk and readiness before the platform grows beyond the pilot. The dashboard helps administrators track:

- contribution workflow volume;
- records waiting for review;
- publication throughput;
- validation readiness;
- citizen safety feedback;
- review decision patterns;
- AYUSH system coverage;
- evidence-source coverage; and
- audit-chain integrity.

## Application Surface

The new `/admin/analytics` page is protected by administrator login and appears in the admin navigation.

It displays:

- total contributions;
- publication rate;
- safety feedback count;
- validation pass count;
- workflow-stage bars;
- validation bars;
- citizen-feedback bars;
- review-decision bars;
- system and evidence coverage; and
- audit posture with latest hash preview.

## Data Sources

The dashboard reads from the development workflow database:

- `contributions`;
- `reviews`;
- `validation_runs`;
- `citizen_feedback`; and
- `audit_events`.

No analytics values are user-entered. All metrics are derived from workflow and governance activity.

## Exit Criteria

This step is complete when:

- `/admin/analytics` is protected by administrator login;
- the dashboard appears in admin navigation;
- workflow, validation, feedback, review, coverage, and audit metrics render;
- the view works with empty pilot data; and
- validation tests cover the analytics surface.

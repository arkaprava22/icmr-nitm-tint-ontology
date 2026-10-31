# Phase 3 Step 1: Public Trust Console

This step begins Phase 3 by exposing a citizen-facing transparency view for the ontology-backed knowledge service.

## Purpose

The public trust console makes the platform boundary visible before wider release. It helps users understand:

- whether reviewed knowledge has entered the public graph;
- whether search results are still pilot or development records;
- how practitioner submissions become published knowledge;
- what safety safeguards are attached to records; and
- why the service is guidance and knowledge access, not diagnosis or prescription.

## Application Surface

The new `/trust` page shows:

- ontology-store availability;
- count of published remedies;
- count of published health-use claims;
- count of reviewed evidence items;
- the reviewed-public-knowledge status;
- workflow guardrails for publication; and
- the Phase 3 step sequence.

The home page now includes a `Trust` navigation link.

## Phase 3 Sequence

1. Public trust and transparency console.
2. Guided discovery by symptom, remedy, region, and AYUSH system.
3. Citizen feedback intake with safety triage.
4. Governance analytics for administrators.
5. Evidence strengthening and external-source curation.

## Safety Boundary

The console repeats the product rule that TINT is not a diagnosis or prescription service. Severe symptoms, pregnancy, children, chronic disease, and medicine-interaction scenarios must be directed to qualified health professionals.

## Exit Criteria

This step is complete when:

- `/trust` renders without requiring authentication;
- ontology-store status is visible;
- public-graph counts are shown;
- pilot/public distinction is explicit; and
- the page is linked from the public search experience.

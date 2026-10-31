# Phase 3 Step 3: Citizen Feedback and Safety Triage

This step adds a public feedback intake path and an administrator triage queue.

## Purpose

Citizens need a safe way to report:

- safety concerns;
- unclear information;
- missing context;
- local knowledge or wording;
- general product feedback.

Feedback is not added directly to the ontology. It is held for governance review and can later inform corrections, practitioner follow-up, or evidence-strengthening work.

## Application Surface

The new `/feedback` page provides a public form for citizen feedback. It asks for:

- feedback type;
- related remedy, symptom, or page;
- review message;
- optional country, state, or community context;
- optional contact for clarification; and
- a declaration that the form is not for emergencies or personal treatment decisions.

The new `/admin/feedback` page provides:

- open feedback count;
- safety-review count;
- resolved count;
- full feedback queue;
- safety-priority labels; and
- triage actions for administrators.

## Triage Rules

Feedback is marked for safety review when:

- the user chooses `Safety concern`; or
- the message contains high-risk terms such as emergency, severe, pregnancy, child, allergy, reaction, bleeding, breathing, poisoning, or overdose.

Administrators can mark feedback as:

- `IN_TRIAGE`;
- `RESOLVED`; or
- `DISMISSED`.

Every citizen submission and triage decision is written into the tamper-evident audit chain.

## Safety Boundary

The feedback form is not an emergency channel and does not provide diagnosis, prescription, or urgent medical support. This is stated before submission and must be accepted by the user.

## Exit Criteria

This step is complete when:

- `/feedback` renders publicly;
- citizen feedback is validated before storage;
- safety concerns are separated for priority review;
- `/admin/feedback` is protected by administrator login;
- administrators can record triage decisions; and
- feedback submission and triage are audit recorded.

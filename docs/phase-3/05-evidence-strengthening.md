# Phase 3 Step 5: Evidence Strengthening and Source Curation

This step adds an administrator evidence-curation queue for improving weak or practitioner-only evidence before broader publication.

## Purpose

Traditional medicine records need clear provenance and source quality. This step helps governance teams identify records that need:

- stronger citations;
- independent source confirmation;
- classical-text or government-source references;
- research-publication review; or
- a decision that evidence strengthening is not applicable.

Evidence curation does not directly change published knowledge. It creates a tracked preparation layer for later reviewer or practitioner correction work.

## Application Surface

The new `/admin/evidence` page is administrator-protected and appears in admin navigation.

It shows:

- total contribution count;
- practitioner-only evidence count;
- weak citation count;
- records ready for review;
- a prioritized evidence backlog;
- current citation details; and
- curator status updates.

Administrators can mark an evidence item as:

- `NEEDS_SOURCE`;
- `SOURCE_IDENTIFIED`;
- `READY_FOR_REVIEW`; or
- `NOT_APPLICABLE`.

## Audit Trail

Every evidence-curation update is recorded as `EVIDENCE_CURATION_UPDATED` in the tamper-evident audit chain. This keeps evidence strengthening accountable without silently changing the record.

## Exit Criteria

This step is complete when:

- `/admin/evidence` is protected by administrator login;
- weak and practitioner-only evidence are visible;
- administrators can add curator notes and source details;
- evidence curation is audit recorded; and
- tests cover the evidence-strengthening surface.

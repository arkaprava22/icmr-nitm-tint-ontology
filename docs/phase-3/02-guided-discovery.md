# Phase 3 Step 2: Guided Discovery

This step adds an ontology-backed browsing path for citizens who may not know the exact remedy, ingredient, or symptom name to search.

## Purpose

Guided discovery helps users begin from structured concepts rather than only free text. It supports browsing by:

- symptoms and health conditions;
- remedies and ingredients;
- AYUSH systems; and
- safety or risk level.

Each browse item links back into the main search experience with the selected term, preserving the language choice.

## Application Surface

The new `/discover` page:

- reads browse facets from the active ontology graph;
- supports English and Hindi language selection;
- shows whether the source is the pilot-preview graph or reviewed-public graph;
- degrades safely when the ontology store is unavailable; and
- keeps the safety boundary visible.

The public home page and trust console now link to guided discovery.

## Ontology Use

The discovery query groups records by ontology relationships:

- `tint:hasTarget` for symptom and condition paths;
- `tint:claimsUseOf` for remedy paths;
- `tint:belongsToSystem` for AYUSH-system paths; and
- `tint:riskLevel` for safety-level paths.

During development, the page uses the pilot preview graph. In production, it uses the reviewed public graph.

## Exit Criteria

This step is complete when:

- `/discover` renders without authentication;
- browse sections are generated from ontology data;
- browse items open the public search experience;
- English and Hindi navigation are available; and
- the public navigation exposes guided discovery.

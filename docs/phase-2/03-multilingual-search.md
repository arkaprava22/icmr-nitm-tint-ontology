# Phase 2, Step 3: Multilingual Search

## Search behavior

The public interface searches remedy preferred labels, alternative/local names,
botanical names, and related symptom or condition labels. English and Hindi can
be used independently as the query language or display language.

Search is executed server-side against the RDF store. Browser input is normalized,
length-limited, escaped as a SPARQL string literal, and inserted only into a fixed
query template. The browser cannot submit arbitrary SPARQL or choose a graph.

## Publication boundary

In development, `ENABLE_PILOT_PREVIEW=true` searches the fixed graph
`submissions/pilot-2026-08`. Every result is labelled as an unvalidated preview.
In production, preview is disabled regardless of that setting and search reads
only `https://w3id.org/tint/graph/published`.

## Result fields

- preferred label in the selected language;
- AYUSH or home-remedy system;
- botanical name where present;
- related proposed uses;
- risk level;
- validation/preview state.

Remedy-detail actions remain disabled until Step 4 adds detail routes with full
evidence and safety context.

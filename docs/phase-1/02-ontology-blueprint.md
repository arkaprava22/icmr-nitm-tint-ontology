# Ontology Blueprint

## 1. Modeling approach

Use a claim-centred ontology. A `Remedy` is an intervention or preparation. A
`HealthUseClaim` is a separately reviewable assertion that a remedy is used for
an intended outcome concerning a symptom or condition. Publication applies to
the claim, not automatically to every statement about the remedy.

This avoids three dangerous shortcuts:

- confusing traditional use with demonstrated clinical effectiveness;
- allowing one accepted use to approve every use of the same remedy;
- losing population, safety, source, and jurisdiction context.

## 2. Core concept groups

| Group | Initial classes |
|---|---|
| Tradition | `MedicalSystem`, `PracticeTradition`, `Jurisdiction` |
| Health | `HealthCondition`, `Symptom`, `BodySystem`, `PopulationGroup` |
| Intervention | `Remedy`, `Formulation`, `Practice`, `Ingredient`, `BiologicalSource`, `PlantPart` |
| Use | `HealthUseClaim`, `IntendedOutcome`, `PreparationMethod`, `AdministrationRoute` |
| Safety | `SafetyStatement`, `Contraindication`, `Interaction`, `AdverseEffect`, `SupervisionRequirement` |
| Evidence | `EvidenceItem`, `ClassicalText`, `GovernmentSource`, `ResearchPublication`, `CommunityKnowledge` |
| People | `Practitioner`, `Reviewer`, `Organization`, `Credential` |
| Workflow | `Contribution`, `ReviewDecision`, `PublicationStatus`, `Version` |
| Language | `LocalizedLabel`, `Language`, `Script`, `Region` |

## 3. Important relationships

| Subject | Relationship | Object |
|---|---|---|
| Remedy | `belongsToSystem` | MedicalSystem |
| Remedy | `hasIngredient` | Ingredient |
| Ingredient | `derivedFrom` | BiologicalSource |
| Ingredient | `usesPart` | PlantPart |
| HealthUseClaim | `claimsUseOf` | Remedy |
| HealthUseClaim | `hasTarget` | Symptom or HealthCondition |
| HealthUseClaim | `hasOutcome` | IntendedOutcome |
| HealthUseClaim | `appliesToPopulation` | PopulationGroup |
| HealthUseClaim | `supportedBy` | EvidenceItem |
| HealthUseClaim | `hasSafetyStatement` | SafetyStatement |
| Contribution | `proposes` | Versioned entity or claim |
| ReviewDecision | `reviews` | Contribution |
| ReviewDecision | `decidedBy` | Reviewer |

## 4. Reused standards

Reuse before inventing terms:

- RDF, RDFS, OWL 2, SKOS, SHACL, Dublin Core Terms, and PROV-O
- BCP 47 language tags for multilingual labels
- Schema.org identifiers where they improve public interoperability
- ORCID for researchers where available
- DOI, ISBN, PMID, and stable government document identifiers for evidence
- Darwin Core or recognized taxonomic identifiers for biological species mapping

Clinical terminology mappings should be declared as mappings, never silently
merged. Exact, close, broad, and narrow matches must remain distinct.

## 5. Names and language

Every concept receives one preferred label per language, optional alternative
labels, script/language tags, transliteration, and region of usage. Homonyms must
remain separate concepts. Local names must not be used as biological identity
without an identified source and review.

Example: one regional plant name may refer to different species, while one
species may have many names. Search can surface both but must show ambiguity.

## 6. Evidence model

Evidence is typed rather than flattened into one score:

- traditional/classical textual source;
- official pharmacopoeia or government guidance;
- systematic review or evidence synthesis;
- clinical study;
- preclinical or laboratory study;
- documented practitioner consensus;
- community-held traditional knowledge;
- anecdotal report.

The system records study design, population, outcome, citation, source date,
language, access link, extraction notes, and reviewer assessment. A future
evidence grade may summarize this record, but the underlying evidence stays
visible and versioned.

## 7. Named graphs and publication boundary

Store knowledge in separate graph spaces:

- `core`: approved ontology and controlled vocabularies;
- `published`: approved public claims and descriptions;
- `submissions/{id}`: practitioner-proposed statements;
- `reviews/{id}`: decisions, annotations, and provenance;
- `deprecated`: withdrawn public versions retained for audit;
- `mappings`: links to external terminologies.

Public search reads only `core` and `published`, with explicit optional access to
deprecated notices. Reviewer tools can inspect all authorized graph spaces.

## 8. Stable identifiers

Use opaque, permanent identifiers such as `tint:claim-000001`, not English names
inside identifiers. Labels may change; identifiers do not. A replaced concept is
deprecated and linked to its successor rather than deleted.

## 9. Competency questions

The ontology and search layer must answer:

1. Which reviewed claims concern relief of a symptom in adults?
2. Which remedies are known by a given Hindi or regional name?
3. Which claims require practitioner supervision?
4. What contraindications apply during pregnancy or childhood?
5. Which remedies contain a specific ingredient or biological species?
6. Which claims are supported by government guidance or clinical research?
7. Which claim version was public on a particular date, and who approved it?
8. Which practitioner submissions are awaiting a reviewer from the same system?
9. Which concepts are likely duplicates but have different local names?
10. Which public claims have passed their next-review date?
11. What was deprecated, why, and what replaces it?
12. Which facts are traditional-use descriptions versus efficacy conclusions?

## 10. Validation rules

A publishable `HealthUseClaim` must have:

- one remedy, target, medical system, and intended outcome;
- at least one evidence item;
- at least one safety statement, including an explicit "none known" review state
  when reviewers find no specific warning;
- audience/population scope;
- provenance, reviewer decision, decision date, and next review date;
- labels in every required launch language;
- exactly one current publication status.

The starter SHACL file implements a safe subset. Workflow-aware and conditional
rules will be added after stakeholder decisions are confirmed.


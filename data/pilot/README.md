# TINT Pilot Dataset

This is synthetic, development-only fixture data for building and testing the
TINT application. It contains familiar names and proposed traditional-use claims
to make screens and workflows realistic, but **none of the records has been
clinically, historically, botanically, or editorially validated**.

Do not load this dataset into the public/published graph. The generator assigns
only non-public workflow states and marks every evidence record as a placeholder.

## Contents

- `pilot-dataset.json`: normalized application fixture
- `pilot-dataset.ttl`: equivalent ontology-oriented RDF fixture
- `pilot-summary.json`: counts and integrity-check result
- `scripts/build-pilot-dataset.mjs`: reproducible generator and validator

## Coverage

- 25 remedy concepts
- 40 proposed health-use claims
- English and Hindi preferred labels
- alternative/local names and botanical-name examples
- oral, topical, gargle, and massage routes
- low, moderate, and high-risk review examples
- contraindication, interaction, vulnerable-population, allergy, and supervision flags
- draft evidence placeholders and practitioner contributions
- no approved or published health claims

## Generate and validate

Run from the project root:

```powershell
node scripts/build-pilot-dataset.mjs
```

The script fails when identifiers are duplicated, references are broken, required
labels are missing, safety statements are absent, or a claim is accidentally
marked as published.

## Application rule

Development environments should import the RDF into a graph named similar to
`submissions/pilot`. Public search must query only approved production graphs.


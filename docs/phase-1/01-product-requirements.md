# Phase 1 Product Requirements

Status: Draft for stakeholder validation  
Scope: India-first, globally usable architecture  
Initial release focus: Ayurveda and commonly used home remedies

## 1. Product vision

Create a trustworthy, multilingual service where a member of the public can
search traditional-medicine knowledge by symptom, condition, remedy, ingredient,
or local name. Qualified practitioners can propose additions and corrections;
reviewers decide what becomes public knowledge.

The service must communicate what a source claims, the strength and type of its
support, important safety limits, and whether expert supervision is required.

## 2. Primary users

| Role | Main need | Permission boundary |
|---|---|---|
| Public visitor | Find understandable, safety-aware information | Read published content only |
| Registered user | Save language and accessibility preferences | No clinical contribution rights |
| Verified practitioner | Submit knowledge and corrections | Cannot publish own submissions |
| Domain reviewer | Assess evidence, terminology, and safety | Approves only assigned domains/systems |
| Senior reviewer | Resolve disagreements and high-risk claims | Can deprecate published claims |
| Administrator | Manage accounts, taxonomies, and operations | Cannot bypass clinical review silently |

## 3. Public experience

The first screen is search, not a promotional landing page. A visitor can search
using a symptom, condition, remedy, ingredient, regional name, or AYUSH system.

Each result must show:

- preferred name and known local names;
- tradition or AYUSH system;
- the intended use as a claim, not a guaranteed outcome;
- preparation or mode of use when approved for public display;
- evidence type and review status;
- contraindications, warnings, and supervision requirements;
- source references and last review date;
- related concepts found through the ontology.

Search must support spelling variants, transliteration, synonyms, and concept
expansion without treating related terms as exact synonyms.

## 4. Practitioner experience

A verified practitioner can:

- create a remedy, ingredient, preparation, or intended-use submission;
- select existing ontology concepts before proposing new ones;
- add regional and language-specific names;
- describe population, route, preparation, duration, and restrictions;
- attach classical, government, research, or other supporting sources;
- disclose conflicts of interest and traditional-knowledge sensitivity;
- respond to reviewer questions and track version history;
- flag public content as unsafe, outdated, duplicated, or mistranslated.

## 5. Review workflow

`Draft -> Submitted -> Automated checks -> Under review -> Approved/Changes
requested/Rejected -> Published -> Superseded or Deprecated`

At least one independent domain reviewer is required for ordinary claims. Claims
with potentially serious harm, vulnerable populations, or prescription-like
instructions require a senior safety review. Every decision records who, when,
why, and which version was assessed.

## 6. Functional scope

### MVP

- Public multilingual search and concept detail pages
- Practitioner registration and credential verification workflow
- Structured contribution forms
- Reviewer work queue and decision records
- Ontology browser and controlled vocabulary management
- Evidence, provenance, warning, and review-status display
- Audit history and content versioning
- English and Hindi labels, with an expansion path for Indian languages

### Later releases

- Additional AYUSH systems and international traditional-medicine systems
- Natural-language and voice search
- Personalized saved collections without treatment recommendations
- Standards mappings and public knowledge-graph API
- Assisted duplicate detection, translation, and ontology mapping
- Adverse-event reporting integration, subject to regulatory design

## 7. Out of scope for MVP

- Diagnosis, triage, prescriptions, or individualized dosage
- Automated approval or AI-authored medical claims
- Product sales, practitioner advertising, or efficacy rankings
- Unreviewed community posts appearing in public search
- Claims that conceal the source tradition or supporting evidence

## 8. Non-functional requirements

- Mobile-first and usable on low-bandwidth connections
- WCAG 2.2 AA accessibility target
- Unicode, language tags, and transliteration-aware search
- Immutable audit events and recoverable content versions
- Role-based access, multi-factor authentication for reviewers/admins
- Encryption in transit and at rest; minimal personal-data collection
- Public pages should remain usable if semantic services are temporarily degraded
- Search performance target: p95 under 2 seconds for cached common queries
- Clear separation of public, submitted, rejected, and deprecated graph data

## 9. Success measures

- Search success: user opens a relevant result without reformulating repeatedly
- Safety completeness: published use claims have all required safety fields
- Provenance completeness: every public claim links to sources and review history
- Review quality: low reversal rate after publication and measured reviewer agreement
- Inclusion: useful search coverage across languages, scripts, and regional names
- Freshness: high-risk content is reviewed within its assigned review interval

## 10. Stakeholder decisions required

1. Sponsoring organization and legal data controller
2. Exact meaning and verification process for "qualified practitioner"
3. Initial clinical editorial board and conflict-of-interest policy
4. First two languages and first body-system/use-case boundaries
5. Permitted public detail for preparation, dosage, and duration
6. Source licensing and treatment of protected community knowledge
7. Review service levels and escalation ownership
8. Whether Homeopathy belongs in the initial public-search scope


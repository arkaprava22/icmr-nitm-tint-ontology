import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const rdfStore = readFileSync(new URL("../src/lib/rdf-store.ts", import.meta.url), "utf8");
const workflowStore = readFileSync(new URL("../src/lib/dev-workflow-store.ts", import.meta.url), "utf8");
const publicationAction = readFileSync(new URL("../src/app/admin/actions.ts", import.meta.url), "utf8");
const trustPage = readFileSync(new URL("../src/app/trust/page.tsx", import.meta.url), "utf8");
const discoverPage = readFileSync(new URL("../src/app/discover/page.tsx", import.meta.url), "utf8");
const feedbackPage = readFileSync(new URL("../src/app/feedback/page.tsx", import.meta.url), "utf8");
const feedbackAction = readFileSync(new URL("../src/app/feedback/actions.ts", import.meta.url), "utf8");
const adminPage = readFileSync(new URL("../src/app/admin/page.tsx", import.meta.url), "utf8");
const adminFeedbackPage = readFileSync(new URL("../src/app/admin/feedback/page.tsx", import.meta.url), "utf8");
const adminAnalyticsPage = readFileSync(new URL("../src/app/admin/analytics/page.tsx", import.meta.url), "utf8");
const adminEvidencePage = readFileSync(new URL("../src/app/admin/evidence/page.tsx", import.meta.url), "utf8");
const adminPilotPage = readFileSync(new URL("../src/app/admin/pilot/page.tsx", import.meta.url), "utf8");
const adminPilotPackPage = readFileSync(new URL("../src/app/admin/pilot/evidence-pack/page.tsx", import.meta.url), "utf8");
const adminPilotScalePage = readFileSync(new URL("../src/app/admin/pilot/scale-up/page.tsx", import.meta.url), "utf8");
const adminPilotMonitoringPage = readFileSync(new URL("../src/app/admin/pilot/monitoring/page.tsx", import.meta.url), "utf8");
const adminPilotDeploymentPage = readFileSync(new URL("../src/app/admin/pilot/deployment/page.tsx", import.meta.url), "utf8");
const adminPilotHandoverPage = readFileSync(new URL("../src/app/admin/pilot/handover/page.tsx", import.meta.url), "utf8");
const adminProductionPage = readFileSync(new URL("../src/app/admin/production/page.tsx", import.meta.url), "utf8");
const homePage = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

test("covers the structural publication-readiness requirements", () => {
  for (const code of ["CLAIM_REQUIRED", "EN_LABEL_REQUIRED", "HI_LABEL_REQUIRED", "REMEDY_REQUIRED", "TARGET_REQUIRED", "CONTEXT_REQUIRED", "EVIDENCE_REQUIRED", "SAFETY_REQUIRED", "STATUS_REQUIRED", "PROVENANCE_REQUIRED"]) {
    assert.match(rdfStore, new RegExp(`code: "${code}"`));
  }
});

test("blocks review submission unless validation passed", () => {
  assert.match(workflowStore, /validation_status !== "PASSED"/);
});

test("reruns validation before ontology publication", () => {
  const validationPosition = publicationAction.indexOf("validateSubmissionGraph(contribution.graph_iri)");
  const promotionPosition = publicationAction.indexOf("promoteSubmissionGraph(contribution.graph_iri)");
  assert.ok(validationPosition >= 0 && promotionPosition > validationPosition);
});

test("preserves revisions and limits editable workflow states", () => {
  assert.match(workflowStore, /contribution_revisions/);
  assert.match(workflowStore, /status IN \('DRAFT', 'CHANGES_REQUESTED'\)/);
  assert.match(workflowStore, /revision-\$\{nextRevision\}/);
  assert.match(workflowStore, /validation_status = 'NOT_RUN'/);
});

test("centralizes tamper-evident audit writes", () => {
  assert.match(workflowStore, /function appendAuditEvent/);
  assert.match(workflowStore, /previous_hash/);
  assert.match(workflowStore, /event_hash/);
  assert.match(workflowStore, /verifyAuditChain\(db\)/);
  assert.equal((workflowStore.match(/INSERT INTO audit_events/g) ?? []).length, 1);
});

test("exposes the Phase 3 public trust console", () => {
  assert.match(rdfStore, /publicKnowledgeSummary/);
  assert.match(trustPage, /Public trust console/);
  assert.match(trustPage, /publishedRemedies/);
  assert.match(trustPage, /Not a diagnosis or prescription service/);
  assert.match(homePage, /href="\/trust"/);
});

test("exposes the Phase 3 guided discovery surface", () => {
  assert.match(rdfStore, /guidedDiscoverySummary/);
  assert.match(rdfStore, /tint:hasTarget/);
  assert.match(rdfStore, /tint:claimsUseOf/);
  assert.match(rdfStore, /tint:belongsToSystem/);
  assert.match(discoverPage, /Guided discovery/);
  assert.match(discoverPage, /Symptoms and conditions/);
  assert.match(discoverPage, /AYUSH systems/);
  assert.match(homePage, /href=\{`\/discover\?lang=\$\{language\}`\}/);
});

test("supports Phase 3 citizen feedback safety triage", () => {
  assert.match(workflowStore, /CREATE TABLE IF NOT EXISTS citizen_feedback/);
  assert.match(workflowStore, /CITIZEN_FEEDBACK_SUBMITTED/);
  assert.match(workflowStore, /CITIZEN_FEEDBACK_TRIAGED/);
  assert.match(feedbackAction, /SAFETY_REVIEW/);
  assert.match(feedbackAction, /not an emergency request/i);
  assert.match(feedbackPage, /Help improve traditional medicine knowledge/);
  assert.match(adminFeedbackPage, /Citizen feedback/);
  assert.match(homePage, /href="\/feedback"/);
});

test("supports Phase 3 governance analytics", () => {
  assert.match(workflowStore, /export function governanceAnalytics/);
  assert.match(workflowStore, /systemCoverage/);
  assert.match(workflowStore, /evidenceCoverage/);
  assert.match(workflowStore, /verifyAuditChain\(db\)/);
  assert.match(adminAnalyticsPage, /Operational dashboard/);
  assert.match(adminAnalyticsPage, /Publication rate/);
  assert.match(adminAnalyticsPage, /Citizen safety signals/);
  assert.match(adminAnalyticsPage, /href="\/admin\/analytics"/);
});

test("supports Phase 3 evidence strengthening", () => {
  assert.match(workflowStore, /CREATE TABLE IF NOT EXISTS evidence_curation/);
  assert.match(workflowStore, /EVIDENCE_CURATION_UPDATED/);
  assert.match(workflowStore, /listEvidenceCurationQueue/);
  assert.match(workflowStore, /evidencePriority/);
  assert.match(publicationAction, /evidenceCurationAction/);
  assert.match(adminEvidencePage, /Curation queue/);
  assert.match(adminEvidencePage, /Practitioner-only evidence/);
  assert.match(adminEvidencePage, /href="\/admin\/evidence"/);
});

test("supports Phase 4 pilot readiness preparation", () => {
  assert.match(workflowStore, /export function pilotReadinessSnapshot/);
  assert.match(workflowStore, /Audit integrity/);
  assert.match(workflowStore, /Validation readiness/);
  assert.match(workflowStore, /Safety triage/);
  assert.match(workflowStore, /Evidence strengthening/);
  assert.match(adminPilotPage, /Pilot readiness/);
  assert.match(adminPilotPage, /Validation session path/);
  assert.match(adminPilotPage, /href="\/admin\/pilot"/);
  assert.match(adminEvidencePage, /href="\/admin\/pilot"/);
});

test("supports Phase 4 stakeholder validation records", () => {
  assert.match(workflowStore, /CREATE TABLE IF NOT EXISTS pilot_validations/);
  assert.match(workflowStore, /PILOT_VALIDATION_RECORDED/);
  assert.match(workflowStore, /export function recordPilotValidation/);
  assert.match(workflowStore, /export function listPilotValidations/);
  assert.match(workflowStore, /export function pilotValidationSummary/);
  assert.match(publicationAction, /pilotValidationAction/);
  assert.match(adminPilotPage, /Stakeholder validation records/);
  assert.match(adminPilotPage, /PilotValidationForm/);
  assert.match(adminPilotPage, /Validation records/);
});

test("supports Phase 4 pilot action tracking", () => {
  assert.match(workflowStore, /CREATE TABLE IF NOT EXISTS pilot_actions/);
  assert.match(workflowStore, /PILOT_ACTION_RECORDED/);
  assert.match(workflowStore, /PILOT_ACTION_UPDATED/);
  assert.match(workflowStore, /export function recordPilotAction/);
  assert.match(workflowStore, /export function updatePilotAction/);
  assert.match(workflowStore, /export function listPilotActions/);
  assert.match(workflowStore, /export function pilotActionSummary/);
  assert.match(publicationAction, /pilotActionCreateAction/);
  assert.match(publicationAction, /pilotActionUpdateAction/);
  assert.match(adminPilotPage, /Pilot action tracker/);
  assert.match(adminPilotPage, /PilotActionForm/);
  assert.match(adminPilotPage, /Open actions/);
});

test("supports Phase 4 pilot outcome reporting", () => {
  assert.match(workflowStore, /export function pilotOutcomeReport/);
  assert.match(workflowStore, /CONDITIONAL_GO/);
  assert.match(workflowStore, /NO_GO/);
  assert.match(workflowStore, /pilotReadinessSnapshot\(\)/);
  assert.match(workflowStore, /pilotValidationSummary\(\)/);
  assert.match(workflowStore, /pilotActionSummary\(\)/);
  assert.match(adminPilotPage, /Pilot outcome report/);
  assert.match(adminPilotPage, /outcome.indicators/);
  assert.match(adminPilotPage, /outcome.nextSteps/);
});

test("supports Phase 4 pilot evidence pack", () => {
  assert.match(adminPilotPage, /href="\/admin\/pilot\/evidence-pack"/);
  assert.match(adminPilotPackPage, /Pilot review pack/);
  assert.match(adminPilotPackPage, /pilotOutcomeReport/);
  assert.match(adminPilotPackPage, /auditIntegrityStatus/);
  assert.match(adminPilotPackPage, /Readiness gate evidence/);
  assert.match(adminPilotPackPage, /Recent validation findings/);
  assert.match(adminPilotPackPage, /Open follow-up actions/);
  assert.match(adminPilotPackPage, /Decision next steps/);
});

test("supports Phase 4 pilot sign-off", () => {
  assert.match(workflowStore, /CREATE TABLE IF NOT EXISTS pilot_signoffs/);
  assert.match(workflowStore, /PILOT_SIGNOFF_RECORDED/);
  assert.match(workflowStore, /export function recordPilotSignoff/);
  assert.match(workflowStore, /export function listPilotSignoffs/);
  assert.match(workflowStore, /export function latestPilotSignoff/);
  assert.match(publicationAction, /pilotSignoffAction/);
  assert.match(adminPilotPackPage, /Pilot sign-off/);
  assert.match(adminPilotPackPage, /PilotSignoffForm/);
  assert.match(adminPilotPackPage, /Latest sign-off/);
});

test("supports Phase 4 scale-up planning", () => {
  assert.match(workflowStore, /export function scaleUpPlan/);
  assert.match(workflowStore, /Knowledge expansion/);
  assert.match(workflowStore, /Practitioner onboarding/);
  assert.match(workflowStore, /Safety monitoring/);
  assert.match(workflowStore, /Operational scale/);
  assert.match(adminPilotPage, /href="\/admin\/pilot\/scale-up"/);
  assert.match(adminPilotPackPage, /href="\/admin\/pilot\/scale-up"/);
  assert.match(adminPilotScalePage, /Scale-up plan/);
  assert.match(adminPilotScalePage, /Rollout workstreams/);
  assert.match(adminPilotScalePage, /Expansion sequence/);
});

test("supports Phase 4 rollout monitoring", () => {
  assert.match(workflowStore, /export function rolloutMonitoringDashboard/);
  assert.match(workflowStore, /Sign-off status/);
  assert.match(workflowStore, /Safety feedback/);
  assert.match(workflowStore, /Validation blockers/);
  assert.match(workflowStore, /Publication throughput/);
  assert.match(adminPilotPage, /href="\/admin\/pilot\/monitoring"/);
  assert.match(adminPilotScalePage, /href="\/admin\/pilot\/monitoring"/);
  assert.match(adminPilotMonitoringPage, /Rollout monitoring/);
  assert.match(adminPilotMonitoringPage, /Monitoring signals/);
  assert.match(adminPilotMonitoringPage, /Weekly cadence/);
});

test("supports Phase 4 deployment readiness", () => {
  assert.match(workflowStore, /export function deploymentReadinessChecklist/);
  assert.match(workflowStore, /Governance approval/);
  assert.match(workflowStore, /Audit verification/);
  assert.match(workflowStore, /Validated content baseline/);
  assert.match(workflowStore, /Scale-up workstreams/);
  assert.match(adminPilotMonitoringPage, /href="\/admin\/pilot\/deployment"/);
  assert.match(adminPilotScalePage, /href="\/admin\/pilot\/deployment"/);
  assert.match(adminPilotDeploymentPage, /Deployment readiness/);
  assert.match(adminPilotDeploymentPage, /Readiness checklist/);
  assert.match(adminPilotDeploymentPage, /Production release notes/);
});

test("supports Phase 4 handover summary", () => {
  assert.match(workflowStore, /export function phaseFourHandoverSummary/);
  assert.match(workflowStore, /Pilot governance/);
  assert.match(workflowStore, /Deployment preparation/);
  assert.match(workflowStore, /Rollout monitoring/);
  assert.match(workflowStore, /phaseFivePriorities/);
  assert.match(adminPilotDeploymentPage, /href="\/admin\/pilot\/handover"/);
  assert.match(adminPilotHandoverPage, /Handover summary/);
  assert.match(adminPilotHandoverPage, /Phase 4 handover items/);
  assert.match(adminPilotHandoverPage, /Phase 5 priorities/);
});

test("supports Phase 5 production readiness", () => {
  assert.match(workflowStore, /export function productionReadinessDashboard/);
  assert.match(workflowStore, /Production data store/);
  assert.match(workflowStore, /Identity and access/);
  assert.match(workflowStore, /Validated ontology baseline/);
  assert.match(workflowStore, /Safety operations/);
  assert.match(workflowStore, /Observability/);
  assert.match(adminPage, /href="\/admin\/production"/);
  assert.match(adminPilotHandoverPage, /href="\/admin\/production"/);
  assert.match(adminProductionPage, /Production readiness/);
  assert.match(adminProductionPage, /Production readiness controls/);
  assert.match(adminProductionPage, /Launch sequence/);
});

"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authenticatePractitioner, createDraftContribution, createPractitionerSession, deletePractitionerSession, getContributionForReview, recordValidationResult, reviseContribution, submitContribution, updateContributionSync, } from "@/lib/dev-workflow-store";
import { requirePractitioner, SESSION_COOKIE } from "@/lib/practitioner-auth";
import { graphConfig, turtleLiteral, validateSubmissionGraph, writeSubmissionGraph } from "@/lib/rdf-store";
const systems = new Set([
    "https://w3id.org/tint/ontology/ayurveda",
    "https://w3id.org/tint/ontology/naturopathy",
    "https://w3id.org/tint/ontology/homeRemedyTradition",
]);
const kinds = new Set(["NEW_CLAIM", "NEW_ENTITY", "UPDATE", "SAFETY_FLAG"]);
const evidenceTypes = new Set(["CLASSICAL_TEXT", "GOVERNMENT_SOURCE", "RESEARCH_PUBLICATION", "PRACTITIONER_KNOWLEDGE", "OTHER"]);
function field(formData, name, min, max, errors) {
    const value = String(formData.get(name) ?? "").normalize("NFKC").trim().replace(/\r\n/g, "\n").slice(0, max);
    if (value.length < min)
        errors[name] = `Enter at least ${min} characters.`;
    return value;
}
export async function loginAction(_, formData) {
    const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);
    const password = String(formData.get("password") ?? "").slice(0, 256);
    if (!email || !password)
        return { message: "Enter your email and password." };
    const practitioner = authenticatePractitioner(email, password);
    if (!practitioner)
        return { message: "Sign-in failed. Check your details or try again later." };
    const session = createPractitionerSession(practitioner.id);
    (await cookies()).set(SESSION_COOKIE, session.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: session.expiresAt,
        priority: "high",
    });
    redirect("/practitioner");
}
export async function logoutAction() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token)
        deletePractitionerSession(token);
    cookieStore.delete(SESSION_COOKIE);
    redirect("/");
}
export async function submitContributionAction(contributionId) {
    const practitioner = await requirePractitioner();
    if (!submitContribution(practitioner.id, contributionId))
        redirect("/practitioner?notice=submit-failed");
    revalidatePath("/practitioner");
    revalidatePath("/reviewer");
    redirect(`/practitioner?submitted=${encodeURIComponent(contributionId)}`);
}
export async function validateContributionAction(contributionId) {
    const practitioner = await requirePractitioner();
    const contribution = getContributionForReview(contributionId);
    if (!contribution || contribution.user_id !== practitioner.id || contribution.status !== "DRAFT")
        redirect("/practitioner?notice=validation-unavailable");
    let validationResult;
    try {
        const issues = await validateSubmissionGraph(contribution.graph_iri);
        recordValidationResult(contributionId, issues);
        validationResult = issues.length === 0 ? "passed" : "failed";
    }
    catch {
        redirect("/practitioner?notice=validation-service");
    }
    revalidatePath("/practitioner");
    redirect(`/practitioner?validated=${validationResult}`);
}
function contributionTurtle(draft) {
    const base = `https://w3id.org/tint/data/submissions/${draft.id}/`;
    return `@prefix tint: <https://w3id.org/tint/ontology/> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix data: <${base}> .

data:contribution a tint:Contribution ;
    tint:proposes data:claim ;
    prov:wasAssociatedWith <https://w3id.org/tint/agent/${draft.userId}> .

data:claim a tint:HealthUseClaim ;
    skos:prefLabel ${turtleLiteral(draft.title, "en")}, ${turtleLiteral(draft.titleHi, "hi")} ;
    tint:claimsUseOf data:remedy ;
    tint:hasTarget data:target ;
    tint:hasOutcome data:outcome ;
    tint:appliesToPopulation data:population ;
    tint:belongsToSystem <${draft.systemIri}> ;
    tint:hasSafetyStatement data:safety ;
    tint:supportedBy data:evidence ;
    tint:publicationStatus tint:statusDraft ;
    tint:riskLevel "moderate" ;
    tint:validationStatus "unvalidated" ;
    tint:assessmentNote ${turtleLiteral(draft.proposedUse, "en")} .

data:remedy a tint:Remedy ; skos:prefLabel ${turtleLiteral(draft.remedyName, "en")} ;
    tint:assessmentNote ${turtleLiteral(draft.preparation, "en")} .
data:target a tint:Symptom ; skos:prefLabel ${turtleLiteral(draft.targetLabel, "en")} .
data:outcome a tint:IntendedOutcome ; skos:prefLabel "Proposed outcome"@en .
data:population a tint:PopulationGroup ; skos:prefLabel ${turtleLiteral(draft.population, "en")} .
data:safety a tint:SafetyStatement ; tint:safetyCode "contributor-safety-note" ;
    tint:validationStatus "unvalidated" ; tint:assessmentNote ${turtleLiteral(draft.safety, "en")} .
data:evidence a tint:EvidenceItem ; tint:evidenceType ${turtleLiteral(draft.evidenceType.toLowerCase())} ;
    tint:sourceCitation ${turtleLiteral(draft.citation)} ; tint:validationStatus "unvalidated" ;
    tint:assessmentNote "Not assessed"@en .
`;
}
function contributionInput(formData) {
    const errors = {};
    const kind = field(formData, "kind", 1, 40, errors);
    const systemIri = field(formData, "systemIri", 1, 200, errors);
    const evidenceType = field(formData, "evidenceType", 1, 60, errors);
    const input = {
        kind,
        title: field(formData, "title", 8, 160, errors),
        titleHi: field(formData, "titleHi", 4, 160, errors),
        systemIri,
        remedyName: field(formData, "remedyName", 2, 120, errors),
        targetLabel: field(formData, "targetLabel", 2, 120, errors),
        proposedUse: field(formData, "proposedUse", 20, 1200, errors),
        preparation: field(formData, "preparation", 10, 1000, errors),
        population: field(formData, "population", 3, 300, errors),
        safety: field(formData, "safety", 20, 1200, errors),
        evidenceType,
        citation: field(formData, "citation", 10, 1000, errors),
        conflictDisclosure: field(formData, "conflictDisclosure", 2, 600, errors),
    };
    if (!kinds.has(kind))
        errors.kind = "Choose a valid contribution type.";
    if (!systems.has(systemIri))
        errors.systemIri = "Choose a valid medical tradition.";
    if (!evidenceTypes.has(evidenceType))
        errors.evidenceType = "Choose a valid evidence type.";
    if (formData.get("declaration") !== "accepted")
        errors.declaration = "Confirm the contributor declaration.";
    return { input, errors };
}
export async function createContributionAction(_, formData) {
    const practitioner = await requirePractitioner();
    const { input, errors } = contributionInput(formData);
    if (Object.keys(errors).length)
        return { message: "Review the highlighted fields.", errors };
    const draft = createDraftContribution(practitioner.id, input, graphConfig().submissionPrefix);
    try {
        await writeSubmissionGraph(draft.graphIri, contributionTurtle(draft));
        updateContributionSync(draft.id, "synced");
    }
    catch {
        updateContributionSync(draft.id, "failed");
        return { message: "The draft was saved, but ontology synchronization failed. It can be retried safely." };
    }
    let issues;
    try {
        issues = await validateSubmissionGraph(draft.graphIri);
        recordValidationResult(draft.id, issues);
    }
    catch {
        return { message: "The draft was saved and synchronized, but automated validation is temporarily unavailable." };
    }
    revalidatePath("/practitioner");
    redirect(`/practitioner?created=${encodeURIComponent(draft.id)}&validated=${issues.length === 0 ? "passed" : "failed"}`);
}
export async function reviseContributionAction(contributionId, _, formData) {
    const practitioner = await requirePractitioner();
    const { input, errors } = contributionInput(formData);
    if (Object.keys(errors).length)
        return { message: "Review the highlighted fields.", errors };
    const revision = reviseContribution(practitioner.id, contributionId, input, graphConfig().submissionPrefix);
    if (!revision)
        return { message: "This contribution is no longer available for editing." };
    try {
        await writeSubmissionGraph(revision.graphIri, contributionTurtle(revision));
        updateContributionSync(revision.id, "synced");
    }
    catch {
        updateContributionSync(revision.id, "failed");
        return { message: "The revision was preserved, but ontology synchronization failed. Open it again to retry." };
    }
    let issues;
    try {
        issues = await validateSubmissionGraph(revision.graphIri);
        recordValidationResult(revision.id, issues);
    }
    catch {
        return { message: "The revision was saved and synchronized, but automated validation is temporarily unavailable." };
    }
    revalidatePath("/practitioner");
    redirect(`/practitioner?revised=${revision.currentRevision}&validated=${issues.length === 0 ? "passed" : "failed"}`);
}

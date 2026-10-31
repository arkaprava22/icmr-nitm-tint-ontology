"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authenticatePortalUser, createPractitionerSession, deletePractitionerSession, finalizeContributionPublication, getApprovedContribution, recordEvidenceCuration, recordPilotAction, recordPilotSignoff, recordPilotValidation, recordValidationResult, triageCitizenFeedback, updatePilotAction } from "@/lib/dev-workflow-store";
import { SESSION_COOKIE } from "@/lib/practitioner-auth";
import { promoteSubmissionGraph, validateSubmissionGraph } from "@/lib/rdf-store";
import { requireAdministrator } from "@/lib/admin-auth";
export async function adminLoginAction(_, formData) {
    const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);
    const password = String(formData.get("password") ?? "").slice(0, 256);
    const administrator = email && password ? authenticatePortalUser(email, password, "ADMINISTRATOR") : null;
    if (!administrator)
        return { message: "Sign-in failed. Check your administrator credentials." };
    const session = createPractitionerSession(administrator.id);
    (await cookies()).set(SESSION_COOKIE, session.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: session.expiresAt, priority: "high" });
    redirect("/admin");
}
export async function adminLogoutAction() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token)
        deletePractitionerSession(token);
    cookieStore.delete(SESSION_COOKIE);
    redirect("/");
}
export async function publishContributionAction(contributionId, _, formData) {
    const administrator = await requireAdministrator();
    const note = String(formData.get("publicationNote") ?? "").normalize("NFKC").trim().slice(0, 1000);
    const errors = {};
    if (note.length < 20)
        errors.publicationNote = "Provide a publication note of at least 20 characters.";
    if (formData.get("confirmation") !== "confirmed")
        errors.confirmation = "Confirm the publication declaration.";
    if (Object.keys(errors).length)
        return { message: "Complete the publication checks.", errors };
    const contribution = getApprovedContribution(contributionId);
    if (!contribution)
        return { message: "This record is no longer approved for publication." };
    try {
        const issues = await validateSubmissionGraph(contribution.graph_iri);
        recordValidationResult(contributionId, issues);
        if (issues.length > 0)
            return { message: `Publication blocked: ${issues.length} automated validation issue(s) were found.` };
        await promoteSubmissionGraph(contribution.graph_iri);
    }
    catch {
        return { message: "Publication was not completed because the ontology store could not accept the record." };
    }
    if (!finalizeContributionPublication(contributionId, administrator.id, note))
        return { message: "The record changed during publication. Review its current status." };
    revalidatePath("/admin");
    revalidatePath("/practitioner");
    revalidatePath("/");
    redirect(`/admin?published=${encodeURIComponent(contributionId)}`);
}
export async function triageFeedbackAction(feedbackId, _, formData) {
    const administrator = await requireAdministrator();
    const status = String(formData.get("status") ?? "");
    const note = String(formData.get("triageNote") ?? "").normalize("NFKC").trim().slice(0, 1000);
    const allowed = new Set(["IN_TRIAGE", "RESOLVED", "DISMISSED"]);
    const errors = {};
    if (!allowed.has(status))
        errors.status = "Choose a valid triage status.";
    if (note.length < 10)
        errors.triageNote = "Add a short triage note.";
    if (Object.keys(errors).length > 0)
        return { message: "Complete the triage decision.", errors };
    const completed = triageCitizenFeedback({ id: feedbackId, administratorId: administrator.id, status: status, note });
    if (!completed)
        return { message: "This feedback item is no longer open for triage." };
    revalidatePath("/admin/feedback");
    return { message: "Feedback triage updated." };
}
export async function evidenceCurationAction(contributionId, _, formData) {
    const administrator = await requireAdministrator();
    const status = String(formData.get("status") ?? "");
    const sourceType = String(formData.get("sourceType") ?? "").normalize("NFKC").trim().slice(0, 80);
    const sourceCitation = String(formData.get("sourceCitation") ?? "").normalize("NFKC").trim().slice(0, 1200);
    const curatorNote = String(formData.get("curatorNote") ?? "").normalize("NFKC").trim().slice(0, 1000);
    const allowed = new Set(["NEEDS_SOURCE", "SOURCE_IDENTIFIED", "READY_FOR_REVIEW", "NOT_APPLICABLE"]);
    const errors = {};
    if (!allowed.has(status))
        errors.status = "Choose a valid evidence status.";
    if (sourceType.length < 3)
        errors.sourceType = "Name the source type.";
    if (status !== "NEEDS_SOURCE" && status !== "NOT_APPLICABLE" && sourceCitation.length < 20)
        errors.sourceCitation = "Add citation details for the identified source.";
    if (curatorNote.length < 10)
        errors.curatorNote = "Add a short curator note.";
    if (Object.keys(errors).length > 0)
        return { message: "Complete the evidence curation details.", errors };
    const completed = recordEvidenceCuration({ contributionId, administratorId: administrator.id, status: status, sourceType, sourceCitation, curatorNote });
    if (!completed)
        return { message: "This contribution could not be found for evidence curation." };
    revalidatePath("/admin/evidence");
    revalidatePath("/admin/analytics");
    return { message: "Evidence curation updated." };
}
export async function pilotValidationAction(_, formData) {
    const administrator = await requireAdministrator();
    const validatorName = String(formData.get("validatorName") ?? "").normalize("NFKC").trim().slice(0, 120);
    const validatorRole = String(formData.get("validatorRole") ?? "");
    const journey = String(formData.get("journey") ?? "");
    const outcome = String(formData.get("outcome") ?? "");
    const testedTerm = String(formData.get("testedTerm") ?? "").normalize("NFKC").trim().slice(0, 120);
    const notes = String(formData.get("notes") ?? "").normalize("NFKC").trim().slice(0, 1200);
    const roles = new Set(["CITIZEN", "PRACTITIONER", "REVIEWER", "ADMINISTRATOR", "RESEARCHER"]);
    const journeys = new Set(["PUBLIC_SEARCH", "REMEDY_DETAIL", "PRACTITIONER_SUBMISSION", "REVIEW_PUBLICATION", "FEEDBACK_TRIAGE"]);
    const outcomes = new Set(["PASS", "PASS_WITH_CHANGES", "BLOCKED"]);
    const errors = {};
    if (validatorName.length < 3)
        errors.validatorName = "Enter the validator name.";
    if (!roles.has(validatorRole))
        errors.validatorRole = "Choose a validator role.";
    if (!journeys.has(journey))
        errors.journey = "Choose the tested journey.";
    if (!outcomes.has(outcome))
        errors.outcome = "Choose a validation outcome.";
    if (testedTerm.length < 2)
        errors.testedTerm = "Enter the tested term or scenario.";
    if (notes.length < 20)
        errors.notes = "Add validation notes of at least 20 characters.";
    if (Object.keys(errors).length > 0)
        return { message: "Complete the pilot validation record.", errors };
    recordPilotValidation({
        administratorId: administrator.id,
        validatorName,
        validatorRole: validatorRole,
        journey: journey,
        outcome: outcome,
        testedTerm,
        notes,
    });
    revalidatePath("/admin/pilot");
    revalidatePath("/admin/audit");
    return { message: "Pilot validation recorded." };
}
export async function pilotActionCreateAction(_, formData) {
    const administrator = await requireAdministrator();
    const title = String(formData.get("title") ?? "").normalize("NFKC").trim().slice(0, 160);
    const owner = String(formData.get("owner") ?? "").normalize("NFKC").trim().slice(0, 120);
    const priority = String(formData.get("priority") ?? "");
    const status = String(formData.get("status") ?? "");
    const dueDate = String(formData.get("dueDate") ?? "").trim().slice(0, 20);
    const source = String(formData.get("source") ?? "").normalize("NFKC").trim().slice(0, 160);
    const note = String(formData.get("note") ?? "").normalize("NFKC").trim().slice(0, 1200);
    const priorities = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
    const statuses = new Set(["OPEN", "IN_PROGRESS", "RESOLVED", "DEFERRED"]);
    const errors = {};
    if (title.length < 5)
        errors.title = "Enter a clear action title.";
    if (owner.length < 3)
        errors.owner = "Enter the owner or responsible group.";
    if (!priorities.has(priority))
        errors.priority = "Choose a priority.";
    if (!statuses.has(status))
        errors.status = "Choose a status.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))
        errors.dueDate = "Choose a due date.";
    if (source.length < 3)
        errors.source = "Name the validation source.";
    if (note.length < 15)
        errors.note = "Add a note of at least 15 characters.";
    if (Object.keys(errors).length > 0)
        return { message: "Complete the pilot action item.", errors };
    recordPilotAction({
        administratorId: administrator.id,
        title,
        owner,
        priority: priority,
        status: status,
        dueDate,
        source,
        note,
    });
    revalidatePath("/admin/pilot");
    revalidatePath("/admin/audit");
    return { message: "Pilot action recorded." };
}
export async function pilotActionUpdateAction(actionId, _, formData) {
    const administrator = await requireAdministrator();
    const status = String(formData.get("status") ?? "");
    const note = String(formData.get("note") ?? "").normalize("NFKC").trim().slice(0, 1200);
    const statuses = new Set(["OPEN", "IN_PROGRESS", "RESOLVED", "DEFERRED"]);
    const errors = {};
    if (!statuses.has(status))
        errors.status = "Choose a status.";
    if (note.length < 15)
        errors.note = "Add an update note of at least 15 characters.";
    if (Object.keys(errors).length > 0)
        return { message: "Complete the action update.", errors };
    const updated = updatePilotAction({ id: actionId, administratorId: administrator.id, status: status, note });
    if (!updated)
        return { message: "This pilot action could not be found." };
    revalidatePath("/admin/pilot");
    revalidatePath("/admin/audit");
    return { message: "Pilot action updated." };
}
export async function pilotSignoffAction(_, formData) {
    const administrator = await requireAdministrator();
    const decision = String(formData.get("decision") ?? "");
    const signoffBy = String(formData.get("signoffBy") ?? "").normalize("NFKC").trim().slice(0, 140);
    const meetingReference = String(formData.get("meetingReference") ?? "").normalize("NFKC").trim().slice(0, 180);
    const conditions = String(formData.get("conditions") ?? "").normalize("NFKC").trim().slice(0, 1400);
    const decisions = new Set(["APPROVE_EXPANSION", "CONDITIONAL_HOLD", "STOP_PILOT"]);
    const errors = {};
    if (!decisions.has(decision))
        errors.decision = "Choose a sign-off decision.";
    if (signoffBy.length < 3)
        errors.signoffBy = "Enter the responsible sign-off name or committee.";
    if (meetingReference.length < 3)
        errors.meetingReference = "Enter the meeting or approval reference.";
    if (conditions.length < 20)
        errors.conditions = "Add decision notes or conditions of at least 20 characters.";
    if (Object.keys(errors).length > 0)
        return { message: "Complete the pilot sign-off record.", errors };
    recordPilotSignoff({
        administratorId: administrator.id,
        decision: decision,
        signoffBy,
        meetingReference,
        conditions,
    });
    revalidatePath("/admin/pilot");
    revalidatePath("/admin/pilot/evidence-pack");
    revalidatePath("/admin/audit");
    return { message: "Pilot sign-off recorded." };
}

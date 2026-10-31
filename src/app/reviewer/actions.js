"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authenticatePortalUser, createPractitionerSession, deletePractitionerSession, recordReviewDecision } from "@/lib/dev-workflow-store";
import { SESSION_COOKIE } from "@/lib/practitioner-auth";
import { requireReviewer } from "@/lib/reviewer-auth";
export async function reviewerLoginAction(_, formData) {
    const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);
    const password = String(formData.get("password") ?? "").slice(0, 256);
    const reviewer = email && password ? authenticatePortalUser(email, password, "REVIEWER") : null;
    if (!reviewer)
        return { message: "Sign-in failed. Check your reviewer credentials." };
    const session = createPractitionerSession(reviewer.id);
    (await cookies()).set(SESSION_COOKIE, session.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: session.expiresAt, priority: "high" });
    redirect("/reviewer");
}
export async function reviewerLogoutAction() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token)
        deletePractitionerSession(token);
    cookieStore.delete(SESSION_COOKIE);
    redirect("/");
}
export async function reviewDecisionAction(contributionId, _, formData) {
    const reviewer = await requireReviewer();
    const outcome = String(formData.get("outcome") ?? "");
    const rationale = String(formData.get("rationale") ?? "").normalize("NFKC").trim().slice(0, 2000);
    const errors = {};
    if (!["APPROVE", "REQUEST_CHANGES", "REJECT"].includes(outcome))
        errors.outcome = "Choose a review decision.";
    if (rationale.length < 20)
        errors.rationale = "Provide a rationale of at least 20 characters.";
    if (formData.get("safetyChecked") !== "yes")
        errors.safetyChecked = "Confirm the safety assessment.";
    if (formData.get("evidenceChecked") !== "yes")
        errors.evidenceChecked = "Confirm the evidence assessment.";
    if (Object.keys(errors).length)
        return { message: "Complete all review checks.", errors };
    const recorded = recordReviewDecision({ contributionId, reviewerId: reviewer.id, outcome: outcome, rationale, safetyChecked: true, evidenceChecked: true });
    if (!recorded)
        return { message: "This contribution is no longer available for review." };
    revalidatePath("/reviewer");
    revalidatePath("/practitioner");
    redirect(`/reviewer?reviewed=${encodeURIComponent(contributionId)}`);
}

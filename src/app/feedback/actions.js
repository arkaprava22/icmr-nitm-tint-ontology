"use server";
import { revalidatePath } from "next/cache";
import { createCitizenFeedback } from "@/lib/dev-workflow-store";
const categories = new Set(["SAFETY_CONCERN", "LOCAL_KNOWLEDGE", "UNCLEAR_INFORMATION", "MISSING_INFORMATION", "GENERAL_FEEDBACK"]);
function clean(value, maxLength) {
    return String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").slice(0, maxLength);
}
export async function submitCitizenFeedbackAction(_, formData) {
    const category = clean(formData.get("category"), 40);
    const relatedTerm = clean(formData.get("relatedTerm"), 120);
    const message = clean(formData.get("message"), 1600);
    const location = clean(formData.get("location"), 120);
    const contact = clean(formData.get("contact"), 180);
    const errors = {};
    if (!categories.has(category))
        errors.category = "Choose the type of feedback.";
    if (relatedTerm.length < 2)
        errors.relatedTerm = "Enter a remedy, symptom, or page name.";
    if (message.length < 20)
        errors.message = "Describe the concern in at least 20 characters.";
    if (formData.get("declaration") !== "accepted")
        errors.declaration = "Confirm that this is not an emergency request.";
    if (Object.keys(errors).length > 0)
        return { message: "Please complete the required feedback details.", errors };
    const urgency = category === "SAFETY_CONCERN" || /\b(emergency|severe|pregnan|child|allergy|reaction|bleeding|breath|poison|overdose)\b/i.test(message)
        ? "SAFETY_REVIEW"
        : "ROUTINE";
    createCitizenFeedback({ category, urgency, relatedTerm, message, location, contact, });
    revalidatePath("/admin/feedback");
    return { message: "Feedback received. It will be reviewed by the governance team.", success: true };
}

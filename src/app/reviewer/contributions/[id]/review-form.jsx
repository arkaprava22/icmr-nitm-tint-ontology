"use client";
import { useActionState } from "react";
import { ClipboardCheck } from "lucide-react";
import { reviewDecisionAction } from "../../actions";
const ErrorText = ({ name, errors }) => errors?.[name] ? <small className="field-error">{errors[name]}</small> : null;
export function ReviewForm({ contributionId }) {
    const actionWithId = reviewDecisionAction.bind(null, contributionId);
    const [state, action, pending] = useActionState(actionWithId, { message: "" });
    return <form className="review-form" action={action}>{state.message && <p className="form-message" role="alert">{state.message}</p>}<fieldset><legend>Decision</legend><label>Outcome<select name="outcome" defaultValue=""><option value="" disabled>Select a decision</option><option value="APPROVE">Approve for publication preparation</option><option value="REQUEST_CHANGES">Request practitioner changes</option><option value="REJECT">Reject submission</option></select><ErrorText name="outcome" errors={state.errors}/></label><label>Review rationale<textarea name="rationale" rows={6} maxLength={2000} required placeholder="Explain the evidence, safety, and wording basis for this decision."/><ErrorText name="rationale" errors={state.errors}/></label></fieldset><fieldset><legend>Required checks</legend><label className="review-check"><input type="checkbox" name="safetyChecked" value="yes"/><span><strong>Safety assessed</strong>Contraindications, interactions, vulnerable groups, and escalation wording were reviewed.</span></label><ErrorText name="safetyChecked" errors={state.errors}/><label className="review-check"><input type="checkbox" name="evidenceChecked" value="yes"/><span><strong>Evidence assessed</strong>The source supports the proposed wording and traditional-use context.</span></label><ErrorText name="evidenceChecked" errors={state.errors}/></fieldset><button type="submit" disabled={pending}><ClipboardCheck size={18}/>{pending ? "Recording decision…" : "Record decision"}</button></form>;
}

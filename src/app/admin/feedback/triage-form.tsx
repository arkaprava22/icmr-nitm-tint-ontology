"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { triageFeedbackAction } from "../actions";

const ErrorText = ({ name, errors }: { name: string; errors?: Record<string, string> }) => errors?.[name] ? <small className="field-error">{errors[name]}</small> : null;

export function TriageForm({ feedbackId }: { feedbackId: string }) {
  const [state, action, pending] = useActionState(triageFeedbackAction.bind(null, feedbackId), { message: "" });
  return (
    <form className="triage-form" action={action}>
      {state.message && <p className="form-message" role="alert">{state.message}</p>}
      <label>Status
        <select name="status" defaultValue="IN_TRIAGE">
          <option value="IN_TRIAGE">In triage</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
        <ErrorText name="status" errors={state.errors} />
      </label>
      <label>Triage note
        <textarea name="triageNote" rows={3} maxLength={1000} required />
        <ErrorText name="triageNote" errors={state.errors} />
      </label>
      <button type="submit" disabled={pending}><CheckCircle2 size={17} />{pending ? "Updating..." : "Update triage"}</button>
    </form>
  );
}

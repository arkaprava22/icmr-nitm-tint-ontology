"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { publishContributionAction } from "../../actions";

const ErrorText = ({ name, errors }: { name: string; errors?: Record<string, string> }) => errors?.[name] ? <small className="field-error">{errors[name]}</small> : null;

export function PublicationForm({ contributionId }: { contributionId: string }) {
  const actionWithId = publishContributionAction.bind(null, contributionId);
  const [state, action, pending] = useActionState(actionWithId, { message: "" });
  return <form className="publication-form" action={action}>{state.message && <p className="form-message" role="alert">{state.message}</p>}<label>Publication note<textarea name="publicationNote" rows={5} maxLength={1000} required placeholder="Record the release basis, scope, and any operational checks completed." /><ErrorText name="publicationNote" errors={state.errors} /></label><label className="review-check"><input type="checkbox" name="confirmation" value="confirmed" /><span><strong>Confirm public release</strong>I confirm that this record is approved, its source graph is correct, and publication is authorized.</span></label><ErrorText name="confirmation" errors={state.errors} /><button type="submit" disabled={pending}><Send size={18} />{pending ? "Publishing…" : "Publish to public knowledge"}</button></form>;
}

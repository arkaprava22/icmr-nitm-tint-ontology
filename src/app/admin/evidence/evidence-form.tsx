"use client";

import { useActionState } from "react";
import { FileSearch } from "lucide-react";
import { evidenceCurationAction } from "../actions";

const ErrorText = ({ name, errors }: { name: string; errors?: Record<string, string> }) => errors?.[name] ? <small className="field-error">{errors[name]}</small> : null;

export function EvidenceForm({ contributionId }: { contributionId: string }) {
  const [state, action, pending] = useActionState(evidenceCurationAction.bind(null, contributionId), { message: "" });
  return (
    <form className="evidence-curation-form" action={action}>
      {state.message && <p className="form-message" role="alert">{state.message}</p>}
      <label>Status
        <select name="status" defaultValue="NEEDS_SOURCE">
          <option value="NEEDS_SOURCE">Needs source</option>
          <option value="SOURCE_IDENTIFIED">Source identified</option>
          <option value="READY_FOR_REVIEW">Ready for review</option>
          <option value="NOT_APPLICABLE">Not applicable</option>
        </select>
        <ErrorText name="status" errors={state.errors} />
      </label>
      <label>Source type
        <input name="sourceType" maxLength={80} placeholder="Classical text, government source, research publication" required />
        <ErrorText name="sourceType" errors={state.errors} />
      </label>
      <label>Citation details
        <textarea name="sourceCitation" rows={3} maxLength={1200} />
        <ErrorText name="sourceCitation" errors={state.errors} />
      </label>
      <label>Curator note
        <textarea name="curatorNote" rows={3} maxLength={1000} required />
        <ErrorText name="curatorNote" errors={state.errors} />
      </label>
      <button type="submit" disabled={pending}><FileSearch size={17} />{pending ? "Updating..." : "Update evidence"}</button>
    </form>
  );
}

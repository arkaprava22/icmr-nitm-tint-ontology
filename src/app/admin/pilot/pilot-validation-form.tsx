"use client";

import { useActionState } from "react";
import { ClipboardCheck } from "lucide-react";
import { pilotValidationAction } from "../actions";

const ErrorText = ({ name, errors }: { name: string; errors?: Record<string, string> }) => errors?.[name] ? <small className="field-error">{errors[name]}</small> : null;

export function PilotValidationForm() {
  const [state, action, pending] = useActionState(pilotValidationAction, { message: "" });
  return (
    <form className="pilot-validation-form" action={action}>
      {state.message && <p className="form-message" role="alert">{state.message}</p>}
      <label>Validator name
        <input name="validatorName" maxLength={120} required />
        <ErrorText name="validatorName" errors={state.errors} />
      </label>
      <label>Validator role
        <select name="validatorRole" defaultValue="CITIZEN">
          <option value="CITIZEN">Citizen</option>
          <option value="PRACTITIONER">Practitioner</option>
          <option value="REVIEWER">Reviewer</option>
          <option value="ADMINISTRATOR">Administrator</option>
          <option value="RESEARCHER">Researcher</option>
        </select>
        <ErrorText name="validatorRole" errors={state.errors} />
      </label>
      <label>Tested journey
        <select name="journey" defaultValue="PUBLIC_SEARCH">
          <option value="PUBLIC_SEARCH">Public search</option>
          <option value="REMEDY_DETAIL">Remedy detail</option>
          <option value="PRACTITIONER_SUBMISSION">Practitioner submission</option>
          <option value="REVIEW_PUBLICATION">Review and publication</option>
          <option value="FEEDBACK_TRIAGE">Feedback triage</option>
        </select>
        <ErrorText name="journey" errors={state.errors} />
      </label>
      <label>Outcome
        <select name="outcome" defaultValue="PASS_WITH_CHANGES">
          <option value="PASS">Pass</option>
          <option value="PASS_WITH_CHANGES">Pass with changes</option>
          <option value="BLOCKED">Blocked</option>
        </select>
        <ErrorText name="outcome" errors={state.errors} />
      </label>
      <label className="span-2">Tested term or scenario
        <input name="testedTerm" maxLength={120} placeholder="ginger, cough, practitioner submission, safety feedback" required />
        <ErrorText name="testedTerm" errors={state.errors} />
      </label>
      <label className="span-2">Validation notes
        <textarea name="notes" rows={4} maxLength={1200} required />
        <ErrorText name="notes" errors={state.errors} />
      </label>
      <button className="span-2" type="submit" disabled={pending}><ClipboardCheck size={17} />{pending ? "Recording..." : "Record validation"}</button>
    </form>
  );
}

"use client";
import { useActionState } from "react";
import { CheckCircle2, ListChecks } from "lucide-react";
import { pilotActionCreateAction, pilotActionUpdateAction } from "../actions";
const ErrorText = ({ name, errors }) => errors?.[name] ? <small className="field-error">{errors[name]}</small> : null;
export function PilotActionForm() {
    const [state, action, pending] = useActionState(pilotActionCreateAction, { message: "" });
    return (<form className="pilot-action-form" action={action}>
      {state.message && <p className="form-message span-2" role="alert">{state.message}</p>}
      <label className="span-2">Action title
        <input name="title" maxLength={160} required/>
        <ErrorText name="title" errors={state.errors}/>
      </label>
      <label>Owner
        <input name="owner" maxLength={120} required/>
        <ErrorText name="owner" errors={state.errors}/>
      </label>
      <label>Due date
        <input name="dueDate" type="date" required/>
        <ErrorText name="dueDate" errors={state.errors}/>
      </label>
      <label>Priority
        <select name="priority" defaultValue="MEDIUM">
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <ErrorText name="priority" errors={state.errors}/>
      </label>
      <label>Status
        <select name="status" defaultValue="OPEN">
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DEFERRED">Deferred</option>
        </select>
        <ErrorText name="status" errors={state.errors}/>
      </label>
      <label className="span-2">Source
        <input name="source" maxLength={160} placeholder="Validation record, readiness gate, feedback triage" required/>
        <ErrorText name="source" errors={state.errors}/>
      </label>
      <label className="span-2">Action note
        <textarea name="note" rows={4} maxLength={1200} required/>
        <ErrorText name="note" errors={state.errors}/>
      </label>
      <button className="span-2" type="submit" disabled={pending}><ListChecks size={17}/>{pending ? "Recording..." : "Record action"}</button>
    </form>);
}
export function PilotActionUpdateForm({ actionId, currentStatus }) {
    const [state, action, pending] = useActionState(pilotActionUpdateAction.bind(null, actionId), { message: "" });
    return (<form className="pilot-action-update-form" action={action}>
      {state.message && <p className="form-message" role="alert">{state.message}</p>}
      <label>Status
        <select name="status" defaultValue={currentStatus}>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DEFERRED">Deferred</option>
        </select>
        <ErrorText name="status" errors={state.errors}/>
      </label>
      <label>Update note
        <textarea name="note" rows={3} maxLength={1200} required/>
        <ErrorText name="note" errors={state.errors}/>
      </label>
      <button type="submit" disabled={pending}><CheckCircle2 size={16}/>{pending ? "Updating..." : "Update"}</button>
    </form>);
}

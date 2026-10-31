"use client";
import { useActionState } from "react";
import { BadgeCheck } from "lucide-react";
import { pilotSignoffAction } from "../../actions";
const ErrorText = ({ name, errors }) => errors?.[name] ? <small className="field-error">{errors[name]}</small> : null;
export function PilotSignoffForm() {
    const [state, action, pending] = useActionState(pilotSignoffAction, { message: "" });
    return (<form className="pilot-signoff-form" action={action}>
      {state.message && <p className="form-message span-2" role="alert">{state.message}</p>}
      <label>Decision
        <select name="decision" defaultValue="CONDITIONAL_HOLD">
          <option value="APPROVE_EXPANSION">Approve expansion</option>
          <option value="CONDITIONAL_HOLD">Conditional hold</option>
          <option value="STOP_PILOT">Stop pilot</option>
        </select>
        <ErrorText name="decision" errors={state.errors}/>
      </label>
      <label>Signed by
        <input name="signoffBy" maxLength={140} required/>
        <ErrorText name="signoffBy" errors={state.errors}/>
      </label>
      <label className="span-2">Meeting reference
        <input name="meetingReference" maxLength={180} placeholder="Pilot review meeting, steering group, validation committee" required/>
        <ErrorText name="meetingReference" errors={state.errors}/>
      </label>
      <label className="span-2">Decision notes and conditions
        <textarea name="conditions" rows={4} maxLength={1400} required/>
        <ErrorText name="conditions" errors={state.errors}/>
      </label>
      <button className="span-2" type="submit" disabled={pending}><BadgeCheck size={17}/>{pending ? "Recording..." : "Record sign-off"}</button>
    </form>);
}

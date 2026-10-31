"use client";
import { useActionState } from "react";
import { Send } from "lucide-react";
import { submitCitizenFeedbackAction } from "./actions";
const ErrorText = ({ name, errors }) => errors?.[name] ? <small className="field-error">{errors[name]}</small> : null;
export function FeedbackForm() {
    const [state, action, pending] = useActionState(submitCitizenFeedbackAction, { message: "" });
    return (<form className="feedback-form" action={action}>
      {state.message && <p className={state.success ? "success-banner" : "form-message"} role="alert">{state.message}</p>}
      <fieldset>
        <legend>Feedback details</legend>
        <div className="form-grid">
          <label>Feedback type
            <select name="category" defaultValue="SAFETY_CONCERN" required>
              <option value="SAFETY_CONCERN">Safety concern</option>
              <option value="LOCAL_KNOWLEDGE">Local knowledge or wording</option>
              <option value="UNCLEAR_INFORMATION">Unclear information</option>
              <option value="MISSING_INFORMATION">Missing information</option>
              <option value="GENERAL_FEEDBACK">General feedback</option>
            </select>
            <ErrorText name="category" errors={state.errors}/>
          </label>
          <label>Related remedy, symptom, or page
            <input name="relatedTerm" maxLength={120} required/>
            <ErrorText name="relatedTerm" errors={state.errors}/>
          </label>
          <label className="span-2">What should the team review?
            <textarea name="message" rows={6} maxLength={1600} required/>
            <ErrorText name="message" errors={state.errors}/>
          </label>
          <label>Country, state, or community context
            <input name="location" maxLength={120} placeholder="Optional"/>
          </label>
          <label>Contact for clarification
            <input name="contact" maxLength={180} placeholder="Optional"/>
          </label>
        </div>
      </fieldset>
      <label className="declaration">
        <input type="checkbox" name="declaration" value="accepted" required/>
        <span>This is not an emergency request. I understand TINT does not provide diagnosis, prescription, or urgent medical support.</span>
      </label>
      <ErrorText name="declaration" errors={state.errors}/>
      <div className="form-actions"><button type="submit" disabled={pending}><Send size={18}/>{pending ? "Sending..." : "Send feedback"}</button></div>
    </form>);
}

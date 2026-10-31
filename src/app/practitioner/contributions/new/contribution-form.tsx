"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { createContributionAction, reviseContributionAction } from "../../actions";

const ErrorText = ({ name, errors }: { name: string; errors?: Record<string, string> }) => errors?.[name] ? <small className="field-error">{errors[name]}</small> : null;

export type ContributionFormValues = {
  kind: string; systemIri: string; title: string; titleHi: string; remedyName: string; targetLabel: string;
  proposedUse: string; preparation: string; population: string; safety: string; evidenceType: string;
  citation: string; conflictDisclosure: string;
};

export function ContributionForm({ contributionId, values }: { contributionId?: string; values?: ContributionFormValues }) {
  const formAction = contributionId ? reviseContributionAction.bind(null, contributionId) : createContributionAction;
  const [state, action, pending] = useActionState(formAction, { message: "" });
  const editing = Boolean(contributionId);
  return (
    <form className="contribution-form" action={action}>
      {state.message && <p className="form-message" role="alert">{state.message}</p>}
      <fieldset><legend>Contribution</legend><div className="form-grid">
        <label>Type<select name="kind" defaultValue={values?.kind ?? "NEW_CLAIM"}><option value="NEW_CLAIM">New health-use claim</option><option value="NEW_ENTITY">New remedy</option><option value="UPDATE">Correction or update</option><option value="SAFETY_FLAG">Safety concern</option></select><ErrorText name="kind" errors={state.errors} /></label>
        <label>Medical tradition<select name="systemIri" defaultValue={values?.systemIri ?? "https://w3id.org/tint/ontology/ayurveda"}><option value="https://w3id.org/tint/ontology/ayurveda">Ayurveda</option><option value="https://w3id.org/tint/ontology/naturopathy">Naturopathy</option><option value="https://w3id.org/tint/ontology/homeRemedyTradition">Home remedy tradition</option></select><ErrorText name="systemIri" errors={state.errors} /></label>
        <label className="span-2">Submission title<input name="title" maxLength={160} defaultValue={values?.title} required /><ErrorText name="title" errors={state.errors} /></label>
        <label className="span-2">Submission title in Hindi<input name="titleHi" lang="hi" maxLength={160} defaultValue={values?.titleHi} required /><ErrorText name="titleHi" errors={state.errors} /></label>
      </div></fieldset>
      <fieldset><legend>Remedy and intended use</legend><div className="form-grid">
        <label>Remedy or practice name<input name="remedyName" maxLength={120} defaultValue={values?.remedyName} required /><ErrorText name="remedyName" errors={state.errors} /></label>
        <label>Symptom or condition<input name="targetLabel" maxLength={120} defaultValue={values?.targetLabel} required /><ErrorText name="targetLabel" errors={state.errors} /></label>
        <label className="span-2">Proposed traditional use<textarea name="proposedUse" rows={4} maxLength={1200} defaultValue={values?.proposedUse} required /><ErrorText name="proposedUse" errors={state.errors} /></label>
        <label className="span-2">Preparation or mode of use<textarea name="preparation" rows={3} maxLength={1000} defaultValue={values?.preparation} required /><ErrorText name="preparation" errors={state.errors} /></label>
        <label className="span-2">Population and exclusions<textarea name="population" rows={2} maxLength={300} defaultValue={values?.population} required /><ErrorText name="population" errors={state.errors} /></label>
      </div></fieldset>
      <fieldset><legend>Safety and evidence</legend><div className="form-grid">
        <label className="span-2">Contraindications, interactions, and cautions<textarea name="safety" rows={4} maxLength={1200} defaultValue={values?.safety} required /><ErrorText name="safety" errors={state.errors} /></label>
        <label>Evidence type<select name="evidenceType" defaultValue={values?.evidenceType ?? "PRACTITIONER_KNOWLEDGE"}><option value="CLASSICAL_TEXT">Classical text</option><option value="GOVERNMENT_SOURCE">Government source</option><option value="RESEARCH_PUBLICATION">Research publication</option><option value="PRACTITIONER_KNOWLEDGE">Practitioner knowledge</option><option value="OTHER">Other</option></select><ErrorText name="evidenceType" errors={state.errors} /></label>
        <label className="span-2">Citation or source details<textarea name="citation" rows={3} maxLength={1000} defaultValue={values?.citation} required /><ErrorText name="citation" errors={state.errors} /></label>
        <label className="span-2">Conflict-of-interest disclosure<textarea name="conflictDisclosure" rows={2} maxLength={600} defaultValue={values?.conflictDisclosure ?? "None declared"} required /><ErrorText name="conflictDisclosure" errors={state.errors} /></label>
      </div></fieldset>
      <label className="declaration"><input type="checkbox" name="declaration" value="accepted" required /><span>I confirm that this submission is accurate to the best of my knowledge and may be independently reviewed.</span></label><ErrorText name="declaration" errors={state.errors} />
      <div className="form-actions"><button type="submit" disabled={pending}><Save size={18} />{pending ? "Saving…" : editing ? "Save new revision" : "Save draft"}</button></div>
    </form>
  );
}

import { ArrowLeft, History, MessageSquareText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { contributionRevisionHistory, getEditableContribution } from "@/lib/dev-workflow-store";
import { requirePractitioner } from "@/lib/practitioner-auth";
import { ContributionForm, type ContributionFormValues } from "../../new/contribution-form";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditContributionPage({ params }: PageProps) {
  const practitioner = await requirePractitioner();
  const { id } = await params;
  const contribution = getEditableContribution(practitioner.id, id);
  const history = contributionRevisionHistory(practitioner.id, id);
  if (!contribution || !history) notFound();
  const values: ContributionFormValues = {
    kind: contribution.kind, systemIri: contribution.system_iri, title: contribution.title, titleHi: contribution.title_hi ?? "",
    remedyName: contribution.remedy_name, targetLabel: contribution.target_label, proposedUse: contribution.proposed_use,
    preparation: contribution.preparation, population: contribution.population, safety: contribution.safety,
    evidenceType: contribution.evidence_type, citation: contribution.citation, conflictDisclosure: contribution.conflict_disclosure,
  };
  return <main className="portal-page"><header className="portal-topbar"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div className="portal-identity"><div><strong>{practitioner.displayName}</strong><span>Practitioner portal</span></div></div></header><div className="editor-shell"><Link className="back-link" href="/practitioner"><ArrowLeft size={16} />Dashboard</Link><div className="editor-heading"><div><p className="eyebrow">Revision {contribution.current_revision}</p><h1>Revise knowledge contribution</h1><p>Correct the current record and preserve this version in its original ontology graph.</p></div><aside><ShieldCheck size={20} /><span>Saving creates a new immutable revision and reruns automated validation.</span></aside></div>{contribution.change_request && <section className="review-feedback"><MessageSquareText size={20} /><div><strong>Reviewer requested changes</strong><p>{contribution.change_request}</p></div></section>}<section className="revision-history"><div><History size={18} /><strong>Revision history</strong></div><span>Current revision {contribution.current_revision}</span><span>{history.previous.length} preserved earlier version{history.previous.length === 1 ? "" : "s"}</span><Link href={`/practitioner/contributions/${id}/history`}>View activity</Link></section><ContributionForm contributionId={id} values={values} /></div></main>;
}

import { ArrowLeft, BadgeCheck, BookOpenText, ShieldAlert, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContributionForReview, getLatestValidation } from "@/lib/dev-workflow-store";
import { requireReviewer } from "@/lib/reviewer-auth";
import { ReviewForm } from "./review-form";
export default async function ReviewContributionPage({ params }) {
    await requireReviewer();
    const { id } = await params;
    const contribution = getContributionForReview(id);
    if (!contribution || !["SUBMITTED", "UNDER_REVIEW"].includes(contribution.status))
        notFound();
    const validation = getLatestValidation(id);
    const facts = [["Tradition", contribution.system_iri.split("/").at(-1)], ["Remedy", contribution.remedy_name], ["Target", contribution.target_label], ["Population", contribution.population]];
    return <main className="portal-page"><div className="review-detail-shell"><Link className="back-link" href="/reviewer"><ArrowLeft size={16}/>Review queue</Link><div className="review-detail-heading"><div><span className="workflow-state status-submitted">{contribution.status.toLowerCase().replaceAll("_", " ")}</span><h1>{contribution.title}</h1><p><UserRound size={15}/> Submitted by {contribution.contributor_name}</p></div><span className="risk-pill"><ShieldAlert size={16}/>{contribution.risk_tier.toLowerCase()} risk</span></div>{validation && <div className={`validation-banner validation-${validation.status.toLowerCase()}`}><BadgeCheck size={18}/><div><strong>Automated validation {validation.status.toLowerCase()}</strong><span>{validation.issues.length === 0 ? "All structural publication-readiness checks passed." : `${validation.issues.length} issue(s) require attention.`}</span></div></div>}<div className="review-detail-grid"><section className="submission-record"><h2>Submitted knowledge</h2><dl className="review-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="record-block"><h3>Hindi title</h3><p lang="hi">{contribution.title_hi}</p></div><div className="record-block"><h3>Proposed traditional use</h3><p>{contribution.proposed_use}</p></div><div className="record-block"><h3>Preparation or mode of use</h3><p>{contribution.preparation}</p></div><div className="record-block safety-record"><h3><ShieldAlert size={17}/>Safety statement</h3><p>{contribution.safety}</p></div><div className="record-block"><h3><BookOpenText size={17}/>Evidence and source</h3><strong>{contribution.evidence_type.toLowerCase().replaceAll("_", " ")}</strong><p>{contribution.citation}</p></div><div className="record-block"><h3>Conflict disclosure</h3><p>{contribution.conflict_disclosure}</p></div></section><aside><ReviewForm contributionId={contribution.id}/></aside></div></div></main>;
}

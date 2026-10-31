import { ArrowLeft, BadgeCheck, BookOpenText, Database, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicationCandidate } from "@/lib/dev-workflow-store";
import { requireAdministrator } from "@/lib/admin-auth";
import { PublicationForm } from "./publication-form";

type PageProps = { params: Promise<{ id: string }> };

export default async function PublicationPage({ params }: PageProps) {
  await requireAdministrator();
  const { id } = await params;
  const contribution = getPublicationCandidate(id);
  if (!contribution) notFound();
  return <main className="portal-page"><div className="publication-detail-shell"><Link className="back-link" href="/admin"><ArrowLeft size={16} />Publication control</Link><div className="review-detail-heading"><div><span className="workflow-state status-approved">approved</span><h1>{contribution.title}</h1><p><BadgeCheck size={15} /> Reviewed by {contribution.reviewer_name}</p></div><span className="risk-pill"><ShieldCheck size={16} />{contribution.risk_tier.toLowerCase()} risk</span></div><div className="publication-grid"><section className="release-record"><h2><Database size={19} />Release record</h2><dl><div><dt>Remedy</dt><dd>{contribution.remedy_name}</dd></div><div><dt>Target</dt><dd>{contribution.target_label}</dd></div><div><dt>Contributor</dt><dd>{contribution.contributor_name}</dd></div><div><dt>Submission graph</dt><dd className="iri-value">{contribution.graph_iri}</dd></div></dl><div className="record-block"><h3><BookOpenText size={17} />Reviewer rationale</h3><p>{contribution.review_rationale}</p></div><div className="publication-boundary"><ShieldCheck size={19} /><p>The source submission graph will be preserved. Published copies receive reviewed validation markers and cannot be released twice.</p></div></section><aside><h2>Authorize publication</h2><p>This action makes the approved knowledge visible to public-graph queries.</p><PublicationForm contributionId={contribution.id} /></aside></div></div></main>;
}

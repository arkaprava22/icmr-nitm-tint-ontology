import { ArrowLeft, CircleDot, Fingerprint } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { contributionTimeline, getContributionForReview } from "@/lib/dev-workflow-store";
import { requirePractitioner } from "@/lib/practitioner-auth";

const labels: Record<string, string> = { CREATE_DRAFT: "Draft created", AUTOMATED_VALIDATION: "Automated checks", SUBMIT_FOR_REVIEW: "Submitted for review", REVIEW_DECISION: "Review decision", REVISE_CONTRIBUTION: "New revision", PUBLISH_CONTRIBUTION: "Published" };

type PageProps = { params: Promise<{ id: string }> };

export default async function ContributionHistoryPage({ params }: PageProps) {
  const practitioner = await requirePractitioner();
  const { id } = await params;
  const contribution = getContributionForReview(id);
  const events = contributionTimeline(practitioner.id, id);
  if (!contribution || !events) notFound();
  return <main className="portal-page"><div className="timeline-shell"><Link className="back-link" href="/practitioner"><ArrowLeft size={16} />Dashboard</Link><div className="timeline-heading"><p className="eyebrow">Contribution provenance</p><h1>{contribution.title}</h1><p>Revision {contribution.current_revision} · {contribution.status.toLowerCase().replaceAll("_", " ")}</p></div><div className="timeline-list">{events.map((event, index) => <article className="timeline-event" key={`${event.event_hash}-${index}`}><div className="timeline-marker"><CircleDot size={18} /></div><div><h2>{labels[event.action] ?? event.action}</h2><p>{event.actor_name ?? "Automated system"}</p><time dateTime={event.occurred_at}>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.occurred_at))}</time></div><code title={event.event_hash}><Fingerprint size={14} />{event.event_hash.slice(0, 12)}…</code></article>)}</div></div></main>;
}

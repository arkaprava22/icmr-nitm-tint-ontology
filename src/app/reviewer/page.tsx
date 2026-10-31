import { BadgeCheck, ClipboardCheck, Clock3, LogOut } from "lucide-react";
import Link from "next/link";
import { listReviewQueue } from "@/lib/dev-workflow-store";
import { requireReviewer } from "@/lib/reviewer-auth";
import { reviewerLogoutAction } from "./actions";

type PageProps = { searchParams: Promise<{ reviewed?: string }> };

export default async function ReviewQueuePage({ searchParams }: PageProps) {
  const reviewer = await requireReviewer();
  const queue = listReviewQueue();
  const { reviewed } = await searchParams;
  return <main className="portal-page"><header className="portal-topbar"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div className="portal-identity"><div><strong>{reviewer.displayName}</strong><span><BadgeCheck size={14} /> Verified reviewer</span></div><form action={reviewerLogoutAction}><button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={19} /></button></form></div></header><div className="review-shell">{reviewed && <div className="success-banner"><BadgeCheck size={19} /><div><strong>Decision recorded</strong><span>The audit trail and contributor status have been updated.</span></div></div>}<div className="portal-heading"><div><p className="eyebrow">Editorial workspace</p><h1>Review queue</h1><p>Assess submitted practitioner knowledge for safety, evidence, and appropriate wording.</p></div><span className="queue-count"><ClipboardCheck size={18} />{queue.length} awaiting review</span></div>{queue.length === 0 ? <div className="portal-empty"><ClipboardCheck size={26} /><h3>The queue is clear</h3><p>New practitioner submissions will appear here.</p></div> : <div className="review-list">{queue.map((item) => <article className="review-item" key={item.id}><div><span className="workflow-state status-submitted">{item.status.toLowerCase().replaceAll("_", " ")}</span><h2>{item.title}</h2><p>{item.remedy_name} · {item.target_label}</p><small>Submitted by {item.contributor_name}</small></div><div className="review-meta"><span><Clock3 size={15} />{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(item.submitted_at))}</span><Link href={`/reviewer/contributions/${item.id}`}>Review submission</Link></div></article>)}</div>}</div></main>;
}

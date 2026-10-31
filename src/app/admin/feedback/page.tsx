import { BadgeCheck, CircleAlert, Inbox, LogOut, MessageSquareWarning, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { adminLogoutAction } from "../actions";
import { requireAdministrator } from "@/lib/admin-auth";
import { feedbackSummary, listCitizenFeedback } from "@/lib/dev-workflow-store";
import { TriageForm } from "./triage-form";

const categoryLabels: Record<string, string> = {
  SAFETY_CONCERN: "Safety concern",
  LOCAL_KNOWLEDGE: "Local knowledge",
  UNCLEAR_INFORMATION: "Unclear information",
  MISSING_INFORMATION: "Missing information",
  GENERAL_FEEDBACK: "General feedback",
};

export default async function AdminFeedbackPage() {
  const administrator = await requireAdministrator();
  const [items, summary] = [listCitizenFeedback(), feedbackSummary()];
  return (
    <main className="portal-page">
      <header className="portal-topbar"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div className="portal-identity"><div><strong>{administrator.displayName}</strong><span><BadgeCheck size={14} /> Publication administrator</span></div><form action={adminLogoutAction}><button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={19} /></button></form></div></header>
      <div className="admin-shell">
        <div className="admin-subnav"><Link href="/admin">Publication control</Link><Link href="/admin/audit">Audit trail</Link><Link className="active" href="/admin/feedback">Citizen feedback</Link><Link href="/admin/analytics">Analytics</Link><Link href="/admin/evidence">Evidence</Link><Link href="/admin/pilot">Pilot readiness</Link></div>
        <div className="portal-heading"><div><p className="eyebrow">Safety triage</p><h1>Citizen feedback</h1><p>Review public feedback before it influences any ontology record or governance action.</p></div><span className="integrity-status integrity-valid"><Inbox size={18} />{summary.open} open</span></div>
        <div className="portal-metrics"><div><span>Open feedback</span><strong>{summary.open}</strong></div><div><span>Safety review</span><strong>{summary.safetyReview}</strong></div><div><span>Resolved</span><strong>{summary.resolved}</strong></div></div>
        <section className="feedback-admin-section">
          <div className="section-title"><h2>Feedback queue</h2><p>Safety concerns stay visible until a governance administrator records a triage decision.</p></div>
          {items.length === 0 ? <div className="portal-empty"><MessageSquareWarning size={26} /><h3>No citizen feedback yet</h3><p>Submitted feedback will appear here.</p></div> : (
            <div className="feedback-admin-list">
              {items.map((item) => (
                <article className="feedback-admin-item" key={item.id}>
                  <div className="feedback-admin-main">
                    <div className="feedback-admin-title">
                      <span className={`workflow-state ${item.urgency === "SAFETY_REVIEW" ? "status-rejected" : "status-under_review"}`}>{item.urgency === "SAFETY_REVIEW" ? <ShieldAlert size={13} /> : <CircleAlert size={13} />}{item.urgency.replaceAll("_", " ").toLowerCase()}</span>
                      <span className="workflow-state">{item.status.replaceAll("_", " ").toLowerCase()}</span>
                    </div>
                    <h2>{categoryLabels[item.category] ?? item.category}</h2>
                    <p>{item.message}</p>
                    <dl>
                      <div><dt>Related term</dt><dd>{item.related_term}</dd></div>
                      <div><dt>Context</dt><dd>{item.location || "Not provided"}</dd></div>
                      <div><dt>Contact</dt><dd>{item.contact || "Not provided"}</dd></div>
                      <div><dt>Submitted</dt><dd>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.submitted_at))}</dd></div>
                    </dl>
                    {item.triage_note && <p className="triage-note"><strong>Latest triage:</strong> {item.triage_note}</p>}
                  </div>
                  {["NEW", "IN_TRIAGE"].includes(item.status) ? <TriageForm feedbackId={item.id} /> : <aside className="triage-complete"><BadgeCheck size={20} /><span>{item.status.replaceAll("_", " ").toLowerCase()} by {item.triaged_by_name ?? "administrator"}</span></aside>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

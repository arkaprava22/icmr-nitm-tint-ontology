import { BadgeCheck, BookMarked, CircleAlert, FileSearch, LogOut, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { requireAdministrator } from "@/lib/admin-auth";
import { evidenceCurationSummary, listEvidenceCurationQueue } from "@/lib/dev-workflow-store";
import { adminLogoutAction } from "../actions";
import { EvidenceForm } from "./evidence-form";
const statusLabels = {
    NEEDS_SOURCE: "Needs source",
    SOURCE_IDENTIFIED: "Source identified",
    READY_FOR_REVIEW: "Ready for review",
    NOT_APPLICABLE: "Not applicable",
};
export default async function AdminEvidencePage() {
    const administrator = await requireAdministrator();
    const [queue, summary] = [listEvidenceCurationQueue(), evidenceCurationSummary()];
    return (<main className="portal-page">
      <header className="portal-topbar"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div className="portal-identity"><div><strong>{administrator.displayName}</strong><span><BadgeCheck size={14}/> Publication administrator</span></div><form action={adminLogoutAction}><button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={19}/></button></form></div></header>
      <div className="admin-shell">
        <div className="admin-subnav"><Link href="/admin">Publication control</Link><Link href="/admin/audit">Audit trail</Link><Link href="/admin/feedback">Citizen feedback</Link><Link href="/admin/analytics">Analytics</Link><Link className="active" href="/admin/evidence">Evidence</Link><Link href="/admin/pilot">Pilot readiness</Link></div>
        <div className="portal-heading"><div><p className="eyebrow">Evidence strengthening</p><h1>Curation queue</h1><p>Track weak citations, practitioner-only evidence, and sources that need reviewer attention.</p></div><span className="integrity-status integrity-valid"><FileSearch size={18}/>{summary.readyForReview} ready</span></div>
        <div className="portal-metrics"><div><span>Total records</span><strong>{summary.total}</strong></div><div><span>Practitioner-only evidence</span><strong>{summary.practitionerOnly}</strong></div><div><span>Weak citations</span><strong>{summary.weakCitation}</strong></div></div>
        <section className="evidence-admin-section">
          <div className="section-title"><h2>Evidence backlog</h2><p>Curator notes do not publish knowledge. They prepare records for formal review and correction.</p></div>
          {queue.length === 0 ? <div className="portal-empty"><BookMarked size={26}/><h3>No evidence records yet</h3><p>Practitioner contributions will appear here after they are created.</p></div> : (<div className="evidence-admin-list">
              {queue.map((item) => (<article className="evidence-admin-item" key={item.id}>
                  <div className="evidence-admin-main">
                    <div className="feedback-admin-title">
                      <span className={`workflow-state ${item.evidence_priority === "High" ? "status-rejected" : "status-under_review"}`}>{item.evidence_priority === "High" ? <ShieldAlert size={13}/> : <CircleAlert size={13}/>}{item.evidence_priority} priority</span>
                      <span className="workflow-state">{statusLabels[item.curation_status ?? "NEEDS_SOURCE"] ?? "Needs source"}</span>
                      <span className={`validation-state validation-${String(item.validation_status).toLowerCase()}`}>{String(item.validation_status).replaceAll("_", " ").toLowerCase()}</span>
                    </div>
                    <h2>{item.title}</h2>
                    <p>{item.remedy_name} for {item.target_label}</p>
                    <dl>
                      <div><dt>Evidence type</dt><dd>{item.evidence_type.replaceAll("_", " ").toLowerCase()}</dd></div>
                      <div><dt>Contributor</dt><dd>{item.contributor_name}</dd></div>
                      <div><dt>Current citation</dt><dd>{item.citation}</dd></div>
                      <div><dt>Latest curation</dt><dd>{item.curation_note || "No curator note yet"}</dd></div>
                    </dl>
                  </div>
                  <EvidenceForm contributionId={item.id}/>
                </article>))}
            </div>)}
        </section>
      </div>
    </main>);
}

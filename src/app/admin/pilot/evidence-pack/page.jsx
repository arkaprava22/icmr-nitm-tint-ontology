import { BadgeCheck, ClipboardCheck, FileCheck2, ListChecks, LogOut, Rocket, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requireAdministrator } from "@/lib/admin-auth";
import { auditIntegrityStatus, latestPilotSignoff, listPilotActions, listPilotSignoffs, listPilotValidations, pilotActionSummary, pilotOutcomeReport, pilotReadinessSnapshot, pilotValidationSummary } from "@/lib/dev-workflow-store";
import { adminLogoutAction } from "../../actions";
import { PilotSignoffForm } from "./pilot-signoff-form";
const statusLabels = {
    READY: "Ready",
    ATTENTION: "Needs attention",
    BLOCKED: "Blocked",
};
export default async function PilotEvidencePackPage() {
    const administrator = await requireAdministrator();
    const outcome = pilotOutcomeReport();
    const readiness = pilotReadinessSnapshot();
    const validationSummary = pilotValidationSummary();
    const actionSummary = pilotActionSummary();
    const audit = auditIntegrityStatus();
    const validations = listPilotValidations(8);
    const actions = listPilotActions(8);
    const latestSignoff = latestPilotSignoff();
    const signoffs = listPilotSignoffs(6);
    return (<main className="portal-page">
      <header className="portal-topbar"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div className="portal-identity"><div><strong>{administrator.displayName}</strong><span><BadgeCheck size={14}/> Publication administrator</span></div><form action={adminLogoutAction}><button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={19}/></button></form></div></header>
      <div className="pilot-pack-shell">
        <div className="admin-subnav"><Link href="/admin">Publication control</Link><Link href="/admin/audit">Audit trail</Link><Link href="/admin/feedback">Citizen feedback</Link><Link href="/admin/analytics">Analytics</Link><Link href="/admin/evidence">Evidence</Link><Link href="/admin/pilot">Pilot readiness</Link></div>
        <div className="pilot-pack-heading"><div><p className="eyebrow">Phase 4 evidence pack</p><h1>Pilot review pack</h1><p>A meeting-ready summary of readiness, validation evidence, action follow-up, and audit posture.</p></div><div className="pilot-pack-actions"><Link href="/admin/pilot">Back to pilot dashboard</Link><Link href="/admin/pilot/scale-up"><Rocket size={16}/>Scale-up plan</Link></div></div>

        <section className={`pilot-pack-decision pilot-outcome-${outcome.recommendation.toLowerCase().replaceAll("_", "-")}`}>
          <div><ClipboardCheck size={24}/><span>Recommendation</span><strong>{outcome.recommendation.replaceAll("_", " ").toLowerCase()}</strong><p>{outcome.summary}</p></div>
          <dl>
            <div><dt>Readiness gates</dt><dd>{readiness.ready} ready, {readiness.attention} attention, {readiness.blocked} blocked</dd></div>
            <div><dt>Validation records</dt><dd>{validationSummary.total} total, {validationSummary.blocked} blocked</dd></div>
            <div><dt>Pilot actions</dt><dd>{actionSummary.open} open, {actionSummary.urgent} high priority</dd></div>
            <div><dt>Audit posture</dt><dd>{audit.valid ? "Verified" : "Needs review"} with {audit.count} event{audit.count === 1 ? "" : "s"}</dd></div>
          </dl>
        </section>

        <section className="pilot-signoff-section">
          <div className="section-title"><h2>Pilot sign-off</h2><p>Record the formal decision from the review meeting after checking the evidence pack.</p></div>
          <div className="pilot-signoff-grid">
            <PilotSignoffForm />
            <div className="pilot-signoff-list">
              {latestSignoff ? <article className="pilot-signoff-latest"><span className={`pilot-result pilot-result-${latestSignoff.decision.toLowerCase().replaceAll("_", "-")}`}>{latestSignoff.decision.replaceAll("_", " ").toLowerCase()}</span><h3>Latest sign-off</h3><p>{latestSignoff.conditions}</p><dl><div><dt>Signed by</dt><dd>{latestSignoff.signoff_by}</dd></div><div><dt>Recommendation</dt><dd>{latestSignoff.recommendation.replaceAll("_", " ").toLowerCase()}</dd></div><div><dt>Reference</dt><dd>{latestSignoff.meeting_reference}</dd></div><div><dt>Signed at</dt><dd>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(latestSignoff.signed_at))}</dd></div></dl></article> : <div className="portal-empty"><BadgeCheck size={26}/><h3>No pilot sign-off yet</h3><p>Record the first decision when the pilot review meeting is complete.</p></div>}
              {signoffs.length > 1 && <div className="pilot-signoff-history">{signoffs.slice(1).map((item) => <article key={item.id}><span className={`pilot-result pilot-result-${item.decision.toLowerCase().replaceAll("_", "-")}`}>{item.decision.replaceAll("_", " ").toLowerCase()}</span><strong>{item.meeting_reference}</strong><small>{item.signoff_by} · {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(item.signed_at))}</small></article>)}</div>}
            </div>
          </div>
        </section>

        <section className="pilot-pack-section">
          <div className="section-title"><h2>Readiness gate evidence</h2><p>These are the checks currently informing the recommendation.</p></div>
          <div className="pilot-pack-table">
            {readiness.gates.map((gate) => <article key={gate.id}><span className={`pilot-result pilot-result-${gate.status.toLowerCase()}`}>{statusLabels[gate.status]}</span><strong>{gate.label}</strong><p>{gate.summary}</p><small>{gate.detail}</small></article>)}
          </div>
        </section>

        <section className="pilot-pack-columns">
          <article>
            <div className="analytics-panel-title"><FileCheck2 size={20}/><h2>Recent validation findings</h2></div>
            {validations.length === 0 ? <p className="pilot-pack-empty">No stakeholder validation records captured yet.</p> : validations.map((item) => <div className="pilot-pack-list-item" key={item.id}><span className={`pilot-result pilot-result-${item.outcome.toLowerCase().replaceAll("_", "-")}`}>{item.outcome.replaceAll("_", " ").toLowerCase()}</span><strong>{item.tested_term}</strong><p>{item.notes}</p><small>{item.validator_name} · {item.validator_role.replaceAll("_", " ").toLowerCase()}</small></div>)}
          </article>

          <article>
            <div className="analytics-panel-title"><ListChecks size={20}/><h2>Open follow-up actions</h2></div>
            {actions.length === 0 ? <p className="pilot-pack-empty">No pilot actions recorded yet.</p> : actions.map((item) => <div className="pilot-pack-list-item" key={item.id}><span className={`pilot-priority pilot-priority-${item.priority.toLowerCase()}`}>{item.priority.toLowerCase()}</span><strong>{item.title}</strong><p>{item.note}</p><small>{item.owner} · due {item.due_date} · {item.status.replaceAll("_", " ").toLowerCase()}</small></div>)}
          </article>
        </section>

        <section className="pilot-pack-section">
          <div className="section-title"><h2>Decision next steps</h2><p>The project team can use these points as meeting actions.</p></div>
          <ol className="pilot-pack-next">
            {outcome.nextSteps.map((step) => <li key={step}><ShieldCheck size={17}/>{step}</li>)}
          </ol>
        </section>
      </div>
    </main>);
}

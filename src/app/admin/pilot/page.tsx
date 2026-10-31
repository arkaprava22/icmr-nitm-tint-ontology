import { Activity, BadgeCheck, CircleAlert, ClipboardCheck, FileCheck2, ListChecks, LogOut, Rocket, ShieldCheck, Share2 } from "lucide-react";
import Link from "next/link";
import { requireAdministrator } from "@/lib/admin-auth";
import { listPilotActions, listPilotValidations, pilotActionSummary, pilotOutcomeReport, pilotReadinessSnapshot, pilotValidationSummary } from "@/lib/dev-workflow-store";
import { adminLogoutAction } from "../actions";
import { PilotActionForm, PilotActionUpdateForm } from "./pilot-action-form";
import { PilotValidationForm } from "./pilot-validation-form";

const statusLabels = {
  READY: "Ready",
  ATTENTION: "Needs attention",
  BLOCKED: "Blocked",
};

const statusIcons = {
  READY: ShieldCheck,
  ATTENTION: CircleAlert,
  BLOCKED: CircleAlert,
};

export default async function AdminPilotReadinessPage() {
  const administrator = await requireAdministrator();
  const readiness = pilotReadinessSnapshot();
  const validations = listPilotValidations();
  const validationSummary = pilotValidationSummary();
  const actions = listPilotActions();
  const actionSummary = pilotActionSummary();
  const outcome = pilotOutcomeReport();

  return (
    <main className="portal-page">
      <header className="portal-topbar"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div className="portal-identity"><div><strong>{administrator.displayName}</strong><span><BadgeCheck size={14} /> Publication administrator</span></div><form action={adminLogoutAction}><button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={19} /></button></form></div></header>
      <div className="admin-shell">
        <div className="admin-subnav"><Link href="/admin">Publication control</Link><Link href="/admin/audit">Audit trail</Link><Link href="/admin/feedback">Citizen feedback</Link><Link href="/admin/analytics">Analytics</Link><Link href="/admin/evidence">Evidence</Link><Link className="active" href="/admin/pilot">Pilot readiness</Link></div>
        <div className="portal-heading"><div><p className="eyebrow">Phase 4</p><h1>Pilot readiness</h1><p>Prepare the knowledge workflow for practitioner, reviewer, administrator, and citizen validation.</p></div><div className="pilot-heading-actions"><Link href="/admin/pilot/evidence-pack"><Share2 size={17} />Evidence pack</Link><Link href="/admin/pilot/scale-up"><Rocket size={17} />Scale-up plan</Link><Link href="/admin/pilot/monitoring"><Activity size={17} />Monitoring</Link><span className={`pilot-overall pilot-${readiness.status.toLowerCase()}`}><ClipboardCheck size={18} />{statusLabels[readiness.status]}</span></div></div>

        <div className="pilot-summary-grid">
          <article><ShieldCheck size={21} /><span>Ready gates</span><strong>{readiness.ready}</strong><small>Can be shown during pilot validation</small></article>
          <article><CircleAlert size={21} /><span>Needs attention</span><strong>{readiness.attention}</strong><small>Improve before wider rollout</small></article>
          <article><CircleAlert size={21} /><span>Blocked gates</span><strong>{readiness.blocked}</strong><small>Resolve before formal validation</small></article>
          <article><FileCheck2 size={21} /><span>Validation records</span><strong>{validationSummary.total}</strong><small>{validationSummary.blocked} blocked, {validationSummary.changes} need changes</small></article>
          <article><ListChecks size={21} /><span>Open actions</span><strong>{actionSummary.open}</strong><small>{actionSummary.urgent} high priority, {actionSummary.resolved} resolved</small></article>
        </div>

        <section className={`pilot-outcome pilot-outcome-${outcome.recommendation.toLowerCase().replaceAll("_", "-")}`}>
          <div><p className="eyebrow">Pilot outcome report</p><h2>{outcome.recommendation.replaceAll("_", " ").toLowerCase()}</h2><p>{outcome.summary}</p><small>Generated {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(outcome.generatedAt))}</small></div>
          <div className="pilot-outcome-indicators">
            {outcome.indicators.map((indicator) => <article key={indicator.label}><span className={`pilot-result pilot-result-${indicator.status.toLowerCase()}`}>{indicator.status.toLowerCase()}</span><strong>{indicator.label}</strong><small>{indicator.value}</small></article>)}
          </div>
          <ol>
            {outcome.nextSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </section>

        <section className="pilot-grid">
          <div className="pilot-gate-list">
            {readiness.gates.map((gate) => {
              const StatusIcon = statusIcons[gate.status];
              return <article className={`pilot-gate pilot-gate-${gate.status.toLowerCase()}`} key={gate.id}><div className="pilot-gate-icon"><StatusIcon size={19} /></div><div><div className="pilot-gate-title"><h2>{gate.label}</h2><span>{statusLabels[gate.status]}</span></div><p>{gate.summary}</p><small>{gate.detail}</small></div><Link href={gate.href}>Open area</Link></article>;
            })}
          </div>

          <aside className="pilot-plan">
            <div className="analytics-panel-title"><ClipboardCheck size={20} /><h2>Validation session path</h2></div>
            <ol>
              <li><strong>Search sample terms</strong><span>Ask validators to search common terms such as cough, ginger, fever, and turmeric.</span></li>
              <li><strong>Review remedy details</strong><span>Check safety notes, evidence labels, systems, and provenance wording.</span></li>
              <li><strong>Submit practitioner knowledge</strong><span>Confirm practitioners can add structured claims without mixing them into public knowledge.</span></li>
              <li><strong>Moderate and publish</strong><span>Run reviewer approval, automated validation, and administrator publication.</span></li>
              <li><strong>Record feedback</strong><span>Capture unclear information, missing local knowledge, and safety concerns for triage.</span></li>
            </ol>
          </aside>
        </section>

        <section className="pilot-validation-section">
          <div className="section-title"><h2>Stakeholder validation records</h2><p>Capture findings from pilot walkthroughs and keep them visible to the project team.</p></div>
          <div className="pilot-validation-grid">
            <PilotValidationForm />
            <div className="pilot-validation-list">
              {validations.length === 0 ? <div className="portal-empty"><ClipboardCheck size={26} /><h3>No validation records yet</h3><p>Use the form to record the first stakeholder walkthrough.</p></div> : validations.map((item) => <article className="pilot-validation-item" key={item.id}><div><span className={`pilot-result pilot-result-${item.outcome.toLowerCase().replaceAll("_", "-")}`}>{item.outcome.replaceAll("_", " ").toLowerCase()}</span><h3>{item.tested_term}</h3><p>{item.notes}</p></div><dl><div><dt>Validator</dt><dd>{item.validator_name}</dd></div><div><dt>Role</dt><dd>{item.validator_role.replaceAll("_", " ").toLowerCase()}</dd></div><div><dt>Journey</dt><dd>{item.journey.replaceAll("_", " ").toLowerCase()}</dd></div><div><dt>Recorded</dt><dd>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.recorded_at))}</dd></div></dl></article>)}
            </div>
          </div>
        </section>

        <section className="pilot-action-section">
          <div className="section-title"><h2>Pilot action tracker</h2><p>Turn validation findings into owned follow-up work before wider release.</p></div>
          <div className="pilot-action-grid">
            <PilotActionForm />
            <div className="pilot-action-list">
              {actions.length === 0 ? <div className="portal-empty"><ListChecks size={26} /><h3>No pilot actions yet</h3><p>Create actions for blocked validations, weak evidence, safety feedback, or readiness gaps.</p></div> : actions.map((item) => <article className="pilot-action-item" key={item.id}><div className="pilot-action-main"><div className="pilot-action-title"><span className={`pilot-priority pilot-priority-${item.priority.toLowerCase()}`}>{item.priority.toLowerCase()}</span><span className={`pilot-result pilot-result-${item.status.toLowerCase().replaceAll("_", "-")}`}>{item.status.replaceAll("_", " ").toLowerCase()}</span></div><h3>{item.title}</h3><p>{item.note}</p><dl><div><dt>Owner</dt><dd>{item.owner}</dd></div><div><dt>Due</dt><dd>{item.due_date}</dd></div><div><dt>Source</dt><dd>{item.source}</dd></div><div><dt>Updated</dt><dd>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(item.updated_at))}</dd></div></dl></div><PilotActionUpdateForm actionId={item.id} currentStatus={item.status} /></article>)}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

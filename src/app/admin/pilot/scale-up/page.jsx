import { Activity, BadgeCheck, CircleAlert, ClipboardCheck, LogOut, Rocket, ServerCog, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requireAdministrator } from "@/lib/admin-auth";
import { scaleUpPlan } from "@/lib/dev-workflow-store";
import { adminLogoutAction } from "../../actions";
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
export default async function PilotScaleUpPage() {
    const administrator = await requireAdministrator();
    const plan = scaleUpPlan();
    return (<main className="portal-page">
      <header className="portal-topbar"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div className="portal-identity"><div><strong>{administrator.displayName}</strong><span><BadgeCheck size={14}/> Publication administrator</span></div><form action={adminLogoutAction}><button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={19}/></button></form></div></header>
      <div className="pilot-pack-shell">
        <div className="admin-subnav"><Link href="/admin">Publication control</Link><Link href="/admin/audit">Audit trail</Link><Link href="/admin/feedback">Citizen feedback</Link><Link href="/admin/analytics">Analytics</Link><Link href="/admin/evidence">Evidence</Link><Link href="/admin/pilot">Pilot readiness</Link></div>
        <div className="pilot-pack-heading"><div><p className="eyebrow">Phase 4 scale-up</p><h1>Scale-up plan</h1><p>Translate pilot sign-off and validation evidence into the first wider rollout workstreams.</p></div><div className="pilot-pack-actions"><Link href="/admin/pilot/evidence-pack">Back to evidence pack</Link><Link href="/admin/pilot/monitoring"><Activity size={16}/>Monitoring</Link><Link href="/admin/pilot/deployment"><ServerCog size={16}/>Deployment readiness</Link></div></div>

        <section className={`scale-up-hero scale-up-${plan.status.toLowerCase()}`}>
          <div><Rocket size={26}/><span>Rollout posture</span><strong>{statusLabels[plan.status]}</strong><p>{plan.canExpand ? "Pilot evidence supports planning a staged expansion." : "Complete sign-off and attention items before expanding beyond the pilot group."}</p></div>
          <dl>
            <div><dt>Current recommendation</dt><dd>{plan.recommendation.replaceAll("_", " ").toLowerCase()}</dd></div>
            <div><dt>Sign-off decision</dt><dd>{plan.signoffDecision ? plan.signoffDecision.replaceAll("_", " ").toLowerCase() : "Not recorded"}</dd></div>
            <div><dt>Generated</dt><dd>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(plan.generatedAt))}</dd></div>
          </dl>
        </section>

        <section className="scale-up-section">
          <div className="section-title"><h2>Rollout workstreams</h2><p>Each workstream uses the pilot evidence currently available in the system.</p></div>
          <div className="scale-up-grid">
            {plan.workstreams.map((stream) => {
            const StatusIcon = statusIcons[stream.status];
            return <article className={`scale-up-card scale-up-card-${stream.status.toLowerCase()}`} key={stream.label}><div className="scale-up-card-title"><StatusIcon size={19}/><span>{statusLabels[stream.status]}</span></div><h3>{stream.label}</h3><p>{stream.objective}</p><dl><div><dt>Owner</dt><dd>{stream.owner}</dd></div><div><dt>Signal</dt><dd>{stream.readinessSignal}</dd></div><div><dt>Next milestone</dt><dd>{stream.nextMilestone}</dd></div></dl></article>;
        })}
          </div>
        </section>

        <section className="scale-up-section">
          <div className="section-title"><h2>Expansion sequence</h2><p>Use this sequence after the pilot has an approved or controlled expansion decision.</p></div>
          <ol className="scale-up-steps">
            <li><ClipboardCheck size={17}/>Confirm sign-off conditions and unresolved pilot actions.</li>
            <li><ClipboardCheck size={17}/>Select the next content batch and practitioner cohort.</li>
            <li><ClipboardCheck size={17}/>Run evidence and safety checks before publication.</li>
            <li><ClipboardCheck size={17}/>Monitor citizen feedback, search behavior, and audit posture weekly.</li>
          </ol>
        </section>
      </div>
    </main>);
}

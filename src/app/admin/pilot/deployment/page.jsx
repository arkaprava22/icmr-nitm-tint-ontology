import { BadgeCheck, CircleAlert, ClipboardCheck, Handshake, LogOut, ServerCog, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requireAdministrator } from "@/lib/admin-auth";
import { deploymentReadinessChecklist } from "@/lib/dev-workflow-store";
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
export default async function DeploymentReadinessPage() {
    const administrator = await requireAdministrator();
    const checklist = deploymentReadinessChecklist();
    const blocked = checklist.items.filter((item) => item.status === "BLOCKED").length;
    const attention = checklist.items.filter((item) => item.status === "ATTENTION").length;
    return (<main className="portal-page">
      <header className="portal-topbar"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div className="portal-identity"><div><strong>{administrator.displayName}</strong><span><BadgeCheck size={14}/> Publication administrator</span></div><form action={adminLogoutAction}><button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={19}/></button></form></div></header>
      <div className="pilot-pack-shell">
        <div className="admin-subnav"><Link href="/admin">Publication control</Link><Link href="/admin/audit">Audit trail</Link><Link href="/admin/feedback">Citizen feedback</Link><Link href="/admin/analytics">Analytics</Link><Link href="/admin/evidence">Evidence</Link><Link href="/admin/pilot">Pilot readiness</Link></div>
        <div className="pilot-pack-heading"><div><p className="eyebrow">Phase 4 deployment</p><h1>Deployment readiness</h1><p>Check whether the pilot evidence, governance controls, safety processes, and monitoring signals are ready for a public environment.</p></div><div className="pilot-pack-actions"><Link href="/admin/pilot/monitoring">Back to monitoring</Link><Link href="/admin/pilot/handover"><Handshake size={16}/>Handover summary</Link></div></div>

        <section className={`scale-up-hero scale-up-${checklist.status.toLowerCase()}`}>
          <div><ServerCog size={26}/><span>Deployment posture</span><strong>{statusLabels[checklist.status]}</strong><p>Generated {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(checklist.generatedAt))}</p></div>
          <dl>
            <div><dt>Pilot recommendation</dt><dd>{checklist.recommendation.replaceAll("_", " ").toLowerCase()}</dd></div>
            <div><dt>Blocked items</dt><dd>{blocked}</dd></div>
            <div><dt>Needs attention</dt><dd>{attention}</dd></div>
          </dl>
        </section>

        <section className="scale-up-section">
          <div className="section-title"><h2>Readiness checklist</h2><p>Resolve blocked items before exposing the pilot application to a wider public audience.</p></div>
          <div className="deployment-checklist">
            {checklist.items.map((item) => {
            const StatusIcon = statusIcons[item.status];
            return <article className={`deployment-item deployment-item-${item.status.toLowerCase()}`} key={item.label}><div><StatusIcon size={19}/><span>{statusLabels[item.status]}</span></div><strong>{item.label}</strong><small>{item.area}</small><p>{item.requirement}</p><em>{item.evidence}</em></article>;
        })}
          </div>
        </section>

        <section className="scale-up-section">
          <div className="section-title"><h2>Production release notes</h2><p>These are the operational reminders for the deployment team.</p></div>
          <ol className="scale-up-steps">
            {checklist.releaseNotes.map((item) => <li key={item}><ClipboardCheck size={17}/>{item}</li>)}
          </ol>
        </section>
      </div>
    </main>);
}

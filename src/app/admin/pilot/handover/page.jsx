import { BadgeCheck, CircleAlert, ClipboardCheck, Handshake, LogOut, Rocket, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requireAdministrator } from "@/lib/admin-auth";
import { phaseFourHandoverSummary } from "@/lib/dev-workflow-store";
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
export default async function PhaseFourHandoverPage() {
    const administrator = await requireAdministrator();
    const summary = phaseFourHandoverSummary();
    return (<main className="portal-page">
      <header className="portal-topbar"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div className="portal-identity"><div><strong>{administrator.displayName}</strong><span><BadgeCheck size={14}/> Publication administrator</span></div><form action={adminLogoutAction}><button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={19}/></button></form></div></header>
      <div className="pilot-pack-shell">
        <div className="admin-subnav"><Link href="/admin">Publication control</Link><Link href="/admin/audit">Audit trail</Link><Link href="/admin/feedback">Citizen feedback</Link><Link href="/admin/analytics">Analytics</Link><Link href="/admin/evidence">Evidence</Link><Link href="/admin/pilot">Pilot readiness</Link></div>
        <div className="pilot-pack-heading"><div><p className="eyebrow">Phase 4 handover</p><h1>Handover summary</h1><p>Close the pilot-readiness phase and prepare the project for production launch planning.</p></div><div className="pilot-pack-actions"><Link href="/admin/pilot/deployment">Back to deployment readiness</Link><Link href="/admin/production"><Rocket size={16}/>Production readiness</Link></div></div>

        <section className={`scale-up-hero scale-up-${summary.status.toLowerCase()}`}>
          <div><Handshake size={26}/><span>Handover posture</span><strong>{statusLabels[summary.status]}</strong><p>Current pilot recommendation: {summary.recommendation.replaceAll("_", " ").toLowerCase()}</p></div>
          <dl>
            <div><dt>Generated</dt><dd>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(summary.generatedAt))}</dd></div>
            <div><dt>Handover items</dt><dd>{summary.handover.length}</dd></div>
            <div><dt>Phase 5 priorities</dt><dd>{summary.phaseFivePriorities.length}</dd></div>
          </dl>
        </section>

        <section className="scale-up-section">
          <div className="section-title"><h2>Phase 4 handover items</h2><p>These items summarize what must be carried into the launch planning phase.</p></div>
          <div className="handover-grid">
            {summary.handover.map((item) => {
            const StatusIcon = statusIcons[item.status];
            return <article className={`handover-card handover-card-${item.status.toLowerCase()}`} key={item.label}><div><StatusIcon size={19}/><span>{statusLabels[item.status]}</span></div><h3>{item.label}</h3><p>{item.summary}</p><small>{item.nextOwner}</small></article>;
        })}
          </div>
        </section>

        <section className="scale-up-section">
          <div className="section-title"><h2>Phase 5 priorities</h2><p>Use these as the starting agenda for production launch planning.</p></div>
          <ol className="scale-up-steps">
            {summary.phaseFivePriorities.map((item) => <li key={item}><ClipboardCheck size={17}/>{item}</li>)}
          </ol>
        </section>
      </div>
    </main>);
}

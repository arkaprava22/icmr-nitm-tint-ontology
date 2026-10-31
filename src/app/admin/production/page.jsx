import { BadgeCheck, CircleAlert, ClipboardCheck, LogOut, Rocket, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requireAdministrator } from "@/lib/admin-auth";
import { productionReadinessDashboard } from "@/lib/dev-workflow-store";
import { adminLogoutAction } from "../actions";
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
export default async function ProductionReadinessPage() {
    const administrator = await requireAdministrator();
    const readiness = productionReadinessDashboard();
    return (<main className="portal-page">
      <header className="portal-topbar"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div className="portal-identity"><div><strong>{administrator.displayName}</strong><span><BadgeCheck size={14}/> Publication administrator</span></div><form action={adminLogoutAction}><button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={19}/></button></form></div></header>
      <div className="pilot-pack-shell">
        <div className="admin-subnav"><Link href="/admin">Publication control</Link><Link href="/admin/audit">Audit trail</Link><Link href="/admin/feedback">Citizen feedback</Link><Link href="/admin/analytics">Analytics</Link><Link href="/admin/evidence">Evidence</Link><Link href="/admin/pilot">Pilot readiness</Link><Link className="active" href="/admin/production">Production readiness</Link></div>
        <div className="pilot-pack-heading"><div><p className="eyebrow">Phase 5 launch foundation</p><h1>Production readiness</h1><p>Turn pilot handover evidence into the practical controls needed before a public countrywide launch.</p></div><Link href="/admin/pilot/handover">Back to handover</Link></div>

        <section className={`production-hero production-${readiness.status.toLowerCase()}`}>
          <div><Rocket size={27}/><span>Launch posture</span><strong>{statusLabels[readiness.status]}</strong><p>Generated {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(readiness.generatedAt))}</p></div>
          <dl>
            <div><dt>Ready</dt><dd>{readiness.ready}</dd></div>
            <div><dt>Needs attention</dt><dd>{readiness.attention}</dd></div>
            <div><dt>Blocked</dt><dd>{readiness.blocked}</dd></div>
            <div><dt>Pilot handover</dt><dd>{statusLabels[readiness.handoverStatus]}</dd></div>
          </dl>
        </section>

        <section className="scale-up-section">
          <div className="section-title"><h2>Production readiness controls</h2><p>These items separate a validated pilot from a reliable public service.</p></div>
          <div className="production-grid">
            {readiness.items.map((item) => {
            const StatusIcon = statusIcons[item.status];
            return <article className={`production-card production-card-${item.status.toLowerCase()}`} key={item.label}><div><StatusIcon size={19}/><span>{statusLabels[item.status]}</span></div><h3>{item.label}</h3><small>{item.area}</small><p>{item.requirement}</p><em>{item.nextStep}</em></article>;
        })}
          </div>
        </section>

        <section className="scale-up-section">
          <div className="section-title"><h2>Launch sequence</h2><p>This becomes the first working order for Phase 5 implementation.</p></div>
          <ol className="scale-up-steps">
            {readiness.launchSequence.map((item) => <li key={item}><ClipboardCheck size={17}/>{item}</li>)}
          </ol>
        </section>
      </div>
    </main>);
}

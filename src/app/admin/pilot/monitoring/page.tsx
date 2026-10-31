import { Activity, BadgeCheck, CircleAlert, ClipboardCheck, LogOut, ServerCog, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requireAdministrator } from "@/lib/admin-auth";
import { rolloutMonitoringDashboard } from "@/lib/dev-workflow-store";
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

export default async function RolloutMonitoringPage() {
  const administrator = await requireAdministrator();
  const dashboard = rolloutMonitoringDashboard();

  return (
    <main className="portal-page">
      <header className="portal-topbar"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div className="portal-identity"><div><strong>{administrator.displayName}</strong><span><BadgeCheck size={14} /> Publication administrator</span></div><form action={adminLogoutAction}><button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={19} /></button></form></div></header>
      <div className="pilot-pack-shell">
        <div className="admin-subnav"><Link href="/admin">Publication control</Link><Link href="/admin/audit">Audit trail</Link><Link href="/admin/feedback">Citizen feedback</Link><Link href="/admin/analytics">Analytics</Link><Link href="/admin/evidence">Evidence</Link><Link href="/admin/pilot">Pilot readiness</Link></div>
        <div className="pilot-pack-heading"><div><p className="eyebrow">Phase 4 monitoring</p><h1>Rollout monitoring</h1><p>Track the signals that should be watched while the AYUSH knowledge platform moves beyond pilot validation.</p></div><div className="pilot-pack-actions"><Link href="/admin/pilot/scale-up">Back to scale-up plan</Link><Link href="/admin/pilot/deployment"><ServerCog size={16} />Deployment readiness</Link></div></div>

        <section className={`scale-up-hero scale-up-${dashboard.status.toLowerCase()}`}>
          <div><Activity size={26} /><span>Monitoring posture</span><strong>{statusLabels[dashboard.status]}</strong><p>Generated {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(dashboard.generatedAt))}</p></div>
          <dl>
            <div><dt>Plan status</dt><dd>{statusLabels[dashboard.planStatus]}</dd></div>
            <div><dt>Blocked signals</dt><dd>{dashboard.signals.filter((signal) => signal.status === "BLOCKED").length}</dd></div>
            <div><dt>Attention signals</dt><dd>{dashboard.signals.filter((signal) => signal.status === "ATTENTION").length}</dd></div>
          </dl>
        </section>

        <section className="scale-up-section">
          <div className="section-title"><h2>Monitoring signals</h2><p>These checks summarize rollout risks from existing pilot and governance records.</p></div>
          <div className="monitoring-grid">
            {dashboard.signals.map((signal) => {
              const StatusIcon = statusIcons[signal.status];
              return <article className={`monitoring-card monitoring-card-${signal.status.toLowerCase()}`} key={signal.label}><div><StatusIcon size={19} /><span>{statusLabels[signal.status]}</span></div><h3>{signal.label}</h3><strong>{signal.value}</strong><p>{signal.detail}</p></article>;
            })}
          </div>
        </section>

        <section className="scale-up-section">
          <div className="section-title"><h2>Weekly cadence</h2><p>Use this cadence during controlled rollout and early scale-up.</p></div>
          <ol className="scale-up-steps">
            {dashboard.cadence.map((item) => <li key={item}><ClipboardCheck size={17} />{item}</li>)}
          </ol>
        </section>
      </div>
    </main>
  );
}

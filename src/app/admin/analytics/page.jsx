import { Activity, BadgeCheck, BarChart3, CircleAlert, FileCheck2, LogOut, ShieldCheck, TrendingUp } from "lucide-react";
import Link from "next/link";
import { requireAdministrator } from "@/lib/admin-auth";
import { governanceAnalytics } from "@/lib/dev-workflow-store";
import { adminLogoutAction } from "../actions";
function percent(value, total) {
    return total > 0 ? Math.round((value / total) * 100) : 0;
}
function AnalyticsBar({ label, count, total }) {
    const width = Math.max(percent(count, total), count > 0 ? 6 : 0);
    return (<div className="analytics-bar-row">
      <div><strong>{label.replaceAll("_", " ").toLowerCase()}</strong><span>{count}</span></div>
      <span className="analytics-bar-track"><span style={{ width: `${width}%` }}/></span>
    </div>);
}
export default async function AdminAnalyticsPage() {
    const administrator = await requireAdministrator();
    const analytics = governanceAnalytics();
    const workflowTotal = Math.max(analytics.workflow.total, 1);
    const validationTotal = Math.max(analytics.validation.passed + analytics.validation.failed + analytics.validation.notRun, 1);
    const feedbackTotal = Math.max(analytics.feedback.open + analytics.feedback.resolved + analytics.feedback.dismissed, 1);
    const publicationRate = percent(analytics.workflow.published, analytics.workflow.total);
    return (<main className="portal-page">
      <header className="portal-topbar"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div className="portal-identity"><div><strong>{administrator.displayName}</strong><span><BadgeCheck size={14}/> Publication administrator</span></div><form action={adminLogoutAction}><button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={19}/></button></form></div></header>
      <div className="admin-shell">
        <div className="admin-subnav"><Link href="/admin">Publication control</Link><Link href="/admin/audit">Audit trail</Link><Link href="/admin/feedback">Citizen feedback</Link><Link className="active" href="/admin/analytics">Analytics</Link><Link href="/admin/evidence">Evidence</Link><Link href="/admin/pilot">Pilot readiness</Link></div>
        <div className="portal-heading"><div><p className="eyebrow">Governance analytics</p><h1>Operational dashboard</h1><p>Track workflow throughput, safety feedback, validation readiness, and audit integrity.</p></div><span className={`integrity-status integrity-${analytics.audit.valid ? "valid" : "broken"}`}>{analytics.audit.valid ? <ShieldCheck size={18}/> : <CircleAlert size={18}/>}{analytics.audit.valid ? "Audit verified" : "Audit issue"}</span></div>

        <div className="analytics-kpi-grid">
          <article><Activity size={21}/><span>Total contributions</span><strong>{analytics.workflow.total}</strong><small>{analytics.review.pending} awaiting review</small></article>
          <article><TrendingUp size={21}/><span>Publication rate</span><strong>{publicationRate}%</strong><small>{analytics.workflow.published} published</small></article>
          <article><ShieldCheck size={21}/><span>Safety feedback</span><strong>{analytics.feedback.safetyReview}</strong><small>{analytics.feedback.open} open feedback items</small></article>
          <article><FileCheck2 size={21}/><span>Validation passed</span><strong>{analytics.validation.passed}</strong><small>{analytics.validation.failed} failed checks</small></article>
        </div>

        <section className="analytics-grid">
          <article className="analytics-panel">
            <div className="analytics-panel-title"><BarChart3 size={20}/><h2>Contribution workflow</h2></div>
            <AnalyticsBar label="Draft" count={analytics.workflow.draft} total={workflowTotal}/>
            <AnalyticsBar label="Submitted" count={analytics.workflow.submitted} total={workflowTotal}/>
            <AnalyticsBar label="Approved" count={analytics.workflow.approved} total={workflowTotal}/>
            <AnalyticsBar label="Published" count={analytics.workflow.published} total={workflowTotal}/>
            <AnalyticsBar label="Changes requested" count={analytics.workflow.changesRequested} total={workflowTotal}/>
            <AnalyticsBar label="Rejected" count={analytics.workflow.rejected} total={workflowTotal}/>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-title"><FileCheck2 size={20}/><h2>Validation readiness</h2></div>
            <AnalyticsBar label="Passed" count={analytics.validation.passed} total={validationTotal}/>
            <AnalyticsBar label="Failed" count={analytics.validation.failed} total={validationTotal}/>
            <AnalyticsBar label="Not run" count={analytics.validation.notRun} total={validationTotal}/>
            <div className="analytics-note">Reviewer and publication gates only advance records that pass automated validation.</div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-title"><ShieldCheck size={20}/><h2>Citizen safety signals</h2></div>
            <AnalyticsBar label="Open" count={analytics.feedback.open} total={feedbackTotal}/>
            <AnalyticsBar label="Safety review" count={analytics.feedback.safetyReview} total={feedbackTotal}/>
            <AnalyticsBar label="Resolved" count={analytics.feedback.resolved} total={feedbackTotal}/>
            <AnalyticsBar label="Dismissed" count={analytics.feedback.dismissed} total={feedbackTotal}/>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-title"><Activity size={20}/><h2>Review decisions</h2></div>
            <AnalyticsBar label="Approvals" count={analytics.review.approvals} total={Math.max(analytics.review.decisions, 1)}/>
            <AnalyticsBar label="Change requests" count={analytics.review.changeRequests} total={Math.max(analytics.review.decisions, 1)}/>
            <AnalyticsBar label="Rejections" count={analytics.review.rejections} total={Math.max(analytics.review.decisions, 1)}/>
            <div className="analytics-note">{analytics.review.decisions} total review decision{analytics.review.decisions === 1 ? "" : "s"} recorded.</div>
          </article>

          <article className="analytics-panel analytics-wide">
            <div className="analytics-panel-title"><BarChart3 size={20}/><h2>System and evidence coverage</h2></div>
            <div className="analytics-two-column">
              <div>{analytics.systemCoverage.length === 0 ? <p className="analytics-empty">No system coverage yet.</p> : analytics.systemCoverage.map((item) => <AnalyticsBar key={item.systemIri} label={item.label} count={item.count} total={workflowTotal}/>)}</div>
              <div>{analytics.evidenceCoverage.length === 0 ? <p className="analytics-empty">No evidence coverage yet.</p> : analytics.evidenceCoverage.map((item) => <AnalyticsBar key={item.label} label={item.label} count={item.count} total={workflowTotal}/>)}</div>
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-title"><ShieldCheck size={20}/><h2>Audit posture</h2></div>
            <dl className="analytics-facts">
              <div><dt>Events</dt><dd>{analytics.audit.events}</dd></div>
              <div><dt>Integrity</dt><dd>{analytics.audit.valid ? "Verified" : "Needs review"}</dd></div>
              <div><dt>Latest hash</dt><dd>{analytics.audit.latestHash ? `${analytics.audit.latestHash.slice(0, 12)}...` : "None"}</dd></div>
            </dl>
          </article>
        </section>
      </div>
    </main>);
}

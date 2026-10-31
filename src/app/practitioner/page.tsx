import { BadgeCheck, CircleAlert, FilePlus2, LogOut } from "lucide-react";
import Link from "next/link";
import { listPractitionerContributions } from "@/lib/dev-workflow-store";
import { requirePractitioner } from "@/lib/practitioner-auth";
import { logoutAction, submitContributionAction, validateContributionAction } from "./actions";

type PageProps = { searchParams: Promise<{ created?: string; submitted?: string; notice?: string; validated?: string; revised?: string }> };

const kindLabels: Record<string, string> = {
  NEW_CLAIM: "Health-use claim",
  NEW_ENTITY: "New remedy",
  UPDATE: "Correction",
  SAFETY_FLAG: "Safety concern",
};

export default async function PractitionerDashboard({ searchParams }: PageProps) {
  const practitioner = await requirePractitioner();
  const contributions = listPractitionerContributions(practitioner.id);
  const { created, submitted, notice, validated, revised } = await searchParams;
  const synced = contributions.filter((item) => item.sync_status === "synced").length;

  return (
    <main className="portal-page">
      <header className="portal-topbar">
        <Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link>
        <div className="portal-identity"><div><strong>{practitioner.displayName}</strong><span><BadgeCheck size={14} /> Verified practitioner</span></div><form action={logoutAction}><button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={19} /></button></form></div>
      </header>
      <div className="portal-shell">
        <nav className="portal-nav" aria-label="Practitioner workspace"><Link className="active" href="/practitioner">Dashboard</Link><Link href="/practitioner/contributions/new">New contribution</Link><Link href="/">Public knowledge</Link></nav>
        <section className="portal-content">
          {created && <div className="success-banner"><BadgeCheck size={19} /><div><strong>Draft saved</strong><span>The contribution is isolated from public knowledge and ready for review.</span></div></div>}
          {submitted && <div className="success-banner"><BadgeCheck size={19} /><div><strong>Submitted for review</strong><span>An independent reviewer can now assess the safety and evidence.</span></div></div>}
          {revised && <div className="success-banner"><BadgeCheck size={19} /><div><strong>Revision {revised} saved</strong><span>The previous ontology graph was preserved and the new revision was checked automatically.</span></div></div>}
          {validated === "passed" && <div className="success-banner"><BadgeCheck size={19} /><div><strong>Automated checks passed</strong><span>The draft meets the structural requirements for editorial review.</span></div></div>}
          {validated === "failed" && <div className="warning-banner"><CircleAlert size={19} /><div><strong>Automated checks need attention</strong><span>The draft remains safely blocked from review until its validation issues are corrected.</span></div></div>}
          {notice && <div className="warning-banner"><CircleAlert size={19} /><div><strong>Submission unavailable</strong><span>Only synchronized drafts can be submitted once.</span></div></div>}
          <div className="portal-heading"><div><p className="eyebrow">Practitioner workspace</p><h1>Knowledge contributions</h1><p>Create structured evidence and safety records for independent review.</p></div><Link className="primary-action" href="/practitioner/contributions/new"><FilePlus2 size={18} />New contribution</Link></div>
          <div className="portal-metrics"><div><span>Total contributions</span><strong>{contributions.length}</strong></div><div><span>Ontology synchronized</span><strong>{synced}</strong></div><div><span>Awaiting review</span><strong>{contributions.filter((item) => ["SUBMITTED", "UNDER_REVIEW"].includes(item.status)).length}</strong></div></div>
          <section className="contribution-section" aria-labelledby="recent-contributions"><div className="section-title"><div><h2 id="recent-contributions">Recent contributions</h2><p>Drafts remain unpublished until the review process is complete.</p></div></div>
            {contributions.length === 0 ? <div className="portal-empty"><FilePlus2 size={25} /><h3>No contributions yet</h3><p>Start with one remedy, intended use, safety statement, and supporting source.</p><Link href="/practitioner/contributions/new">Create the first contribution</Link></div> : <div className="contribution-table"><div className="table-header"><span>Contribution</span><span>Workflow</span><span>Validation</span><span>Action</span></div>{contributions.map((item) => { const issues = item.validation_issues ? JSON.parse(item.validation_issues) as Array<{ message: string }> : []; const editable = ["DRAFT", "CHANGES_REQUESTED"].includes(item.status); return <article className="contribution-row" key={item.id}><div><strong>{item.title}</strong><small>{kindLabels[item.kind] ?? item.kind} · revision {item.current_revision ?? 1}</small></div><span className={`workflow-state status-${item.status.toLowerCase()}`}>{item.status.replaceAll("_", " ").toLowerCase()}</span><div className="validation-cell"><span className={`validation-state validation-${item.validation_status.toLowerCase()}`}>{item.validation_status === "PASSED" ? <BadgeCheck size={14} /> : <CircleAlert size={14} />}{item.validation_status.replaceAll("_", " ").toLowerCase()}</span>{issues[0] && <small>{issues[0].message}</small>}</div><div className="row-actions">{editable && <Link className="table-action" href={`/practitioner/contributions/${item.id}/edit`}>Edit</Link>}{item.status === "DRAFT" && item.validation_status !== "PASSED" && item.sync_status === "synced" && <form action={validateContributionAction.bind(null, item.id)}><button className="table-action">Run checks</button></form>}{item.status === "DRAFT" && item.validation_status === "PASSED" && <form action={submitContributionAction.bind(null, item.id)}><button className="table-action">Submit</button></form>}{!editable && item.status !== "DRAFT" && <span className="muted-action">No action needed</span>}</div></article>; })}</div>}
          </section>
        </section>
      </div>
    </main>
  );
}

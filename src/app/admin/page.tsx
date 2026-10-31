import { BadgeCheck, Database, FileCheck2, LogOut, ServerCog } from "lucide-react";
import Link from "next/link";
import { listPublicationQueue, publicationSummary } from "@/lib/dev-workflow-store";
import { ontologyStoreStatus } from "@/lib/rdf-store";
import { requireAdministrator } from "@/lib/admin-auth";
import { adminLogoutAction } from "./actions";

type PageProps = { searchParams: Promise<{ published?: string }> };

export default async function AdminDashboard({ searchParams }: PageProps) {
  const administrator = await requireAdministrator();
  const [queue, summary, store] = await Promise.all([Promise.resolve(listPublicationQueue()), Promise.resolve(publicationSummary()), ontologyStoreStatus()]);
  const { published } = await searchParams;
  return <main className="portal-page">
    <header className="portal-topbar"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div className="portal-identity"><div><strong>{administrator.displayName}</strong><span><BadgeCheck size={14} /> Publication administrator</span></div><form action={adminLogoutAction}><button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={19} /></button></form></div></header>
    <div className="admin-shell">
      <div className="admin-subnav"><Link className="active" href="/admin">Publication control</Link><Link href="/admin/audit">Audit trail</Link><Link href="/admin/feedback">Citizen feedback</Link><Link href="/admin/analytics">Analytics</Link><Link href="/admin/evidence">Evidence</Link><Link href="/admin/pilot">Pilot readiness</Link><Link href="/admin/production">Production readiness</Link></div>
      {published && <div className="success-banner"><BadgeCheck size={19} /><div><strong>Knowledge published</strong><span>The approved RDF is now available in the public graph and the audit trail is complete.</span></div></div>}
      <div className="portal-heading"><div><p className="eyebrow">Administration</p><h1>Publication control</h1><p>Release independently reviewed knowledge into the public ontology.</p></div><span className={`store-health store-${store.status}`}><ServerCog size={18} />Ontology store {store.status}</span></div>
      <div className="portal-metrics"><div><span>Approved for publication</span><strong>{summary.approved}</strong></div><div><span>Published contributions</span><strong>{summary.published}</strong></div><div><span>Ontology response</span><strong className="metric-text">{store.status === "available" ? `${store.responseTimeMs} ms` : "Unavailable"}</strong></div></div>
      <section className="publication-section"><div className="section-title"><h2>Approved knowledge</h2><p>Every item below has a recorded independent review decision.</p></div>{queue.length === 0 ? <div className="portal-empty"><FileCheck2 size={26} /><h3>No records awaiting publication</h3><p>Reviewer-approved contributions will appear here.</p></div> : <div className="publication-list">{queue.map((item) => <article className="publication-item" key={item.id}><div className="publication-icon"><Database size={20} /></div><div><span className="workflow-state status-approved">approved</span><h3>{item.title}</h3><p>{item.remedy_name} · {item.target_label}</p><small>Reviewed by {item.reviewer_name}</small></div><Link href={`/admin/publications/${item.id}`}>Prepare publication</Link></article>)}</div>}</section>
    </div>
  </main>;
}

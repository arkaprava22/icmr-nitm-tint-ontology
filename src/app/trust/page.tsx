import { AlertTriangle, BadgeCheck, DatabaseZap, FileCheck2, History, Landmark, SearchCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { appConfig } from "@/lib/config";
import { publicKnowledgeSummary } from "@/lib/rdf-store";

const guardrails = [
  {
    title: "Reviewed before publication",
    body: "Practitioner submissions stay outside the public graph until a reviewer approves them and an administrator publishes them.",
    icon: FileCheck2,
  },
  {
    title: "Source and safety context",
    body: "Published records carry evidence, provenance, safety notes, risk labels, and the traditional medicine system they belong to.",
    icon: ShieldCheck,
  },
  {
    title: "Audit-backed workflow",
    body: "Contribution, review, correction, and publication actions are recorded in a tamper-evident audit chain.",
    icon: History,
  },
];

const phaseSteps = [
  "Public trust and transparency console",
  "Guided discovery by symptom, remedy, region, and AYUSH system",
  "Citizen feedback intake with safety triage",
  "Governance analytics for administrators",
  "Evidence strengthening and external-source curation",
];

export default async function TrustPage() {
  const summary = await publicKnowledgeSummary();
  const hasPublishedKnowledge = summary.containsPublishedData;

  return (
    <main>
      <header className="topbar">
        <Link className="brand" href="/" aria-label={`${appConfig.name} home`}>
          <span className="brand-mark">T</span><span>{appConfig.name}</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/">Search</Link>
          <Link href="/discover">Discover</Link>
          <Link href="/trust">Trust</Link>
          <Link href="/feedback">Feedback</Link>
          <Link className="practitioner-button" href="/practitioner/login">Practitioner sign in</Link>
        </nav>
      </header>

      <section className="trust-hero" aria-labelledby="trust-heading">
        <div>
          <p className="system-label">Phase 3</p>
          <h1 id="trust-heading">Public trust console</h1>
          <p>See how traditional medicine knowledge becomes visible to citizens, what is still in pilot review, and how safety boundaries are maintained.</p>
        </div>
        <span className={`store-health store-${summary.status}`}>
          <DatabaseZap size={18} />Ontology store {summary.status}
        </span>
      </section>

      <section className="trust-dashboard" aria-label="Public knowledge status">
        <div className="trust-status-panel">
          <div className="trust-status-icon">
            {hasPublishedKnowledge ? <BadgeCheck size={28} /> : <AlertTriangle size={28} />}
          </div>
          <div>
            <p className="eyebrow">Public graph</p>
            <h2>{hasPublishedKnowledge ? "Reviewed knowledge is available" : "No reviewed public records yet"}</h2>
            <p>
              {hasPublishedKnowledge
                ? "Citizens are seeing records that completed contribution, review, validation, and publication."
                : "Search may still show unvalidated pilot records during development. These are clearly marked and should not be treated as approved public knowledge."}
            </p>
          </div>
        </div>
        <div className="trust-metrics">
          <div><span>Published remedies</span><strong>{summary.publishedRemedies}</strong></div>
          <div><span>Published claims</span><strong>{summary.publishedClaims}</strong></div>
          <div><span>Reviewed evidence</span><strong>{summary.reviewedEvidenceItems}</strong></div>
          <div><span>Store response</span><strong>{summary.status === "available" ? `${summary.responseTimeMs} ms` : "Unavailable"}</strong></div>
        </div>
      </section>

      <section className="trust-section" aria-labelledby="guardrails-heading">
        <div className="section-heading">
          <div><p className="eyebrow">Safeguards</p><h2 id="guardrails-heading">How records earn public visibility</h2></div>
          <Link className="trust-link" href="/admin/audit"><SearchCheck size={16} />Audit trail</Link>
        </div>
        <div className="guardrail-grid">
          {guardrails.map((item) => {
            const Icon = item.icon;
            return (
              <article className="guardrail-card" key={item.title}>
                <Icon size={23} />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="trust-section trust-roadmap" aria-labelledby="phase3-heading">
        <div>
          <p className="eyebrow">Next build path</p>
          <h2 id="phase3-heading">Phase 3 steps</h2>
          <p>Phase 3 turns the reviewed knowledge base into a clearer public service, while adding stronger governance and citizen-facing transparency.</p>
        </div>
        <ol>
          {phaseSteps.map((step, index) => (
            <li key={step}><span>{index + 1}</span>{step}</li>
          ))}
        </ol>
      </section>

      <section className="safety-band">
        <Landmark size={25} aria-hidden="true" />
        <div>
          <h2>Not a diagnosis or prescription service</h2>
          <p>TINT presents reviewed knowledge and safety context. Urgent symptoms, pregnancy, children, chronic disease, or medicine interactions require a qualified health professional.</p>
        </div>
      </section>
    </main>
  );
}

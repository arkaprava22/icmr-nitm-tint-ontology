import {
  ArrowLeft,
  BookOpenCheck,
  Database,
  FileWarning,
  FlaskConical,
  Languages,
  ShieldAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { appConfig } from "@/lib/config";
import { getRemedyDetail, normalizeEntityId, type SearchLanguage } from "@/lib/rdf-store";

const copy = {
  en: {
    back: "Back to search",
    preview: "Unvalidated development record",
    previewText: "This record has not been approved for public health guidance. Its claims, sources, and safety statements require practitioner review.",
    names: "Known names",
    identity: "Record identity",
    botanical: "Botanical name",
    system: "Medical tradition",
    recordStatus: "Record status",
    claims: "Proposed traditional-use claims",
    claimCount: "claims in this pilot record",
    target: "Concerning",
    outcome: "Intended outcome",
    population: "Population",
    workflow: "Review status",
    safety: "Safety review",
    evidence: "Evidence and sources",
    sourceType: "Source type",
    assessment: "Assessment",
    noClaims: "No use claims are available for this record.",
    provenance: "Graph provenance",
    graph: "Source graph",
    entity: "Entity identifier",
    caution: "Do not use this pilot record to make treatment decisions.",
    cautionText: "Seek qualified medical care for severe symptoms, emergencies, pregnancy, children, chronic illness, or possible medicine interactions.",
    risk: { low: "Low risk", moderate: "Moderate risk", high: "High risk", unknown: "Risk not assessed" },
  },
  hi: {
    back: "खोज पर वापस जाएं",
    preview: "असत्यापित विकास रिकॉर्ड",
    previewText: "यह रिकॉर्ड सार्वजनिक स्वास्थ्य मार्गदर्शन के लिए स्वीकृत नहीं है। इसके दावों, स्रोतों और सुरक्षा कथनों की चिकित्सक समीक्षा आवश्यक है।",
    names: "ज्ञात नाम",
    identity: "रिकॉर्ड पहचान",
    botanical: "वानस्पतिक नाम",
    system: "चिकित्सा परंपरा",
    recordStatus: "रिकॉर्ड स्थिति",
    claims: "प्रस्तावित पारंपरिक उपयोग दावे",
    claimCount: "पायलट रिकॉर्ड में दावे",
    target: "संबंधित विषय",
    outcome: "अपेक्षित परिणाम",
    population: "जनसंख्या",
    workflow: "समीक्षा स्थिति",
    safety: "सुरक्षा समीक्षा",
    evidence: "साक्ष्य और स्रोत",
    sourceType: "स्रोत प्रकार",
    assessment: "आकलन",
    noClaims: "इस रिकॉर्ड के लिए उपयोग संबंधी दावा उपलब्ध नहीं है।",
    provenance: "ग्राफ स्रोत विवरण",
    graph: "स्रोत ग्राफ",
    entity: "इकाई पहचानकर्ता",
    caution: "उपचार संबंधी निर्णय के लिए इस पायलट रिकॉर्ड का उपयोग न करें।",
    cautionText: "गंभीर लक्षण, आपातस्थिति, गर्भावस्था, बच्चों, पुरानी बीमारी या दवाओं के संभावित प्रभाव में योग्य चिकित्सा सहायता लें।",
    risk: { low: "कम जोखिम", moderate: "मध्यम जोखिम", high: "उच्च जोखिम", unknown: "जोखिम का आकलन नहीं" },
  },
} as const;

function humanizeCode(code: string) {
  const value = code.replaceAll("-", " ");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function RemedyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { id: rawId } = await params;
  const language: SearchLanguage = (await searchParams).lang === "hi" ? "hi" : "en";
  let id: string;
  try { id = normalizeEntityId(rawId); } catch { notFound(); }
  const remedy = await getRemedyDetail(id, language);
  if (!remedy) notFound();
  const text = copy[language];
  const otherLanguage = language === "en" ? "hi" : "en";

  return (
    <main lang={language}>
      <header className="topbar">
        <Link className="brand" href={`/?lang=${language}`} aria-label={`${appConfig.name} home`}><span className="brand-mark">T</span><span>{appConfig.name}</span></Link>
        <nav aria-label="Primary navigation">
          <Link className="language-button" href={`/remedies/${id}?lang=${otherLanguage}`}><Languages size={18} /><span>{language === "en" ? "हिन्दी" : "English"}</span></Link>
          <Link className="practitioner-button" href="/practitioner/login">{language === "en" ? "Practitioner sign in" : "चिकित्सक प्रवेश"}</Link>
        </nav>
      </header>

      <div className="detail-breadcrumb"><Link href={`/?lang=${language}`}><ArrowLeft size={17} />{text.back}</Link></div>
      {remedy.preview && <section className="record-warning"><FlaskConical size={23} /><div><strong>{text.preview}</strong><p>{text.previewText}</p></div></section>}

      <section className="detail-hero">
        <div>
          <p className="system-label">{remedy.system}</p>
          <h1>{remedy.label}</h1>
          {remedy.botanicalName && <p className="detail-botanical"><span>{text.botanical}</span><i>{remedy.botanicalName}</i></p>}
        </div>
        <span className={`detail-risk risk-${remedy.riskLevel}`}><ShieldAlert size={17} />{text.risk[remedy.riskLevel]}</span>
      </section>

      <div className="detail-layout">
        <section className="claim-section" aria-labelledby="claims-heading">
          <div className="claim-section-heading"><div><p className="eyebrow">{remedy.claims.length} {text.claimCount}</p><h2 id="claims-heading">{text.claims}</h2></div></div>
          {remedy.claims.length === 0 ? <p className="empty-detail">{text.noClaims}</p> : remedy.claims.map((claim) => (
            <article className="claim-card" key={claim.id}>
              <header className="claim-header"><div><p>{claim.id}</p><h3>{claim.label}</h3></div><span className="status-label">{claim.status}</span></header>
              <dl className="claim-facts">
                <div><dt>{text.target}</dt><dd>{claim.target}</dd></div>
                <div><dt>{text.outcome}</dt><dd>{claim.outcome}</dd></div>
                <div><dt>{text.population}</dt><dd><Users size={15} />{claim.population}</dd></div>
                <div><dt>{text.workflow}</dt><dd>{claim.status}</dd></div>
              </dl>
              <section className="claim-safety"><h4><ShieldAlert size={18} />{text.safety}</h4><ul>{claim.safety.map((item) => <li key={item.id}><strong>{humanizeCode(item.code)}</strong><span>{item.note}</span></li>)}</ul></section>
              <section className="claim-evidence"><h4><BookOpenCheck size={18} />{text.evidence}</h4>{claim.evidence.map((item) => <div className="evidence-row" key={item.id}><div><span>{text.sourceType}</span><strong>{humanizeCode(item.type)}</strong></div><p>{item.citation}</p><small>{text.assessment}: {item.assessment} · {item.validationStatus}</small></div>)}</section>
            </article>
          ))}
        </section>

        <aside className="detail-aside">
          <section><h2>{text.identity}</h2><dl><div><dt>{text.system}</dt><dd>{remedy.system}</dd></div><div><dt>{text.recordStatus}</dt><dd>{remedy.validationStatus}</dd></div>{remedy.botanicalName && <div><dt>{text.botanical}</dt><dd><i>{remedy.botanicalName}</i></dd></div>}</dl></section>
          <section><h2>{text.names}</h2>{remedy.alternativeNames.length ? <ul>{remedy.alternativeNames.map((name) => <li key={name}>{name}</li>)}</ul> : <p>—</p>}</section>
          <section><h2><Database size={17} />{text.provenance}</h2><dl><div><dt>{text.entity}</dt><dd className="iri-value">{remedy.iri}</dd></div><div><dt>{text.graph}</dt><dd className="iri-value">{remedy.graphIri}</dd></div></dl></section>
        </aside>
      </div>

      <section className="safety-band"><FileWarning size={25} /><div><h2>{text.caution}</h2><p>{text.cautionText}</p></div></section>
      <footer><span>{appConfig.name}</span><span>{language === "en" ? "Traditional medicine knowledge, with sources and review history." : "स्रोतों और समीक्षा इतिहास सहित पारंपरिक चिकित्सा ज्ञान।"}</span></footer>
    </main>
  );
}

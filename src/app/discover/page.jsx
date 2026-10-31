import { AlertTriangle, ArrowUpRight, BadgeCheck, BookOpenText, Languages, Leaf, ShieldCheck, Stethoscope } from "lucide-react";
import Link from "next/link";
import { appConfig } from "@/lib/config";
import { guidedDiscoverySummary } from "@/lib/rdf-store";
const copy = {
    en: {
        eyebrow: "Guided discovery",
        title: "Browse traditional medicine knowledge",
        intro: "Start from a familiar symptom, remedy, AYUSH system, or safety level. Each path opens the search experience with ontology-backed context.",
        search: "Search",
        trust: "Trust",
        feedback: "Feedback",
        practitioner: "Practitioner sign in",
        language: "हिन्दी",
        graph: "Knowledge source",
        unavailable: "Guided discovery is temporarily unavailable.",
        symptoms: "Symptoms and conditions",
        remedies: "Remedies and ingredients",
        systems: "AYUSH systems",
        safety: "Safety levels",
        empty: "No browse items are available yet.",
        open: "Open",
        pilot: "Pilot records may appear during development. They are not public approvals.",
        safetyNote: "This service does not diagnose or prescribe treatment. For serious symptoms or medicine interactions, consult a qualified health professional.",
    },
    hi: {
        eyebrow: "मार्गदर्शित खोज",
        title: "पारंपरिक चिकित्सा ज्ञान देखें",
        intro: "परिचित लक्षण, उपचार, आयुष पद्धति या सुरक्षा स्तर से शुरू करें। हर विकल्प ontology आधारित खोज खोलता है।",
        search: "खोज",
        trust: "विश्वास",
        feedback: "प्रतिक्रिया",
        practitioner: "चिकित्सक प्रवेश",
        language: "English",
        graph: "ज्ञान स्रोत",
        unavailable: "मार्गदर्शित खोज अभी उपलब्ध नहीं है।",
        symptoms: "लक्षण और स्थितियां",
        remedies: "उपचार और सामग्री",
        systems: "आयुष पद्धतियां",
        safety: "सुरक्षा स्तर",
        empty: "अभी कोई विकल्प उपलब्ध नहीं है।",
        open: "खोलें",
        pilot: "विकास के दौरान पायलट रिकॉर्ड दिख सकते हैं। ये सार्वजनिक स्वीकृति नहीं हैं।",
        safetyNote: "यह सेवा रोग-निदान या उपचार निर्धारित नहीं करती है। गंभीर लक्षण या दवा प्रभाव की स्थिति में योग्य स्वास्थ्य विशेषज्ञ से सलाह लें।",
    },
};
function FacetList({ title, items, icon: Icon, emptyText, openText }) {
    return (<section className="discover-panel" aria-labelledby={`${title.replace(/\W+/g, "-").toLowerCase()}-heading`}>
      <div className="discover-panel-title">
        <Icon size={21}/>
        <h2 id={`${title.replace(/\W+/g, "-").toLowerCase()}-heading`}>{title}</h2>
      </div>
      {items.length === 0 ? (<p className="discover-empty">{emptyText}</p>) : (<div className="discover-list">
          {items.map((item) => (<Link href={item.href} key={`${title}-${item.label}`}>
              <span><strong>{item.label}</strong><small>{item.count} linked record{item.count === 1 ? "" : "s"}</small></span>
              <span className="discover-open">{openText}<ArrowUpRight size={15}/></span>
            </Link>))}
        </div>)}
    </section>);
}
export default async function DiscoverPage({ searchParams }) {
    const params = await searchParams;
    const language = params.lang === "hi" ? "hi" : "en";
    const text = copy[language];
    const otherLanguage = language === "en" ? "hi" : "en";
    const summary = await guidedDiscoverySummary(language);
    return (<main lang={language}>
      <header className="topbar">
        <Link className="brand" href={`/?lang=${language}`} aria-label={`${appConfig.name} home`}>
          <span className="brand-mark">T</span><span>{appConfig.name}</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href={`/?lang=${language}`}>{text.search}</Link>
          <Link href="/trust">{text.trust}</Link>
          <Link href="/feedback">{text.feedback}</Link>
          <Link className="language-button" href={{ pathname: "/discover", query: { lang: otherLanguage } }} title="Choose language">
            <Languages size={18} aria-hidden="true"/><span>{text.language}</span>
          </Link>
          <Link className="practitioner-button" href="/practitioner/login">{text.practitioner}</Link>
        </nav>
      </header>

      <section className="discover-hero" aria-labelledby="discover-heading">
        <div>
          <p className="system-label">{text.eyebrow}</p>
          <h1 id="discover-heading">{text.title}</h1>
          <p>{text.intro}</p>
        </div>
        <span className={`store-health store-${summary.status}`}>
          {summary.status === "available" ? <BadgeCheck size={18}/> : <AlertTriangle size={18}/>}
          {text.graph}: {summary.graphLabel}
        </span>
      </section>

      {summary.status === "unavailable" && (<div className="discover-warning"><AlertTriangle size={20}/><span>{summary.message ?? text.unavailable}</span></div>)}

      <section className="discover-grid" aria-label={text.title}>
        <FacetList title={text.symptoms} items={summary.symptoms} icon={Stethoscope} emptyText={text.empty} openText={text.open}/>
        <FacetList title={text.remedies} items={summary.remedies} icon={Leaf} emptyText={text.empty} openText={text.open}/>
        <FacetList title={text.systems} items={summary.systems} icon={BookOpenText} emptyText={text.empty} openText={text.open}/>
        <FacetList title={text.safety} items={summary.safetyLevels} icon={ShieldCheck} emptyText={text.empty} openText={text.open}/>
      </section>

      <section className="safety-band">
        <ShieldCheck size={25} aria-hidden="true"/>
        <div><h2>{text.pilot}</h2><p>{text.safetyNote}</p></div>
      </section>
    </main>);
}

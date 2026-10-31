import {
  AlertTriangle,
  ArrowUpRight,
  BookOpenText,
  FlaskConical,
  Languages,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { appConfig } from "@/lib/config";
import { normalizeSearchInput, searchKnowledge, type KnowledgeSearchResult, type SearchLanguage } from "@/lib/rdf-store";

const copy = {
  en: {
    searchLabel: "AYUSH knowledge search",
    heading: "What would you like to understand?",
    placeholder: "Search a symptom, remedy, ingredient, or local name",
    search: "Search",
    note: "This service does not diagnose or prescribe treatment.",
    results: "Search results",
    noResults: "No matching knowledge was found.",
    tryAnother: "Try another name, spelling, symptom, or ingredient.",
    relatedUses: "Proposed uses",
    botanical: "Botanical name",
    preview: "Unvalidated pilot preview",
    unavailable: "Knowledge search is temporarily unavailable.",
    browse: "Browse by topic",
    browseNav: "Browse",
    discoverNav: "Discover",
    safetyNav: "Safety",
    trustNav: "Trust",
    feedbackNav: "Feedback",
    signIn: "Practitioner sign in",
    explore: "Explore knowledge",
    pilot: "Pilot data not publicly approved",
    symptoms: "Symptoms",
    remedies: "Remedies",
    safetyInfo: "Safety information",
    safetyHeading: "Use traditional-medicine information carefully",
    safetyText: "For severe symptoms, emergencies, pregnancy, children, chronic illness, or possible medicine interactions, consult a qualified health professional.",
    footer: "Traditional medicine knowledge, with sources and review history.",
    risk: { low: "Low risk", moderate: "Moderate risk", high: "High risk", unknown: "Risk not assessed" },
  },
  hi: {
    searchLabel: "आयुष ज्ञान खोज",
    heading: "आप क्या समझना चाहते हैं?",
    placeholder: "लक्षण, उपचार, सामग्री या स्थानीय नाम खोजें",
    search: "खोजें",
    note: "यह सेवा रोग-निदान या उपचार निर्धारित नहीं करती है।",
    results: "खोज परिणाम",
    noResults: "कोई संबंधित जानकारी नहीं मिली।",
    tryAnother: "दूसरा नाम, वर्तनी, लक्षण या सामग्री खोजें।",
    relatedUses: "प्रस्तावित उपयोग",
    botanical: "वानस्पतिक नाम",
    preview: "असत्यापित पायलट पूर्वावलोकन",
    unavailable: "ज्ञान खोज अभी उपलब्ध नहीं है।",
    browse: "विषय के अनुसार देखें",
    browseNav: "विषय",
    discoverNav: "मार्गदर्शित खोज",
    safetyNav: "सुरक्षा",
    trustNav: "विश्वास",
    feedbackNav: "प्रतिक्रिया",
    signIn: "चिकित्सक प्रवेश",
    explore: "ज्ञान देखें",
    pilot: "पायलट डेटा सार्वजनिक रूप से स्वीकृत नहीं है",
    symptoms: "लक्षण",
    remedies: "उपचार",
    safetyInfo: "सुरक्षा जानकारी",
    safetyHeading: "पारंपरिक चिकित्सा जानकारी का सावधानी से उपयोग करें",
    safetyText: "गंभीर लक्षण, आपातस्थिति, गर्भावस्था, बच्चों, पुरानी बीमारी या दवाओं के साथ संभावित प्रभाव की स्थिति में योग्य स्वास्थ्य विशेषज्ञ से सलाह लें।",
    footer: "स्रोतों और समीक्षा इतिहास सहित पारंपरिक चिकित्सा ज्ञान।",
    risk: { low: "कम जोखिम", moderate: "मध्यम जोखिम", high: "उच्च जोखिम", unknown: "जोखिम का आकलन नहीं" },
  },
} as const;

type PageProps = { searchParams: Promise<{ q?: string; lang?: string }> };

function SearchResults({ results, query, language, failed }: { results: KnowledgeSearchResult[]; query: string; language: SearchLanguage; failed: boolean }) {
  const text = copy[language];
  return (
    <section className="results-section" aria-labelledby="results-heading">
      <div className="results-heading-row">
        <div>
          <p className="eyebrow">{results.length} {text.results.toLowerCase()}</p>
          <h2 id="results-heading">{text.results} <span>“{query}”</span></h2>
        </div>
        {results.some((result) => result.preview) && <span className="preview-label"><FlaskConical size={15} />{text.preview}</span>}
      </div>
      {failed ? (
        <div className="empty-state"><AlertTriangle size={24} /><p>{text.unavailable}</p></div>
      ) : results.length === 0 ? (
        <div className="empty-state"><Search size={24} /><div><p>{text.noResults}</p><span>{text.tryAnother}</span></div></div>
      ) : (
        <div className="result-list">
          {results.map((result) => (
            <article className="result-item" key={result.id}>
              <div className="result-main">
                <div className="result-title-row">
                  <h3>{result.label}</h3>
                  <span className={`risk-badge risk-${result.riskLevel}`}>{text.risk[result.riskLevel]}</span>
                </div>
                <p className="result-system">{result.system}</p>
                {result.botanicalName && <p className="botanical"><span>{text.botanical}:</span> <i>{result.botanicalName}</i></p>}
                {result.relatedUses.length > 0 && (
                  <div className="use-row"><span>{text.relatedUses}</span>{result.relatedUses.map((use) => <small key={use}>{use}</small>)}</div>
                )}
              </div>
              <Link className="result-action" href={`/remedies/${result.id}?lang=${language}`} title="Open remedy details" aria-label={`Open ${result.label}`}>
                <ArrowUpRight size={19} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = normalizeSearchInput(params.q ?? "");
  const language: SearchLanguage = params.lang === "hi" ? "hi" : "en";
  const text = copy[language];
  let results: KnowledgeSearchResult[] = [];
  let searchFailed = false;
  if (query.length >= 2) {
    try { results = await searchKnowledge(query, language); } catch { searchFailed = true; }
  }
  const otherLanguage = language === "en" ? "hi" : "en";

  return (
    <main lang={language}>
      <header className="topbar">
        <Link className="brand" href={`/?lang=${language}`} aria-label={`${appConfig.name} home`}>
          <span className="brand-mark">T</span><span>{appConfig.name}</span>
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#browse">{text.browseNav}</a><Link href={`/discover?lang=${language}`}>{text.discoverNav}</Link><a href="#safety">{text.safetyNav}</a><Link href="/trust">{text.trustNav}</Link><Link href="/feedback">{text.feedbackNav}</Link>
          <Link className="language-button" href={{ pathname: "/", query: { ...(query ? { q: query } : {}), lang: otherLanguage } }} title="Choose language">
            <Languages size={18} aria-hidden="true" /><span>{language === "en" ? "हिन्दी" : "English"}</span>
          </Link>
          <Link className="practitioner-button" href="/practitioner/login">{text.signIn}</Link>
        </nav>
      </header>

      <section className={`search-band ${query ? "search-band-compact" : ""}`} aria-labelledby="search-heading">
        <div className="search-content">
          <p className="system-label">{text.searchLabel}</p><h1 id="search-heading">{text.heading}</h1>
          <form className="search-form" role="search" action="/" method="get">
            <Search size={22} aria-hidden="true" />
            <label className="sr-only" htmlFor="knowledge-search">{text.placeholder}</label>
            <input id="knowledge-search" name="q" defaultValue={query} placeholder={text.placeholder} />
            <select name="lang" defaultValue={language} aria-label="Search language">
              <option value="en">English</option><option value="hi">हिन्दी</option>
            </select>
            <button type="submit">{text.search}</button>
          </form>
          <p className="search-note">{text.note}</p>
        </div>
      </section>

      {query.length >= 2 && <SearchResults results={results} query={query} language={language} failed={searchFailed} />}

      <section className="browse-section" id="browse" aria-labelledby="browse-heading">
        <div className="section-heading"><div><p className="eyebrow">{text.explore}</p><h2 id="browse-heading">{text.browse}</h2></div><span className="pilot-badge">{text.pilot}</span></div>
        <div className="topic-grid">
          <Link className="topic-item" href={`/?q=cough&lang=${language}`}><span className="topic-icon"><Stethoscope size={21} /></span><span>{text.symptoms}</span><span>›</span></Link>
          <Link className="topic-item" href={`/?q=ginger&lang=${language}`}><span className="topic-icon"><BookOpenText size={21} /></span><span>{text.remedies}</span><span>›</span></Link>
          <a className="topic-item" href="#safety"><span className="topic-icon"><ShieldCheck size={21} /></span><span>{text.safetyInfo}</span><span>›</span></a>
        </div>
      </section>

      <section className="safety-band" id="safety"><ShieldCheck size={25} aria-hidden="true" /><div><h2>{text.safetyHeading}</h2><p>{text.safetyText}</p></div></section>
      <footer><span>{appConfig.name}</span><span>{text.footer}</span></footer>
    </main>
  );
}

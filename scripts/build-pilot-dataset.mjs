import { mkdir, writeFile } from "node:fs/promises";

const OUT = new URL("../data/pilot/", import.meta.url);
const generatedAt = "2026-08-26T00:00:00Z";

const systems = [
  { id: "ayurveda", en: "Ayurveda", hi: "आयुर्वेद" },
  { id: "naturopathy", en: "Naturopathy", hi: "प्राकृतिक चिकित्सा" },
  { id: "home-remedy", en: "Home remedy tradition", hi: "घरेलू उपचार परंपरा" },
];

const populations = [
  { id: "adults", en: "Adults", hi: "वयस्क" },
  { id: "adult-general", en: "General adult population", hi: "सामान्य वयस्क जनसंख्या" },
  { id: "adult-supervised", en: "Adults under practitioner supervision", hi: "चिकित्सक की देखरेख में वयस्क" },
];

const targets = [
  ["nausea", "Nausea", "मतली", "symptom"],
  ["throat-discomfort", "Throat discomfort", "गले में परेशानी", "symptom"],
  ["cough", "Cough", "खांसी", "symptom"],
  ["nasal-congestion", "Nasal congestion", "नाक बंद होना", "symptom"],
  ["indigestion", "Indigestion", "अपच", "symptom"],
  ["bloating", "Bloating", "पेट फूलना", "symptom"],
  ["digestive-discomfort", "Digestive discomfort", "पाचन संबंधी परेशानी", "symptom"],
  ["minor-skin-irritation", "Minor skin irritation", "त्वचा की हल्की जलन", "symptom"],
  ["skin-hygiene-concern", "Skin hygiene concern", "त्वचा की स्वच्छता संबंधी चिंता", "health-condition"],
  ["reduced-appetite", "Reduced appetite", "भूख कम लगना", "symptom"],
  ["constipation", "Constipation", "कब्ज", "health-condition"],
  ["stress", "Stress", "तनाव", "symptom"],
  ["fatigue", "Fatigue", "थकान", "symptom"],
  ["oral-discomfort", "Oral discomfort", "मुंह में परेशानी", "symptom"],
  ["common-cold-discomfort", "Common-cold discomfort", "सर्दी की परेशानी", "symptom"],
  ["dry-skin", "Dry skin", "शुष्क त्वचा", "symptom"],
  ["muscle-discomfort", "Muscle discomfort", "मांसपेशियों में परेशानी", "symptom"],
  ["joint-discomfort", "Joint discomfort", "जोड़ों में परेशानी", "symptom"],
].map(([id, en, hi, type]) => ({ id, en, hi, type }));

const remedies = [
  ["remedy-0001", "Ginger infusion", "अदरक का काढ़ा", ["adrak tea", "ginger tea"], "Zingiber officinale", "rhizome", "ayurveda", "oral", "infusion", "moderate", ["pregnancy-caution", "medicine-interaction-review"]],
  ["remedy-0002", "Turmeric milk", "हल्दी वाला दूध", ["haldi doodh", "golden milk"], "Curcuma longa", "rhizome", "home-remedy", "oral", "warm-mixture", "moderate", ["allergy-caution", "medicine-interaction-review"]],
  ["remedy-0003", "Tulsi leaf infusion", "तुलसी पत्ती का काढ़ा", ["holy basil tea", "tulasi infusion"], "Ocimum tenuiflorum", "leaf", "ayurveda", "oral", "infusion", "moderate", ["pregnancy-caution", "medicine-interaction-review"]],
  ["remedy-0004", "Ajwain water", "अजवाइन का पानी", ["carom water", "ajowan water"], "Trachyspermum ammi", "fruit", "home-remedy", "oral", "infusion", "moderate", ["pregnancy-caution", "dose-review-required"]],
  ["remedy-0005", "Fennel seed infusion", "सौंफ का पानी", ["saunf water", "fennel tea"], "Foeniculum vulgare", "fruit", "home-remedy", "oral", "infusion", "low", ["allergy-caution"]],
  ["remedy-0006", "Cumin water", "जीरे का पानी", ["jeera water"], "Cuminum cyminum", "fruit", "home-remedy", "oral", "infusion", "low", ["allergy-caution"]],
  ["remedy-0007", "Coriander seed water", "धनिया का पानी", ["dhania water"], "Coriandrum sativum", "fruit", "home-remedy", "oral", "infusion", "low", ["allergy-caution"]],
  ["remedy-0008", "Mint leaf infusion", "पुदीना पत्ती का काढ़ा", ["pudina tea", "mint tea"], "Mentha spicata", "leaf", "home-remedy", "oral", "infusion", "moderate", ["reflux-caution", "child-caution"]],
  ["remedy-0009", "Aloe vera gel", "घृतकुमारी जेल", ["aloe gel", "gheekumari gel"], "Aloe vera", "leaf-gel", "naturopathy", "topical", "fresh-gel", "moderate", ["external-use-only", "patch-test"]],
  ["remedy-0010", "Neem leaf wash", "नीम पत्ती का धोवन", ["neem rinse"], "Azadirachta indica", "leaf", "ayurveda", "topical", "wash", "high", ["external-use-only", "pregnancy-caution", "child-caution"]],
  ["remedy-0011", "Amla preparation", "आंवला तैयारी", ["amalaki preparation", "Indian gooseberry preparation"], "Phyllanthus emblica", "fruit", "ayurveda", "oral", "food-preparation", "moderate", ["medicine-interaction-review", "allergy-caution"]],
  ["remedy-0012", "Triphala preparation", "त्रिफला तैयारी", ["triphala"], null, "mixed-fruit", "ayurveda", "oral", "powder-or-infusion", "high", ["practitioner-supervision", "pregnancy-caution", "medicine-interaction-review"]],
  ["remedy-0013", "Ashwagandha preparation", "अश्वगंधा तैयारी", ["Indian ginseng preparation"], "Withania somnifera", "root", "ayurveda", "oral", "powder-or-extract", "high", ["practitioner-supervision", "pregnancy-caution", "thyroid-caution", "sedative-interaction"]],
  ["remedy-0014", "Liquorice root infusion", "मुलेठी का काढ़ा", ["mulethi tea", "licorice root tea"], "Glycyrrhiza glabra", "root", "ayurveda", "oral", "infusion", "high", ["hypertension-caution", "pregnancy-caution", "medicine-interaction-review"]],
  ["remedy-0015", "Cinnamon infusion", "दालचीनी का काढ़ा", ["dalchini tea"], "Cinnamomum verum", "bark", "home-remedy", "oral", "infusion", "moderate", ["medicine-interaction-review", "liver-caution"]],
  ["remedy-0016", "Clove preparation", "लौंग की तैयारी", ["laung preparation"], "Syzygium aromaticum", "flower-bud", "home-remedy", "oral", "whole-or-infusion", "high", ["oral-burn-caution", "medicine-interaction-review", "child-caution"]],
  ["remedy-0017", "Cardamom infusion", "इलायची का काढ़ा", ["elaichi tea"], "Elettaria cardamomum", "fruit", "home-remedy", "oral", "infusion", "low", ["allergy-caution"]],
  ["remedy-0018", "Fenugreek seed preparation", "मेथी दाना तैयारी", ["methi seed preparation"], "Trigonella foenum-graecum", "seed", "ayurveda", "oral", "soaked-or-cooked", "high", ["pregnancy-caution", "medicine-interaction-review", "allergy-caution"]],
  ["remedy-0019", "Garlic preparation", "लहसुन की तैयारी", ["lahsun preparation"], "Allium sativum", "bulb", "home-remedy", "oral", "food-preparation", "high", ["bleeding-risk", "surgery-caution", "medicine-interaction-review"]],
  ["remedy-0020", "Honey in warm water", "गुनगुने पानी में शहद", ["warm honey water"], null, "food-product", "home-remedy", "oral", "warm-mixture", "high", ["infant-contraindication", "diabetes-caution", "allergy-caution"]],
  ["remedy-0021", "Lemon water", "नींबू पानी", ["nimbu pani"], "Citrus limon", "fruit-juice", "home-remedy", "oral", "dilution", "low", ["dental-erosion-caution", "reflux-caution"]],
  ["remedy-0022", "Warm saline gargle", "गुनगुने नमक पानी के गरारे", ["salt-water gargle"], null, "mineral-solution", "home-remedy", "gargle", "dissolution", "moderate", ["do-not-swallow", "child-caution", "sodium-caution"]],
  ["remedy-0023", "Coconut oil application", "नारियल तेल का प्रयोग", ["coconut oil rub"], "Cocos nucifera", "fruit-oil", "home-remedy", "topical", "direct-application", "low", ["patch-test", "slip-hazard"]],
  ["remedy-0024", "Sesame oil application", "तिल तेल का प्रयोग", ["til oil massage", "sesame oil massage"], "Sesamum indicum", "seed-oil", "ayurveda", "massage", "direct-application", "moderate", ["allergy-caution", "patch-test"]],
  ["remedy-0025", "Psyllium husk in water", "इसबगोल पानी में", ["isabgol water", "ispaghula husk"], "Plantago ovata", "seed-husk", "ayurveda", "oral", "dispersion", "high", ["adequate-water-required", "obstruction-caution", "medicine-separation"]],
].map(([id, en, hi, altNames, botanicalName, plantPart, systemId, route, preparation, riskLevel, safetyCodes]) => ({
  id, labels: { en, hi }, altNames, botanicalName, plantPart, systemId, route, preparation, riskLevel, safetyCodes,
  validationStatus: "unvalidated",
}));

const claimSeeds = [
  [1,"remedy-0001","nausea"],[2,"remedy-0001","throat-discomfort"],[3,"remedy-0001","indigestion"],
  [4,"remedy-0002","throat-discomfort"],[5,"remedy-0002","joint-discomfort"],
  [6,"remedy-0003","cough"],[7,"remedy-0003","nasal-congestion"],[8,"remedy-0003","throat-discomfort"],
  [9,"remedy-0004","indigestion"],[10,"remedy-0004","bloating"],
  [11,"remedy-0005","bloating"],[12,"remedy-0005","digestive-discomfort"],
  [13,"remedy-0006","digestive-discomfort"],[14,"remedy-0006","bloating"],
  [15,"remedy-0007","digestive-discomfort"],
  [16,"remedy-0008","indigestion"],[17,"remedy-0008","nausea"],
  [18,"remedy-0009","minor-skin-irritation"],[19,"remedy-0009","dry-skin"],
  [20,"remedy-0010","skin-hygiene-concern"],
  [21,"remedy-0011","reduced-appetite"],[22,"remedy-0011","fatigue"],
  [23,"remedy-0012","constipation"],[24,"remedy-0012","digestive-discomfort"],
  [25,"remedy-0013","stress"],[26,"remedy-0013","fatigue"],
  [27,"remedy-0014","throat-discomfort"],[28,"remedy-0014","cough"],
  [29,"remedy-0015","digestive-discomfort"],
  [30,"remedy-0016","oral-discomfort"],
  [31,"remedy-0017","digestive-discomfort"],
  [32,"remedy-0018","digestive-discomfort"],
  [33,"remedy-0019","common-cold-discomfort"],
  [34,"remedy-0020","cough"],[35,"remedy-0020","throat-discomfort"],
  [36,"remedy-0021","nausea"],[37,"remedy-0021","throat-discomfort"],
  [38,"remedy-0022","throat-discomfort"],
  [39,"remedy-0023","dry-skin"],
  [40,"remedy-0024","muscle-discomfort"],
];

const remedyById = new Map(remedies.map((item) => [item.id, item]));
const targetById = new Map(targets.map((item) => [item.id, item]));
const workflowStates = ["submitted", "under-review", "changes-requested"];

const claims = claimSeeds.map(([number, remedyId, targetId]) => {
  const remedy = remedyById.get(remedyId);
  const target = targetById.get(targetId);
  const id = `claim-${String(number).padStart(6, "0")}`;
  const requiresSupervision = remedy.safetyCodes.includes("practitioner-supervision") || remedy.riskLevel === "high";
  return {
    id,
    labels: {
      en: `Proposed traditional use of ${remedy.labels.en} for ${target.en.toLowerCase()}`,
      hi: `${target.hi} के लिए ${remedy.labels.hi} का प्रस्तावित पारंपरिक उपयोग`,
    },
    remedyId,
    targetId,
    systemId: remedy.systemId,
    intendedOutcome: targetId === "skin-hygiene-concern" ? "support-hygiene" : "relief",
    populationId: requiresSupervision ? "adult-supervised" : "adult-general",
    route: remedy.route,
    evidenceIds: [`evidence-${String(number).padStart(6, "0")}`],
    safetyStatementIds: remedy.safetyCodes.map((_, index) => `${id}-safety-${index + 1}`),
    riskLevel: remedy.riskLevel,
    requiresPractitionerSupervision: requiresSupervision,
    publicationStatus: workflowStates[(number - 1) % workflowStates.length],
    validationStatus: "unvalidated",
    contributionId: `contribution-${String(number).padStart(6, "0")}`,
    publicDisplayAllowed: false,
  };
});

const evidence = claims.map((claim, index) => ({
  id: claim.evidenceIds[0],
  type: index % 4 === 0 ? "traditional-use-placeholder" : "source-required",
  citation: "PLACEHOLDER: authoritative source and exact passage must be supplied during validation.",
  assessment: "Not assessed",
  validationStatus: "unvalidated",
  supportsClaimId: claim.id,
}));

const safetyStatements = claims.flatMap((claim) => {
  const remedy = remedyById.get(claim.remedyId);
  return remedy.safetyCodes.map((code, index) => ({
    id: claim.safetyStatementIds[index],
    claimId: claim.id,
    code,
    type: code.includes("contraindication") ? "contraindication" : code.includes("interaction") || code.includes("separation") ? "interaction" : code.includes("supervision") ? "supervision-requirement" : "caution",
    text: `PLACEHOLDER SAFETY FLAG: ${code.replaceAll("-", " ")}. Requires practitioner and safety review.`,
    validationStatus: "unvalidated",
  }));
});

const contributions = claims.map((claim, index) => ({
  id: claim.contributionId,
  proposedEntityId: claim.id,
  contributorId: `pilot-practitioner-${String((index % 3) + 1).padStart(2, "0")}`,
  submittedAt: `2026-08-${String(1 + (index % 20)).padStart(2, "0")}T09:00:00Z`,
  workflowStatus: claim.publicationStatus,
  datasetPurpose: "application-development-only",
}));

const dataset = {
  metadata: {
    id: "tint-pilot-2026-08",
    title: "TINT unvalidated pilot dataset",
    version: "0.1.0",
    generatedAt,
    validationStatus: "unvalidated",
    publicUseAllowed: false,
    disclaimer: "Synthetic development fixture. No health-use claim is approved medical guidance.",
  },
  systems,
  populations,
  targets,
  remedies,
  claims,
  evidence,
  safetyStatements,
  practitioners: [1, 2, 3].map((number) => ({
    id: `pilot-practitioner-${String(number).padStart(2, "0")}`,
    displayName: `Pilot Practitioner ${number}`,
    fictional: true,
    verificationStatus: number === 1 ? "pending" : "development-fixture",
  })),
  contributions,
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertUnique(items, group) {
  const ids = items.map(({ id }) => id);
  assert(new Set(ids).size === ids.length, `${group} contains duplicate identifiers`);
}

function validate() {
  assert(remedies.length === 25, "Pilot must contain 25 remedies");
  assert(claims.length === 40, "Pilot must contain 40 claims");
  [systems, populations, targets, remedies, claims, evidence, safetyStatements, contributions].forEach((items, index) => assertUnique(items, `group-${index}`));
  for (const remedy of remedies) {
    assert(remedy.labels.en && remedy.labels.hi, `${remedy.id} lacks bilingual labels`);
    assert(systems.some(({ id }) => id === remedy.systemId), `${remedy.id} has an unknown system`);
  }
  for (const claim of claims) {
    assert(remedyById.has(claim.remedyId), `${claim.id} has an unknown remedy`);
    assert(targetById.has(claim.targetId), `${claim.id} has an unknown target`);
    assert(claim.evidenceIds.length > 0 && claim.safetyStatementIds.length > 0, `${claim.id} lacks evidence or safety data`);
    assert(claim.publicationStatus !== "published" && !claim.publicDisplayAllowed, `${claim.id} must not be public`);
  }
}

const esc = (value) => value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n");
const lit = (value, lang) => `"${esc(value)}"${lang ? `@${lang}` : ""}`;

function asTurtle() {
  const lines = [
    "@prefix tint: <https://w3id.org/tint/ontology/> .",
    "@prefix data: <https://w3id.org/tint/data/pilot/> .",
    "@prefix dcterms: <http://purl.org/dc/terms/> .",
    "@prefix prov: <http://www.w3.org/ns/prov#> .",
    "@prefix skos: <http://www.w3.org/2004/02/skos/core#> .",
    "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .",
    "",
    "# UNVALIDATED DEVELOPMENT DATA. NEVER LOAD INTO THE PUBLIC GRAPH.",
    "",
  ];
  for (const target of targets) {
    const type = target.type === "health-condition" ? "HealthCondition" : target.type === "symptom" ? "Symptom" : "IntendedOutcome";
    lines.push(`data:${target.id} a tint:${type} ; skos:prefLabel ${lit(target.en, "en")}, ${lit(target.hi, "hi")} .`, "");
  }
  for (const remedy of remedies) {
    const ontologySystem = remedy.systemId === "home-remedy" ? "homeRemedyTradition" : remedy.systemId;
    const descriptions = [
      `data:${remedy.id} a tint:Remedy ;`,
      `    skos:prefLabel ${lit(remedy.labels.en, "en")}, ${lit(remedy.labels.hi, "hi")} ;`,
      ...remedy.altNames.map((name) => `    skos:altLabel ${lit(name, "en")} ;`),
      ...(remedy.botanicalName ? [`    tint:botanicalName ${lit(remedy.botanicalName)} ;`] : []),
      `    tint:belongsToSystem tint:${ontologySystem} ;`,
      `    tint:riskLevel ${lit(remedy.riskLevel)} ;`,
      `    tint:validationStatus ${lit("unvalidated")} ;`,
      `    tint:assessmentNote ${lit("Unvalidated pilot record for application development.", "en")} .`,
      "",
    ];
    lines.push(...descriptions);
  }
  for (const claim of claims) {
    const status = claim.publicationStatus === "submitted" ? "statusSubmitted" : claim.publicationStatus === "under-review" ? "statusUnderReview" : "statusChangesRequested";
    const ontologySystem = claim.systemId === "home-remedy" ? "homeRemedyTradition" : claim.systemId;
    lines.push(`data:${claim.id} a tint:HealthUseClaim ;`, `    skos:prefLabel ${lit(claim.labels.en, "en")}, ${lit(claim.labels.hi, "hi")} ;`, `    tint:claimsUseOf data:${claim.remedyId} ;`, `    tint:hasTarget data:${claim.targetId} ;`, `    tint:belongsToSystem tint:${ontologySystem} ;`, `    tint:hasOutcome data:${claim.intendedOutcome} ;`, `    tint:appliesToPopulation data:${claim.populationId} ;`, `    tint:supportedBy data:${claim.evidenceIds[0]} ;`, ...claim.safetyStatementIds.map((id) => `    tint:hasSafetyStatement data:${id} ;`), `    tint:publicationStatus tint:${status} ;`, `    tint:riskLevel ${lit(claim.riskLevel)} ;`, `    tint:assessmentNote ${lit("UNVALIDATED: not permitted for public display.", "en")} .`, "");
  }
  lines.push("data:relief a tint:IntendedOutcome ; skos:prefLabel \"Relief\"@en, \"राहत\"@hi .", "", "data:support-hygiene a tint:IntendedOutcome ; skos:prefLabel \"Support hygiene\"@en, \"स्वच्छता में सहायता\"@hi .", "");
  for (const population of populations) lines.push(`data:${population.id} a tint:PopulationGroup ; skos:prefLabel ${lit(population.en, "en")}, ${lit(population.hi, "hi")} .`, "");
  for (const item of evidence) lines.push(`data:${item.id} a tint:EvidenceItem ;`, `    tint:evidenceType ${lit(item.type)} ;`, `    tint:validationStatus ${lit(item.validationStatus)} ;`, `    tint:sourceCitation ${lit(item.citation)} ;`, `    tint:assessmentNote ${lit(item.assessment, "en")} .`, "");
  for (const item of safetyStatements) lines.push(`data:${item.id} a tint:SafetyStatement ;`, `    tint:safetyCode ${lit(item.code)} ;`, `    tint:validationStatus ${lit(item.validationStatus)} ;`, `    tint:assessmentNote ${lit(item.text, "en")} .`, "");
  for (const item of contributions) lines.push(`data:${item.id} a tint:Contribution ;`, `    tint:proposes data:${item.proposedEntityId} ;`, `    prov:wasAssociatedWith data:${item.contributorId} ;`, `    prov:endedAtTime "${item.submittedAt}"^^xsd:dateTime .`, "");
  return `${lines.join("\n")}\n`;
}

validate();
await mkdir(OUT, { recursive: true });
await writeFile(new URL("pilot-dataset.json", OUT), `${JSON.stringify(dataset, null, 2)}\n`);
await writeFile(new URL("pilot-dataset.ttl", OUT), asTurtle());
await writeFile(new URL("pilot-summary.json", OUT), `${JSON.stringify({
  datasetId: dataset.metadata.id,
  valid: true,
  generatedAt,
  counts: {
    remedies: remedies.length,
    claims: claims.length,
    evidenceItems: evidence.length,
    safetyStatements: safetyStatements.length,
    contributions: contributions.length,
  },
  publishedClaims: claims.filter(({ publicationStatus }) => publicationStatus === "published").length,
}, null, 2)}\n`);

console.log(`Pilot dataset validated: ${remedies.length} remedies, ${claims.length} claims, 0 published claims.`);

const DEFAULT_TIMEOUT_MS = 5_000;
export class RdfStoreError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = "RdfStoreError";
    }
}
function requireAbsoluteIri(value, field) {
    let parsed;
    try {
        parsed = new URL(value);
    }
    catch {
        throw new RdfStoreError(`${field} must be an absolute IRI.`);
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new RdfStoreError(`${field} must use HTTP or HTTPS.`);
    }
    return parsed.toString();
}
export function graphConfig() {
    return {
        core: process.env.RDF_CORE_GRAPH ?? "https://w3id.org/tint/graph/core",
        public: process.env.RDF_PUBLIC_GRAPH ?? "https://w3id.org/tint/graph/published",
        shapes: process.env.RDF_SHAPES_GRAPH ?? "https://w3id.org/tint/graph/shapes",
        submissionPrefix: process.env.RDF_SUBMISSION_GRAPH_PREFIX ?? "https://w3id.org/tint/graph/submissions/",
    };
}
export function assertGraphAccess(graphIri, access) {
    const iri = requireAbsoluteIri(graphIri, "Graph IRI");
    const config = graphConfig();
    const expected = access === "submission" ? config.submissionPrefix : config[access];
    const permitted = access === "submission" ? iri.startsWith(expected) && iri.length > expected.length : iri === expected;
    if (!permitted)
        throw new RdfStoreError(`Graph is not permitted for ${access} access.`);
    return iri;
}
function queryEndpoint() {
    return requireAbsoluteIri(process.env.RDF_QUERY_ENDPOINT ?? "http://localhost:3030/tint/query", "RDF query endpoint");
}
function dataEndpoint() {
    return requireAbsoluteIri(process.env.RDF_DATA_ENDPOINT ?? "http://localhost:3030/tint/data", "RDF data endpoint");
}
function updateEndpoint() {
    return requireAbsoluteIri(process.env.RDF_UPDATE_ENDPOINT ?? "http://localhost:3030/tint/update", "RDF update endpoint");
}
function sparqlString(value) {
    return `"${value
        .replaceAll("\\", "\\\\")
        .replaceAll('"', '\\"')
        .replaceAll("\n", "\\n")
        .replaceAll("\r", "\\r")}"`;
}
function pilotPreviewEnabled() {
    return process.env.NODE_ENV !== "production" && process.env.ENABLE_PILOT_PREVIEW !== "false";
}
function searchGraph() {
    const config = graphConfig();
    if (pilotPreviewEnabled()) {
        return {
            iri: assertGraphAccess(`${config.submissionPrefix}pilot-2026-08`, "submission"),
            preview: true,
        };
    }
    return { iri: assertGraphAccess(config.public, "public"), preview: false };
}
function graphDiscoveryLabel(preview) {
    return preview ? "Pilot preview graph" : "Reviewed public graph";
}
async function withTimeout(url, init) {
    const configured = Number(process.env.RDF_REQUEST_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
    const timeoutMs = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
    try {
        return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : "Unknown connection error";
        throw new RdfStoreError(`Ontology store request failed: ${detail}`);
    }
}
async function selectQuery(query) {
    const response = await withTimeout(queryEndpoint(), {
        method: "POST",
        headers: { Accept: "application/sparql-results+json", "Content-Type": "application/sparql-query" },
        body: query,
    });
    if (!response.ok)
        throw new RdfStoreError("Ontology store rejected the search query.", response.status);
    return (await response.json());
}
export async function writeSubmissionGraph(graphIri, turtle) {
    const graph = assertGraphAccess(graphIri, "submission");
    const url = new URL(dataEndpoint());
    url.searchParams.set("graph", graph);
    const response = await withTimeout(url.toString(), {
        method: "PUT",
        headers: { "Content-Type": "text/turtle; charset=utf-8" },
        body: turtle,
    });
    if (!response.ok)
        throw new RdfStoreError("Ontology store rejected the draft graph.", response.status);
}
export async function promoteSubmissionGraph(graphIri) {
    const source = assertGraphAccess(graphIri, "submission");
    const target = assertGraphAccess(graphConfig().public, "public");
    const update = `PREFIX tint: <https://w3id.org/tint/ontology/>
INSERT { GRAPH <${target}> { ?subject ?predicate ?publishedObject } }
WHERE {
  GRAPH <${source}> { ?subject ?predicate ?object }
  BIND(IF(?predicate = tint:publicationStatus, tint:statusPublished,
    IF(?predicate = tint:validationStatus, "reviewed", ?object)) AS ?publishedObject)
}`;
    const response = await withTimeout(updateEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/sparql-update" },
        body: update,
    });
    if (!response.ok)
        throw new RdfStoreError("Ontology store rejected the publication update.", response.status);
}
export async function validateSubmissionGraph(graphIri) {
    const graph = assertGraphAccess(graphIri, "submission");
    const checks = [
        { code: "CLAIM_REQUIRED", message: "A health-use claim is required.", pattern: "?claim a tint:HealthUseClaim ." },
        { code: "EN_LABEL_REQUIRED", message: "An English preferred label is required.", pattern: "?claim a tint:HealthUseClaim ; skos:prefLabel ?label . FILTER(LANG(?label) = 'en')" },
        { code: "HI_LABEL_REQUIRED", message: "A Hindi preferred label is required.", pattern: "?claim a tint:HealthUseClaim ; skos:prefLabel ?label . FILTER(LANG(?label) = 'hi')" },
        { code: "REMEDY_REQUIRED", message: "The claim must identify a remedy.", pattern: "?claim a tint:HealthUseClaim ; tint:claimsUseOf ?remedy . ?remedy a tint:Remedy ." },
        { code: "TARGET_REQUIRED", message: "The claim must identify a symptom or health condition.", pattern: "?claim a tint:HealthUseClaim ; tint:hasTarget ?target . ?target a ?type . FILTER(?type IN (tint:Symptom, tint:HealthCondition))" },
        { code: "CONTEXT_REQUIRED", message: "Medical system, outcome, and population are required.", pattern: "?claim a tint:HealthUseClaim ; tint:belongsToSystem ?system ; tint:hasOutcome ?outcome ; tint:appliesToPopulation ?population ." },
        { code: "EVIDENCE_REQUIRED", message: "Evidence with a source citation is required.", pattern: "?claim a tint:HealthUseClaim ; tint:supportedBy ?evidence . ?evidence a tint:EvidenceItem ; tint:sourceCitation ?citation . FILTER(STRLEN(STR(?citation)) > 0)" },
        { code: "SAFETY_REQUIRED", message: "A safety statement with an assessment note is required.", pattern: "?claim a tint:HealthUseClaim ; tint:hasSafetyStatement ?safety . ?safety a tint:SafetyStatement ; tint:assessmentNote ?note . FILTER(STRLEN(STR(?note)) > 0)" },
        { code: "STATUS_REQUIRED", message: "Exactly one publication status is required.", pattern: "?claim a tint:HealthUseClaim ; tint:publicationStatus ?status ." },
        { code: "PROVENANCE_REQUIRED", message: "Contributor provenance is required.", pattern: "?contribution a tint:Contribution ; prov:wasAssociatedWith ?agent ; tint:proposes ?claim ." },
    ];
    const results = await Promise.all(checks.map(async (check) => {
        const query = `PREFIX tint: <https://w3id.org/tint/ontology/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX prov: <http://www.w3.org/ns/prov#>
ASK { GRAPH <${graph}> { ${check.pattern} } }`;
        const response = await withTimeout(queryEndpoint(), { method: "POST", headers: { Accept: "application/sparql-results+json", "Content-Type": "application/sparql-query" }, body: query });
        if (!response.ok)
            throw new RdfStoreError("Ontology store rejected validation query.", response.status);
        const result = (await response.json());
        return result.boolean === true ? null : { code: check.code, message: check.message };
    }));
    return results.filter((issue) => issue !== null);
}
export function turtleLiteral(value, language) {
    const literal = sparqlString(value);
    return language ? `${literal}@${language}` : literal;
}
export function normalizeSearchInput(value) {
    return value.normalize("NFKC").trim().replace(/\s+/g, " ").slice(0, 80);
}
export function normalizeEntityId(value) {
    const normalized = value.normalize("NFKC").trim();
    if (!/^remedy-[0-9]{4,12}$/.test(normalized)) {
        throw new RdfStoreError("Invalid remedy identifier.");
    }
    return normalized;
}
export async function searchKnowledge(input, language = "en") {
    const queryText = normalizeSearchInput(input);
    if (queryText.length < 2)
        return [];
    const graph = searchGraph();
    const coreGraph = assertGraphAccess(graphConfig().core, "core");
    const needle = sparqlString(queryText.toLocaleLowerCase(language));
    const languageLiteral = sparqlString(language);
    const sparql = `
PREFIX tint: <https://w3id.org/tint/ontology/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?remedy ?label ?botanical ?risk ?validation ?systemLabel
       (GROUP_CONCAT(DISTINCT ?targetLabel; separator="|||") AS ?targets)
WHERE {
  {
    SELECT DISTINCT ?remedy WHERE {
      GRAPH <${graph.iri}> {
        ?remedy a tint:Remedy ; skos:prefLabel ?searchLabel .
        OPTIONAL { ?remedy skos:altLabel ?alternativeLabel . }
        OPTIONAL { ?remedy tint:botanicalName ?searchBotanical . }
        OPTIONAL {
          ?searchClaim a tint:HealthUseClaim ; tint:claimsUseOf ?remedy ; tint:hasTarget ?searchTarget .
          ?searchTarget skos:prefLabel ?searchTargetLabel .
        }
        FILTER(
          CONTAINS(LCASE(STR(?searchLabel)), ${needle}) ||
          CONTAINS(LCASE(COALESCE(STR(?alternativeLabel), "")), ${needle}) ||
          CONTAINS(LCASE(COALESCE(STR(?searchBotanical), "")), ${needle}) ||
          CONTAINS(LCASE(COALESCE(STR(?searchTargetLabel), "")), ${needle})
        )
      }
    }
  }
  GRAPH <${graph.iri}> {
    ?remedy skos:prefLabel ?label ; tint:belongsToSystem ?system ; tint:riskLevel ?risk .
    FILTER(LANG(?label) = ${languageLiteral})
    OPTIONAL { ?remedy tint:botanicalName ?botanical . }
    OPTIONAL { ?remedy tint:validationStatus ?validation . }
    OPTIONAL {
      ?claim a tint:HealthUseClaim ; tint:claimsUseOf ?remedy ; tint:hasTarget ?target .
      ?target skos:prefLabel ?targetLabel .
      FILTER(LANG(?targetLabel) = ${languageLiteral})
    }
  }
  GRAPH <${coreGraph}> {
    ?system skos:prefLabel ?systemLabel .
    FILTER(LANG(?systemLabel) = ${languageLiteral})
  }
}
GROUP BY ?remedy ?label ?botanical ?risk ?validation ?systemLabel
ORDER BY LCASE(STR(?label))
LIMIT 20`;
    const response = await selectQuery(sparql);
    return (response.results?.bindings ?? []).map((binding) => ({
        id: binding.remedy.value.split("/").at(-1) ?? binding.remedy.value,
        iri: binding.remedy.value,
        label: binding.label.value,
        botanicalName: binding.botanical?.value ?? null,
        system: binding.systemLabel.value,
        riskLevel: ["low", "moderate", "high"].includes(binding.risk.value)
            ? binding.risk.value
            : "unknown",
        relatedUses: binding.targets?.value ? binding.targets.value.split("|||").filter(Boolean) : [],
        validationStatus: binding.validation?.value ?? (graph.preview ? "unvalidated" : "reviewed"),
        preview: graph.preview,
    }));
}
export async function guidedDiscoverySummary(language = "en") {
    const graph = searchGraph();
    const coreGraph = assertGraphAccess(graphConfig().core, "core");
    const languageLiteral = sparqlString(language);
    try {
        const sparql = `
PREFIX tint: <https://w3id.org/tint/ontology/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?group ?label (COUNT(DISTINCT ?claim) AS ?count)
WHERE {
  {
    GRAPH <${graph.iri}> {
      ?claim a tint:HealthUseClaim ; tint:hasTarget ?item .
      ?item skos:prefLabel ?label .
      FILTER(LANG(?label) = ${languageLiteral})
    }
    BIND("symptom" AS ?group)
  }
  UNION
  {
    GRAPH <${graph.iri}> {
      ?claim a tint:HealthUseClaim ; tint:claimsUseOf ?item .
      ?item skos:prefLabel ?label .
      FILTER(LANG(?label) = ${languageLiteral})
    }
    BIND("remedy" AS ?group)
  }
  UNION
  {
    GRAPH <${graph.iri}> {
      ?claim a tint:HealthUseClaim ; tint:belongsToSystem ?item .
    }
    GRAPH <${coreGraph}> {
      ?item skos:prefLabel ?label .
      FILTER(LANG(?label) = ${languageLiteral})
    }
    BIND("system" AS ?group)
  }
  UNION
  {
    GRAPH <${graph.iri}> {
      ?claim a tint:HealthUseClaim ; tint:riskLevel ?item .
      BIND(STR(?item) AS ?label)
    }
    BIND("safety" AS ?group)
  }
}
GROUP BY ?group ?label
ORDER BY ?group DESC(?count) LCASE(STR(?label))
LIMIT 80`;
        const bindings = (await selectQuery(sparql)).results?.bindings ?? [];
        const items = bindings.map((binding) => ({
            group: binding.group.value,
            label: binding.label.value,
            count: Number(binding.count?.value ?? 0),
        }));
        const makeItems = (group) => items
            .filter((item) => item.group === group)
            .slice(0, 8)
            .map((item) => ({
            label: item.label,
            count: item.count,
            href: `/?q=${encodeURIComponent(item.label)}&lang=${language}`,
        }));
        return {
            status: "available",
            graphPreview: graph.preview,
            graphLabel: graphDiscoveryLabel(graph.preview),
            symptoms: makeItems("symptom"),
            remedies: makeItems("remedy"),
            systems: makeItems("system"),
            safetyLevels: makeItems("safety"),
        };
    }
    catch (error) {
        return {
            status: "unavailable",
            graphPreview: graph.preview,
            graphLabel: graphDiscoveryLabel(graph.preview),
            symptoms: [],
            remedies: [],
            systems: [],
            safetyLevels: [],
            message: error instanceof Error ? error.message : "Guided discovery is temporarily unavailable.",
        };
    }
}
export async function getRemedyDetail(entityId, language = "en") {
    const id = normalizeEntityId(entityId);
    const graph = searchGraph();
    const coreGraph = assertGraphAccess(graphConfig().core, "core");
    const idSuffix = sparqlString(`/${id}`);
    const languageLiteral = sparqlString(language);
    const summaryQuery = `
PREFIX tint: <https://w3id.org/tint/ontology/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?remedy ?label ?alternative ?botanical ?risk ?validation ?assessment ?systemLabel WHERE {
  GRAPH <${graph.iri}> {
    ?remedy a tint:Remedy ; skos:prefLabel ?label ; tint:belongsToSystem ?system ; tint:riskLevel ?risk .
    FILTER(STRENDS(STR(?remedy), ${idSuffix}))
    FILTER(LANG(?label) = ${languageLiteral})
    OPTIONAL { ?remedy skos:altLabel ?alternative . }
    OPTIONAL { ?remedy tint:botanicalName ?botanical . }
    OPTIONAL { ?remedy tint:validationStatus ?validation . }
    OPTIONAL { ?remedy tint:assessmentNote ?assessment . FILTER(LANG(?assessment) = "en") }
  }
  GRAPH <${coreGraph}> {
    ?system skos:prefLabel ?systemLabel . FILTER(LANG(?systemLabel) = ${languageLiteral})
  }
}`;
    const summaryBindings = (await selectQuery(summaryQuery)).results?.bindings ?? [];
    if (summaryBindings.length === 0)
        return null;
    const first = summaryBindings[0];
    const claimsQuery = `
PREFIX tint: <https://w3id.org/tint/ontology/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?claim ?claimLabel ?targetLabel ?outcomeLabel ?populationLabel ?claimRisk ?statusLabel
       ?safety ?safetyCode ?safetyNote ?evidence ?evidenceType ?citation ?evidenceAssessment ?evidenceValidation
WHERE {
  GRAPH <${graph.iri}> {
    ?remedy a tint:Remedy . FILTER(STRENDS(STR(?remedy), ${idSuffix}))
    ?claim a tint:HealthUseClaim ; tint:claimsUseOf ?remedy ; skos:prefLabel ?claimLabel ;
           tint:hasTarget ?target ; tint:hasOutcome ?outcome ; tint:appliesToPopulation ?population ;
           tint:publicationStatus ?status ; tint:riskLevel ?claimRisk .
    FILTER(LANG(?claimLabel) = ${languageLiteral})
    ?target skos:prefLabel ?targetLabel . FILTER(LANG(?targetLabel) = ${languageLiteral})
    ?outcome skos:prefLabel ?outcomeLabel . FILTER(LANG(?outcomeLabel) = ${languageLiteral})
    ?population skos:prefLabel ?populationLabel . FILTER(LANG(?populationLabel) = ${languageLiteral})
    OPTIONAL {
      ?claim tint:hasSafetyStatement ?safety .
      ?safety tint:safetyCode ?safetyCode ; tint:assessmentNote ?safetyNote .
      FILTER(LANG(?safetyNote) = "en")
    }
    OPTIONAL {
      ?claim tint:supportedBy ?evidence .
      ?evidence tint:evidenceType ?evidenceType ; tint:sourceCitation ?citation ;
                tint:assessmentNote ?evidenceAssessment ; tint:validationStatus ?evidenceValidation .
      FILTER(LANG(?evidenceAssessment) = "en")
    }
  }
  GRAPH <${coreGraph}> {
    ?status skos:prefLabel ?statusLabel . FILTER(LANG(?statusLabel) = ${languageLiteral})
  }
}
ORDER BY ?claim ?safety ?evidence`;
    const claimBindings = (await selectQuery(claimsQuery)).results?.bindings ?? [];
    const claimMap = new Map();
    for (const binding of claimBindings) {
        const claimIri = binding.claim.value;
        let claim = claimMap.get(claimIri);
        if (!claim) {
            claim = {
                id: claimIri.split("/").at(-1) ?? claimIri,
                iri: claimIri,
                label: binding.claimLabel.value,
                target: binding.targetLabel.value,
                outcome: binding.outcomeLabel.value,
                population: binding.populationLabel.value,
                riskLevel: ["low", "moderate", "high"].includes(binding.claimRisk.value)
                    ? binding.claimRisk.value
                    : "unknown",
                status: binding.statusLabel.value,
                safety: [],
                evidence: [],
            };
            claimMap.set(claimIri, claim);
        }
        if (binding.safety && !claim.safety.some((item) => item.id === binding.safety.value)) {
            claim.safety.push({ id: binding.safety.value, code: binding.safetyCode?.value ?? "safety-review-required", note: binding.safetyNote?.value ?? "Safety review required." });
        }
        if (binding.evidence && !claim.evidence.some((item) => item.id === binding.evidence.value)) {
            claim.evidence.push({
                id: binding.evidence.value,
                type: binding.evidenceType?.value ?? "source-required",
                citation: binding.citation?.value ?? "Source required.",
                assessment: binding.evidenceAssessment?.value ?? "Not assessed",
                validationStatus: binding.evidenceValidation?.value ?? "unvalidated",
            });
        }
    }
    return {
        id,
        iri: first.remedy.value,
        label: first.label.value,
        alternativeNames: [...new Set(summaryBindings.map((binding) => binding.alternative?.value).filter((value) => Boolean(value)))],
        botanicalName: first.botanical?.value ?? null,
        system: first.systemLabel.value,
        riskLevel: ["low", "moderate", "high"].includes(first.risk.value) ? first.risk.value : "unknown",
        validationStatus: first.validation?.value ?? (graph.preview ? "unvalidated" : "reviewed"),
        assessmentNote: first.assessment?.value ?? null,
        preview: graph.preview,
        graphIri: graph.iri,
        claims: [...claimMap.values()],
    };
}
export async function askGraph(graphIri, access) {
    const graph = assertGraphAccess(graphIri, access);
    const query = `ASK { GRAPH <${graph}> { ?subject ?predicate ?object } }`;
    const response = await withTimeout(queryEndpoint(), {
        method: "POST",
        headers: { Accept: "application/sparql-results+json", "Content-Type": "application/sparql-query" },
        body: query,
    });
    if (!response.ok)
        throw new RdfStoreError("Ontology store rejected the health query.", response.status);
    const result = (await response.json());
    return result.boolean === true;
}
export async function ontologyStoreStatus() {
    const startedAt = performance.now();
    try {
        const containsPublishedData = await askGraph(graphConfig().public, "public");
        return {
            status: "available",
            containsPublishedData,
            responseTimeMs: Math.round(performance.now() - startedAt),
        };
    }
    catch (error) {
        return {
            status: "unavailable",
            containsPublishedData: false,
            responseTimeMs: Math.round(performance.now() - startedAt),
            message: error instanceof Error ? error.message : "Ontology store is unavailable.",
        };
    }
}
export async function publicKnowledgeSummary() {
    const startedAt = performance.now();
    try {
        const publicGraph = assertGraphAccess(graphConfig().public, "public");
        const sparql = `
PREFIX tint: <https://w3id.org/tint/ontology/>
SELECT
  (COUNT(DISTINCT ?remedy) AS ?remedies)
  (COUNT(DISTINCT ?claim) AS ?claims)
  (COUNT(DISTINCT ?evidence) AS ?evidenceItems)
WHERE {
  GRAPH <${publicGraph}> {
    OPTIONAL { ?remedy a tint:Remedy . }
    OPTIONAL { ?claim a tint:HealthUseClaim . }
    OPTIONAL {
      ?evidence a tint:EvidenceItem ;
        tint:validationStatus "reviewed" .
    }
  }
}`;
        const bindings = (await selectQuery(sparql)).results?.bindings ?? [];
        const first = bindings[0] ?? {};
        const publishedRemedies = Number(first.remedies?.value ?? 0);
        const publishedClaims = Number(first.claims?.value ?? 0);
        const reviewedEvidenceItems = Number(first.evidenceItems?.value ?? 0);
        return {
            status: "available",
            containsPublishedData: publishedRemedies > 0 || publishedClaims > 0,
            responseTimeMs: Math.round(performance.now() - startedAt),
            publishedRemedies,
            publishedClaims,
            reviewedEvidenceItems,
        };
    }
    catch (error) {
        return {
            status: "unavailable",
            containsPublishedData: false,
            responseTimeMs: Math.round(performance.now() - startedAt),
            publishedRemedies: 0,
            publishedClaims: 0,
            reviewedEvidenceItems: 0,
            message: error instanceof Error ? error.message : "Ontology store is unavailable.",
        };
    }
}

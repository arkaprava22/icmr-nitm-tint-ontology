import { readFile } from "node:fs/promises";

export const defaults = {
  queryEndpoint: "http://localhost:3030/tint/query",
  dataEndpoint: "http://localhost:3030/tint/data",
  coreGraph: "https://w3id.org/tint/graph/core",
  shapesGraph: "https://w3id.org/tint/graph/shapes",
  publicGraph: "https://w3id.org/tint/graph/published",
  submissionPrefix: "https://w3id.org/tint/graph/submissions/",
};

export function storeConfig(environment = process.env) {
  return {
    queryEndpoint: environment.RDF_QUERY_ENDPOINT ?? defaults.queryEndpoint,
    dataEndpoint: environment.RDF_DATA_ENDPOINT ?? defaults.dataEndpoint,
    coreGraph: environment.RDF_CORE_GRAPH ?? defaults.coreGraph,
    shapesGraph: environment.RDF_SHAPES_GRAPH ?? defaults.shapesGraph,
    publicGraph: environment.RDF_PUBLIC_GRAPH ?? defaults.publicGraph,
    submissionPrefix: environment.RDF_SUBMISSION_GRAPH_PREFIX ?? defaults.submissionPrefix,
    timeoutMs: Number(environment.RDF_REQUEST_TIMEOUT_MS ?? 10_000),
  };
}

export function pilotGraph(config = storeConfig()) {
  return `${config.submissionPrefix}pilot-2026-08`;
}

export function assertLoadGraph(graphIri, config = storeConfig()) {
  const allowed = [config.coreGraph, config.shapesGraph];
  const isSubmission = graphIri.startsWith(config.submissionPrefix) && graphIri.length > config.submissionPrefix.length;
  if (!allowed.includes(graphIri) && !isSubmission) {
    throw new Error(`Refusing to load protected or unknown graph: ${graphIri}`);
  }
  if (graphIri === config.publicGraph) throw new Error("Development loaders cannot write the public graph.");
  return graphIri;
}

async function request(url, init, timeoutMs) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Ontology store returned ${response.status}: ${responseText.slice(0, 300)}`);
  }
  return response;
}

export async function putTurtleFile(path, graphIri, config = storeConfig()) {
  assertLoadGraph(graphIri, config);
  const body = await readFile(path, "utf8");
  const url = new URL(config.dataEndpoint);
  url.searchParams.set("graph", graphIri);
  await request(url, { method: "PUT", headers: { "Content-Type": "text/turtle; charset=utf-8" }, body }, config.timeoutMs);
}

export async function sparqlQuery(query, config = storeConfig()) {
  const response = await request(config.queryEndpoint, {
    method: "POST",
    headers: { Accept: "application/sparql-results+json", "Content-Type": "application/sparql-query" },
    body: query,
  }, config.timeoutMs);
  return response.json();
}

export async function countGraph(graphIri, config = storeConfig()) {
  const result = await sparqlQuery(`SELECT (COUNT(*) AS ?count) WHERE { GRAPH <${graphIri}> { ?s ?p ?o } }`, config);
  return Number(result.results.bindings[0]?.count?.value ?? 0);
}

export async function ping(config = storeConfig()) {
  const result = await sparqlQuery("ASK { ?s ?p ?o }", config);
  return typeof result.boolean === "boolean";
}

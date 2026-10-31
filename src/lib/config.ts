export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "TINT",
  publicGraph: process.env.RDF_PUBLIC_GRAPH ?? "https://w3id.org/tint/graph/published",
  coreGraph: process.env.RDF_CORE_GRAPH ?? "https://w3id.org/tint/graph/core",
  shapesGraph: process.env.RDF_SHAPES_GRAPH ?? "https://w3id.org/tint/graph/shapes",
  submissionGraphPrefix:
    process.env.RDF_SUBMISSION_GRAPH_PREFIX ?? "https://w3id.org/tint/graph/submissions/",
  pilotPreviewEnabled:
    process.env.NODE_ENV !== "production" && process.env.ENABLE_PILOT_PREVIEW !== "false",
} as const;

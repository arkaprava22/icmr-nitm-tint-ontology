# Phase 2, Step 2: Ontology Store Integration

## Runtime

Apache Jena Fuseki 6.2.0 runs locally as a persistent TDB2 store. On Windows, the
official Java distribution is downloaded and checksum verified inside `.runtime`.
Docker Compose is also provided for CI and hosts with a Linux container engine.
Both bind to `127.0.0.1:3030`, keeping the development update endpoint off the
external network. Production authentication, TLS, backups, and graph-level
authorization must be configured at the infrastructure boundary before deployment.

## Graph layout

| Graph | Purpose | Development loader access |
|---|---|---|
| `https://w3id.org/tint/graph/core` | Ontology vocabulary | Write |
| `https://w3id.org/tint/graph/shapes` | SHACL rules | Write |
| `https://w3id.org/tint/graph/submissions/pilot-2026-08` | Unvalidated pilot records | Write |
| `https://w3id.org/tint/graph/published` | Approved public knowledge | Blocked |

The loader refuses unknown graphs and the public graph. Verification also fails
if pilot loading results in any triples appearing in the public graph.

## Commands

```powershell
npm run ontology:setup
npm run ontology:start
npm run ontology:health
npm run ontology:load
npm run ontology:verify
```

On a Docker-capable host, `npm run ontology:start:docker` provides the equivalent
containerized service.

`npm run ontology:load` replaces the three development graph contents, making it
repeatable. It never writes the published graph.

## Application integration

The server-only RDF client validates graph identifiers, applies request timeouts,
uses uncached requests, and returns controlled errors. No endpoint accepts raw
SPARQL from a browser. `/api/ontology/health` reports availability, while the
general `/api/health` response becomes degraded if Fuseki is unavailable.

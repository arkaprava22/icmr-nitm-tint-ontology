import { fileURLToPath } from "node:url";
import {
  countGraph,
  pilotGraph,
  ping,
  putTurtleFile,
  storeConfig,
} from "./lib/ontology-store.mjs";

const command = process.argv[2] ?? "verify";
const config = storeConfig();
const projectFile = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));

async function health() {
  await ping(config);
  console.log(`Ontology store available at ${config.queryEndpoint}`);
}

async function load() {
  await putTurtleFile(projectFile("ontology/tint-core.ttl"), config.coreGraph, config);
  await putTurtleFile(projectFile("ontology/shapes/tint-core.shacl.ttl"), config.shapesGraph, config);
  await putTurtleFile(projectFile("data/pilot/pilot-dataset.ttl"), pilotGraph(config), config);
  console.log("Loaded core ontology, validation shapes, and pilot submission data.");
  await verify();
}

async function verify() {
  const counts = {
    core: await countGraph(config.coreGraph, config),
    shapes: await countGraph(config.shapesGraph, config),
    pilotSubmission: await countGraph(pilotGraph(config), config),
    published: await countGraph(config.publicGraph, config),
  };
  if (counts.core === 0 || counts.shapes === 0 || counts.pilotSubmission === 0) {
    throw new Error(`Required ontology graphs are empty: ${JSON.stringify(counts)}`);
  }
  if (counts.published !== 0) {
    throw new Error(`Pilot safety check failed: published graph contains ${counts.published} triples.`);
  }
  console.log(JSON.stringify({ valid: true, graphs: counts }, null, 2));
}

const commands = { health, load, verify };
if (!(command in commands)) throw new Error(`Unknown command: ${command}`);
await commands[command]();

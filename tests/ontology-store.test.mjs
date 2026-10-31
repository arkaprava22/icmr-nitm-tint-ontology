import test from "node:test";
import assert from "node:assert/strict";
import { assertLoadGraph, defaults, pilotGraph, storeConfig } from "../scripts/lib/ontology-store.mjs";

test("uses stable default graph identifiers", () => {
  const config = storeConfig({});
  assert.equal(config.publicGraph, defaults.publicGraph);
  assert.equal(pilotGraph(config), `${defaults.submissionPrefix}pilot-2026-08`);
});

test("allows core, shapes, and submission graph loads", () => {
  const config = storeConfig({});
  assert.equal(assertLoadGraph(config.coreGraph, config), config.coreGraph);
  assert.equal(assertLoadGraph(config.shapesGraph, config), config.shapesGraph);
  assert.equal(assertLoadGraph(pilotGraph(config), config), pilotGraph(config));
});

test("blocks writes to the published graph", () => {
  const config = storeConfig({});
  assert.throws(() => assertLoadGraph(config.publicGraph, config), /Refusing to load/);
});

test("blocks submission prefix without a graph identifier", () => {
  const config = storeConfig({});
  assert.throws(() => assertLoadGraph(config.submissionPrefix, config), /Refusing to load/);
});

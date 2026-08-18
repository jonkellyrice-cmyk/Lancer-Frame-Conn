#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const MUTATION_CARRIER_ROUTER_SCHEMA_VERSION = 1;

export const MUTATION_CARRIERS = Object.freeze({
  filepatcher: Object.freeze({
    id: "filepatcher",
    workflow: "GitHub FilePatcher",
    executor: "dev_scripts/github-filepatcher.mjs",
    config: "dev_scripts/github-filepatcher.json"
  }),
  path_mover: Object.freeze({
    id: "path_mover",
    workflow: "Path Mover",
    executor: "dev_scripts/path-mover.mjs",
    config: "dev_scripts/path-mover.json"
  }),
  domain_decomposer: Object.freeze({
    id: "domain_decomposer",
    workflow: "Domain Decomposer",
    executor: "dev_scripts/domain-decomposer-executor.mjs",
    config: "dev_scripts/domain-decomposer-plan.json"
  })
});

const CARRIER_ALIASES = new Map([
  ["filepatcher", "filepatcher"],
  ["file_patcher", "filepatcher"],
  ["patch", "filepatcher"],
  ["path-mover", "path_mover"],
  ["path_mover", "path_mover"],
  ["relocation", "path_mover"],
  ["move", "path_mover"],
  ["domain-decomposer", "domain_decomposer"],
  ["domain_decomposer", "domain_decomposer"],
  ["decomposer", "domain_decomposer"],
  ["decomposition", "domain_decomposer"]
]);

function normalizeCarrier(value) {
  const key = String(value ?? "").trim().toLowerCase();
  return key ? (CARRIER_ALIASES.get(key) ?? null) : null;
}

function requestKind(value) {
  return String(value ?? "").trim().toLowerCase().replaceAll("-", "_");
}

function nonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function detectStructuralSignatures(request) {
  const matches = [];
  const reasons = [];
  const kind = requestKind(request?.request_kind ?? request?.kind);

  const filepatcher =
    Array.isArray(request?.operations) ||
    Boolean(request?.authoring_intent && typeof request.authoring_intent === "object");
  if (filepatcher) {
    matches.push("filepatcher");
    reasons.push(Array.isArray(request?.operations) ? "operations_array" : "authoring_intent");
  }

  const pathMover =
    Array.isArray(request?.moves) ||
    kind === "relocation" ||
    kind === "path_move" ||
    kind === "path_mover";
  if (pathMover) {
    matches.push("path_mover");
    reasons.push(Array.isArray(request?.moves) ? "moves_array" : `request_kind:${kind}`);
  }

  const domainDecomposer =
    Array.isArray(request?.candidates) ||
    Boolean(request?.decomposition_plan) ||
    kind === "decomposition" ||
    kind === "domain_decomposition" ||
    kind === "domain_decomposer";
  if (domainDecomposer) {
    matches.push("domain_decomposer");
    reasons.push(Array.isArray(request?.candidates) ? "candidates_array" : `request_kind:${kind || "decomposition_plan"}`);
  }

  return { matches: [...new Set(matches)], reasons };
}

function executionReadiness(carrierId, request) {
  if (carrierId === "filepatcher") {
    const directOperations = Array.isArray(request?.operations) ? request.operations.length : 0;
    const authoredEdits = Array.isArray(request?.authoring_intent?.edits)
      ? request.authoring_intent.edits.length
      : 0;
    const goal = String(request?.planning_goal ?? request?.goal ?? "").trim();
    if (directOperations > 0 || authoredEdits > 0) return { ready: true, mode: "mutation" };
    if (goal) return { ready: true, mode: "planning_only" };
    return { ready: false, mode: "idle", reason: "FilePatcher request has no operations, authoring_intent edits, or planning goal." };
  }

  if (carrierId === "path_mover") {
    if (request?.enabled === false) return { ready: false, mode: "disabled", reason: "Path Mover plan is disabled." };
    if (!nonEmptyArray(request?.moves)) return { ready: false, mode: "invalid", reason: "Path Mover requires at least one move." };
    return { ready: true, mode: "relocation" };
  }

  if (carrierId === "domain_decomposer") {
    if (request?.approved !== true) return { ready: false, mode: "awaiting_approval", reason: "Domain Decomposer plan is not approved." };
    if (!nonEmptyArray(request?.candidates)) return { ready: false, mode: "invalid", reason: "Domain Decomposer plan has no candidates." };
    const unapproved = request.candidates.filter(candidate => candidate?.execution?.approved !== true);
    if (unapproved.length) {
      return { ready: false, mode: "awaiting_approval", reason: `${unapproved.length} decomposition candidate(s) are not approved for execution.` };
    }
    return { ready: true, mode: "decomposition" };
  }

  return { ready: false, mode: "unknown", reason: "Unknown mutation carrier." };
}

export function routeMutationRequest(request, requestPath = null) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new Error("Mutation Carrier Router requires a request object.");
  }

  const explicitRaw = request.mutation_carrier ?? request.mutationCarrier ?? null;
  const explicit = explicitRaw == null ? null : normalizeCarrier(explicitRaw);
  if (explicitRaw != null && !explicit) {
    return {
      schema_version: MUTATION_CARRIER_ROUTER_SCHEMA_VERSION,
      kind: "frame_conn_mutation_carrier_route",
      state: "UNROUTABLE",
      mutation_authority: null,
      carrier: null,
      request_path: requestPath,
      evidence: { explicit: String(explicitRaw), structural_matches: [] },
      conflict: null,
      failure: { code: "UNKNOWN_MUTATION_CARRIER", summary: `Unknown mutation_carrier: ${explicitRaw}` },
      direct_github_mutation_permitted: false
    };
  }

  const structural = detectStructuralSignatures(request);
  const structuralMatches = structural.matches;

  if (structuralMatches.length > 1) {
    return {
      schema_version: MUTATION_CARRIER_ROUTER_SCHEMA_VERSION,
      kind: "frame_conn_mutation_carrier_route",
      state: "CONFLICT",
      mutation_authority: null,
      carrier: null,
      request_path: requestPath,
      evidence: { explicit, structural_matches: structuralMatches, reasons: structural.reasons },
      conflict: {
        code: "MULTIPLE_MUTATION_CARRIER_SIGNATURES",
        owners: structuralMatches
      },
      failure: null,
      direct_github_mutation_permitted: false
    };
  }

  const inferred = structuralMatches[0] ?? null;
  if (explicit && inferred && explicit !== inferred) {
    return {
      schema_version: MUTATION_CARRIER_ROUTER_SCHEMA_VERSION,
      kind: "frame_conn_mutation_carrier_route",
      state: "CONFLICT",
      mutation_authority: null,
      carrier: null,
      request_path: requestPath,
      evidence: { explicit, structural_matches: structuralMatches, reasons: structural.reasons },
      conflict: {
        code: "EXPLICIT_CARRIER_CONTRADICTS_REQUEST_SHAPE",
        owners: [explicit, inferred]
      },
      failure: null,
      direct_github_mutation_permitted: false
    };
  }

  const selected = explicit ?? inferred;
  if (!selected) {
    return {
      schema_version: MUTATION_CARRIER_ROUTER_SCHEMA_VERSION,
      kind: "frame_conn_mutation_carrier_route",
      state: "UNROUTABLE",
      mutation_authority: null,
      carrier: null,
      request_path: requestPath,
      evidence: { explicit: null, structural_matches: [], reasons: [] },
      conflict: null,
      failure: {
        code: "NO_CANONICAL_MUTATION_CARRIER_MATCH",
        summary: "Request does not match FilePatcher, Path Mover, or Domain Decomposer."
      },
      direct_github_mutation_permitted: false
    };
  }

  const readiness = executionReadiness(selected, request);
  return {
    schema_version: MUTATION_CARRIER_ROUTER_SCHEMA_VERSION,
    kind: "frame_conn_mutation_carrier_route",
    state: "ROUTED",
    mutation_authority: selected,
    carrier: MUTATION_CARRIERS[selected],
    request_path: requestPath,
    evidence: {
      explicit,
      inferred,
      reasons: structural.reasons
    },
    execution: readiness,
    conflict: null,
    failure: null,
    direct_github_mutation_permitted: false
  };
}

export function routeMutationRequestFromFile(requestPath) {
  const absolute = path.resolve(requestPath);
  const request = JSON.parse(fs.readFileSync(absolute, "utf8"));
  return { request, route: routeMutationRequest(request, String(requestPath).replaceAll("\\", "/")) };
}

function parseArgs(argv) {
  const args = { values: new Map(), flags: new Set() };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    if (argv[index + 1] && !argv[index + 1].startsWith("--")) args.values.set(key, argv[++index]);
    else args.flags.add(key);
  }
  return args;
}

function selfTest() {
  const filepatcher = routeMutationRequest({
    operations: [{ type: "replace_text", path: "a.js", search: "a", replace: "b" }]
  });
  const mover = routeMutationRequest({ enabled: true, moves: [{ from: "a.js", to: "b.js" }] });
  const decomposer = routeMutationRequest({
    approved: true,
    candidates: [{ source: "a.js", execution: { approved: true } }]
  });
  const explicit = routeMutationRequest({
    mutation_carrier: "filepatcher",
    operations: []
  });
  const conflict = routeMutationRequest({
    mutation_carrier: "path_mover",
    operations: [{ type: "create_file", path: "a.js", content: "" }]
  });
  const ambiguous = routeMutationRequest({
    operations: [],
    moves: [{ from: "a", to: "b" }]
  });
  const unknown = routeMutationRequest({ description: "nothing routable" });

  const checks = [
    filepatcher.mutation_authority === "filepatcher",
    filepatcher.execution.ready === true,
    mover.mutation_authority === "path_mover",
    decomposer.mutation_authority === "domain_decomposer",
    explicit.mutation_authority === "filepatcher",
    conflict.state === "CONFLICT",
    ambiguous.state === "CONFLICT",
    unknown.state === "UNROUTABLE"
  ];
  if (checks.some(check => !check)) throw new Error("Mutation Carrier Router self-test failed.");
  console.log("Mutation Carrier Router self-test passed.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.has("self-test")) return selfTest();
  const requestPath = String(args.values.get("request") ?? "dev_scripts/github-filepatcher.json");
  const { route } = routeMutationRequestFromFile(requestPath);
  const output = String(args.values.get("output") ?? "").trim();
  if (output) fs.writeFileSync(path.resolve(output), `${JSON.stringify(route, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(route, null, 2)}\n`);
  if (route.state === "CONFLICT") process.exitCode = 23;
  else if (route.state === "UNROUTABLE") process.exitCode = 24;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error?.stack || String(error)); process.exitCode = 1; });
}

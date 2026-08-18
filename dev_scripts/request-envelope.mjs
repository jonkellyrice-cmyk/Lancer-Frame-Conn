#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const REQUEST_ENVELOPE_SCHEMA_VERSION = 1;
export const DEFAULT_REQUEST_PATH = "dev_scripts/github-filepatcher.json";

const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value;
const hash = value => crypto.createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
const strings = value => [...new Set((Array.isArray(value) ? value : value == null ? [] : [value])
  .map(entry => String(entry).trim()).filter(Boolean))];
const repoPath = value => String(value ?? "").replaceAll("\\", "/").replace(/^\.\//, "");

export function semanticRequestProjection(request) {
  const value = { ...(request ?? {}) };
  for (const key of [
    "id", "description", "orchestrator", "telemetry", "execution_metadata",
    "runtime_metadata", "request_id", "request_fingerprint", "request_envelope",
    "toolchain_artifacts", "result"
  ]) delete value[key];
  return stable(value);
}

export function fingerprintRequest(request) {
  return hash(semanticRequestProjection(request));
}

export function buildRequestIdentity(request, requestPath = DEFAULT_REQUEST_PATH) {
  const fingerprint = fingerprintRequest(request);
  const label = String(request?.id || "request").trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72) || "request";
  return {
    id: `${label}-${fingerprint.slice(0, 12)}`,
    fingerprint,
    fingerprint_short: fingerprint.slice(0, 12),
    request_path: repoPath(requestPath)
  };
}

function operationPaths(request) {
  const output = [];
  for (const operation of request?.operations ?? []) {
    for (const key of ["path", "from", "to"]) if (operation?.[key]) output.push(repoPath(operation[key]));
    for (const root of operation?.roots ?? []) output.push(repoPath(root));
  }
  return [...new Set(output.filter(Boolean))].sort();
}

function artifacts(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return stable(Object.fromEntries(Object.entries(source).map(([name, item]) => [
    name,
    typeof item === "string" ? { ref: item } : item
  ])));
}

export function buildRequestEnvelope(request, requestPath = DEFAULT_REQUEST_PATH, options = {}) {
  if (!request || typeof request !== "object" || Array.isArray(request)) throw new Error("Request Envelope requires an object.");
  const identity = buildRequestIdentity(request, requestPath);
  const envelope = {
    schema_version: REQUEST_ENVELOPE_SCHEMA_VERSION,
    kind: "frame_conn_request_envelope",
    request: identity,
    intent: {
      goal: String(request.planning_goal ?? request.goal ?? "").trim() || null,
      acceptance_criteria: strings(request.acceptance_criteria ?? request.acceptanceCriteria),
      non_goals: strings(request.non_goals ?? request.nonGoals)
    },
    scope: {
      explicit: strings(request.scope).map(repoPath).sort(),
      allowed_paths: strings(request?.policy?.allowed_paths).map(repoPath).sort(),
      operation_paths: operationPaths(request)
    },
    evidence: Array.isArray(request.evidence) ? stable(request.evidence) : [],
    manifest: {
      artifacts: artifacts(options.artifacts ?? request.toolchain_artifacts),
      result: options.result ?? request.result ?? null
    },
    source: {
      request_path: repoPath(requestPath),
      authored_id: typeof request.id === "string" ? request.id : null,
      description: typeof request.description === "string" ? request.description : null,
      schema_version: request.schema_version ?? null,
      operation_count: request.operations?.length ?? 0
    },
    authority: {
      authoritative_for: ["semantic_request_identity", "request_goal", "acceptance_criteria", "non_goals", "declared_scope", "request_artifact_index"],
      not_authoritative_for: ["architectural_ownership", "patch_corridor_certification", "mutation_operations", "validation", "promotion"]
    }
  };
  envelope.envelope_fingerprint = hash(stable(envelope));
  return envelope;
}

export function buildRequestEnvelopeFromFile(requestPath = DEFAULT_REQUEST_PATH, options = {}) {
  const request = JSON.parse(fs.readFileSync(path.resolve(requestPath), "utf8"));
  return { request, envelope: buildRequestEnvelope(request, requestPath, options) };
}

function parseArgs(argv) {
  const args = { command: null, values: new Map(), flags: new Set() };
  const tokens = [...argv];
  if (tokens[0] && !tokens[0].startsWith("--")) args.command = tokens.shift();
  while (tokens.length) {
    const token = tokens.shift();
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    if (tokens[0] && !tokens[0].startsWith("--")) args.values.set(key, tokens.shift());
    else args.flags.add(key);
  }
  return args;
}

function selfTest() {
  const base = {
    schema_version: 2,
    id: "scan-a",
    description: "label a",
    planning_goal: "Route Scan through native execution.",
    acceptance_criteria: ["Native Scan executes", "Targeting preserved"],
    non_goals: ["No menu redesign"],
    policy: { allowed_paths: ["scripts/a.js", "scripts/b.js"] },
    operations: [{ type: "replace_text", path: "scripts/a.js", search: "old", replace: "new" }]
  };
  const relabeled = { ...base, id: "scan-b", description: "label b" };
  const changed = { ...base, planning_goal: "Route Scan through alternate execution." };
  const a = buildRequestEnvelope(base);
  const b = buildRequestEnvelope(relabeled);
  const c = buildRequestEnvelope(changed);
  if (
    a.request.fingerprint !== b.request.fingerprint ||
    a.request.fingerprint === c.request.fingerprint ||
    a.intent.acceptance_criteria.length !== 2 ||
    a.intent.non_goals.length !== 1 ||
    !a.scope.operation_paths.includes("scripts/a.js") ||
    !/^[a-f0-9]{64}$/.test(a.envelope_fingerprint)
  ) throw new Error("Request Envelope self-test failed.");
  console.log("Request Envelope self-test passed.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.has("self-test") || args.command === "self-test") return selfTest();
  const requestPath = String(args.values.get("request") ?? DEFAULT_REQUEST_PATH);
  const { envelope } = buildRequestEnvelopeFromFile(requestPath);
  const output = String(args.values.get("output") ?? "").trim();
  if (output) fs.writeFileSync(path.resolve(output), `${JSON.stringify(envelope, null, 2)}\n`, "utf8");
  if (!output || args.command === "show") process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`);
  console.log(`request_envelope=${envelope.request.fingerprint_short}`);
  console.log(`acceptance_criteria=${envelope.intent.acceptance_criteria.length}`);
  console.log(`non_goals=${envelope.intent.non_goals.length}`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error?.stack || String(error)); process.exitCode = 1; });
}

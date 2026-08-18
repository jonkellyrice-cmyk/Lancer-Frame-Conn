#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const SCOPE_LOCK_SCHEMA_VERSION = 1;

const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value;
const hash = value => crypto.createHash("sha256").update(JSON.stringify(stable(value)), "utf8").digest("hex");
const strings = value => [...new Set((Array.isArray(value) ? value : value == null ? [] : [value]).map(entry => String(entry).trim()).filter(Boolean))];
const repoPath = value => String(value ?? "").trim().replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/{2,}/g, "/");

function declaredPaths(request) {
  const output = [];
  for (const operation of request?.operations ?? []) {
    for (const key of ["path", "from", "to"]) if (operation?.[key]) output.push(operation[key]);
    for (const root of operation?.roots ?? []) output.push(root);
  }
  for (const edit of request?.authoring_intent?.edits ?? []) if (edit?.path) output.push(edit.path);
  for (const move of request?.moves ?? []) { if (move?.from) output.push(move.from); if (move?.to) output.push(move.to); }
  for (const candidate of request?.candidates ?? []) {
    if (candidate?.source) output.push(candidate.source);
    for (const unit of candidate?.units ?? []) if (unit?.target) output.push(unit.target);
  }
  for (const allowed of request?.policy?.allowed_paths ?? []) output.push(allowed);
  return [...new Set(output.map(repoPath).filter(Boolean))].sort();
}

function pathAuthorized(candidate, authorizedPaths) {
  return authorizedPaths.some(allowed => candidate === allowed || candidate.startsWith(`${allowed.replace(/\/$/, "")}/`));
}

export function buildScopeLock(request) {
  const source = request?.scope_lock;
  const violations = [];
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return { schema_version: SCOPE_LOCK_SCHEMA_VERSION, kind: "frame_conn_scope_lock", state: "SCOPE_VIOLATION", locked: false, fingerprint: null, violations: [{ code: "SCOPE_LOCK_REQUIRED", summary: "Every canonical request requires an explicit scope_lock rooted in the user's instruction." }] };
  }
  const originalUserInstruction = String(source.original_user_instruction ?? "").trim();
  const authorizedDeliverables = strings(source.authorized_deliverables);
  const authorizedPaths = strings(source.authorized_paths).map(repoPath).sort();
  const forbiddenExpansions = strings(source.forbidden_expansions);
  const authorizedCapabilities = strings(source.authorized_capabilities).sort();
  if (!originalUserInstruction) violations.push({ code: "USER_OBJECTIVE_REQUIRED", summary: "scope_lock.original_user_instruction must preserve the user's objective verbatim." });
  if (!authorizedDeliverables.length) violations.push({ code: "AUTHORIZED_DELIVERABLE_REQUIRED", summary: "Scope Lock requires at least one user-authorized deliverable." });
  if (!authorizedPaths.length && declaredPaths(request).length) violations.push({ code: "AUTHORIZED_PATHS_REQUIRED", summary: "Mutating requests must declare authorized_paths in Scope Lock." });
  const outside = declaredPaths(request).filter(candidate => !pathAuthorized(candidate, authorizedPaths));
  if (outside.length) violations.push({ code: "PATH_SCOPE_EXPANSION", summary: "The request declares repository paths outside the immutable Scope Lock.", paths: outside });
  const capabilityConstruction = source.allow_capability_construction === true;
  if (capabilityConstruction && !authorizedCapabilities.length) violations.push({ code: "CAPABILITY_AUTHORIZATION_REQUIRED", summary: "Capability construction requires explicit authorized_capabilities." });
  const projection = { schema_version: SCOPE_LOCK_SCHEMA_VERSION, lock_id: String(source.lock_id ?? "").trim() || null, original_user_instruction: originalUserInstruction, authorized_deliverables: authorizedDeliverables, authorized_paths: authorizedPaths, forbidden_expansions: forbiddenExpansions, allow_capability_construction: capabilityConstruction, authorized_capabilities: authorizedCapabilities };
  const fingerprint = hash(projection);
  return { schema_version: SCOPE_LOCK_SCHEMA_VERSION, kind: "frame_conn_scope_lock", state: violations.length ? "SCOPE_VIOLATION" : "LOCKED", locked: violations.length === 0, fingerprint, objective_fingerprint: hash(originalUserInstruction), ...projection, declared_paths: declaredPaths(request), violations, authority: { root: "original_user_instruction", assistant_may_narrow_scope: true, assistant_may_expand_scope: false, obstacle_may_change_means_not_goal: true, expansion_requires_new_explicit_user_authorization: true } };
}

export function assertScopeLock(request) {
  const lock = buildScopeLock(request);
  if (!lock.locked) {
    const error = new Error(`Scope Lock rejected request: ${lock.violations.map(item => item.code).join(", ")}`);
    error.code = "SCOPE_VIOLATION";
    error.scopeLock = lock;
    throw error;
  }
  return lock;
}

function selfTest() {
  const valid = { scope_lock: { original_user_instruction: "Change a.js only.", authorized_deliverables: ["Change a.js"], authorized_paths: ["a.js"], forbidden_expansions: ["Do not change b.js"] }, policy: { allowed_paths: ["a.js"] }, operations: [{ type: "replace_text", path: "a.js" }] };
  if (!buildScopeLock(valid).locked) throw new Error("Valid Scope Lock was rejected.");
  if (buildScopeLock({ operations: [] }).state !== "SCOPE_VIOLATION") throw new Error("Missing Scope Lock did not fail closed.");
  const expanded = structuredClone(valid); expanded.operations.push({ type: "replace_text", path: "b.js" });
  if (!buildScopeLock(expanded).violations.some(item => item.code === "PATH_SCOPE_EXPANSION")) throw new Error("Path expansion was not rejected.");
  const capability = structuredClone(valid); capability.scope_lock.allow_capability_construction = true;
  if (!buildScopeLock(capability).violations.some(item => item.code === "CAPABILITY_AUTHORIZATION_REQUIRED")) throw new Error("Unauthorized capability construction was not rejected.");
  console.log("Scope Lock self-test passed.");
}

async function main() {
  if (process.argv.includes("--self-test") || process.argv[2] === "self-test") return selfTest();
  const requestIndex = process.argv.indexOf("--request");
  const requestPath = requestIndex >= 0 ? process.argv[requestIndex + 1] : "dev_scripts/github-filepatcher.json";
  const request = JSON.parse(fs.readFileSync(path.resolve(requestPath), "utf8"));
  const lock = buildScopeLock(request);
  process.stdout.write(`${JSON.stringify(lock, null, 2)}\n`);
  if (!lock.locked) process.exitCode = 26;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main().catch(error => { console.error(error?.stack || String(error)); process.exitCode = 1; });

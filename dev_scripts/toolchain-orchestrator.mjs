#!/usr/bin/env node

import fs from "node:fs";
import {
  buildRequestEnvelopeFromFile,
  buildRequestIdentity as buildEnvelopeRequestIdentity,
  fingerprintRequest as fingerprintEnvelopeRequest
} from "./request-envelope.mjs";
import {
  MUTATION_CARRIERS,
  routeMutationRequest,
  routeMutationRequestFromFile
} from "./mutation-carrier-router.mjs";
import path from "node:path";
import childProcess from "node:child_process";
import { pathToFileURL } from "node:url";

export const TOOLCHAIN_ORCHESTRATOR_SCHEMA_VERSION = 1;
export const ORCHESTRATOR_STATUS_CONTEXT = "frame-conn/orchestrator";
export const DEFAULT_REQUEST_PATH = "dev_scripts/github-filepatcher.json";
const MUTATION_WORKFLOWS = new Set(
  Object.values(MUTATION_CARRIERS).map(carrier => carrier.workflow)
);
const TERMINAL_STATES = new Set(["SUCCEEDED", "FAILED", "BLOCKED_IDENTICAL_FAILURE", "CAPABILITY_GAP", "CONFLICT", "SUPERSEDED"]);

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

function stringValue(args, key, fallback = "") {
  return String(args.values.get(key) ?? fallback).trim();
}

export function fingerprintRequest(request) {
  return fingerprintEnvelopeRequest(request);
}

export function buildRequestIdentity(request, requestPath = DEFAULT_REQUEST_PATH) {
  const identity = buildEnvelopeRequestIdentity(request, requestPath);
  return {
    id: identity.id,
    fingerprint: identity.fingerprint,
    fingerprintShort: identity.fingerprint_short,
    requestPath: identity.request_path
  };
}

export function buildRequestIdentityFromFile(requestPath = DEFAULT_REQUEST_PATH) {
  const { request, envelope } = buildRequestEnvelopeFromFile(requestPath);
  return {
    request,
    envelope,
    identity: {
      id: envelope.request.id,
      fingerprint: envelope.request.fingerprint,
      fingerprintShort: envelope.request.fingerprint_short,
      requestPath: envelope.request.request_path
    }
  };
}

function assistantCapabilityPolicy(state) {
  const permittedActionsByState = {
    IDLE: ["author_bounded_request"],
    READY: ["canonical_execute"],
    EXECUTING: [],
    VALIDATING: [],
    PROMOTING: [],
    SUCCEEDED: [],
    FAILED: ["consume_failure_evidence", "modify_canonical_request"],
    BLOCKED_IDENTICAL_FAILURE: ["modify_canonical_request"],
    CAPABILITY_GAP: ["request_explicit_user_authorization"],
    CONFLICT: ["await_current_owner_or_modify_request"],
    SUPERSEDED: []
  };
  const active = ["READY", "EXECUTING", "VALIDATING", "PROMOTING"].includes(state);
  const failed = ["FAILED", "BLOCKED_IDENTICAL_FAILURE"].includes(state);
  const closed = ["SUCCEEDED", "SUPERSEDED"].includes(state);
  return {
    repository_read_mode: state === "IDLE"
      ? "open_discovery"
      : active
        ? "curated_context_only"
        : failed
          ? "failure_evidence_only"
          : state === "CAPABILITY_GAP"
            ? "capability_gap_only"
            : state === "CONFLICT"
              ? "ownership_resolution_only"
              : closed
                ? "closed"
                : "curated_context_only",
    direct_source_reconstruction_permitted: state === "IDLE",
    targeted_source_expansion_policy: state === "IDLE"
      ? "open"
      : active
        ? "canonical_context_insufficiency_only"
        : failed
          ? "failure_evidence_extractor_only"
          : "forbidden",
    github_workflow_reads_permitted: false,
    raw_job_log_reads_permitted: false,
    generic_direct_github_write_permitted: false,
    protected_path_publication: state === "CAPABILITY_GAP"
      ? "infrastructure_publisher_after_explicit_authorization_only"
      : "forbidden",
    permitted_actions: permittedActionsByState[state] ?? []
  };
}

function stateRecord(identity, state, overrides = {}) {
  const terminal = TERMINAL_STATES.has(state);
  return {
    schema_version: TOOLCHAIN_ORCHESTRATOR_SCHEMA_VERSION,
    request: { id: identity?.id ?? null, fingerprint: identity?.fingerprint ?? null },
    state,
    toolchain_authority: "canonical",
    mutation_authority: "filepatcher",
    assistant_action_required: false,
    permitted_next_action: terminal ? "none" : "canonical_execute",
    terminal,
    validation_closed: state === "SUCCEEDED",
    promotion_completed: state === "SUCCEEDED",
    direct_github_mutation_permitted: false,
    assistant_capabilities: assistantCapabilityPolicy(state),
    authoring_policy: null,
    capability_gap: null,
    failure: null,
    conflict: null,
    supersedes: null,
    ...overrides
  };
}

function normalizeDeclaredRepoPath(value) {
  return String(value ?? "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/\/{2,}/g, "/");
}

export function collectRequestDeclaredPaths(request) {
  const paths = [];
  for (const operation of request?.operations ?? []) {
    for (const key of ["path", "from", "to"]) if (operation?.[key]) paths.push(operation[key]);
    for (const root of operation?.roots ?? []) paths.push(root);
  }
  for (const edit of request?.authoring_intent?.edits ?? []) if (edit?.path) paths.push(edit.path);
  for (const move of request?.moves ?? []) {
    if (move?.from) paths.push(move.from);
    if (move?.to) paths.push(move.to);
  }
  for (const candidate of request?.candidates ?? []) {
    if (candidate?.source) paths.push(candidate.source);
    for (const unit of candidate?.units ?? []) if (unit?.target) paths.push(unit.target);
  }
  for (const allowed of request?.policy?.allowed_paths ?? []) paths.push(allowed);
  return [...new Set(paths.map(normalizeDeclaredRepoPath).filter(Boolean))].sort();
}

function protectedWorkflowPaths(request) {
  return collectRequestDeclaredPaths(request).filter(
    value => value === ".github/workflows" || value.startsWith(".github/workflows/")
  );
}

function buildAuthoringPolicy(request) {
  const operationCount = Array.isArray(request?.operations) ? request.operations.length : 0;
  const compilerSelected = Boolean(request?.authoring_intent && typeof request.authoring_intent === "object");
  return {
    preferred_surface: "patch_authoring_compiler",
    selected_surface: compilerSelected ? "patch_authoring_compiler" : operationCount > 0 ? "raw_operations" : "none",
    raw_operations_reason: compilerSelected ? null : String(request?.raw_operations_reason ?? "").trim() || null
  };
}

function rawOperationsAuthoringViolation(request) {
  const operationCount = Array.isArray(request?.operations) ? request.operations.length : 0;
  if (operationCount === 0 || request?.authoring_intent) return null;
  const mode = String(request?.authoring_mode ?? "").trim();
  const reason = String(request?.raw_operations_reason ?? "").trim();
  if (mode === "raw_operations" && reason.length >= 24) return null;
  return {
    code: "RAW_OPERATIONS_REASON_REQUIRED",
    summary: "Direct FilePatcher operations are an escape hatch. Use authoring_intent/Patch Authoring Compiler when expressible, or declare authoring_mode=raw_operations with a specific raw_operations_reason."
  };
}

function apiHeaders() {
  const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "frame-conn-toolchain-orchestrator" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function githubJson(endpoint) {
  const base = String(process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/$/, "");
  const url = `${base}${endpoint}`;
  const authenticatedHeaders = apiHeaders();
  let response = await fetch(url, { headers: authenticatedHeaders });

  if (!response.ok && authenticatedHeaders.Authorization && [401, 403].includes(response.status)) {
    const publicHeaders = { ...authenticatedHeaders };
    delete publicHeaders.Authorization;
    response = await fetch(url, { headers: publicHeaders });
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub read failed (${response.status}) for ${endpoint}: ${body}`);
  }
  return response.json();
}

function repositoryName() { return String(process.env.GITHUB_REPOSITORY || "").trim(); }
function currentRunId() { const parsed = Number.parseInt(String(process.env.GITHUB_RUN_ID || ""), 10); return Number.isFinite(parsed) ? parsed : null; }
function currentSha() { return String(process.env.GITHUB_SHA || "").trim(); }
function currentBranch() { return String(process.env.GITHUB_REF_NAME || "").trim(); }

function refreshGitHistory() {
  if (!process.env.GITHUB_ACTIONS) return;
  const branch = currentBranch();
  if (!branch) throw new Error("Toolchain Orchestrator cannot certify request history because GITHUB_REF_NAME is missing.");
  const result = childProcess.spawnSync(
    "git",
    ["fetch", "--quiet", "--depth=80", "origin", branch],
    { stdio: "ignore" }
  );
  if (result.error || result.status !== 0) {
    throw new Error(`Toolchain Orchestrator could not refresh request history for ${branch}; refusing to execute without sticky-history evidence.`);
  }
}

function requestCommits(requestPath, limit = 40) {
  try {
    const result = childProcess.execFileSync("git", ["log", `-n${limit}`, "--format=%H", "--", requestPath], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return result.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  } catch (error) {
    if (process.env.GITHUB_ACTIONS) {
      throw new Error(`Toolchain Orchestrator could not read request history for ${requestPath}: ${error?.message ?? error}`);
    }
    return [];
  }
}

function requestAtCommit(commitSha, requestPath) {
  try {
    const content = childProcess.execFileSync("git", ["show", `${commitSha}:${requestPath}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return JSON.parse(content);
  } catch { return null; }
}

async function orchestratorStatusForCommit(repository, sha) {
  if (!repository || !sha) return null;
  const combined = await githubJson(`/repos/${repository}/commits/${sha}/status`);
  const statuses = Array.isArray(combined?.statuses) ? combined.statuses : [];
  return statuses.find(entry => entry.context === ORCHESTRATOR_STATUS_CONTEXT) ?? null;
}

function stateFromCommitStatus(status) {
  if (!status) return null;
  const description = String(status.description || "");
  if (description.startsWith("SUCCEEDED")) return "SUCCEEDED";
  if (description.startsWith("FAILED")) return "FAILED";
  if (description.startsWith("CAPABILITY_GAP")) return "CAPABILITY_GAP";
  if (description.startsWith("CONFLICT")) return "CONFLICT";
  if (status.state === "success") return "SUCCEEDED";
  if (status.state === "failure" || status.state === "error") return "FAILED";
  return null;
}

async function findPriorTerminal(identity, requestPath) {
  const repository = repositoryName();
  if (!repository) return null;
  refreshGitHistory();
  for (const sha of requestCommits(requestPath)) {
    if (sha === currentSha()) continue;
    const prior = requestAtCommit(sha, requestPath);
    if (!prior) continue;
    const priorIdentity = buildRequestIdentity(prior, requestPath);
    if (priorIdentity.fingerprint !== identity.fingerprint) continue;
    const status = await orchestratorStatusForCommit(repository, sha);
    const state = stateFromCommitStatus(status);
    if (state) return { commit: sha, state, status, request: priorIdentity };
  }
  return null;
}

async function findSupersededFailure(identity, requestPath) {
  const repository = repositoryName();
  if (!repository) return null;
  refreshGitHistory();
  for (const sha of requestCommits(requestPath, 20)) {
    if (sha === currentSha()) continue;
    const prior = requestAtCommit(sha, requestPath);
    if (!prior) continue;
    const priorIdentity = buildRequestIdentity(prior, requestPath);
    if (priorIdentity.fingerprint === identity.fingerprint) continue;
    const status = await orchestratorStatusForCommit(repository, sha);
    if (stateFromCommitStatus(status) === "FAILED") return { request_id: priorIdentity.id, request_fingerprint: priorIdentity.fingerprint, commit: sha, state: "SUPERSEDED" };
  }
  return null;
}

async function activeMutationConflicts() {
  const repository = repositoryName();
  if (!repository) return [];
  const current = currentRunId();
  const branch = currentBranch();
  const runs = [];
  for (const state of ["in_progress", "queued"]) {
    const payload = await githubJson(`/repos/${repository}/actions/runs?status=${state}&per_page=50`);
    for (const run of payload.workflow_runs ?? []) {
      if (!MUTATION_WORKFLOWS.has(run.name)) continue;
      if (current && Number(run.id) === current) continue;
      if (branch && run.head_branch && run.head_branch !== branch) continue;
      runs.push({ workflow: run.name, run_id: run.id, state: run.status, head_sha: run.head_sha, branch: run.head_branch });
    }
  }
  return runs;
}

export function mapWorkflowState(status, stepName = "") {
  const normalizedStatus = String(status || "").toLowerCase();
  const step = String(stepName || "").toLowerCase();
  if (normalizedStatus === "completed") return "SUCCEEDED";
  if (step.includes("commit") || step.includes("push") || step.includes("promot")) return "PROMOTING";
  if (step.includes("validate") || step.includes("audit") || step.includes("diff") || step.includes("propagation") || step.includes("test")) return "VALIDATING";
  return "EXECUTING";
}

export function buildCapabilityGapRecord({ identity, requestedOperation, canonicalPath, missingCapability, blockingReason, directAction, affected = [], resumeAuthority = "FilePatcher / canonical workflow", mutationAuthority = "filepatcher" }) {
  return stateRecord(identity, "CAPABILITY_GAP", {
    mutation_authority: mutationAuthority,
    assistant_action_required: true,
    permitted_next_action: "request_explicit_user_authorization",
    capability_gap: {
      requested_operation: requestedOperation,
      canonical_toolchain_path: canonicalPath,
      missing_capability: missingCapability,
      blocking_reason: blockingReason,
      smallest_direct_github_action: directAction,
      affected_paths_or_refs: affected,
      normal_authority_after_exception: resumeAuthority,
      explicit_user_authorization_required: true,
      exception_publisher: "dev_scripts/infrastructure-publisher.mjs",
      exception_publisher_mode: "single_explicitly_authorized_protected_file"
    }
  });
}

export function buildTerminalCompletionRecord(telemetry, failureEvidence = null) {
  const identity = telemetry?.orchestratorRequest ?? null;
  if (!identity) return null;
  const succeeded = String(telemetry.conclusion || "").toLowerCase() === "success";
  if (succeeded) {
    return stateRecord(identity, "SUCCEEDED", {
      mutation_authority: telemetry.mutationAuthority ?? "filepatcher",
      repository_changed: Boolean(telemetry.resultCommitSha && telemetry.triggeringSha && telemetry.resultCommitSha !== telemetry.triggeringSha),
      validation_closed: true,
      promotion_completed: true,
      assistant_action_required: false,
      permitted_next_action: "none"
    });
  }
  const failure = {
    request_id: identity.id,
    request_fingerprint: identity.fingerprint,
    state: "FAILED",
    failed_stage: failureEvidence?.failed_stage ?? "workflow",
    failure_class: failureEvidence?.failure_class ?? "canonical_workflow_failure",
    summary: failureEvidence?.summary ?? `${telemetry.workflow || "Canonical workflow"} ended ${telemetry.conclusion || "unsuccessfully"}.`,
    repository_changed: Boolean(telemetry.resultCommitSha && telemetry.triggeringSha && telemetry.resultCommitSha !== telemetry.triggeringSha),
    promotion_completed: false,
    relevant_evidence: failureEvidence?.relevant_evidence ?? [],
    permitted_next_action: "modify_request"
  };
  return stateRecord(identity, "FAILED", {
    mutation_authority: telemetry.mutationAuthority ?? "filepatcher",
    assistant_action_required: true,
    permitted_next_action: "modify_request",
    validation_closed: false,
    promotion_completed: false,
    failure
  });
}

async function evaluateRequest(requestPath) {
  const { request, identity } = buildRequestIdentityFromFile(requestPath);
  const mutationRoute = routeMutationRequest(request, requestPath);

  if (mutationRoute.state === "CONFLICT") {
    return stateRecord(identity, "CONFLICT", {
      mutation_authority: null,
      assistant_action_required: true,
      permitted_next_action: "modify_request",
      conflict: mutationRoute.conflict,
      mutation_route: mutationRoute
    });
  }

  if (mutationRoute.state === "UNROUTABLE") {
    return stateRecord(identity, "CONFLICT", {
      mutation_authority: null,
      assistant_action_required: true,
      permitted_next_action: "modify_request",
      conflict: {
        code: "UNROUTABLE_REQUEST",
        owners: [],
        summary: mutationRoute.failure?.summary ?? "No canonical mutation carrier matched the request."
      },
      mutation_route: mutationRoute
    });
  }

  const workflowPaths = protectedWorkflowPaths(request);
  if (workflowPaths.length) {
    return buildCapabilityGapRecord({
      identity,
      mutationAuthority: mutationRoute.mutation_authority,
      requestedOperation: "publish protected GitHub workflow infrastructure",
      canonicalPath: `${mutationRoute.mutation_authority} -> protected infrastructure publication`,
      missingCapability: "normal mutation carriers intentionally refuse .github/workflows publication",
      blockingReason: "Protected workflow paths require the explicitly authorized Infrastructure Publisher exception boundary.",
      directAction: "publish exactly one authorized workflow file through dev_scripts/infrastructure-publisher.mjs",
      affected: workflowPaths,
      resumeAuthority: `${mutationRoute.mutation_authority} / canonical workflow`
    });
  }

  const rawAuthoringViolation = mutationRoute.mutation_authority === "filepatcher"
    ? rawOperationsAuthoringViolation(request)
    : null;
  if (rawAuthoringViolation) {
    return stateRecord(identity, "CONFLICT", {
      mutation_authority: mutationRoute.mutation_authority,
      assistant_action_required: true,
      permitted_next_action: "modify_request",
      conflict: {
        code: rawAuthoringViolation.code,
        owners: ["patch_authoring_compiler", "raw_operations"],
        summary: rawAuthoringViolation.summary
      },
      authoring_policy: buildAuthoringPolicy(request),
      mutation_route: mutationRoute
    });
  }

  if (mutationRoute.execution?.ready === false) {
    return stateRecord(identity, "IDLE", {
      mutation_authority: mutationRoute.mutation_authority,
      bounded_request: false,
      assistant_action_required: false,
      permitted_next_action: "none",
      terminal: false,
      mutation_route: mutationRoute
    });
  }

  const conflicts = await activeMutationConflicts();
  if (conflicts.length) return stateRecord(identity, "CONFLICT", {
    mutation_authority: mutationRoute.mutation_authority,
    assistant_action_required: true,
    permitted_next_action: "wait_for_current_owner_or_resolve_conflict",
    conflict: { code: "MULTIPLE_MUTATION_AUTHORITIES", owners: conflicts },
    mutation_route: mutationRoute
  });

  const priorTerminal = await findPriorTerminal(identity, requestPath);
  if (priorTerminal?.state === "SUCCEEDED") return stateRecord(identity, "SUCCEEDED", { assistant_action_required: false, permitted_next_action: "none", closed_by_commit: priorTerminal.commit });
  if (priorTerminal && priorTerminal.state !== "SUCCEEDED") return stateRecord(identity, "BLOCKED_IDENTICAL_FAILURE", {
    assistant_action_required: true,
    permitted_next_action: "modify_request",
    failure: {
      request_id: identity.id, request_fingerprint: identity.fingerprint, state: "BLOCKED_IDENTICAL_FAILURE",
      failed_stage: "previous_terminal_failure", failure_class: "identical_request_retry",
      summary: "This semantic request already failed terminally and has not materially changed.",
      repository_changed: false, promotion_completed: false,
      relevant_evidence: [{ commit: priorTerminal.commit, target_url: priorTerminal.status?.target_url ?? null }],
      permitted_next_action: "modify_request"
    }
  });

  const supersedes = await findSupersededFailure(identity, requestPath);
  return stateRecord(identity, "READY", {
    mutation_authority: mutationRoute.mutation_authority,
    assistant_action_required: false,
    permitted_next_action: "canonical_execute",
    terminal: false,
    supersedes,
    authoring_policy: buildAuthoringPolicy(request),
    mutation_route: mutationRoute
  });
}

function exitCodeForState(state) {
  if (["IDLE", "READY"].includes(state)) return 0;
  if (state === "SUCCEEDED") return 21;
  if (state === "BLOCKED_IDENTICAL_FAILURE") return 22;
  if (state === "CONFLICT") return 23;
  if (state === "CAPABILITY_GAP") return 24;
  return 25;
}

function printJson(value) { process.stdout.write(`${JSON.stringify(value, null, 2)}\n`); }
function readTelemetry(filePath) { return JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8")); }

function runSelfTest() {
  const base = { schema_version: 2, id: "first-label", description: "metadata", planning_goal: "change behavior", policy: { max_files_changed: 1, allowed_paths: ["a.js"] }, operations: [{ type: "replace_text", path: "a.js", search: "a", replace: "b" }] };
  const sameSemantics = { ...base, id: "other-label", description: "different metadata" };
  const changedSemantics = { ...base, operations: [{ type: "replace_text", path: "a.js", search: "a", replace: "c" }] };
  const first = buildRequestIdentity(base);
  const second = buildRequestIdentity(sameSemantics);
  const third = buildRequestIdentity(changedSemantics);
  if (first.fingerprint !== second.fingerprint) throw new Error("Transient metadata changed the semantic fingerprint.");
  if (first.fingerprint === third.fingerprint) throw new Error("Semantic operation change did not change fingerprint.");
  const success = buildTerminalCompletionRecord({ conclusion: "success", triggeringSha: "1".repeat(40), resultCommitSha: "2".repeat(40), orchestratorRequest: first });
  if (success.state !== "SUCCEEDED" || success.permitted_next_action !== "none" || !success.validation_closed) throw new Error("Success closure contract failed.");
  const failure = buildTerminalCompletionRecord({ conclusion: "failure", triggeringSha: "1".repeat(40), resultCommitSha: "1".repeat(40), workflow: "GitHub FilePatcher", orchestratorRequest: first }, { failed_stage: "Validate diff", failure_class: "validation_failure", summary: "Diff validation failed.", relevant_evidence: ["git diff --check"] });
  if (failure.state !== "FAILED" || failure.permitted_next_action !== "modify_request") throw new Error("Failure contract failed.");
  const gap = buildCapabilityGapRecord({ identity: first, requestedOperation: "publish workflow", canonicalPath: "FilePatcher -> publication workflow", missingCapability: "protected workflow publication", blockingReason: "canonical publisher cannot update protected workflow files", directAction: "update one workflow file", affected: [".github/workflows/example.yml"] });
  if (gap.state !== "CAPABILITY_GAP" || gap.capability_gap?.explicit_user_authorization_required !== true) throw new Error("Capability-gap authorization contract failed.");
  if (success.assistant_capabilities?.permitted_actions?.length !== 0 || success.assistant_capabilities?.direct_source_reconstruction_permitted !== false) throw new Error("Terminal closure capability contract failed.");
  if (protectedWorkflowPaths({ operations: [{ path: ".github/workflows/test.yml" }] }).length !== 1) throw new Error("Protected workflow detection failed.");
  if (!rawOperationsAuthoringViolation({ operations: [{ path: "a.js" }] })) throw new Error("Raw operations escape-hatch enforcement failed.");
  if (rawOperationsAuthoringViolation({ operations: [{ path: "a.js" }], authoring_mode: "raw_operations", raw_operations_reason: "Required because this operation is not expressible by the compiler." })) throw new Error("Declared raw operations escape hatch was incorrectly rejected.");
  if (mapWorkflowState("in_progress", "Validate diff") !== "VALIDATING") throw new Error("Workflow validation mapping failed.");
  if (mapWorkflowState("in_progress", "Commit verified patch") !== "PROMOTING") throw new Error("Workflow promotion mapping failed.");
  console.log("Toolchain Orchestrator self-test passed.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.has("self-test") || args.command === "self-test") { runSelfTest(); return; }
  const requestPath = stringValue(args, "request", DEFAULT_REQUEST_PATH);
  if (args.command === "route") {
    const { route } = routeMutationRequestFromFile(requestPath);
    printJson(route);
    process.exitCode = route.state === "ROUTED" ? 0 : route.state === "CONFLICT" ? 23 : 24;
    return;
  }
  if (args.command === "execute") {
    const record = await evaluateRequest(requestPath);
    printJson(record);
    process.exitCode = exitCodeForState(record.state);
    return;
  }
  if (args.command === "status" || !args.command) {
    const telemetryPath = stringValue(args, "telemetry");
    if (telemetryPath) { const telemetry = readTelemetry(telemetryPath); printJson(telemetry.orchestrator ?? telemetry); return; }
    printJson(await evaluateRequest(requestPath));
    return;
  }
  if (args.command === "failure") {
    const telemetryPath = stringValue(args, "telemetry");
    if (telemetryPath) { const telemetry = readTelemetry(telemetryPath); printJson(telemetry.orchestrator?.failure ?? { state: telemetry.orchestrator?.state ?? "UNKNOWN", summary: "No terminal failure record is present." }); return; }
    const record = await evaluateRequest(requestPath);
    printJson(record.failure ?? { state: record.state, summary: "No terminal failure record is available from the current request state." });
    return;
  }
  throw new Error("Usage: toolchain-orchestrator.mjs route|status|execute|failure|self-test [--request path] [--telemetry report.json]");
}

const invokedAsScript = process.argv[1] ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href : false;
if (invokedAsScript) main().catch(error => { console.error(error?.stack || error?.message || String(error)); process.exitCode = 1; });

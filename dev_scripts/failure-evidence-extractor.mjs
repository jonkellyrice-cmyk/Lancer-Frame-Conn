#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const FAILURE_EVIDENCE_EXTRACTOR_SCHEMA_VERSION = 1;

const TERMINAL_FAILURE_CONCLUSIONS = new Set(["failure", "cancelled", "timed_out", "action_required", "startup_failure"]);
const ERROR_LINE_PATTERN = /\b(error|failed|failure|fatal|exception|assert(?:ion)?|mismatch|not found|cannot|unable|rejected|denied|enoent|eacces|syntaxerror|typeerror|referenceerror|exit code\s+[1-9]|exited with code\s+[1-9])\b/i;
const PATH_PATTERN = /(?:^|[\s("'`])((?:dev_scripts|scripts|styles|Docs|\.github)\/[A-Za-z0-9_.\/-]+|(?:package|module)\.json)\b/g;
const MAX_ANCHORS = 8;
const CONTEXT_RADIUS = 2;
const MAX_EXCERPT_LINES = 24;
const MAX_LINE_LENGTH = 420;

function normalizeRepoPath(value) {
  return String(value ?? "").trim().replaceAll("\\", "/").replace(/^\.\//, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function redactSecrets(value) {
  return String(value)
    .replace(/(authorization:\s*bearer\s+)[^\s]+/ig, "$1[REDACTED]")
    .replace(/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g, "[REDACTED_GITHUB_TOKEN]")
    .replace(/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, "[REDACTED_GITHUB_TOKEN]")
    .replace(/([?&](?:token|access_token|signature|sig)=)[^&\s]+/ig, "$1[REDACTED]");
}

function cleanLogLine(value) {
  return redactSecrets(String(value ?? "")
    .replace(/\u001b\[[0-9;]*m/g, "")
    .replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\s*/, "")
    .trimEnd()).slice(0, MAX_LINE_LENGTH);
}

export function classifyFailureStage(stageName = "") {
  const stage = String(stageName).toLowerCase();
  if (stage.includes("commit") || stage.includes("push") || stage.includes("promot")) return "promotion_failure";
  if (stage.includes("publish") || stage.includes("permission") || stage.includes("protected")) return "publication_failure";
  if (
    stage.includes("validate") ||
    stage.includes("audit") ||
    stage.includes("diff") ||
    stage.includes("test") ||
    stage.includes("propagation") ||
    stage.includes("compatibility") ||
    stage.includes("syntax")
  ) return "validation_failure";
  if (stage.includes("corridor") || stage.includes("context") || stage.includes("plan")) return "planning_failure";
  return "canonical_workflow_failure";
}

export function extractRepositoryPaths(text) {
  const output = [];
  for (const line of String(text ?? "").split(/\r?\n/)) {
    PATH_PATTERN.lastIndex = 0;
    let match;
    while ((match = PATH_PATTERN.exec(line))) {
      output.push(normalizeRepoPath(match[1]).replace(/[),:;]+$/, ""));
    }
  }
  return unique(output).sort();
}

export function extractLogEvidence(logText, options = {}) {
  const rawLines = String(logText ?? "").split(/\r?\n/);
  const cleaned = rawLines.map(cleanLogLine);
  const anchorIndexes = [];
  for (let index = 0; index < cleaned.length && anchorIndexes.length < MAX_ANCHORS; index += 1) {
    if (ERROR_LINE_PATTERN.test(cleaned[index])) anchorIndexes.push(index);
  }

  const selectedIndexes = new Set();
  for (const anchor of anchorIndexes) {
    for (
      let index = Math.max(0, anchor - CONTEXT_RADIUS);
      index <= Math.min(cleaned.length - 1, anchor + CONTEXT_RADIUS);
      index += 1
    ) selectedIndexes.add(index);
  }

  const excerpt = [...selectedIndexes]
    .sort((a, b) => a - b)
    .slice(0, MAX_EXCERPT_LINES)
    .map(index => ({ line: index + 1, text: cleaned[index] }))
    .filter(entry => entry.text);

  const paths = extractRepositoryPaths(excerpt.map(entry => entry.text).join("\n"));
  const scopePaths = unique((options.scopePaths ?? []).map(normalizeRepoPath));
  const scopeSet = new Set(scopePaths);
  const inScopePaths = paths.filter(item => scopeSet.has(item));
  const outsideScopePaths = paths.filter(item => scopePaths.length && !scopeSet.has(item));

  return {
    anchor_count: anchorIndexes.length,
    excerpt,
    evidence_paths: paths,
    in_scope_paths: inScopePaths,
    outside_scope_paths: outsideScopePaths
  };
}

function collectFindingSignatures(value, output = new Set()) {
  if (value == null) return output;
  if (Array.isArray(value)) {
    for (const item of value) collectFindingSignatures(item, output);
    return output;
  }
  if (typeof value !== "object") return output;

  const signatureKeys = ["code", "path", "file", "message", "summary", "rule", "type"];
  const signature = {};
  for (const key of signatureKeys) {
    if (value[key] !== undefined && value[key] !== null) signature[key] = value[key];
  }
  if (Object.keys(signature).length >= 2 || signature.message || signature.summary) {
    output.add(JSON.stringify(signature));
  }

  for (const [key, item] of Object.entries(value)) {
    if (["findings", "errors", "warnings", "issues", "violations", "results", "diagnostics"].includes(key)) {
      collectFindingSignatures(item, output);
    }
  }
  return output;
}

function signatureTouchesScope(signature, scopePaths) {
  return scopePaths.some(scopePath => String(signature).includes(scopePath));
}

export function classifyRegression({ baseline = null, current = null, scopePaths = [], evidencePaths = [] } = {}) {
  const normalizedScope = unique(scopePaths.map(normalizeRepoPath));
  if (baseline && current) {
    const before = collectFindingSignatures(baseline);
    const after = collectFindingSignatures(current);
    const introduced = [...after].filter(signature => !before.has(signature));
    const resolved = [...before].filter(signature => !after.has(signature));

    if (introduced.length === 0) {
      return {
        classification: "pre_existing_only",
        basis: "canonical_baseline_delta",
        introduced_count: 0,
        resolved_count: resolved.length
      };
    }

    const introducedInScope = introduced.filter(signature => signatureTouchesScope(signature, normalizedScope));
    return {
      classification: introducedInScope.length
        ? "request_regression"
        : "introduced_outside_request_scope",
      basis: "canonical_baseline_delta",
      introduced_count: introduced.length,
      introduced_in_scope_count: introducedInScope.length,
      resolved_count: resolved.length
    };
  }

  const normalizedEvidence = unique(evidencePaths.map(normalizeRepoPath));
  const scopeSet = new Set(normalizedScope);
  const inScope = normalizedEvidence.filter(item => scopeSet.has(item));

  if (normalizedScope.length && inScope.length) {
    return {
      classification: "request_scope_failure",
      basis: "terminal_log_path_overlap",
      in_scope_path_count: inScope.length
    };
  }
  if (normalizedScope.length && normalizedEvidence.length) {
    return {
      classification: "outside_request_scope_unproven",
      basis: "terminal_log_paths_outside_scope",
      outside_scope_path_count: normalizedEvidence.length
    };
  }
  return {
    classification: "undetermined",
    basis: "insufficient_baseline_or_path_evidence"
  };
}

async function githubGet(url, token, options = {}) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      Accept: options.accept ?? "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "frame-conn-failure-evidence-extractor"
    }
  });
  return response;
}

async function readFailedJob(report, token, apiUrl) {
  if (!report?.repository || !report?.runId) return { job: null, step: null };
  const endpoint = `${String(apiUrl || "https://api.github.com").replace(/\/$/, "")}/repos/${report.repository}/actions/runs/${report.runId}/jobs?per_page=100`;
  const response = await githubGet(endpoint, token);
  if (!response.ok) return { job: null, step: null };
  const payload = await response.json();
  const job = (payload.jobs ?? []).find(item =>
    TERMINAL_FAILURE_CONCLUSIONS.has(String(item.conclusion ?? "").toLowerCase())
  ) ?? null;
  const step = job?.steps?.find(item =>
    TERMINAL_FAILURE_CONCLUSIONS.has(String(item.conclusion ?? "").toLowerCase())
  ) ?? null;
  return { job, step };
}

async function readFailedJobLog(report, job, token, apiUrl) {
  if (!report?.repository || !job?.id) return "";
  const endpoint = `${String(apiUrl || "https://api.github.com").replace(/\/$/, "")}/repos/${report.repository}/actions/jobs/${job.id}/logs`;
  const response = await githubGet(endpoint, token, { accept: "text/plain, application/octet-stream" });
  if (!response.ok) return "";
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.includes(0)) return "";
  return buffer.toString("utf8");
}

export async function extractTerminalFailureEvidence(report, options = {}) {
  if (!report || String(report.conclusion ?? "").toLowerCase() === "success") return null;

  const token = options.token ?? process.env.GITHUB_TOKEN ?? "";
  const apiUrl = options.apiUrl ?? process.env.GITHUB_API_URL ?? "https://api.github.com";
  const scopePaths = unique((options.scopePaths ?? report.requestScope ?? []).map(normalizeRepoPath));

  const { job, step } = options.job
    ? { job: options.job, step: options.step ?? null }
    : await readFailedJob(report, token, apiUrl);

  const stage = step?.name || job?.name || "workflow";
  const logText = options.logText ?? await readFailedJobLog(report, job, token, apiUrl);
  const logEvidence = extractLogEvidence(logText, { scopePaths });
  const regression = classifyRegression({
    baseline: options.baseline ?? null,
    current: options.current ?? null,
    scopePaths,
    evidencePaths: logEvidence.evidence_paths
  });

  const summarySuffix = regression.classification === "pre_existing_only"
    ? " Canonical baseline evidence shows no newly introduced finding."
    : regression.classification === "outside_request_scope_unproven"
      ? " Terminal evidence points outside the bounded request scope, but no baseline proves it was pre-existing."
      : regression.classification === "request_regression"
        ? " Canonical baseline evidence identifies a newly introduced in-scope regression."
        : "";

  return {
    schema_version: FAILURE_EVIDENCE_EXTRACTOR_SCHEMA_VERSION,
    kind: "frame_conn_terminal_failure_evidence",
    failed_stage: stage,
    failure_class: classifyFailureStage(stage),
    summary: `${report.workflow || "Canonical workflow"} failed at ${stage}.${summarySuffix}`.trim(),
    regression_classification: regression,
    request_scope_paths: scopePaths,
    relevant_evidence: [{
      job: job?.name ?? null,
      job_id: job?.id ?? null,
      step: step?.name ?? null,
      conclusion: step?.conclusion ?? job?.conclusion ?? report.conclusion ?? "failure",
      evidence_paths: logEvidence.evidence_paths,
      log_excerpt: logEvidence.excerpt
    }],
    raw_log_expansion: {
      available: Boolean(job?.id),
      job_id: job?.id ?? null,
      normal_assistant_action: "none"
    },
    permitted_next_action: "modify_request"
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8"));
}

function parseArgs(argv) {
  const values = new Map();
  const flags = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    if (argv[index + 1] && !argv[index + 1].startsWith("--")) values.set(key, argv[++index]);
    else flags.add(key);
  }
  return { values, flags };
}

function runSelfTest() {
  const log = [
    "Run npm test",
    "tests/example.test.mjs:12",
    "Error: expected VALUE to be 2",
    "    at scripts/example.js:44:3",
    "Process exited with code 1"
  ].join("\n");
  const extracted = extractLogEvidence(log, { scopePaths: ["scripts/example.js"] });
  const scoped = classifyRegression({
    scopePaths: ["scripts/example.js"],
    evidencePaths: extracted.evidence_paths
  });
  const baseline = { errors: [{ code: "OLD", path: "scripts/old.js", message: "old" }] };
  const unchanged = { errors: [{ code: "OLD", path: "scripts/old.js", message: "old" }] };
  const changed = { errors: [
    { code: "OLD", path: "scripts/old.js", message: "old" },
    { code: "NEW", path: "scripts/example.js", message: "new" }
  ] };
  const preExisting = classifyRegression({ baseline, current: unchanged, scopePaths: ["scripts/example.js"] });
  const regression = classifyRegression({ baseline, current: changed, scopePaths: ["scripts/example.js"] });

  const checks = [
    extracted.excerpt.length > 0,
    extracted.evidence_paths.includes("scripts/example.js"),
    scoped.classification === "request_scope_failure",
    preExisting.classification === "pre_existing_only",
    regression.classification === "request_regression",
    classifyFailureStage("Commit verified patch") === "promotion_failure",
    classifyFailureStage("Repository audit") === "validation_failure"
  ];
  if (checks.some(value => !value)) throw new Error("Failure Evidence Extractor self-test failed.");
  console.log("Failure Evidence Extractor self-test passed.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.has("self-test")) return runSelfTest();

  const reportPath = String(args.values.get("report") ?? "").trim();
  if (!reportPath) throw new Error("Usage: failure-evidence-extractor.mjs --report telemetry.json [--log job.log] [--baseline before.json --current after.json] [--output evidence.json]");
  const report = readJson(reportPath);
  const logPath = String(args.values.get("log") ?? "").trim();
  const baselinePath = String(args.values.get("baseline") ?? "").trim();
  const currentPath = String(args.values.get("current") ?? "").trim();
  const evidence = await extractTerminalFailureEvidence(report, {
    token: process.env.GITHUB_TOKEN,
    apiUrl: process.env.GITHUB_API_URL,
    logText: logPath ? fs.readFileSync(path.resolve(logPath), "utf8") : undefined,
    baseline: baselinePath ? readJson(baselinePath) : null,
    current: currentPath ? readJson(currentPath) : null
  });
  const outputPath = String(args.values.get("output") ?? "").trim();
  if (outputPath) fs.writeFileSync(path.resolve(outputPath), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error?.stack || String(error)); process.exitCode = 1; });
}

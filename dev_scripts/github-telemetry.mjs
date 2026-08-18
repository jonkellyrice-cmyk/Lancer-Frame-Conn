#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import childProcess from "node:child_process";
import {
  buildRequestIdentityFromFile,
  buildTerminalCompletionRecord,
  ORCHESTRATOR_STATUS_CONTEXT
} from "./toolchain-orchestrator.mjs";

const SCHEMA_VERSION = 1;
const DEFAULT_RECEIPT_NAME = "github-telemetry-receipt.json";
const DEFAULT_REPORT_NAME = "github-telemetry-report.json";

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

function integerValue(value, fallback = null) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function currentGitSha() {
  try {
    return childProcess.execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return "";
  }
}

function writeJson(filePath, value) {
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return resolved;
}

function appendSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  fs.appendFileSync(summaryPath, `${markdown.trim()}\n`, "utf8");
}

function slug(value) {
  return String(value || "workflow")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "workflow";
}

function statusState(conclusion) {
  const normalized = String(conclusion || "").toLowerCase();
  if (normalized === "success") return "success";
  if (["failure", "timed_out", "action_required", "startup_failure"].includes(normalized)) return "failure";
  if (["cancelled", "skipped", "neutral", "stale"].includes(normalized)) return "error";
  return "error";
}

function buildReceipt(args, env = process.env) {
  const workflow = stringValue(args, "workflow", env.FRAME_CONN_TELEMETRY_WORKFLOW || env.GITHUB_WORKFLOW);
  const job = stringValue(args, "job", env.FRAME_CONN_TELEMETRY_JOB || env.GITHUB_JOB);
  const conclusion = stringValue(args, "conclusion", env.FRAME_CONN_TELEMETRY_CONCLUSION || "unknown").toLowerCase();
  const triggeringSha = stringValue(args, "head-sha", env.FRAME_CONN_TELEMETRY_HEAD_SHA || env.GITHUB_SHA);
  const resultCommitSha = stringValue(args, "result-sha", currentGitSha() || triggeringSha);
  let orchestratorRequest = null;
  if (workflow === "GitHub FilePatcher") {
    try {
      orchestratorRequest = buildRequestIdentityFromFile().identity;
    } catch {
      orchestratorRequest = null;
    }
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: "frame_conn_github_workflow_receipt",
    observedAt: new Date().toISOString(),
    workflow,
    job,
    conclusion,
    runId: integerValue(stringValue(args, "run-id", env.GITHUB_RUN_ID)),
    runAttempt: integerValue(stringValue(args, "run-attempt", env.GITHUB_RUN_ATTEMPT), "1"),
    event: stringValue(args, "event", env.GITHUB_EVENT_NAME),
    branch: stringValue(args, "branch", env.GITHUB_REF_NAME),
    repository: stringValue(args, "repository", env.GITHUB_REPOSITORY),
    triggeringSha,
    resultCommitSha,
    orchestratorRequest
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function findReceipt(args) {
  const explicit = stringValue(args, "receipt");
  if (explicit) return explicit;
  const directory = stringValue(args, "receipt-dir");
  if (!directory) return "";
  const candidates = [];
  const walk = current => {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const resolved = path.join(current, entry.name);
      if (entry.isDirectory()) walk(resolved);
      else if (entry.name === DEFAULT_RECEIPT_NAME) candidates.push(resolved);
    }
  };
  walk(directory);
  candidates.sort();
  return candidates.at(-1) || "";
}

function buildReport(eventPayload, receipt = null) {
  const run = eventPayload.workflow_run ?? {};
  const workflow = receipt?.workflow || run.name || "Unknown workflow";
  const conclusion = String(run.conclusion || receipt?.conclusion || "unknown").toLowerCase();
  const triggeringSha = receipt?.triggeringSha || run.head_sha || "";
  const resultCommitSha = receipt?.resultCommitSha || triggeringSha;
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: "frame_conn_github_completion_telemetry",
    observedAt: new Date().toISOString(),
    workflow,
    workflowId: run.workflow_id ?? null,
    runId: run.id ?? receipt?.runId ?? null,
    runAttempt: run.run_attempt ?? receipt?.runAttempt ?? null,
    conclusion,
    statusState: statusState(conclusion),
    event: run.event || receipt?.event || "",
    branch: run.head_branch || receipt?.branch || "",
    repository: eventPayload.repository?.full_name || receipt?.repository || "",
    triggeringSha,
    resultCommitSha,
    runUrl: run.html_url || "",
    actor: run.actor?.login || "",
    startedAt: run.run_started_at || run.created_at || null,
    completedAt: run.updated_at || null,
    receiptAvailable: Boolean(receipt),
    orchestratorRequest: receipt?.orchestratorRequest ?? null
  };
}

async function publishCommitStatus(report, token, apiUrl = "https://api.github.com") {
  if (!token) throw new Error("GITHUB_TOKEN is required to publish telemetry status.");
  if (!report.repository) throw new Error("Repository is missing from telemetry report.");
  if (!report.resultCommitSha) throw new Error("Result commit SHA is missing from telemetry report.");
  const endpoint = `${apiUrl.replace(/\/$/, "")}/repos/${report.repository}/statuses/${report.resultCommitSha}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "frame-conn-github-telemetry"
    },
    body: JSON.stringify({
      state: report.statusState,
      context: `frame-conn/telemetry/${slug(report.workflow)}`,
      description: `${report.workflow}: ${report.conclusion}`.slice(0, 140),
      target_url: report.runUrl || undefined
    })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub status publish failed (${response.status}): ${body}`);
  }
  return response.json();
}

async function fetchTerminalFailureEvidence(report, token, apiUrl = "https://api.github.com") {
  if (!report.runId || report.conclusion === "success") return null;
  const endpoint = `${apiUrl.replace(/\/$/, "")}/repos/${report.repository}/actions/runs/${report.runId}/jobs?per_page=100`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "frame-conn-github-telemetry"
    }
  });
  if (!response.ok) return null;
  const payload = await response.json();
  const failedJob = (payload.jobs ?? []).find(job => ["failure", "cancelled", "timed_out"].includes(job.conclusion)) ?? null;
  const failedStep = failedJob?.steps?.find(step => ["failure", "cancelled", "timed_out"].includes(step.conclusion)) ?? null;
  const stage = failedStep?.name || failedJob?.name || "workflow";
  const normalizedStage = stage.toLowerCase();
  const failureClass = normalizedStage.includes("commit") || normalizedStage.includes("push")
    ? "promotion_failure"
    : (normalizedStage.includes("validate") || normalizedStage.includes("audit") || normalizedStage.includes("diff") || normalizedStage.includes("test") || normalizedStage.includes("propagation"))
      ? "validation_failure"
      : "canonical_workflow_failure";
  return {
    failed_stage: stage,
    failure_class: failureClass,
    summary: `${report.workflow} failed at ${stage}.`,
    relevant_evidence: [{
      job: failedJob?.name ?? null,
      step: failedStep?.name ?? null,
      conclusion: failedStep?.conclusion ?? failedJob?.conclusion ?? report.conclusion
    }]
  };
}

async function publishOrchestratorStatus(report, token, apiUrl = "https://api.github.com") {
  if (!report.orchestrator || !token) return;
  const state = report.orchestrator.state;
  const statusStateValue = state === "SUCCEEDED" ? "success" : state === "FAILED" ? "failure" : "error";
  const shortFingerprint = report.orchestrator.request?.fingerprint?.slice(0, 12) || "unknown";
  const stage = report.orchestrator.failure?.failed_stage;
  const description = `${state} request=${shortFingerprint}${stage ? ` stage=${stage}` : ""}`.slice(0, 140);
  const shas = [...new Set([report.triggeringSha, report.resultCommitSha].filter(Boolean))];
  for (const sha of shas) {
    const endpoint = `${apiUrl.replace(/\/$/, "")}/repos/${report.repository}/statuses/${sha}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "frame-conn-toolchain-orchestrator"
      },
      body: JSON.stringify({
        state: statusStateValue,
        context: ORCHESTRATOR_STATUS_CONTEXT,
        description,
        target_url: report.runUrl || undefined
      })
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Orchestrator status publish failed (${response.status}): ${body}`);
    }
  }
}

function printReportSummary(report) {
  const shortSha = report.resultCommitSha ? report.resultCommitSha.slice(0, 12) : "unknown";
  const message = `${report.workflow} -> ${report.conclusion.toUpperCase()} | run ${report.runId ?? "?"} | commit ${shortSha}`;
  console.log(message);
  appendSummary(`## Frame Conn GitHub Telemetry\n\n- **Workflow:** ${report.workflow}\n- **Conclusion:** ${report.conclusion}\n- **Run:** ${report.runId ?? "unknown"}\n- **Result commit:** \`${report.resultCommitSha || "unknown"}\`\n- **Receipt:** ${report.receiptAvailable ? "available" : "fallback to workflow head SHA"}${report.runUrl ? `\n- **Run URL:** ${report.runUrl}` : ""}\n`);
}

function runSelfTest() {
  const fakeReceipt = {
    schemaVersion: 1,
    workflow: "GitHub FilePatcher",
    conclusion: "success",
    runId: 42,
    runAttempt: 1,
    event: "push",
    branch: "main",
    repository: "example/frame-conn",
    triggeringSha: "1111111111111111111111111111111111111111",
    resultCommitSha: "2222222222222222222222222222222222222222"
  };
  const fakeEvent = {
    repository: { full_name: "example/frame-conn" },
    workflow_run: {
      id: 42,
      run_attempt: 1,
      name: "GitHub FilePatcher",
      conclusion: "success",
      event: "push",
      head_branch: "main",
      head_sha: fakeReceipt.triggeringSha,
      html_url: "https://github.example/run/42",
      actor: { login: "github-actions[bot]" },
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:01:00Z"
    }
  };
  const report = buildReport(fakeEvent, fakeReceipt);
  const checks = [
    report.resultCommitSha === fakeReceipt.resultCommitSha,
    report.triggeringSha === fakeReceipt.triggeringSha,
    report.statusState === "success",
    report.receiptAvailable === true,
    statusState("cancelled") === "error",
    slug("GitHub FilePatcher") === "github-filepatcher"
  ];
  if (checks.some(value => !value)) throw new Error("GitHub telemetry self-test failed.");
  console.log("GitHub telemetry self-test passed.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.has("self-test") || args.command === "self-test") {
    runSelfTest();
    return;
  }

  if (args.command === "emit") {
    const receipt = buildReceipt(args);
    const output = stringValue(args, "output", DEFAULT_RECEIPT_NAME);
    writeJson(output, receipt);
    console.log(`Telemetry receipt written: ${output}`);
    console.log(`${receipt.workflow} -> ${receipt.conclusion.toUpperCase()} | result ${receipt.resultCommitSha || "unknown"}`);
    return;
  }

  if (args.command === "publish") {
    const eventPath = stringValue(args, "event-file", process.env.GITHUB_EVENT_PATH);
    if (!eventPath) throw new Error("publish requires --event-file or GITHUB_EVENT_PATH.");
    const eventPayload = readJson(eventPath);
    const receiptPath = findReceipt(args);
    const receipt = receiptPath && fs.existsSync(receiptPath) ? readJson(receiptPath) : null;
    const report = buildReport(eventPayload, receipt);
    const failureEvidence = await fetchTerminalFailureEvidence(report, process.env.GITHUB_TOKEN, process.env.GITHUB_API_URL);
    report.orchestrator = buildTerminalCompletionRecord(report, failureEvidence);
    const output = stringValue(args, "output", DEFAULT_REPORT_NAME);
    writeJson(output, report);
    printReportSummary(report);
    if (!args.flags.has("dry-run")) {
      await publishCommitStatus(report, process.env.GITHUB_TOKEN, process.env.GITHUB_API_URL);
      await publishOrchestratorStatus(report, process.env.GITHUB_TOKEN, process.env.GITHUB_API_URL);
      console.log(`Published terminal telemetry status to ${report.resultCommitSha}.`);
      if (report.orchestrator) console.log(`Published orchestrator closure state ${report.orchestrator.state}.`);
    }
    return;
  }

  throw new Error("Usage: github-telemetry.mjs emit|publish|self-test [options]");
}

main().catch(error => {
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});

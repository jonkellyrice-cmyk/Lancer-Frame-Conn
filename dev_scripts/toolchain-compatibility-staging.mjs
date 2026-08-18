#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const TOOLCHAIN_COMPATIBILITY_STAGING_SCHEMA_VERSION = 1;

function normalizeRepoPath(value) {
  return String(value ?? "").replaceAll("\\", "/").replace(/^\.\//, "");
}

function isToolchainSensitivePath(value) {
  const file = normalizeRepoPath(value);
  return (
    file === "package.json" ||
    file === "dev_scripts/filepatcher.py" ||
    file.startsWith("dev_scripts/") && [".mjs", ".js", ".cjs", ".py"].includes(path.extname(file))
  );
}

function parseSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("Toolchain Compatibility Staging requires a snapshot object.");
  }
  const changes = Array.isArray(snapshot.changes) ? snapshot.changes : [];
  return changes
    .map(change => ({
      path: normalizeRepoPath(change?.path),
      beforeExists: Boolean(change?.beforeExists),
      before: change?.before ?? null,
      afterExists: change?.afterExists !== false,
      after: change?.after ?? null
    }))
    .filter(change => change.path && isToolchainSensitivePath(change.path));
}

function parseSelfTestScripts(packageText) {
  let parsed;
  try { parsed = JSON.parse(packageText); }
  catch (error) { throw new Error(`package.json is invalid while staging toolchain compatibility: ${error.message}`); }

  const output = new Map();
  for (const [name, command] of Object.entries(parsed.scripts ?? {})) {
    if (!name.endsWith(":self-test") || typeof command !== "string") continue;
    const match = command.trim().match(/^node\s+(\.?\/?dev_scripts\/[^\s]+)(.*)$/);
    if (!match) continue;
    const scriptPath = normalizeRepoPath(match[1]);
    const args = match[2].trim() ? match[2].trim().split(/\s+/) : [];
    output.set(scriptPath, { name, args });
  }
  return output;
}

function runNodeCheck(filePath, cwd) {
  const result = spawnSync(process.execPath, ["--check", filePath], { cwd, encoding: "utf8" });
  return {
    ok: !result.error && result.status === 0,
    exit_code: result.status,
    stdout: String(result.stdout ?? "").trim().slice(-1200),
    stderr: String(result.stderr ?? "").trim().slice(-1200)
  };
}

function runNodeSelfTest(filePath, args, cwd) {
  const result = spawnSync(process.execPath, [filePath, ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024
  });
  return {
    ok: !result.error && result.status === 0,
    exit_code: result.status,
    stdout: String(result.stdout ?? "").trim().slice(-1600),
    stderr: String(result.stderr ?? "").trim().slice(-1600)
  };
}

function copyToolchainOverlay(root, overlayRoot) {
  const source = path.join(root, "dev_scripts");
  const target = path.join(overlayRoot, "dev_scripts");
  fs.cpSync(source, target, {
    recursive: true,
    filter: sourcePath => {
      const relative = normalizeRepoPath(path.relative(root, sourcePath));
      return !relative.startsWith("dev_scripts/backups/") &&
        !relative.startsWith("dev_scripts/patch-history/");
    }
  });
  fs.copyFileSync(path.join(root, "package.json"), path.join(overlayRoot, "package.json"));
}

function applyOverlayChanges(overlayRoot, changes) {
  for (const change of changes) {
    if (!["package.json"].includes(change.path) && !change.path.startsWith("dev_scripts/")) continue;
    const target = path.join(overlayRoot, ...change.path.split("/"));
    if (!change.afterExists) {
      if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
      continue;
    }
    if (typeof change.after !== "string") {
      throw new Error(`Toolchain staged content is missing for ${change.path}.`);
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, change.after, "utf8");
  }
}

function packageTextForState(root, changes, state) {
  const packageChange = changes.find(change => change.path === "package.json");
  if (packageChange) {
    const value = state === "before" ? packageChange.before : packageChange.after;
    const exists = state === "before" ? packageChange.beforeExists : packageChange.afterExists;
    if (exists && typeof value === "string") return value;
  }
  return fs.readFileSync(path.join(root, "package.json"), "utf8");
}

function changedScriptPaths(changes) {
  return changes
    .filter(change => change.path.startsWith("dev_scripts/") && [".mjs", ".js", ".cjs"].includes(path.extname(change.path)))
    .map(change => change.path)
    .sort();
}

export function stageToolchainCompatibility(snapshot, options = {}) {
  const root = path.resolve(options.root ?? process.cwd());
  const changes = parseSnapshot(snapshot);
  if (changes.length === 0) {
    return {
      schema_version: TOOLCHAIN_COMPATIBILITY_STAGING_SCHEMA_VERSION,
      kind: "frame_conn_toolchain_compatibility_staging",
      applicable: false,
      compatible: true,
      changed_toolchain_paths: [],
      phases: [],
      blockers: [],
      authority: {
        authoritative_for: ["toolchain_transition_compatibility_sequence"],
        not_authoritative_for: ["mutation", "architectural_planning", "application_validation", "promotion"]
      }
    };
  }

  const scripts = changedScriptPaths(changes);
  const blockers = [];
  const phases = [];

  const currentPackage = packageTextForState(root, changes, "before");
  const currentSelfTests = parseSelfTestScripts(currentPackage);
  const currentChecks = [];

  for (const scriptPath of scripts) {
    const change = changes.find(entry => entry.path === scriptPath);
    if (!change?.beforeExists) continue;
    const absolute = path.join(root, ...scriptPath.split("/"));
    if ([".mjs", ".js", ".cjs"].includes(path.extname(scriptPath)) && fs.existsSync(absolute)) {
      const syntax = runNodeCheck(absolute, root);
      currentChecks.push({ path: scriptPath, check: "syntax", ...syntax });
      if (!syntax.ok) blockers.push({ phase: "current_authority", path: scriptPath, check: "syntax" });
    }
    const selfTest = currentSelfTests.get(scriptPath);
    if (selfTest && fs.existsSync(absolute)) {
      const result = runNodeSelfTest(absolute, selfTest.args, root);
      currentChecks.push({ path: scriptPath, check: selfTest.name, ...result });
      if (!result.ok) blockers.push({ phase: "current_authority", path: scriptPath, check: selfTest.name });
    }
  }
  phases.push({
    id: "current_authority",
    purpose: "Prove changed installed tools are healthy before replacement.",
    status: currentChecks.every(check => check.ok) ? "passed" : "failed",
    checks: currentChecks
  });

  const overlayRoot = fs.mkdtempSync(path.join(os.tmpdir(), "frame-conn-toolchain-overlay-"));
  try {
    copyToolchainOverlay(root, overlayRoot);
    applyOverlayChanges(overlayRoot, changes);

    const proposedSyntaxChecks = [];
    for (const scriptPath of scripts) {
      const change = changes.find(entry => entry.path === scriptPath);
      if (!change?.afterExists) continue;
      const absolute = path.join(overlayRoot, ...scriptPath.split("/"));
      const syntax = runNodeCheck(absolute, overlayRoot);
      proposedSyntaxChecks.push({ path: scriptPath, check: "syntax", ...syntax });
      if (!syntax.ok) blockers.push({ phase: "proposed_syntax", path: scriptPath, check: "syntax" });
    }
    phases.push({
      id: "proposed_syntax",
      purpose: "Parse proposed JavaScript tool files before integration.",
      status: proposedSyntaxChecks.every(check => check.ok) ? "passed" : "failed",
      checks: proposedSyntaxChecks
    });

    const proposedPackage = packageTextForState(root, changes, "after");
    const proposedSelfTests = parseSelfTestScripts(proposedPackage);
    const proposedChecks = [];
    for (const scriptPath of scripts) {
      const change = changes.find(entry => entry.path === scriptPath);
      if (!change?.afterExists) continue;
      const selfTest = proposedSelfTests.get(scriptPath);
      if (!selfTest) continue;
      const absolute = path.join(overlayRoot, ...scriptPath.split("/"));
      const result = runNodeSelfTest(absolute, selfTest.args, overlayRoot);
      proposedChecks.push({ path: scriptPath, check: selfTest.name, ...result });
      if (!result.ok) blockers.push({ phase: "proposed_self_test", path: scriptPath, check: selfTest.name });
    }
    phases.push({
      id: "proposed_self_test",
      purpose: "Run registered self-tests against the proposed isolated tool overlay.",
      status: proposedChecks.every(check => check.ok) ? "passed" : "failed",
      checks: proposedChecks
    });
  } finally {
    fs.rmSync(overlayRoot, { recursive: true, force: true });
  }

  const compatible = blockers.length === 0;
  phases.push({
    id: "integration",
    purpose: "Hand the compatibility-certified transition back to FilePatcher.",
    status: compatible ? "ready" : "blocked",
    checks: []
  });

  return {
    schema_version: TOOLCHAIN_COMPATIBILITY_STAGING_SCHEMA_VERSION,
    kind: "frame_conn_toolchain_compatibility_staging",
    applicable: true,
    compatible,
    changed_toolchain_paths: changes.map(change => change.path).sort(),
    phases,
    blockers,
    permitted_next_action: compatible ? "canonical_filepatcher_continue" : "modify_request",
    authority: {
      authoritative_for: [
        "toolchain_transition_compatibility_sequence",
        "current_tool_health_before_replacement",
        "proposed_tool_syntax",
        "registered_proposed_tool_self_tests"
      ],
      not_authoritative_for: [
        "mutation",
        "architectural_planning",
        "application_validation",
        "promotion",
        "bootstrap_generations"
      ]
    }
  };
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

function selfTest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "frame-conn-toolchain-staging-test-"));
  try {
    fs.mkdirSync(path.join(root, "dev_scripts"), { recursive: true });
    fs.writeFileSync(path.join(root, "dev_scripts", "sample-tool.mjs"),
      'if (process.argv.includes("--self-test")) console.log("old ok");\n', "utf8");
    fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({
      scripts: { "sample:self-test": "node ./dev_scripts/sample-tool.mjs --self-test" }
    }, null, 2), "utf8");

    const good = stageToolchainCompatibility({
      changes: [{
        path: "dev_scripts/sample-tool.mjs",
        beforeExists: true,
        before: 'if (process.argv.includes("--self-test")) console.log("old ok");\n',
        afterExists: true,
        after: 'if (process.argv.includes("--self-test")) console.log("new ok");\n'
      }]
    }, { root });
    if (!good.applicable || !good.compatible || good.phases.at(-1)?.status !== "ready") {
      throw new Error("Compatible staged tool transition was rejected.");
    }

    const bad = stageToolchainCompatibility({
      changes: [{
        path: "dev_scripts/sample-tool.mjs",
        beforeExists: true,
        before: 'if (process.argv.includes("--self-test")) console.log("old ok");\n',
        afterExists: true,
        after: "export const = ;\n"
      }]
    }, { root });
    if (bad.compatible || !bad.blockers.some(entry => entry.phase === "proposed_syntax")) {
      throw new Error("Invalid proposed tool syntax was not blocked.");
    }

    const irrelevant = stageToolchainCompatibility({
      changes: [{ path: "scripts/example.js", beforeExists: true, before: "a", afterExists: true, after: "b" }]
    }, { root });
    if (irrelevant.applicable || !irrelevant.compatible) {
      throw new Error("Non-toolchain changes should be a compatible no-op.");
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
  console.log("Toolchain Compatibility Staging self-test passed.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.has("self-test")) return selfTest();
  const snapshotPath = String(args.values.get("snapshot") ?? "").trim();
  if (!snapshotPath) throw new Error("Usage: toolchain-compatibility-staging.mjs --snapshot transition.json [--output report.json] [--self-test]");
  const snapshot = JSON.parse(fs.readFileSync(path.resolve(snapshotPath), "utf8"));
  const report = stageToolchainCompatibility(snapshot);
  const output = String(args.values.get("output") ?? "").trim();
  if (output) fs.writeFileSync(path.resolve(output), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.compatible) process.exitCode = 2;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error?.stack || String(error)); process.exitCode = 1; });
}

#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const PATCH_AUTHORING_COMPILER_SCHEMA_VERSION = 1;
export const DEFAULT_REQUEST_PATH = "dev_scripts/github-filepatcher.json";

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
}

function normalizeRepoPath(value) {
  const normalized = String(value ?? "").trim().replaceAll("\\", "/").replace(/^\.\//, "");
  if (!normalized || normalized === "." || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error(`Patch Authoring Compiler received invalid repository path: ${value}`);
  }
  return normalized;
}

function strings(value) {
  return [...new Set((Array.isArray(value) ? value : value == null ? [] : [value])
    .map(item => String(item).trim()).filter(Boolean))];
}

function readJson(filePath, label, required = true) {
  if (!filePath) {
    if (required) throw new Error(`${label} path is required.`);
    return null;
  }
  const absolute = path.resolve(filePath);
  if (!fs.existsSync(absolute)) {
    if (required) throw new Error(`${label} not found: ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function readRepositoryFile(root, repoPath) {
  const absolute = path.resolve(root, repoPath);
  const relative = path.relative(root, absolute);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Authoring target escapes repository root: ${repoPath}`);
  }
  if (!fs.existsSync(absolute)) return { exists: false, content: null, sha256: null };
  if (!fs.statSync(absolute).isFile()) throw new Error(`Authoring target is not a regular file: ${repoPath}`);
  const content = fs.readFileSync(absolute, "utf8");
  return { exists: true, content, sha256: sha256Text(content) };
}

function corridorFiles(corridor) {
  if (!corridor) return null;
  const entries = Array.isArray(corridor.files) ? corridor.files : [];
  return new Set(entries.map(entry => normalizeRepoPath(typeof entry === "string" ? entry : entry?.file)).filter(Boolean));
}

function contextSnapshotMap(context) {
  const output = new Map();
  for (const entry of context?.snapshot?.files ?? []) {
    if (!entry?.file || !entry?.sha256) continue;
    output.set(normalizeRepoPath(entry.file), String(entry.sha256).toLowerCase());
  }
  return output;
}

function requestEnvelopeScope(envelope, request) {
  const values = [
    ...(envelope?.scope?.explicit ?? []),
    ...(envelope?.scope?.allowed_paths ?? []),
    ...(request?.scope ?? []),
    ...(request?.policy?.allowed_paths ?? [])
  ].filter(Boolean).map(normalizeRepoPath);
  return values.length ? new Set(values) : null;
}

function assertAuthoringScope(pathValue, allowedScope, certifiedCorridor, options) {
  if (allowedScope && !allowedScope.has(pathValue)) {
    throw new Error(`Authoring target is outside Request Envelope/declared scope: ${pathValue}`);
  }
  if (
    certifiedCorridor &&
    certifiedCorridor.size > 0 &&
    !certifiedCorridor.has(pathValue) &&
    !options.allowOutsideCorridor
  ) {
    throw new Error(`Authoring target is outside the certified Patch Corridor: ${pathValue}`);
  }
}

function sourceGuardFor(pathValue, repositoryState, snapshotMap, guardedPaths) {
  if (!repositoryState.exists || guardedPaths.has(pathValue)) return undefined;
  const snapshotHash = snapshotMap.get(pathValue);
  if (snapshotHash && snapshotHash !== repositoryState.sha256.toLowerCase()) {
    throw new Error(
      `Context snapshot drift for ${pathValue}. Context=${snapshotHash}, current=${repositoryState.sha256}`
    );
  }
  guardedPaths.add(pathValue);
  return repositoryState.sha256;
}

function exactOccurrenceCount(text, search) {
  if (!search) return 0;
  return text.split(search).length - 1;
}

function compileEdit(edit, state) {
  if (!edit || typeof edit !== "object" || Array.isArray(edit)) {
    throw new Error("Each authoring_intent edit must be an object.");
  }
  const kind = String(edit.kind ?? edit.type ?? "").trim();
  const targetPath = normalizeRepoPath(edit.path);
  assertAuthoringScope(targetPath, state.allowedScope, state.certifiedCorridor, state.options);

  const repositoryState = readRepositoryFile(state.root, targetPath);
  const expectedSha256 = sourceGuardFor(
    targetPath,
    repositoryState,
    state.snapshotMap,
    state.guardedPaths
  );
  const withGuard = operation => expectedSha256 ? { ...operation, expected_sha256: expectedSha256 } : operation;

  if (kind === "create_file") {
    if (repositoryState.exists && edit.overwrite !== true) {
      throw new Error(`create_file target already exists: ${targetPath}`);
    }
    if (typeof edit.content !== "string") throw new Error(`create_file requires string content: ${targetPath}`);
    return {
      operation: {
        type: "create_file",
        path: targetPath,
        content: edit.content,
        ...(edit.encoding ? { encoding: edit.encoding } : {}),
        ...(edit.overwrite === true ? { overwrite: true } : {})
      },
      preview: edit.content,
      primitive: kind
    };
  }

  if (kind === "replace_file") {
    if (!repositoryState.exists) throw new Error(`replace_file target does not exist: ${targetPath}`);
    if (typeof edit.content !== "string") throw new Error(`replace_file requires string content: ${targetPath}`);
    return {
      operation: withGuard({
        type: "replace_file",
        path: targetPath,
        content: edit.content,
        ...(edit.encoding ? { encoding: edit.encoding } : {})
      }),
      preview: edit.content,
      primitive: kind
    };
  }

  if (!repositoryState.exists) throw new Error(`${kind} target does not exist: ${targetPath}`);
  const search = String(edit.search ?? "");
  if (!search) throw new Error(`${kind} requires non-empty search text: ${targetPath}`);
  const occurrences = exactOccurrenceCount(repositoryState.content, search);
  const expectedOccurrences = edit.expected_occurrences ?? 1;
  if (!Number.isInteger(expectedOccurrences) || expectedOccurrences < 1) {
    throw new Error(`${kind} expected_occurrences must be a positive integer: ${targetPath}`);
  }
  if (occurrences !== expectedOccurrences) {
    throw new Error(
      `${kind} expected ${expectedOccurrences} occurrence(s) in ${targetPath}, found ${occurrences}.`
    );
  }

  let replacement;
  if (kind === "replace_exact") {
    if (typeof edit.replace !== "string") throw new Error(`replace_exact requires replace text: ${targetPath}`);
    replacement = edit.replace;
  } else if (kind === "insert_before_exact") {
    if (typeof edit.content !== "string") throw new Error(`insert_before_exact requires content: ${targetPath}`);
    replacement = `${edit.content}${search}`;
  } else if (kind === "insert_after_exact") {
    if (typeof edit.content !== "string") throw new Error(`insert_after_exact requires content: ${targetPath}`);
    replacement = `${search}${edit.content}`;
  } else if (kind === "delete_exact") {
    replacement = "";
  } else {
    throw new Error(`Unsupported authoring primitive "${kind}".`);
  }

  return {
    operation: withGuard({
      type: "replace_text",
      path: targetPath,
      search,
      replace: replacement,
      expected_occurrences: expectedOccurrences
    }),
    preview: repositoryState.content.split(search).join(replacement),
    primitive: kind
  };
}

export function compileAuthoringRequest({
  root = process.cwd(),
  request,
  envelope = null,
  context = null,
  corridor = null,
  corridorContext = null,
  allowOutsideCorridor = false
}) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new Error("Patch Authoring Compiler requires a request object.");
  }
  const intent = request.authoring_intent;
  if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
    throw new Error("Request does not contain an authoring_intent object.");
  }
  const edits = intent.edits;
  if (!Array.isArray(edits) || edits.length === 0) {
    throw new Error("authoring_intent.edits must contain at least one explicit semantic edit.");
  }

  const state = {
    root: path.resolve(root),
    allowedScope: requestEnvelopeScope(envelope, request),
    certifiedCorridor: corridorFiles(corridor),
    snapshotMap: contextSnapshotMap(context),
    guardedPaths: new Set(),
    options: { allowOutsideCorridor }
  };

  const compiledOperations = [];
  const primitives = [];
  for (const edit of edits) {
    const compiled = compileEdit(edit, state);
    compiledOperations.push(compiled.operation);
    primitives.push({ path: compiled.operation.path, primitive: compiled.primitive });
  }

  const changedPaths = [...new Set(compiledOperations.map(operation => operation.path))].sort();
  const maxFilesChanged = request?.policy?.max_files_changed ?? changedPaths.length;
  if (changedPaths.length > maxFilesChanged) {
    throw new Error(
      `Compiled authoring intent changes ${changedPaths.length} files but policy.max_files_changed=${maxFilesChanged}.`
    );
  }

  const compiledPatch = {
    schema_version: 2,
    id: request.id ?? intent.id ?? "compiled-authoring-request",
    description: request.description ?? intent.description ?? "Compiled by Patch Authoring Compiler.",
    ...(request.planning_goal ? { planning_goal: request.planning_goal } : {}),
    ...(request.goal ? { goal: request.goal } : {}),
    ...(request.acceptance_criteria ? { acceptance_criteria: request.acceptance_criteria } : {}),
    ...(request.non_goals ? { non_goals: request.non_goals } : {}),
    policy: {
      ...(request.policy ?? {}),
      max_files_changed: maxFilesChanged,
      allowed_paths: request?.policy?.allowed_paths ?? changedPaths
    },
    operations: compiledOperations,
    compiled_authoring: {
      schema_version: PATCH_AUTHORING_COMPILER_SCHEMA_VERSION,
      request_fingerprint: envelope?.request?.fingerprint ?? null,
      context_snapshot_fingerprint: context?.snapshot?.fingerprint ?? null,
      corridor_certified: Boolean(corridor),
      corridor_context_present: Boolean(corridorContext),
      corridor_context_fingerprint: corridorContext
        ? sha256Text(JSON.stringify(stable(corridorContext)))
        : null,
      primitives
    }
  };

  return {
    schema_version: PATCH_AUTHORING_COMPILER_SCHEMA_VERSION,
    kind: "frame_conn_patch_authoring_compilation",
    compiled_patch: compiledPatch,
    changed_paths: changedPaths,
    primitive_count: primitives.length,
    compilation_fingerprint: sha256Text(JSON.stringify(stable(compiledPatch))),
    authority: {
      authoritative_for: [
        "explicit_semantic_edit_compilation",
        "filepatcher_operation_generation",
        "source_sha_preconditions",
        "declared_scope_enforcement",
        "context_snapshot_drift_detection"
      ],
      not_authoritative_for: [
        "architectural_ownership",
        "patch_corridor_certification",
        "semantic_edit_invention",
        "mutation_execution",
        "validation",
        "promotion"
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "frame-conn-patch-authoring-"));
  try {
    fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
    const source = "export const VALUE = 1;\n";
    fs.writeFileSync(path.join(root, "scripts", "example.js"), source, "utf8");

    const request = {
      schema_version: 2,
      id: "example",
      planning_goal: "Change VALUE through an explicit semantic edit.",
      policy: { max_files_changed: 1, allowed_paths: ["scripts/example.js"] },
      authoring_intent: {
        edits: [{
          kind: "replace_exact",
          path: "scripts/example.js",
          search: "export const VALUE = 1;",
          replace: "export const VALUE = 2;"
        }]
      },
      operations: []
    };
    const envelope = { request: { fingerprint: "f".repeat(64) }, scope: { allowed_paths: ["scripts/example.js"] } };
    const context = {
      snapshot: {
        fingerprint: "c".repeat(64),
        files: [{ file: "scripts/example.js", sha256: sha256Text(source) }]
      }
    };
    const corridor = { files: [{ file: "scripts/example.js" }] };
    const result = compileAuthoringRequest({ root, request, envelope, context, corridor });
    const operation = result.compiled_patch.operations[0];

    if (
      operation.type !== "replace_text" ||
      operation.expected_sha256 !== sha256Text(source) ||
      result.compiled_patch.policy.allowed_paths[0] !== "scripts/example.js" ||
      result.primitive_count !== 1 ||
      !/^[a-f0-9]{64}$/.test(result.compilation_fingerprint)
    ) throw new Error("Patch Authoring Compiler self-test failed.");

    fs.writeFileSync(path.join(root, "scripts", "example.js"), "export const VALUE = 9;\n", "utf8");
    let driftBlocked = false;
    try { compileAuthoringRequest({ root, request, envelope, context, corridor }); }
    catch (error) { driftBlocked = /snapshot drift/i.test(String(error)); }
    if (!driftBlocked) throw new Error("Patch Authoring Compiler failed to block snapshot drift.");

    console.log("Patch Authoring Compiler self-test passed.");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.has("self-test")) return selfTest();

  const requestPath = String(args.values.get("request") ?? DEFAULT_REQUEST_PATH);
  const envelopePath = String(args.values.get("envelope") ?? "").trim();
  const contextPath = String(args.values.get("context") ?? "").trim();
  const corridorPath = String(args.values.get("corridor") ?? "").trim();
  const corridorContextPath = String(args.values.get("corridor-context") ?? "").trim();
  const outputPath = String(args.values.get("output") ?? "").trim();

  const request = readJson(requestPath, "Request");
  const envelope = readJson(envelopePath, "Request Envelope", false);
  const context = readJson(contextPath, "Assistant Context packet", false);
  const corridor = readJson(corridorPath, "Patch Corridor", false);
  const corridorContext = readJson(corridorContextPath, "Corridor Context Pack", false);

  const result = compileAuthoringRequest({
    root: process.cwd(),
    request,
    envelope,
    context,
    corridor,
    corridorContext,
    allowOutsideCorridor: args.flags.has("allow-outside-corridor")
  });

  if (outputPath) {
    fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
    fs.writeFileSync(path.resolve(outputPath), `${JSON.stringify(result.compiled_patch, null, 2)}\n`, "utf8");
  } else {
    process.stdout.write(`${JSON.stringify(result.compiled_patch, null, 2)}\n`);
  }

  console.log(`patch_authoring_compilation=${result.compilation_fingerprint.slice(0, 12)}`);
  console.log(`compiled_operations=${result.compiled_patch.operations.length}`);
  console.log(`compiled_files=${result.changed_paths.length}`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {
    console.error(error?.stack || String(error));
    process.exitCode = 1;
  });
}

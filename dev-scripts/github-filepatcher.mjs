import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const PATCH_FILE = path.join(ROOT, "dev-scripts", "filepatcher.json");
const DEFAULT_MAX_FILES_CHANGED = 1;
const DEFAULT_PROTECTED_PATHS = [".git", ".github/workflows", "node_modules"];
const DRY_RUN = new Set(process.argv.slice(2)).has("--dry-run");

const fail = (message) => { throw new Error(`[github-filepatcher] ${message}`); };

function normalizeRepoPath(value) {
  if (typeof value !== "string" || !value.trim()) fail("Patch operation is missing a valid path.");
  const relative = path.relative(ROOT, path.resolve(ROOT, value));
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`Path escapes repository root or targets repository root: ${value}`);
  }
  return relative.split(path.sep).join("/");
}

const resolveRepoPath = (value) => path.join(ROOT, ...normalizeRepoPath(value).split("/"));
const normalizeProtectedPath = (value) => {
  if (typeof value !== "string" || !value.trim()) fail("Protected paths must be non-empty strings.");
  return value.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+$/, "");
};

function isProtectedPath(value, protectedPaths) {
  const target = normalizeRepoPath(value);
  return protectedPaths.some((entry) => {
    const protectedPath = normalizeProtectedPath(entry);
    return target === protectedPath || target.startsWith(`${protectedPath}/`);
  });
}

const sha256 = (content) => crypto.createHash("sha256").update(content, "utf8").digest("hex");

function decodeContent(operation, operationName) {
  if (typeof operation.content !== "string") fail(`${operationName} requires string content: ${operation.path}`);
  const encoding = operation.encoding ?? "utf8";
  if (encoding === "utf8") return operation.content;
  if (encoding === "base64") return Buffer.from(operation.content, "base64").toString("utf8");
  fail(`${operationName} has unsupported encoding "${encoding}": ${operation.path}`);
}

function readPatchFile() {
  if (!fs.existsSync(PATCH_FILE)) fail(`Patch file not found: ${PATCH_FILE}`);
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(PATCH_FILE, "utf8")); }
  catch (error) { fail(`Unable to parse filepatcher.json: ${error}`); }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) fail("filepatcher.json must contain an object.");
  const schemaVersion = parsed.schema_version ?? 1;
  if (![1, 2].includes(schemaVersion)) fail(`Unsupported schema_version: ${schemaVersion}`);
  if (!Array.isArray(parsed.operations)) fail("filepatcher.json must contain an operations array.");
  if (parsed.id !== undefined && (typeof parsed.id !== "string" || !parsed.id.trim())) fail("Patch id must be a non-empty string when provided.");
  if (parsed.description !== undefined && typeof parsed.description !== "string") fail("Patch description must be a string when provided.");

  const policy = parsed.policy ?? {};
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) fail("policy must be an object when provided.");
  const maxFilesChanged = policy.max_files_changed ?? DEFAULT_MAX_FILES_CHANGED;
  if (!Number.isInteger(maxFilesChanged) || maxFilesChanged < 1) fail("policy.max_files_changed must be a positive integer.");
  const additionalProtectedPaths = policy.protected_paths ?? [];
  if (!Array.isArray(additionalProtectedPaths) || additionalProtectedPaths.some((entry) => typeof entry !== "string")) {
    fail("policy.protected_paths must be an array of strings.");
  }

  return {
    id: parsed.id,
    description: parsed.description,
    operations: parsed.operations,
    policy: {
      maxFilesChanged,
      protectedPaths: [...DEFAULT_PROTECTED_PATHS, ...additionalProtectedPaths],
    },
  };
}

function readExistingFile(relativePath) {
  const absolutePath = resolveRepoPath(relativePath);
  if (!fs.existsSync(absolutePath)) return { exists: false, content: undefined };
  if (!fs.statSync(absolutePath).isFile()) fail(`Target exists but is not a regular file: ${relativePath}`);
  return { exists: true, content: fs.readFileSync(absolutePath, "utf8") };
}

function validateExpectedSha256(operation, existingContent) {
  if (operation.expected_sha256 === undefined) return;
  if (typeof operation.expected_sha256 !== "string" || !/^[a-fA-F0-9]{64}$/.test(operation.expected_sha256)) {
    fail(`expected_sha256 must be a 64-character hex SHA-256 digest: ${operation.path}`);
  }
  if (existingContent === undefined) fail(`expected_sha256 cannot be checked because file does not exist: ${operation.path}`);
  const actual = sha256(existingContent);
  if (actual.toLowerCase() !== operation.expected_sha256.toLowerCase()) {
    fail(`SHA-256 precondition failed for ${operation.path}. Expected ${operation.expected_sha256}, found ${actual}.`);
  }
}

function planOperation(operation, existing) {
  validateExpectedSha256(operation, existing.content);

  if (operation.type === "create_file") {
    if (existing.exists && operation.overwrite !== true) fail(`create_file refused to overwrite existing file: ${operation.path}`);
    if (!existing.exists && operation.expected_sha256 !== undefined) fail(`create_file cannot use expected_sha256 when target does not exist: ${operation.path}`);
    return decodeContent(operation, "create_file");
  }

  if (operation.type === "replace_file") {
    if (!existing.exists) fail(`replace_file target does not exist: ${operation.path}`);
    return decodeContent(operation, "replace_file");
  }

  if (operation.type === "replace_text") {
    if (!existing.exists) fail(`replace_text target does not exist: ${operation.path}`);
    if (typeof operation.search !== "string" || !operation.search.length) fail(`replace_text requires non-empty string search text: ${operation.path}`);
    if (typeof operation.replace !== "string") fail(`replace_text requires string replacement text: ${operation.path}`);
    const occurrences = existing.content.split(operation.search).length - 1;
    if (occurrences === 0) fail(`replace_text search text not found: ${operation.path}`);
    if (operation.expected_occurrences !== undefined) {
      if (!Number.isInteger(operation.expected_occurrences) || operation.expected_occurrences < 1) fail(`expected_occurrences must be a positive integer: ${operation.path}`);
      if (occurrences !== operation.expected_occurrences) fail(`replace_text expected ${operation.expected_occurrences} occurrence(s) but found ${occurrences}: ${operation.path}`);
    } else if (occurrences !== 1) {
      fail(`replace_text is ambiguous; found ${occurrences} occurrences. Specify expected_occurrences explicitly: ${operation.path}`);
    }
    return existing.content.split(operation.search).join(operation.replace);
  }

  fail(`Unsupported operation type: ${String(operation.type)}`);
}

function normalizeTextMigrationStrings(values, fieldName) {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== "string" || !value)) {
    fail(`${fieldName} must be a non-empty array of non-empty strings.`);
  }
  return values;
}

function pathMatchesExclusion(relativePath, exclusions) {
  return exclusions.some((entry) => (
    relativePath === entry ||
    relativePath.startsWith(`${entry}/`)
  ));
}

function collectTextMigrationFiles(rootPath, extensions, exclusions, protectedPaths) {
  const root = resolveRepoPath(rootPath);
  if (!fs.existsSync(root)) fail(`replace_tree_text root does not exist: ${rootPath}`);

  const files = [];
  const visit = (absolutePath) => {
    const relativePath = path.relative(ROOT, absolutePath).split(path.sep).join("/");
    if (pathMatchesExclusion(relativePath, exclusions)) return;
    if (isProtectedPath(relativePath, protectedPaths)) return;

    const stat = fs.statSync(absolutePath);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(absolutePath).sort()) {
        visit(path.join(absolutePath, entry));
      }
      return;
    }

    if (!stat.isFile()) return;
    if (!extensions.includes(path.extname(relativePath).toLowerCase())) return;
    files.push(relativePath);
  };

  visit(root);
  return files;
}

function planTreeTextOperation(operation, patch, stagedFiles, originalFiles) {
  const roots = normalizeTextMigrationStrings(operation.roots, "replace_tree_text.roots")
    .map((value) => normalizeRepoPath(value));

  if (!Array.isArray(operation.excludes ?? [])) fail("replace_tree_text.excludes must be an array of strings.");
  const exclusions = (operation.excludes ?? []).map((value) => normalizeProtectedPath(value));
  if (exclusions.some((value) => !value)) fail("replace_tree_text.excludes must contain non-empty strings.");

  const extensions = operation.extensions ?? [".js", ".mjs", ".css", ".json", ".md", ".yml", ".yaml"];
  normalizeTextMigrationStrings(extensions, "replace_tree_text.extensions");
  const normalizedExtensions = extensions.map((value) => value.startsWith(".") ? value.toLowerCase() : `.${value.toLowerCase()}`);

  if (!Array.isArray(operation.replacements) || operation.replacements.length === 0) {
    fail("replace_tree_text.replacements must be a non-empty array.");
  }

  const replacements = operation.replacements.map((replacement, index) => {
    if (!replacement || typeof replacement !== "object" || Array.isArray(replacement)) {
      fail(`replace_tree_text replacement ${index + 1} must be an object.`);
    }
    if (typeof replacement.search !== "string" || !replacement.search.length) {
      fail(`replace_tree_text replacement ${index + 1} requires non-empty search text.`);
    }
    if (typeof replacement.replace !== "string") {
      fail(`replace_tree_text replacement ${index + 1} requires string replacement text.`);
    }
    return replacement;
  });

  const occurrenceCounts = new Map(replacements.map((replacement) => [replacement.search, 0]));
  const files = [...new Set(
    roots.flatMap((rootPath) =>
      collectTextMigrationFiles(rootPath, normalizedExtensions, exclusions, patch.policy.protectedPaths)
    )
  )].sort();

  for (const relativePath of files) {
    let existing;
    if (stagedFiles.has(relativePath)) {
      existing = { exists: true, content: stagedFiles.get(relativePath) };
    } else {
      existing = readExistingFile(relativePath);
      originalFiles.set(relativePath, existing);
    }

    if (!existing.exists) continue;
    let nextContent = existing.content;

    for (const replacement of replacements) {
      const occurrences = nextContent.split(replacement.search).length - 1;
      occurrenceCounts.set(
        replacement.search,
        occurrenceCounts.get(replacement.search) + occurrences
      );
      if (occurrences > 0) {
        nextContent = nextContent.split(replacement.search).join(replacement.replace);
      }
    }

    stagedFiles.set(relativePath, nextContent);
  }

  if (operation.require_each_search !== false) {
    for (const replacement of replacements) {
      if (occurrenceCounts.get(replacement.search) === 0) {
        fail(`replace_tree_text search text not found anywhere in selected roots: ${replacement.search}`);
      }
    }
  }

  const assertAbsent = operation.assert_absent ?? replacements.map((replacement) => replacement.search);
  if (!Array.isArray(assertAbsent) || assertAbsent.some((value) => typeof value !== "string" || !value)) {
    fail("replace_tree_text.assert_absent must be an array of non-empty strings.");
  }

  for (const relativePath of files) {
    const content = stagedFiles.get(relativePath);
    if (content === undefined) continue;
    for (const forbidden of assertAbsent) {
      if (content.includes(forbidden)) {
        fail(`replace_tree_text postcondition failed; "${forbidden}" remains in ${relativePath}`);
      }
    }
  }
}

function buildMutationPlan(patch) {
  const stagedFiles = new Map();
  const originalFiles = new Map();

  patch.operations.forEach((operation, index) => {
    if (!operation || typeof operation !== "object" || Array.isArray(operation)) fail(`Operation ${index + 1} is not an object.`);

    if (operation.type === "replace_tree_text") {
      planTreeTextOperation(operation, patch, stagedFiles, originalFiles);
      return;
    }

    const relativePath = normalizeRepoPath(operation.path);
    if (isProtectedPath(relativePath, patch.policy.protectedPaths)) fail(`Operation targets protected path: ${relativePath}`);

    let existing;
    if (stagedFiles.has(relativePath)) existing = { exists: true, content: stagedFiles.get(relativePath) };
    else {
      existing = readExistingFile(relativePath);
      originalFiles.set(relativePath, existing);
    }

    stagedFiles.set(relativePath, planOperation(operation, existing));
  });

  const changedFiles = [...stagedFiles.entries()]
    .filter(([relativePath, nextContent]) => {
      const original = originalFiles.get(relativePath);
      return (original?.exists ? original.content : undefined) !== nextContent;
    })
    .map(([relativePath]) => relativePath);

  if (changedFiles.length > patch.policy.maxFilesChanged) {
    fail(`Patch changes ${changedFiles.length} files, exceeding policy.max_files_changed=${patch.policy.maxFilesChanged}.`);
  }

  return { stagedFiles, originalFiles, changedFiles };
}

function applyMutationPlan(plan) {
  const written = [];
  try {
    for (const relativePath of plan.changedFiles) {
      const absolutePath = resolveRepoPath(relativePath);
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, plan.stagedFiles.get(relativePath), "utf8");
      written.push(relativePath);
    }
  } catch (error) {
    for (const relativePath of written.reverse()) {
      const original = plan.originalFiles.get(relativePath);
      const absolutePath = resolveRepoPath(relativePath);
      try {
        if (original?.exists) {
          fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
          fs.writeFileSync(absolutePath, original.content, "utf8");
        } else if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
      } catch (rollbackError) {
        console.error(`[github-filepatcher] rollback failed for ${relativePath}: ${rollbackError}`);
      }
    }
    fail(`Patch commit failed and rollback was attempted: ${error}`);
  }
}

function rollbackMutationPlan(plan) {
  const rollbackErrors = [];

  for (const relativePath of [...plan.changedFiles].reverse()) {
    const original = plan.originalFiles.get(relativePath);
    const absolutePath = resolveRepoPath(relativePath);

    try {
      if (original?.exists) {
        fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
        fs.writeFileSync(absolutePath, original.content, "utf8");
      } else if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (error) {
      rollbackErrors.push(`${relativePath}: ${error}`);
    }
  }

  if (rollbackErrors.length > 0) {
    fail(`Repository-audit rollback encountered error(s): ${rollbackErrors.join(" | ")}`);
  }
}

function runRepositoryAudit() {
  const auditScript = path.join(ROOT, "dev_scripts", "repo-audit.mjs");
  if (!fs.existsSync(auditScript)) fail(`Repository audit script not found: ${auditScript}`);

  const outputFile = path.join(os.tmpdir(), `frame-conn-repo-audit-${process.pid}.json`);
  const result = spawnSync(
    process.execPath,
    [auditScript, "--output", outputFile],
    { cwd: ROOT, encoding: "utf8" }
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.error) {
    fail(`Repository audit could not start: ${result.error}`);
  }

  if (result.status !== 0) {
    let report = "";
    try {
      if (fs.existsSync(outputFile)) report = fs.readFileSync(outputFile, "utf8");
    } catch {}

    if (report) console.error(`[github-filepatcher] Repository audit findings:\n${report}`);
    fail(`Repository audit failed with exit code ${result.status}.`);
  }

  console.log("[github-filepatcher] Repository audit passed.");
}

function runSymbolFamilyAudit() {
  const auditScript = path.join(ROOT, "dev_scripts", "symbol-family-audit.mjs");
  if (!fs.existsSync(auditScript)) fail(`Symbol family audit script not found: ${auditScript}`);

  const outputFile = path.join(os.tmpdir(), `frame-conn-symbol-family-audit-${process.pid}.json`);
  const result = spawnSync(
    process.execPath,
    [auditScript, "--output", outputFile],
    { cwd: ROOT, encoding: "utf8" }
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.error) {
    fail(`Symbol family audit could not start: ${result.error}`);
  }

  if (result.status !== 0) {
    let report = "";
    try {
      if (fs.existsSync(outputFile)) report = fs.readFileSync(outputFile, "utf8");
    } catch {}

    if (report) console.error(`[github-filepatcher] Symbol family audit findings:\n${report}`);
    fail(`Symbol family audit failed with exit code ${result.status}.`);
  }

  console.log("[github-filepatcher] Symbol family audit passed.");
}

function runEffectAtlasAudit() {
  const auditScript = path.join(ROOT, "dev_scripts", "effect-atlas.mjs");
  if (!fs.existsSync(auditScript)) fail(`Effect atlas script not found: ${auditScript}`);

  const outputFile = path.join(os.tmpdir(), `frame-conn-effect-atlas-${process.pid}.json`);
  const result = spawnSync(
    process.execPath,
    [auditScript, "--output", outputFile],
    { cwd: ROOT, encoding: "utf8" }
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.error) {
    fail(`Effect atlas could not start: ${result.error}`);
  }

  if (result.status !== 0) {
    let report = "";
    try {
      if (fs.existsSync(outputFile)) report = fs.readFileSync(outputFile, "utf8");
    } catch {}

    if (report) console.error(`[github-filepatcher] Effect atlas findings:\n${report}`);
    fail(`Effect atlas failed with exit code ${result.status}.`);
  }

  console.log("[github-filepatcher] Effect atlas passed.");
}

function main() {
  try {
    const patch = readPatchFile();
    const plan = buildMutationPlan(patch);
    console.log(`[github-filepatcher] patch=${patch.id ?? "unnamed"}`);
    if (patch.description) console.log(`[github-filepatcher] description=${patch.description}`);
    console.log(`[github-filepatcher] operations=${patch.operations.length}`);
    console.log(`[github-filepatcher] changed_files=${plan.changedFiles.length}`);
    plan.changedFiles.forEach((file) => console.log(`[github-filepatcher] change=${file}`));

    if (DRY_RUN) {
      console.log("[github-filepatcher] Dry run completed successfully. No files were written.");
      return;
    }

    applyMutationPlan(plan);

    try {
      runRepositoryAudit();
      runSymbolFamilyAudit();
      runEffectAtlasAudit();
    } catch (auditError) {
      console.error("[github-filepatcher] Post-apply audit failed; rolling back applied patch.");
      rollbackMutationPlan(plan);
      throw auditError;
    }

    console.log("[github-filepatcher] Patch completed successfully.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();

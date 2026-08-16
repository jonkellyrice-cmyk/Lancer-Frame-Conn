#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const REPO_ROOT = process.cwd();
const PLAN_PATH = path.join(REPO_ROOT, "dev-scripts", "path-mover.json");
const SOURCE_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx"]);
const RESOLUTION_EXTENSIONS = ["", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json"];

function fail(message) {
  console.error(`[path-mover] ${message}`);
  process.exit(1);
}

function normalizeRepoPath(value) {
  return String(value ?? "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/\/$/, "");
}

function absolute(repoPath) {
  return path.resolve(REPO_ROOT, normalizeRepoPath(repoPath));
}

function assertInsideRepo(targetPath) {
  const relative = path.relative(REPO_ROOT, targetPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`Path escapes repository: ${targetPath}`);
  }
}

function listFilesRecursively(rootPath) {
  const output = [];
  if (!fs.existsSync(rootPath)) return output;
  const stack = [rootPath];
  while (stack.length) {
    const current = stack.pop();
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(current)) {
        if (entry === ".git" || entry === "node_modules") continue;
        stack.push(path.join(current, entry));
      }
    } else if (stat.isFile()) {
      output.push(current);
    }
  }
  return output;
}

function resolveModuleTarget(importerAbsolutePath, specifier) {
  if (!specifier.startsWith(".")) return null;
  const base = path.resolve(path.dirname(importerAbsolutePath), specifier);
  for (const extension of RESOLUTION_EXTENSIONS) {
    const candidate = `${base}${extension}`;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  for (const extension of RESOLUTION_EXTENSIONS.slice(1)) {
    const candidate = path.join(base, `index${extension}`);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function relativeModuleSpecifier(importerAbsolutePath, targetAbsolutePath, originalSpecifier) {
  let relative = path.relative(path.dirname(importerAbsolutePath), targetAbsolutePath).replace(/\\/g, "/");
  if (!relative.startsWith(".")) relative = `./${relative}`;
  const originalHadExtension = path.extname(originalSpecifier) !== "";
  if (!originalHadExtension) {
    for (const extension of RESOLUTION_EXTENSIONS.slice(1)) {
      if (relative.endsWith(extension)) {
        relative = relative.slice(0, -extension.length);
        break;
      }
    }
    relative = relative.replace(/\/index$/, "");
    if (relative === ".") relative = "./";
  }
  return relative;
}

function buildMoveMaps(moves) {
  const oldToNew = new Map();
  for (const move of moves) {
    const fromRoot = absolute(move.from);
    const toRoot = absolute(move.to);
    assertInsideRepo(fromRoot);
    assertInsideRepo(toRoot);
    if (!fs.existsSync(fromRoot)) fail(`Move source does not exist: ${move.from}`);
    if (fs.existsSync(toRoot)) fail(`Move destination already exists: ${move.to}`);
    for (const oldFile of listFilesRecursively(fromRoot)) {
      const rel = path.relative(fromRoot, oldFile);
      oldToNew.set(oldFile, path.join(toRoot, rel));
    }
  }
  return oldToNew;
}

function collectSpecifierRecords() {
  const records = [];
  const regex = /\b(?:import|export)\s+(?:[^"'`]*?\s+from\s+)?["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  for (const importer of listFilesRecursively(REPO_ROOT)) {
    if (!SOURCE_EXTENSIONS.has(path.extname(importer))) continue;
    const content = fs.readFileSync(importer, "utf8");
    let match;
    while ((match = regex.exec(content))) {
      const specifier = match[1] ?? match[2];
      if (!specifier?.startsWith(".")) continue;
      const target = resolveModuleTarget(importer, specifier);
      if (!target) continue;
      records.push({ importerOld: importer, targetOld: target, specifier });
    }
  }
  return records;
}

function gitMove(from, to) {
  fs.mkdirSync(path.dirname(absolute(to)), { recursive: true });
  execFileSync("git", ["mv", normalizeRepoPath(from), normalizeRepoPath(to)], {
    cwd: REPO_ROOT,
    stdio: "inherit"
  });
}

function rewriteImports(records, oldToNew) {
  const replacementsByFile = new Map();
  for (const record of records) {
    const importerNew = oldToNew.get(record.importerOld) ?? record.importerOld;
    const targetNew = oldToNew.get(record.targetOld) ?? record.targetOld;
    if (importerNew === record.importerOld && targetNew === record.targetOld) continue;
    const nextSpecifier = relativeModuleSpecifier(importerNew, targetNew, record.specifier);
    if (nextSpecifier === record.specifier) continue;
    if (!replacementsByFile.has(importerNew)) replacementsByFile.set(importerNew, []);
    replacementsByFile.get(importerNew).push({ from: record.specifier, to: nextSpecifier });
  }

  let rewrittenFiles = 0;
  for (const [filePath, replacements] of replacementsByFile.entries()) {
    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;
    const unique = new Map(replacements.map(item => [item.from, item.to]));
    for (const [from, to] of unique.entries()) {
      const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(["'])${escaped}\\1`, "g");
      const next = content.replace(pattern, (_, quote) => `${quote}${to}${quote}`);
      if (next !== content) {
        content = next;
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, content, "utf8");
      rewrittenFiles += 1;
    }
  }
  return rewrittenFiles;
}

function validateAffectedImports(records, oldToNew) {
  const failures = [];
  for (const record of records) {
    const importerNew = oldToNew.get(record.importerOld) ?? record.importerOld;
    const targetNew = oldToNew.get(record.targetOld) ?? record.targetOld;
    if (importerNew === record.importerOld && targetNew === record.targetOld) continue;
    const expectedSpecifier = relativeModuleSpecifier(importerNew, targetNew, record.specifier);
    const resolved = resolveModuleTarget(importerNew, expectedSpecifier);
    if (resolved !== targetNew) {
      failures.push(`${path.relative(REPO_ROOT, importerNew)} -> ${expectedSpecifier}`);
      continue;
    }
    const content = fs.readFileSync(importerNew, "utf8");
    if (!content.includes(`"${expectedSpecifier}"`) && !content.includes(`'${expectedSpecifier}'`)) {
      failures.push(`${path.relative(REPO_ROOT, importerNew)} missing rewritten specifier ${expectedSpecifier}`);
    }
  }
  if (failures.length) {
    console.error("[path-mover] Relocation broke previously-resolved imports:");
    for (const item of failures) console.error(`  ${item}`);
    process.exit(2);
  }
}

if (!fs.existsSync(PLAN_PATH)) fail("Missing dev-scripts/path-mover.json");
const plan = JSON.parse(fs.readFileSync(PLAN_PATH, "utf8"));
if (!plan.enabled) {
  console.log("[path-mover] Plan disabled; nothing to do.");
  process.exit(0);
}
if (!Array.isArray(plan.moves) || plan.moves.length === 0) fail("Enabled plan must declare moves.");

const normalizedMoves = plan.moves.map(move => ({
  from: normalizeRepoPath(move.from),
  to: normalizeRepoPath(move.to)
}));

const oldToNew = buildMoveMaps(normalizedMoves);
const importRecords = collectSpecifierRecords();

for (const move of normalizedMoves) gitMove(move.from, move.to);
const rewrittenFiles = rewriteImports(importRecords, oldToNew);
validateAffectedImports(importRecords, oldToNew);

plan.enabled = false;
plan.last_applied_at = new Date().toISOString();
fs.writeFileSync(PLAN_PATH, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

console.log(`[path-mover] Moved ${normalizedMoves.length} path(s).`);
console.log(`[path-mover] Rewrote imports in ${rewrittenFiles} file(s).`);
console.log("[path-mover] Relocation import validation passed.");

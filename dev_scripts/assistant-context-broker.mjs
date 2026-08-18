#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const SCHEMA_VERSION = 1;
const DEFAULT_MAX_FILES = 12;
const DEFAULT_MAX_SLICES = 18;
const DEFAULT_CONTEXT_LINES = 8;
const MAX_SCAN_BYTES = 1024 * 1024;
const TEXT_EXTENSIONS = new Set([
  ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
  ".json", ".css", ".html", ".hbs", ".md", ".yml", ".yaml", ".py"
]);
const RESOLUTION_EXTENSIONS = ["", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json"];
const STOP_WORDS = new Set([
  "about", "after", "again", "also", "before", "between", "build", "change", "could",
  "from", "have", "into", "make", "need", "should", "that", "their", "then", "there",
  "these", "this", "through", "using", "when", "where", "which", "with", "would"
]);

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

function value(args, key, fallback = "") { return String(args.values.get(key) ?? fallback).trim(); }
function intValue(args, key, fallback) {
  const parsed = Number.parseInt(value(args, key, fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function normalizeRepoPath(input) { return String(input).replaceAll("\\", "/").replace(/^\.\//, ""); }
function sha256(content) { return crypto.createHash("sha256").update(content).digest("hex"); }
function runGit(root, args, fallback = "") {
  try { return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return fallback; }
}

export function tokenizeQuery(input) {
  const tokens = String(input || "").toLowerCase().match(/[a-z0-9_$.-]{3,}/g) ?? [];
  return [...new Set(tokens.map(token => token.replace(/^[._-]+|[._-]+$/g, "")).filter(token => token.length >= 3 && !STOP_WORDS.has(token)))];
}

function trackedFiles(root) {
  const raw = runGit(root, ["ls-files", "-z"]);
  if (!raw) return [];
  return raw.split("\0").filter(Boolean).map(normalizeRepoPath).filter(file => {
    if (file.startsWith("node_modules/") || file.startsWith(".git/")) return false;
    if (/report\.json$/i.test(file) || /package-lock\.json$/i.test(file)) return false;
    return TEXT_EXTENSIONS.has(path.extname(file).toLowerCase());
  });
}

function readText(root, relativePath) {
  try {
    const absolute = path.join(root, ...relativePath.split("/"));
    const stat = fs.statSync(absolute);
    if (!stat.isFile() || stat.size > MAX_SCAN_BYTES) return null;
    return fs.readFileSync(absolute, "utf8");
  } catch { return null; }
}

function countOccurrences(text, needle) {
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while ((offset = text.indexOf(needle, offset)) >= 0) { count += 1; offset += needle.length; }
  return count;
}

function scoreFile(relativePath, content, goal, tokens, symbol) {
  const lowerPath = relativePath.toLowerCase();
  const lower = content.toLowerCase();
  const lowerGoal = goal.toLowerCase().trim();
  let score = 0;
  const reasons = [];
  if (lowerGoal.length >= 4) {
    const phraseHits = Math.min(countOccurrences(lower, lowerGoal), 3);
    if (phraseHits) { score += phraseHits * 18; reasons.push(`goal_phrase:${phraseHits}`); }
  }
  for (const token of tokens) {
    if (lowerPath.includes(token)) { score += 8; reasons.push(`path:${token}`); }
    const hits = Math.min(countOccurrences(lower, token), 8);
    if (hits) { score += hits; reasons.push(`content:${token}:${hits}`); }
  }
  if (symbol) {
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const refs = Math.min((content.match(new RegExp(`\\b${escaped}\\b`, "g")) ?? []).length, 12);
    if (refs) { score += refs * 3; reasons.push(`symbol_ref:${refs}`); }
    if (new RegExp(`(?:function|class|const|let|var)\\s+${escaped}\\b|(?:export\\s+)?(?:async\\s+)?function\\s+${escaped}\\b`).test(content)) {
      score += 30; reasons.push("symbol_declaration");
    }
  }
  return { score, reasons };
}

function matchingLines(content, goal, tokens, symbol) {
  const lines = content.split(/\r?\n/);
  const needles = [...tokens];
  if (goal.trim().length >= 4) needles.unshift(goal.toLowerCase().trim());
  if (symbol) needles.unshift(symbol.toLowerCase());
  const matches = [];
  for (let index = 0; index < lines.length; index += 1) {
    const lower = lines[index].toLowerCase();
    if (needles.some(needle => needle && lower.includes(needle))) matches.push(index + 1);
  }
  return { lines, matches };
}

export function mergeLineWindows(lineNumbers, lineCount, radius = DEFAULT_CONTEXT_LINES) {
  const windows = lineNumbers.map(line => ({ start: Math.max(1, line - radius), end: Math.min(lineCount, line + radius) }));
  const merged = [];
  for (const window of windows) {
    const previous = merged.at(-1);
    if (previous && window.start <= previous.end + 1) previous.end = Math.max(previous.end, window.end);
    else merged.push({ ...window });
  }
  return merged;
}

function extractSlices(relativePath, content, goal, tokens, symbol, contextLines, limit) {
  const { lines, matches } = matchingLines(content, goal, tokens, symbol);
  const seeds = matches.length ? matches : [1];
  return mergeLineWindows(seeds, lines.length, contextLines).slice(0, limit).map(window => ({
    file: relativePath,
    start_line: window.start,
    end_line: window.end,
    source: lines.slice(window.start - 1, window.end).join("\n")
  }));
}

function importSpecifiers(content) {
  const specs = new Set();
  const patterns = [
    /(?:import|export)\s+(?:[^\n;]*?\s+from\s+)?["']([^"']+)["']/g,
    /require\(\s*["']([^"']+)["']\s*\)/g,
    /import\(\s*["']([^"']+)["']\s*\)/g
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) specs.add(match[1]);
  }
  return [...specs];
}

function resolveLocalImport(importer, specifier, trackedSet) {
  if (!specifier.startsWith(".")) return null;
  const base = normalizeRepoPath(path.posix.normalize(path.posix.join(path.posix.dirname(importer), specifier)));
  for (const extension of RESOLUTION_EXTENSIONS) {
    const candidate = `${base}${extension}`;
    if (trackedSet.has(candidate)) return candidate;
  }
  for (const extension of RESOLUTION_EXTENSIONS.slice(1)) {
    const candidate = `${base}/index${extension}`;
    if (trackedSet.has(candidate)) return candidate;
  }
  return null;
}

function buildImportGraph(root, files, contentByFile) {
  const trackedSet = new Set(files);
  const outgoing = new Map();
  const incoming = new Map();
  for (const file of files) {
    const content = contentByFile.get(file);
    if (content === null || content === undefined) continue;
    const imports = importSpecifiers(content).map(specifier => ({ specifier, resolved: resolveLocalImport(file, specifier, trackedSet) })).filter(entry => entry.resolved);
    outgoing.set(file, imports);
    for (const entry of imports) {
      if (!incoming.has(entry.resolved)) incoming.set(entry.resolved, []);
      incoming.get(entry.resolved).push({ file, specifier: entry.specifier });
    }
  }
  return { outgoing, incoming };
}

function symbolReferences(files, contentByFile, symbol, limit = 30) {
  if (!symbol) return [];
  const results = [];
  for (const file of files) {
    const content = contentByFile.get(file);
    if (content === null || content === undefined) continue;
    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].includes(symbol)) results.push({ file, line: index + 1, text: lines[index].trim().slice(0, 300) });
      if (results.length >= limit) return results;
    }
  }
  return results;
}

export function buildContextPacket(root, options) {
  const goal = String(options.goal || options.query || "").trim();
  const symbol = String(options.symbol || "").trim();
  if (!goal && !symbol) throw new Error("Assistant Context Broker requires --goal/--query or --symbol.");
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const maxSlices = options.maxSlices ?? DEFAULT_MAX_SLICES;
  const contextLines = options.contextLines ?? DEFAULT_CONTEXT_LINES;
  const files = trackedFiles(root);
  const contentByFile = new Map(files.map(file => [file, readText(root, file)]));
  const tokens = tokenizeQuery(`${goal} ${symbol}`);
  const ranked = files.map(file => {
    const content = contentByFile.get(file);
    if (content === null) return null;
    const scoring = scoreFile(file, content, goal, tokens, symbol);
    return { file, ...scoring };
  }).filter(Boolean).filter(entry => entry.score > 0).sort((a, b) => b.score - a.score || a.file.localeCompare(b.file)).slice(0, maxFiles);
  const selectedFiles = ranked.map(entry => entry.file);
  const graph = buildImportGraph(root, files, contentByFile);
  const slices = [];
  for (const selected of selectedFiles) {
    if (slices.length >= maxSlices) break;
    const remaining = maxSlices - slices.length;
    slices.push(...extractSlices(selected, contentByFile.get(selected), goal, tokens, symbol, contextLines, Math.min(3, remaining)));
  }
  const head = runGit(root, ["rev-parse", "HEAD"]);
  const branch = runGit(root, ["branch", "--show-current"]);
  const dirty = Boolean(runGit(root, ["status", "--porcelain"]));
  const snapshots = selectedFiles.map(file => {
    const content = contentByFile.get(file) ?? "";
    return { file, sha256: sha256(content), bytes: Buffer.byteLength(content, "utf8") };
  });
  const snapshotFingerprint = sha256(JSON.stringify({ head, files: snapshots.map(({ file, sha256: hash }) => [file, hash]) }));
  const packet = {
    schema_version: SCHEMA_VERSION,
    kind: "frame_conn_assistant_context_packet",
    query: { goal, symbol: symbol || null, tokens },
    snapshot: { head, branch, dirty, fingerprint: snapshotFingerprint, files: snapshots },
    selection: { scanned_files: files.length, selected_files: ranked },
    source_slices: slices,
    local_imports: selectedFiles.map(file => ({ file, imports: graph.outgoing.get(file) ?? [] })),
    direct_importers: selectedFiles.map(file => ({ file, importers: graph.incoming.get(file) ?? [] })),
    symbol_references: symbolReferences(files, contentByFile, symbol),
    boundaries: {
      authoritative_for: ["broad_repository_discovery", "bounded_source_context", "direct_import_edges", "repository_snapshot_identity"],
      not_authoritative_for: ["architectural_ownership", "patch_corridor_certification", "mutation_order", "native_runtime_contracts", "validation"]
    }
  };
  packet.packet_fingerprint = sha256(JSON.stringify(packet));
  return packet;
}

function writePacket(filePath, packet) {
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  fs.writeFileSync(path.resolve(filePath), `${JSON.stringify(packet, null, 2)}\n`, "utf8");
}

function selfTest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "frame-conn-context-broker-"));
  try {
    fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
    fs.writeFileSync(path.join(root, "scripts", "scan-service.js"), "export function scanTarget(target) { return target?.id ?? null; }\n", "utf8");
    fs.writeFileSync(path.join(root, "scripts", "ui.js"), "import { scanTarget } from './scan-service.js';\nexport const run = actor => scanTarget(actor);\n", "utf8");
    spawnSync("git", ["init", "-q"], { cwd: root });
    spawnSync("git", ["config", "user.email", "test@example.invalid"], { cwd: root });
    spawnSync("git", ["config", "user.name", "Context Broker Test"], { cwd: root });
    spawnSync("git", ["add", "."], { cwd: root });
    spawnSync("git", ["commit", "-qm", "fixture"], { cwd: root });
    const packet = buildContextPacket(root, { goal: "scan target execution", symbol: "scanTarget", maxFiles: 4, maxSlices: 6, contextLines: 2 });
    const service = packet.selection.selected_files.find(entry => entry.file === "scripts/scan-service.js");
    const importers = packet.direct_importers.find(entry => entry.file === "scripts/scan-service.js")?.importers ?? [];
    const checks = [
      Boolean(service),
      importers.some(entry => entry.file === "scripts/ui.js"),
      packet.source_slices.some(entry => entry.file === "scripts/scan-service.js"),
      packet.symbol_references.some(entry => entry.file === "scripts/ui.js"),
      /^[a-f0-9]{64}$/.test(packet.snapshot.fingerprint),
      packet.snapshot.files.every(entry => /^[a-f0-9]{64}$/.test(entry.sha256)),
      tokenizeQuery("change scan target with context").includes("scan")
    ];
    if (checks.some(check => !check)) throw new Error("Assistant Context Broker self-test failed.");
    console.log("Assistant Context Broker self-test passed.");
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.has("self-test")) { selfTest(); return; }
  const root = path.resolve(value(args, "root", process.cwd()));
  const goal = value(args, "goal", value(args, "query"));
  const symbol = value(args, "symbol");
  const packet = buildContextPacket(root, {
    goal, symbol,
    maxFiles: intValue(args, "max-files", DEFAULT_MAX_FILES),
    maxSlices: intValue(args, "max-slices", DEFAULT_MAX_SLICES),
    contextLines: intValue(args, "context-lines", DEFAULT_CONTEXT_LINES)
  });
  const output = value(args, "output");
  if (output) writePacket(output, packet);
  console.log(`[context-broker] head=${packet.snapshot.head || "unknown"}`);
  console.log(`[context-broker] selected_files=${packet.selection.selected_files.length}`);
  console.log(`[context-broker] source_slices=${packet.source_slices.length}`);
  console.log(`[context-broker] snapshot=${packet.snapshot.fingerprint.slice(0, 12)}`);
  if (!output || args.flags.has("print")) console.log(JSON.stringify(packet, null, 2));
  else console.log(`[context-broker] report=${output}`);
}

try { main(); } catch (error) {
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
}

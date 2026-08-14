import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);

function argValue(flag, fallback) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : fallback;
}

const inputPath = path.resolve(ROOT, argValue("--input", "dev-scripts/filepatcher.dsl"));
const outputPath = path.resolve(ROOT, argValue("--output", "dev-scripts/filepatcher.json"));
const checkOnly = argv.includes("--check");
const selfTest = argv.includes("--self-test");

const fail = (message, line = null) => {
  const where = line == null ? "" : ` at DSL line ${line}`;
  throw new Error(`[patch-dsl] ${message}${where}`);
};

const countOccurrences = (text, search) => text.split(search).length - 1;
const normalizeRepoPath = value => value.replaceAll("\\", "/").replace(/^\.\//, "");

function parseQuotedOrBare(value, line) {
  const trimmed = value.trim();
  if (!trimmed) fail("Expected a value.", line);
  if (trimmed.startsWith('"')) {
    try { return JSON.parse(trimmed); }
    catch { fail("Invalid quoted string.", line); }
  }
  return trimmed;
}

function readBlock(lines, state, line) {
  if (lines[state.index]?.trim() !== "<<<") fail('Expected "<<<" to start a block.', line);
  state.index += 1;
  const out = [];
  while (state.index < lines.length && lines[state.index].trim() !== ">>>") {
    out.push(lines[state.index]);
    state.index += 1;
  }
  if (state.index >= lines.length) fail('Unterminated block; expected ">>>".', line);
  state.index += 1;
  return out.join("\n");
}

function nextMeaningful(lines, state) {
  while (state.index < lines.length) {
    const raw = lines[state.index];
    const trimmed = raw.trim();
    const line = state.index + 1;
    state.index += 1;
    if (!trimmed || trimmed.startsWith("#")) continue;
    return { raw, trimmed, line };
  }
  return null;
}

function findMatchingBrace(text, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let templateExpressionDepth = 0;

  for (let i = openIndex; i < text.length; i += 1) {
    const c = text[i];
    const n = text[i + 1];

    if (lineComment) {
      if (c === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (c === "*" && n === "/") { blockComment = false; i += 1; }
      continue;
    }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (c === "\\") { escaped = true; continue; }
      if (quote === "`" && c === "$" && n === "{") {
        templateExpressionDepth += 1;
        depth += 1;
        i += 1;
        continue;
      }
      if (quote === "`" && c === "}" && templateExpressionDepth > 0) {
        templateExpressionDepth -= 1;
        depth -= 1;
        continue;
      }
      if (c === quote && templateExpressionDepth === 0) quote = null;
      continue;
    }

    if (c === "/" && n === "/") { lineComment = true; i += 1; continue; }
    if (c === "/" && n === "*") { blockComment = true; i += 1; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function locateSymbol(text, symbol, line) {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`(?:^|\\n)([ \\t]*(?:export\\s+)?(?:async\\s+)?function\\s+${escaped}\\s*\\([^)]*\\)\\s*\\{)`, "g"),
    new RegExp(`(?:^|\\n)([ \\t]*(?:export\\s+)?class\\s+${escaped}(?:\\s+extends\\s+[^\\{]+)?\\s*\\{)`, "g"),
    new RegExp(`(?:^|\\n)([ \\t]*(?:export\\s+)?(?:const|let|var)\\s+${escaped}\\s*=)`, "g")
  ];

  const matches = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) matches.push({ index: match.index + (match[0].startsWith("\n") ? 1 : 0), prefix: match[1] });
  }
  if (matches.length !== 1) fail(`within ${symbol} expected exactly one top-level declaration, found ${matches.length}.`, line);

  const start = matches[0].index;
  const headEnd = start + matches[0].prefix.length;
  const brace = text.indexOf("{", start);
  if (brace >= start && brace < headEnd + 8) {
    const close = findMatchingBrace(text, brace);
    if (close < 0) fail(`Unable to find closing brace for symbol ${symbol}.`, line);
    let end = close + 1;
    if (text[end] === ";") end += 1;
    return { start, end, source: text.slice(start, end) };
  }

  let end = text.indexOf(";", headEnd);
  if (end < 0) end = text.indexOf("\n", headEnd);
  if (end < 0) end = text.length;
  else end += 1;
  return { start, end, source: text.slice(start, end) };
}

function readRepoFile(relativePath, virtualFiles, line) {
  const normalized = normalizeRepoPath(relativePath);
  if (virtualFiles.has(normalized)) return virtualFiles.get(normalized);
  const absolute = path.resolve(ROOT, normalized);
  const relative = path.relative(ROOT, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) fail(`Path escapes repository root: ${relativePath}`, line);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) fail(`File does not exist: ${normalized}`, line);
  const content = fs.readFileSync(absolute, "utf8");
  virtualFiles.set(normalized, content);
  return content;
}

function applyTextEdit(text, kind, search, replacement, cardinality, line) {
  const occurrences = countOccurrences(text, search);
  if (cardinality === "optional" && occurrences === 0) return { text, occurrences: 0, skipped: true };
  if (occurrences === 0) fail(`${kind} search text was not found.`, line);
  if (cardinality === "once" && occurrences !== 1) fail(`${kind} once expected 1 occurrence, found ${occurrences}.`, line);
  const expected = cardinality === "once" ? 1 : occurrences;

  let replace = replacement;
  if (kind === "before") replace = `${replacement}${search}`;
  if (kind === "after") replace = `${search}${replacement}`;
  if (kind === "delete") replace = "";

  return {
    text: text.split(search).join(replace),
    occurrences: expected,
    replace,
    skipped: false
  };
}

function parseDsl(source, seededFiles = new Map()) {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  const state = { index: 0 };
  const patch = {
    schema_version: 2,
    id: null,
    description: null,
    planning_goal: null,
    policy: { max_files_changed: 1 },
    operations: []
  };
  const virtualFiles = new Map(seededFiles);
  let currentFile = null;
  let currentSymbol = null;
  const stats = new Map();
  const bump = name => stats.set(name, (stats.get(name) ?? 0) + 1);

  for (let entry = nextMeaningful(lines, state); entry; entry = nextMeaningful(lines, state)) {
    const { trimmed, line } = entry;

    if (trimmed.startsWith("patch ")) { patch.id = parseQuotedOrBare(trimmed.slice(6), line); continue; }
    if (trimmed.startsWith("description ")) { patch.description = parseQuotedOrBare(trimmed.slice(12), line); continue; }
    if (trimmed.startsWith("goal ")) { patch.planning_goal = parseQuotedOrBare(trimmed.slice(5), line); continue; }
    if (trimmed.startsWith("max-files ")) {
      const value = Number(trimmed.slice(10).trim());
      if (!Number.isInteger(value) || value < 1) fail("max-files must be a positive integer.", line);
      patch.policy.max_files_changed = value;
      continue;
    }
    if (trimmed.startsWith("file ")) {
      currentFile = normalizeRepoPath(parseQuotedOrBare(trimmed.slice(5), line));
      currentSymbol = null;
      continue;
    }
    if (trimmed.startsWith("within ")) {
      if (!currentFile) fail("within requires a preceding file directive.", line);
      currentSymbol = parseQuotedOrBare(trimmed.slice(7).replace(/:$/, ""), line);
      continue;
    }
    if (trimmed === "global") { currentSymbol = null; continue; }

    if (trimmed.startsWith("create ")) {
      const target = normalizeRepoPath(parseQuotedOrBare(trimmed.slice(7).replace(/:$/, ""), line));
      const content = readBlock(lines, state, line);
      patch.operations.push({ type: "create_file", path: target, content });
      virtualFiles.set(target, content);
      bump("create");
      continue;
    }

    if (trimmed.startsWith("rewrite ")) {
      const target = normalizeRepoPath(parseQuotedOrBare(trimmed.slice(8).replace(/:$/, ""), line));
      readRepoFile(target, virtualFiles, line);
      const content = readBlock(lines, state, line);
      patch.operations.push({ type: "replace_file", path: target, content });
      virtualFiles.set(target, content);
      bump("rewrite");
      continue;
    }

    if (trimmed === "raw" || trimmed === "raw:") {
      const raw = readBlock(lines, state, line);
      let operation;
      try { operation = JSON.parse(raw); }
      catch { fail("raw block must contain one valid JSON operation object.", line); }
      if (!operation || typeof operation !== "object" || Array.isArray(operation)) fail("raw block must contain one JSON object.", line);
      patch.operations.push(operation);
      bump("raw");
      continue;
    }

    const editMatch = /^(replace|before|after|delete)(?:\\s+(once|all|optional))?$/.exec(trimmed.replace(/:$/, ""));
    if (editMatch) {
      if (!currentFile) fail(`${editMatch[1]} requires a preceding file directive.`, line);
      const kind = editMatch[1];
      const cardinality = editMatch[2] ?? "once";
      const search = readBlock(lines, state, line);
      let replacement = "";
      if (kind !== "delete") {
        const marker = nextMeaningful(lines, state);
        const expectedMarker = kind === "replace" ? "with" : "add";
        if (!marker || marker.trimmed.replace(/:$/, "") !== expectedMarker) fail(`Expected ${expectedMarker} after ${dind} block.`, marker?.line ?? line);
        replacement = readBlock(lines, state, marker.line);
      }

      const fileContent = readRepoFile(currentFile, virtualFiles, line);
      if (currentSymbol) {
        const region = locateSymbol(fileContent, currentSymbol, line);
        const local = applyTextEdit(region.source, kind, search, replacement, cardinality, line);
        if (local.skipped) { bump(`${kind}-optional-skip`); continue; }
        const nextRegion = local.text;
        patch.operations.push({
          type: "replace_text",
          path: currentFile,
          search: region.source,
          replace: nextRegion,
          expected_occurrences: 1
        });
        virtualFiles.set(currentFile, fileContent.slice(0, region.start) + nextRegion + fileContent.slice(region.end));
      } else {
        const applied = applyTextEdit(fileContent, kind, search, replacement, cardinality, line);
        if (applied.skipped) { bump(`${kind}-optional-skip`); continue; }
        patch.operations.push({
          type: "replace_text",
          path: currentFile,
          search,
          replace: applied.replace,
          expected_occurrences: applied.occurrences
        });
        virtualFiles.set(currentFile, applied.text);
      }
      bump(kind);
      continue;
    }

    fail(`Unknown DSL statement: ${trimmed}`, line);
  }

  if (!patch.id) fail("DSL must declare patch <id>.");
  if (!patch.description) delete patch.description;
  if (!patch.planning_goal) delete patch.planning_goal;
  return { patch, stats };
}

function runSelfTest() {
  const fixture = `patch self-test\nmax-files 1\nfile scripts/self-test.js\nwithin demo\nreplace once\n<<<\noldThing()\n>>>\nwith\n<<<\nnewThing()\n>>>\nglobal\nafter once\n<<<\nexport const y = 1;\n>>>\nadd\n<<<\n\nexport const z = 2;\n#�����6��7B6VVFVB��Wr����'67&�G2�6V�b�FW7B�2"�&W��'BgV�7F���FV�����&WGW&���EF���r����������W��'B6��7B�����%�ғ��6��7B�F6���'6TG6f��GW&R�6VVFVB����b�F6���W&F���2��V�wF���"�f�6V�b�FW7BW�V7FVB"�W&F���2�f�V�BG�F6���W&F���2��V�wF�������b�F6���W&F���5���&W�6R��6�VFW2�&�WuF���r��"��f�%6V�b�FW7B7��&���66�VB&W�6V�V�Bf��VB�"����b�F6���W&F���5���&W�6R��6�VFW2�&W��'B6��7B��#�"��f�%6V�b�FW7Bv��&���6W'F���f��VB�"���6��6��R���r�%�F6��G6��6V�b�FW7B76VB�"���Р�gV�7F�����ₒ���b�6V�eFW7B���'V�6V�eFW7B����&WGW&㰢Т�b�g2�W��7G57��2���WEF���f�E4�f��R��Bf�V�C�G�F��&V�F�fR�$��B���WEF������6��7B6�W&6R�g2�&VDf��U7��2���WEF��'WFc�"���6��7B�F6��7FG2��'6TG66�W&6R���6��7B&V�FW&VB��4���7G&��v�g��F6���V���"��%��#���6��6��R���r��F6��G6����WC�G�F��&V�F�fR�$��B���WEF������6��6��R���r��F6��G6��F6��G�F6��G����6��6��R���r��F6��G6���W&F���3�G�F6���W&F���2��V�wF�����6��6��R���r��F6��G6�����f��W5�6��vVC�G�F6���Ɩ7�����f��W5�6��vVG����f�"�6��7B����B�6�V�E��b����7FG2�V�G&�W2����6�'B���6��6��R���r��F6��G6��G����G��G�6�V�G������b�6�V6���ǒ���6��6��R���r�%�F6��G6��6�V6�6���WFVB7V66W76gV�ǒ����4��v2w&�GFV��"���&WGW&㰢Р�g2�ֶF�%7��2�F��F�&��R��WGWEF����&V7W'6�fS�G'VRғ��g2�w&�FTf��U7��2��WGWEF��&V�FW&VB�'WFc�"���6��6��R���r��F6��G6��w&�FS�G�F��&V�F�fR�$��B��WGWEF������Р�G'����ₓ�Ц6F6��W'&�"���6��6��R�W'&�"�W'&�"��7F�6V�bW'&�"�W'&�"��W76vR�7G&��r�W'&�"����&�6W72�W��B����Р
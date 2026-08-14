import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const gi = argv.indexOf("--goal");
const goal = (gi >= 0 ? argv[gi + 1] : argv.filter(x => !x.startsWith("--")).join(" "))?.trim();
const oi = argv.indexOf("--output");
const output = path.resolve(ROOT, oi >= 0 ? argv[oi + 1] : "patch-corridor-report.json");

if (!goal) {
  console.error('Usage: npm run patch-corridor -- --goal "wire committed Scan through native execution"');
  process.exit(2);
}

const STOP = new Set([
  "the","and","for","from","into","with","that","this","wire","wiring","make",
  "patch","frame","conn","through","authoritative","given","change"
]);
const norm = v => String(v ?? "")
  .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  .replace(/[_.\/:-]+/g, " ")
  .toLowerCase();
const terms = [...new Set(norm(goal).split(/[^a-z0-9$]+/).filter(x => x.length >= 3 && !STOP.has(x)))];
const arr = v => Array.isArray(v) ? v : [];
const containsAny = values => terms.some(t => values.includes(t));
const score = v => {
  const h = norm(v);
  return terms.reduce((n,t) => n + (h.includes(t) ? (t.length >= 7 ? 4 : 2) : 0), 0);
};

function diagnostic(name, prefix) {
  const out = path.join(os.tmpdir(), `${prefix}-${process.pid}.json`);
  const r = spawnSync(process.execPath, [path.join(ROOT,"dev_scripts",name),"--output",out], {cwd:ROOT,encoding:"utf8"});
  if (r.status !== 0) throw new Error(`${name} failed; planner requires healthy diagnostics.`);
  return JSON.parse(fs.readFileSync(out,"utf8"));
}

function topSymbols(text) {
  const found = [];
  for (const [kind,re] of [
    ["function",/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm],
    ["class",/^(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/gm],
    ["binding",/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm]
  ]) {
    let m;
    while ((m = re.exec(text))) {
      const s = score(m[1]);
      if (s) found.push({name:m[1],kind,line:text.slice(0,m.index).split("\n").length,score:s});
    }
  }
  return found.sort((a,b)=>b.score-a.score||a.line-b.line).slice(0,8);
}

const repo = diagnostic("repo-audit.mjs","corridor-repo");
const symbols = diagnostic("symbol-family-audit.mjs","corridor-symbol");
const effects = diagnostic("effect-atlas.mjs","corridor-effect");
const families = new Map(arr(symbols.families).map(f => [f.id,f]));

const graph = new Map();
for (const f of families.values()) {
  if (!graph.has(f.id)) graph.set(f.id,new Set());
  for (const x of [...arr(f.incomingFamilies),...arr(f.outgoingFamilies)]) {
    graph.get(f.id).add(x);
    if (!graph.has(x)) graph.set(x,new Set());
    graph.get(x).add(f.id);
  }
}

const actionIntent = containsAny(["action","actions","committed","plan","attack","scan","boost","lock","target"]);
const presentationIntent = containsAny(["committed","presentation","button","panel","ui","execute-control","control"]);
const endpointIntent = containsAny(["native","lancer","execute","execution","roll","attack","endpoint"]);
const transactionIntent = containsAny(["transaction","hook","validation","commit","economy"]);
const lifecycleIntent = containsAny(["lifecycle","expire","reset","status","condition"]);
const targetingIntent = containsAny(["target","targeting","spatial","sensor","range"]);

const dormantUnlessRequested = new Set();
if (!lifecycleIntent) {
  dormantUnlessRequested.add("lifecycle");
  dormantUnlessRequested.add("lifecycle-service");
}
if (!targetingIntent) {
  dormantUnlessRequested.add("targeting-spatial");
  dormantUnlessRequested.add("targeting-spatial-service");
}
if (!transactionIntent) {
  dormantUnlessRequested.add("action-economy");
  dormantUnlessRequested.add("execution-transaction");
  dormantUnlessRequested.add("semantic-event-bus");
  dormantUnlessRequested.add("resource-service");
  dormantUnlessRequested.add("actor-owned-feature-registry");
}

const ranked = [...families.values()].map(f => {
  let s = score(f.id)*4 + score(arr(f.locations).join(" "));
  for (const stem of arr(f.topStems)) s += score(stem.stem)*Math.min(3,Number(stem.count??1));
  if (actionIntent && ["actions","action-execution","turn"].includes(f.id)) s += 12;
  if (presentationIntent && ["ui-turn","ui-application"].includes(f.id)) s += 14;
  if (endpointIntent && ["native-adapter","action-execution","system-bridge"].includes(f.id)) s += 12;
  if (dormantUnlessRequested.has(f.id)) s -= 18;
  return {id:f.id,score:s};
}).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));

function existing(ids) {
  return ids.filter(id => families.has(id) && !dormantUnlessRequested.has(id));
}

let sourceAnchors = [];
if (actionIntent) sourceAnchors.push("actions","action-execution","turn");
if (presentationIntent) sourceAnchors.push("ui-turn","ui-application");
sourceAnchors = existing([...new Set(sourceAnchors)]);

let endpointAnchors = [];
if (endpointIntent) endpointAnchors.push("action-execution","native-adapter","system-bridge");
endpointAnchors = existing([...new Set(endpointAnchors)]);

if (!sourceAnchors.length) sourceAnchors = ranked.filter(x=>x.score>0 && !dormantUnlessRequested.has(x.id)).slice(0,2).map(x=>x.id);
if (!endpointAnchors.length) endpointAnchors = ranked.filter(x=>x.score>0 && !sourceAnchors.includes(x.id) && !dormantUnlessRequested.has(x.id)).slice(0,2).map(x=>x.id);

function pathBetween(a,b) {
  const q=[[a]], seen=new Set([a]);
  while(q.length) {
    const p=q.shift(), tail=p[p.length-1];
    for(const n of graph.get(tail)??[]) {
      if(seen.has(n) || dormantUnlessRequested.has(n)) continue;
      const next=[...p,n];
      if(n===b) return next;
      seen.add(n); q.push(next);
    }
  }
  return [];
}

const corridor = new Set([...sourceAnchors,...endpointAnchors]);
for (const a of sourceAnchors) {
  let best = [];
  for (const b of endpointAnchors) {
    const p = pathBetween(a,b);
    if (p.length && (!best.length || p.length < best.length)) best = p;
  }
  for (const n of best.slice(0,8)) corridor.add(n);
}
for (const b of endpointAnchors) {
  let best = [];
  for (const a of sourceAnchors) {
    const p = pathBetween(a,b);
    if (p.length && (!best.length || p.length < best.length)) best = p;
  }
  for (const n of best.slice(0,8)) corridor.add(n);
}

const familyScores = new Map(ranked.map(x=>[x.id,x.score]));
const familyRows = new Map();
for (const id of corridor) {
  const f=families.get(id);
  if(!f) continue;
  const rows=[];
  for(const rel of arr(f.locations)) {
    const abs=path.join(ROOT,rel);
    if(!fs.existsSync(abs)||!fs.statSync(abs).isFile()) continue;
    const text=fs.readFileSync(abs,"utf8");
    let s=(familyScores.get(id)??0)+score(rel)*4+score(text.slice(0,18000));
    const normalizedRel=norm(rel);
    if (actionIntent && normalizedRel.includes("action")) s += 8;
    if (presentationIntent && (normalizedRel.includes("committed") || normalizedRel.includes("ui turn") || normalizedRel.includes("presentation"))) s += 14;
    if (endpointIntent && (normalizedRel.includes("native") || normalizedRel.includes("action execution"))) s += 12;
    if (norm(text).includes("committed plan")) s += presentationIntent ? 10 : 0;
    if (text.includes("executeControl")) s += presentationIntent ? 10 : 0;
    rows.push({file:rel,family:id,score:s,symbols:topSymbols(text)});
  }
  rows.sort((a,b)=>b.score-a.score||a.file.localeCompare(b.file));
  familyRows.set(id,rows);
}

const anchorSet = new Set([...sourceAnchors,...endpointAnchors]);
const orderedFamilies = [...corridor].sort((a,b)=>
  (anchorSet.has(b)?1:0)-(anchorSet.has(a)?1:0) ||
  (familyScores.get(b)??0)-(familyScores.get(a)??0) ||
  a.localeCompare(b)
);
const files=[];
for (const id of orderedFamilies) {
  const quota = anchorSet.has(id) ? 2 : 1;
  for (const row of (familyRows.get(id)??[]).slice(0,quota)) {
    if (!files.some(x=>x.file===row.file)) files.push(row);
    if (files.length >= 12) break;
  }
  if (files.length >= 12) break;
}

const effectOwners=arr(effects.ownerFamilies)
  .filter(x=>corridor.has(x.id))
  .sort((a,b)=>Number(b.siteCount??0)-Number(a.siteCount??0))
  .slice(0,5);

const flow=repo.dependencyFlow??repo.dependency_flow??{};
const rivers=arr(flow.rivers??flow.majorRivers);
const runtime=rivers.filter(r=>arr(r.streams).some(s=>corridor.has(s.id??s.name))).map(r=>({
  river:r.name??r.id??"runtime",
  convergence:r.convergence??r.convergencePoint??null,
  outlet:r.outlet??null
}));
if(!runtime.length) runtime.push({river:"runtime",convergence:"scripts/feature-registry.js / styles/ui-registry.js",outlet:"scripts/runtime-orchestrator.js"});

const symbolCount=files.reduce((n,f)=>n+f.symbols.length,0);
const representedSource = sourceAnchors.some(id=>files.some(f=>f.family===id));
const representedEndpoint = endpointAnchors.some(id=>files.some(f=>f.family===id));
const confidence = representedSource && representedEndpoint && symbolCount >= 2 ? "high" :
  (representedSource || representedEndpoint) && symbolCount ? "medium" : "exploratory";

const report={
  planner:{name:"Frame Conn Patch Corridor Planner",version:"1.1.0",generatedAt:new Date().toISOString()},
  goal,terms,
  intent:{action:actionIntent,presentation:presentationIntent,endpoint:endpointIntent,transaction:transactionIntent,lifecycle:lifecycleIntent,targeting:targetingIntent},
  anchors:{source:sourceAnchors,endpoint:endpointAnchors},
  summary:{families:corridor.size,files:files.length,symbols:symbolCount,confidence},
  corridor:[...corridor],
  rankedFamilies:ranked.slice(0,12),
  files,runtime,effects:effectOwners,
  scope:{
    maxFilesSuggested:Math.max(1,files.length),
    certificationRule:"Prefer edits inside this corridor; justify any file outside it by a newly discovered dependency, runtime binding, or effect boundary."
  },
  baseline:{
    dependencyErrors:repo.summary?.errors??null,
    symbolErrors:symbols.summary?.errors??null,
    effectErrors:effects.summary?.errors??null,
    effectWarnings:effects.summary?.warnings??null
  }
};
fs.writeFileSync(output,JSON.stringify(report,null,2)+"\n");

console.log(`\nFrame Conn patch corridor: ${goal}`);
console.log(`${report.summary.families} families | ${report.summary.files} files | ${symbolCount} symbol anchors | ${confidence} confidence`);
console.log(`  source anchors: ${sourceAnchors.join(", ")||"none"}`);
console.log(`  endpoint anchors: ${endpointAnchors.join(", ")||"none"}`);
console.log(`\nCorridor:\n  ${report.corridor.join(" -> ")}`);
console.log("\nTargeted patch surface:");
for(const f of files) {
  console.log(`  ${f.file} [${f.family}]`);
  for(const s of f.symbols.slice(0,5)) console.log(`    L${s.line} ${s.kind} ${s.name}`);
}
console.log("\nRuntime convergence:");
for(const r of runtime) console.log(`  ${r.river}: ${r.convergence??"composition"}${r.outlet?` -> ${r.outlet}`:""}`);
console.log("\nEffect boundary candidates:");
if(!effectOwners.length) console.log("  none in current corridor");
for(const e of effectOwners) console.log(`  ${e.id}: ${e.siteCount??0} effect sites | ${e.status??"healthy"}`);
console.log(`\nExpected scope: <= ${report.scope.maxFilesSuggested} files; report: ${output}`);

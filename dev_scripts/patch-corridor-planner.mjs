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

const STOP = new Set(["the","and","for","from","into","with","that","this","wire","wiring","make","patch","frame","conn"]);
const norm = v => String(v ?? "").replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/[_.\/:-]+/g," ").toLowerCase();
const terms = [...new Set(norm(goal).split(/[^a-z0-9$]+/).filter(x => x.length >= 3 && !STOP.has(x)))];
const arr = v => Array.isArray(v) ? v : [];
const score = v => terms.reduce((n,t) => n + (norm(v).includes(t) ? (t.length >= 7 ? 4 : 2) : 0), 0);

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

const endpoint = terms.some(t => ["native","lancer","execute","execution","roll","attack","endpoint"].includes(t));
const ui = terms.some(t => ["button","committed","presentation","panel","ui"].includes(t));
const ranked = [...families.values()].map(f => {
  let s = score(f.id)*4 + score(arr(f.locations).join(" "));
  for (const stem of arr(f.topStems)) s += score(stem.stem)*Math.min(3,Number(stem.count??1));
  if (endpoint && ["native-adapter","action-execution","execution-transaction","system-bridge"].includes(f.id)) s += 8;
  if (ui && f.id.startsWith("ui-")) s += 6;
  return {id:f.id,score:s};
}).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));

const seeds = ranked.filter(x=>x.score>0).slice(0,5).map(x=>x.id);
const corridor = new Set(seeds);
for (const seed of seeds.slice(0,3)) for (const n of graph.get(seed)??[]) corridor.add(n);

function pathBetween(a,b) {
  const q=[[a]], seen=new Set([a]);
  while(q.length) {
    const p=q.shift(), tail=p[p.length-1];
    for(const n of graph.get(tail)??[]) {
      if(seen.has(n)) continue;
      const next=[...p,n];
      if(n===b) return next;
      seen.add(n); q.push(next);
    }
  }
  return [];
}
for(let i=0;i<seeds.length;i++) for(let j=i+1;j<seeds.length;j++) for(const n of pathBetween(seeds[i],seeds[j]).slice(0,8)) corridor.add(n);

const familyScores = new Map(ranked.map(x=>[x.id,x.score]));
const fileRows = [];
for (const id of corridor) {
  const f=families.get(id);
  if(!f) continue;
  for(const rel of arr(f.locations)) {
    const abs=path.join(ROOT,rel);
    if(!fs.existsSync(abs)||!fs.statSync(abs).isFile()) continue;
    const text=fs.readFileSync(abs,"utf8");
    fileRows.push({file:rel,family:id,score:(familyScores.get(id)??0)+score(rel)*3+score(text.slice(0,12000)),symbols:topSymbols(text)});
  }
}
fileRows.sort((a,b)=>b.score-a.score||a.file.localeCompare(b.file));
const files=fileRows.slice(0,14);
const effectOwners=arr(effects.ownerFamilies).filter(x=>corridor.has(x.id)).sort((a,b)=>Number(b.siteCount??0)-Number(a.siteCount??0)).slice(0,6);

const flow=repo.dependencyFlow??repo.dependency_flow??{};
const rivers=arr(flow.rivers??flow.majorRivers);
const runtime=rivers.filter(r=>arr(r.streams).some(s=>corridor.has(s.id??s.name))).map(r=>({
  river:r.name??r.id??"runtime",
  convergence:r.convergence??r.convergencePoint??null,
  outlet:r.outlet??null
}));
if(!runtime.length) runtime.push({river:"runtime",convergence:"scripts/feature-registry.js / styles/ui-registry.js",outlet:"scripts/runtime-orchestrator.js"});

const symbolCount=files.reduce((n,f)=>n+f.symbols.length,0);
const top=ranked[0]?.score??0, second=ranked[1]?.score??0;
const confidence=top>=18&&symbolCount>=3&&top>=second*1.15?"high":top>=8&&symbolCount?"medium":"exploratory";
const report={
  planner:{name:"Frame Conn Patch Corridor Planner",version:"1.0.0",generatedAt:new Date().toISOString()},
  goal,terms,
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

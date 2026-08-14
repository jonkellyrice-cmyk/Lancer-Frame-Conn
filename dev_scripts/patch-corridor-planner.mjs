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

if (!sourceAnchors.length) sourceAnchors = ranked.filter(x=>x.h��ܙO�	��YܛX[�[�\�ԙ\]Y\�Y�\��Y
JK��X�J�K�X\
O��Y
NY�
Y[��[�[��ܜ˛[��
H[��[�[��ܜ�H�[��Y��[\�O��66�&S�bb6�W&6T�6��'2��6�VFW2���B�bbF�&��EV��W75&WVW7FVB�2���B���6Ɩ6R��"��������B����gV�7F���F�&WGvVV��"���6��7Bյ����6VV���Wr6WB��ғ��v���R���V�wF����6��7B��6��gB���F������V�wF��Ӱ�f�"�6��7B��bw&��vWB�F����Ғ���b�6VV��2����F�&��EV��W75&WVW7FVB�2�⒒6��F��VS��6��7B�W�Cղ�����Ӱ��b�����"�&WGW&��W�C��6VV��FB�⓲�W6���W�B���ТТ&WGW&��Ӱ�Р�6��7B6�'&�F�"��Wr6WB�����6�W&6T�6��'2����V�G���D�6��'5ғ��f�"�6��7B�b6�W&6T�6��'2����WB&W7B��Ӱ�f�"�6��7B"�bV�G���D�6��'2���6��7B�F�&WGvVV��"����b���V�wF�bb�&W7B��V�wF�����V�wF��&W7B��V�wF����&W7B���Тf�"�6��7B��b&W7B�6Ɩ6R�Â��6�'&�F�"�FB�⓰�Цf�"�6��7B"�bV�G���D�6��'2����WB&W7B��Ӱ�f�"�6��7B�b6�W&6T�6��'2���6��7B�F�&WGvVV��"����b���V�wF�bb�&W7B��V�wF�����V�wF��&W7B��V�wF���&W7B���Тf�"�6��7B��b&W7B�6Ɩ6R�Â��6�'&�F�"�FB�⓰�Р�6��7Bf֖Ǖ66�&W2��Wr��&�VB�����巂�Bǂ�66�&UҒ���6��7Bf֖Ǖ&�w2��Wr�����f�"�6��7B�B�b6�'&�F�"���6��7Bc�f֖ƖW2�vWB��B����b�b�6��F��VS��6��7B&�w3յӰ�f�"�6��7B&V��b'"�b���6F���2����6��7B'3�F�����$��B�&V���b�g2�W��7G57��2�'2���g2�7FE7��2�'2��4f��R���6��F��VS��6��7BFW�C�g2�&VDf��U7��2�'2�'WFc�"����WB3҆f֖Ǖ66�&W2�vWB��B�����66�&R�&V�B�66�&R�FW�B�6Ɩ6R�������6��7B��&�Ɨ�VE&V����&҇&V���b�7F����FV�Bbb��&�Ɨ�VE&V���6�VFW2�&7F���"��2������b�&W6V�FF����FV�Bbb���&�Ɨ�VE&V���6�VFW2�&6��֗GFVB"�����&�Ɨ�VE&V���6�VFW2�'V�GW&�"�����&�Ɨ�VE&V���6�VFW2�'&W6V�FF���"���2��C���b�V�G���D��FV�Bbb���&�Ɨ�VE&V���6�VFW2�&�F�fR"�����&�Ɨ�VE&V���6�VFW2�&7F���W�V7WF���"���2��#���b���&҇FW�B���6�VFW2�&6��֗GFVB��"��2��&W6V�FF����FV�B�����b�FW�B��6�VFW2�&W�V7WFT6��G&��"��2��&W6V�FF����FV�B����&�w2�W6���f��S�&V��f֖Ǔ��B�66�&S�2�7��&��3�F�7��&��2�FW�B�ғ��Т&�w2�6�'B���"���"�66�&R��66�&W���f��R���6�T6��&R�"�f��R����f֖Ǖ&�w2�6WB��B�&�w2���Р�6��7B�6��%6WB��Wr6WB�����6�W&6T�6��'2����V�G���D�6��'5ғ��6��7B�&FW&VDf֖ƖW2�����6�'&�F�%��6�'B���"�����6��%6WB�2�"����҆�6��%6WB�2���������f֖Ǖ66�&W2�vWB�"����҆f֖Ǖ66�&W2�vWB�����������6�T6��&R�"�����6��7Bf��W3յӰ�f�"�6��7B�B�b�&FW&VDf֖ƖW2���6��7BV�F��6��%6WB�2��B��"���f�"�6��7B&�r�b�f֖Ǖ&�w2�vWB��B����Ғ�6Ɩ6R��V�F�����b�f��W2�6��R�����f��S���&�r�f��R��f��W2�W6��&�r����b�f��W2��V�wF���"�'&V���Т�b�f��W2��V�wF���"�'&V���Р�6��7BVffV7D�v�W'3�'"�VffV7G2��v�W$f֖ƖW2���f��FW"����6�'&�F�"�2���B����6�'B���"����V�&W"�"�6�FT6�V�C�����V�&W"��6�FT6�V�C������6Ɩ6R��R����6��7Bf��s�&W��FWV�FV�7�f��s��&W��FWV�FV�7��f��s���Ӱ�6��7B&�fW'3�'"�f��r�&�fW'3��f��r����%&�fW'2���6��7B'V�F��S�&�fW'2�f��FW"�#��'"�"�7G&V�2��6��R�3��6�'&�F�"�2�2�C��2���R������#�⇰�&�fW#�"���S��"�C��''V�F��R"��6��fW&vV�6S�"�6��fW&vV�6S��"�6��fW&vV�6U���C���V�����WF�WC�"��WF�WC���V���Ғ����b�'V�F��R��V�wF��'V�F��R�W6���&�fW#�''V�F��R"�6��fW&vV�6S�'67&�G2�fVGW&R�&Vv�7G'��2�7G��W2�V��&Vv�7G'��2"��WF�WC�'67&�G2�'V�F��R��&6�W7G&F�"�2'ғ���6��7B7��&��6�V�C�f��W2�&VGV6R����b����b�7��&��2��V�wF�����6��7B&W&W6V�FVE6�W&6R�6�W&6T�6��'2�6��R��C��f��W2�6��R�c��b�f֖Ǔ��֖B����6��7B&W&W6V�FVDV�G���B�V�G���D�6��'2�6��R��C��f��W2�6��R�c��b�f֖Ǔ��֖B����6��7B6��f�FV�6R�&W&W6V�FVE6�W&6Rbb&W&W6V�FVDV�G���Bbb7��&��6�V�B��"�&��v�"���&W&W6V�FVE6�W&6R��&W&W6V�FVDV�G���B�bb7��&��6�V�B�&�VF�V�"�&W���&F�'�#���6��7B&W�'Cװ����W#����S�$g&�R6���F6�6�'&�F�"���W""�fW'6���#��"�vV�W&FVDC��WrFFR���F��4�7G&��r�����v���FW&�2����FV�C��7F���7F����FV�B�&W6V�FF���&W6V�FF����FV�B�V�G���C�V�G���D��FV�B�G&�67F���G&�67F����FV�B�ƖfV7�6�S�ƖfV7�6�T��FV�B�F&vWF��s�F&vWF��t��FV�G����6��'3��6�W&6S�6�W&6T�6��'2�V�G���C�V�G���D�6��'7���7V��'���f֖ƖW3�6�'&�F�"�6��R�f��W3�f��W2��V�wF��7��&��3�7��&��6�V�B�6��f�FV�6W���6�'&�F�#�����6�'&�F�%���&�VDf֖ƖW3�&�VB�6Ɩ6R��"���f��W2�'V�F��R�VffV7G3�VffV7D�v�W'2��66�S�����f��W57VvvW7FVC��F������f��W2��V�wF����6W'F�f�6F���'V�S�%&VfW"VF�G2��6�FRF��26�'&�F�#��W7F�g��f��R�WG6�FR�B'��WvǒF�66�fW&VBFWV�FV�7��'V�F��R&��F��r��"VffV7B&�V�F'�� ����&6VƖ�S���FWV�FV�7�W'&�'3�&W��7V��'���W'&�'3���V����7��&��W'&�'3�7��&��2�7V��'���W'&�'3���V����VffV7DW'&�'3�VffV7G2�7V��'���W'&�'3���V����VffV7Ev&��w3�VffV7G2�7V��'���v&��w3���V���ЧӰ�g2�w&�FTf��U7��2��WGWBĥ4���7G&��v�g��&W�'B��V���"��%��"����6��6��R���r���g&�R6���F6�6�'&�F�#�G�v������6��6��R���r�G�&W�'B�7V��'��f֖ƖW7�f֖ƖW2�G�&W�'B�7V��'��f��W7�f��W2�G�7��&��6�V�G�7��&���6��'2�G�6��f�FV�6W�6��f�FV�6V���6��6��R���r�6�W&6R�6��'3�G�6�W&6T�6��'2����"�"���&���R'����6��6��R���r�V�G���B�6��'3�G�V�G���D�6��'2����"�"���&���R'����6��6��R���r���6�'&�F�#���G�&W�'B�6�'&�F�"����"��"�����6��6��R���r�%��F&vWFVBF6�7W&f6S�"���f�"�6��7Bb�bf��W2���6��6��R���r�G�b�f��W��G�b�f֖Ǘ�����f�"�6��7B2�bb�7��&��2�6Ɩ6R��R��6��6��R���r��G�2�Ɩ�W�G�2涖�G�G�2���W����Ц6��6��R���r�%��'V�F��R6��fW&vV�6S�"���f�"�6��7B"�b'V�F��R�6��6��R���r�G�"�&�fW'ӢG�"�6��fW&vV�6S��&6���6�F���'�G�"��WF�WC���G�"��WF�WG��"'����6��6��R���r�%��VffV7B&�V�F'�6�F�FFW3�"����b�VffV7D�v�W'2��V�wF��6��6��R���r�"���R��7W'&V�B6�'&�F�""���f�"�6��7BR�bVffV7D�v�W'2�6��6��R���r�G�R�GӢG�R�6�FT6�V�C���VffV7B6�FW2�G�R�7FGW3��&�V�F��'����6��6��R���r���W�V7FVB66�S���G�&W�'B�66�R���f��W57VvvW7FVG�f��W3�&W�'C�G��WGWG���
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const PACKAGE_PATH = path.join(ROOT, "package.json");
const SELF_TEST = process.argv.includes("--self-test");
const RECEIPT_PATH = process.env.FRAME_CONN_ONBOARDING_RECEIPT || path.join(os.tmpdir(), "frame-conn-toolchain-onboarding-receipt.json");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const nodeCommand = process.execPath;

const AUTHORITATIVE_DOCUMENTS = [
  "dev_scripts/DEVELOPMENT_TOOL_SUITE_GUIDE.md",
  "dev_scripts/REQUEST_ENVELOPE.md",
  "dev_scripts/scope-lock.mjs",
  "dev_scripts/MUTATION_CARRIER_ROUTER.md",
  "dev_scripts/TOOLCHAIN_ORCHESTRATOR.md",
  "dev_scripts/ASSISTANT_CONTEXT_BROKER.md",
  "dev_scripts/NATIVE_CONTRACT_CATALOG.md",
  "dev_scripts/INTEGRATION_SURFACE_ATLAS.md",
  "dev_scripts/RUNTIME_SIGNAL_MAP.md",
  "dev_scripts/AUTOMATIC_PATCH_STAGING.md",
  "dev_scripts/CORRIDOR_CONTEXT_PACK.md",
  "dev_scripts/PATCH_AUTHORING_COMPILER.md",
  "dev_scripts/RUNTIME_CONTRACT_PROBES.md",
  "dev_scripts/PATCH_DSL.md",
  "dev_scripts/GITHUB_FILEPATCHER.md",
  "dev_scripts/TOOLCHAIN_COMPATIBILITY_STAGING.md",
  "dev_scripts/CHANGE_PROPAGATION_SIMULATOR.md",
  "dev_scripts/GITHUB_TELEMETRY.md",
  "dev_scripts/FAILURE_EVIDENCE_EXTRACTOR.md",
  "dev_scripts/INFRASTRUCTURE_PUBLISHER.md",
  "dev_scripts/DOMAIN_DECOMPOSER.md"
];

const HARD_INVARIANTS = [
  "The user's original objective is immutable root authority; plans, obstacles, and intermediate requests may change means but never silently replace or broaden the goal.",
  "Only explicit user authorization may expand Scope Lock; the assistant may narrow scope but cannot authorize its own expansion.",
  "A capability gap does not authorize capability construction; stop or request explicit user authorization unless that capability is already authorized by Scope Lock.",
  "Bound the behavioral request before repository mutation.",
  "Use Request Envelope for semantic identity and declared scope.",
  "Let Mutation Carrier Router select exactly one normal mutation authority.",
  "Toolchain Orchestrator is mandatory pre-mutation policy authority.",
  "After READY, use canonical curated context only; do not manually reconstruct repository source.",
  "Do not use generic direct GitHub writes as a substitute for the selected mutation carrier.",
  "Do not inspect GitHub workflow/job logs during normal execution; terminal failure evidence flows through Failure Evidence Extractor.",
  "Use Native Contract Catalog first and authoritative native evidence; never invent native Lancer APIs or flows.",
  "Every runtime behavioral clause must be certified by Patch Corridor before authoring.",
  "Patch Authoring Compiler is preferred when authoring_intent can express the edit; raw operations require a concrete documented exception.",
  "Developer-tool/package transitions must pass Toolchain Compatibility Staging.",
  "Identical terminal failures are sticky; consume extractor evidence and materially revise the canonical request rather than blindly rerun.",
  "Protected .github/workflows publication requires CAPABILITY_GAP, explicit user authorization, and Infrastructure Publisher.",
  "SUCCEEDED closes the request: no reassurance reads, cleanup mutation, workflow inspection, or extra validation.",
  "Runtime-sensitive work ends with the canonical Foundry Runtime Contract Probe/manual checkpoint, not invented validation."
];

const npmStage = (id, label, script, phase) => ({ id, label, phase, command: npmCommand, args: ["run", script], requiredScript: script });
const syntaxStage = (id, label, scriptPath, phase) => ({ id, label, phase, command: nodeCommand, args: ["--check", scriptPath], requiredFile: scriptPath });

const STAGES = [
  npmStage("01-request-envelope", "Request Envelope semantic identity", "request-envelope:self-test", "canonical-spine"),
  npmStage("01b-scope-lock", "Scope Lock immutable user objective and expansion guard", "scope-lock:self-test", "canonical-spine"),
  npmStage("02-mutation-carrier-router", "Mutation Carrier Router authority selection", "mutation-route:self-test", "canonical-spine"),
  npmStage("03-toolchain-orchestrator", "Toolchain Orchestrator state and closure policy", "toolchain:self-test", "canonical-spine"),
  npmStage("04-assistant-context-broker", "Assistant Context Broker bounded evidence", "context-broker:self-test", "canonical-spine"),
  npmStage("05-native-contract-catalog", "Native Contract Catalog reusable native proof", "native-contracts:self-test", "canonical-spine"),
  npmStage("06-integration-surface-atlas", "Integration Surface Atlas native integration discovery", "integration-atlas:self-test", "canonical-spine"),
  npmStage("07-runtime-signal-map", "Runtime Signal Map causal tracing", "runtime-signal-map:self-test", "canonical-spine"),
  npmStage("08-patch-corridor", "Clause-Aware Patch Corridor ownership certification", "patch-corridor:self-test", "canonical-spine"),
  npmStage("09-automatic-patch-staging", "Automatic Patch Staging dependency order and scope locks", "patch-staging:self-test", "canonical-spine"),
  npmStage("10-corridor-context-pack", "Corridor Context Pack exact authoring evidence", "corridor-context:self-test", "canonical-spine"),
  npmStage("11-patch-authoring-compiler", "Patch Authoring Compiler guarded semantic edits", "patch-authoring:self-test", "canonical-spine"),
  npmStage("12-native-contract-verify", "Native Contract Catalog verification pass", "native-contracts:verify", "canonical-spine"),
  npmStage("13-runtime-contract-probes", "Runtime Contract Probe planning contract", "runtime-probes:self-test", "canonical-spine"),
  npmStage("14-patch-dsl", "Patch DSL deterministic shorthand", "patch:dsl:self-test", "canonical-spine"),
  syntaxStage("15-github-filepatcher-syntax", "GitHub FilePatcher executor syntax", "dev_scripts/github-filepatcher.mjs", "canonical-spine"),
  npmStage("16-toolchain-compatibility", "Toolchain Compatibility Staging", "toolchain-compatibility:self-test", "canonical-spine"),
  npmStage("17-change-propagation", "Change Propagation Simulator", "change-propagation:self-test", "canonical-spine"),
  npmStage("18-repository-audit", "Repository Audit", "audit", "validation"),
  npmStage("19-symbol-family-audit", "Symbol Family Audit", "symbol-family-audit", "validation"),
  npmStage("20-effect-atlas", "Effect Atlas side-effect ownership audit", "effect-atlas", "validation"),
  npmStage("21-runtime-authority-audit", "Runtime authority audit", "runtime-authority-audit:self-test", "validation"),
  npmStage("22-state-namespace-atlas", "State Namespace Atlas", "state-namespace-atlas:self-test", "validation"),
  npmStage("23-legacy-assimilation", "Legacy Assimilation Atlas", "legacy-assimilation:self-test", "validation"),
  npmStage("24-domain-decomposer", "Domain Decomposer alternate carrier", "decompose:self-test", "alternate-carriers"),
  npmStage("25-domain-decomposer-executor", "Domain Decomposer Executor delegated mutation path", "decompose:apply:self-test", "alternate-carriers"),
  syntaxStage("26-path-mover-syntax", "Path Mover alternate carrier syntax", "dev_scripts/path-mover.mjs", "alternate-carriers"),
  npmStage("27-infrastructure-publisher", "Infrastructure Publisher protected-path exception", "infrastructure:publish:self-test", "exception-path"),
  npmStage("28-github-telemetry", "GitHub Telemetry terminal receipt/status contract", "github:telemetry:self-test", "terminal-closure"),
  npmStage("29-failure-evidence", "Failure Evidence Extractor terminal failure contract", "failure-evidence:self-test", "terminal-failure-recovery")
];

function sha256(content) { return crypto.createHash("sha256").update(content).digest("hex"); }

function loadPackageScripts() {
  if (!fs.existsSync(PACKAGE_PATH)) throw new Error("package.json was not found at repository root.");
  return JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf8")).scripts ?? {};
}

function fingerprintDocuments() {
  return AUTHORITATIVE_DOCUMENTS.map(relativePath => {
    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath)) throw new Error(`Missing authoritative toolchain document: ${relativePath}`);
    const content = fs.readFileSync(absolutePath);
    return { path: relativePath, sha256: sha256(content), bytes: content.length };
  });
}

function validateManifest() {
  const scripts = loadPackageScripts();
  const stageIds = new Set();
  for (const stage of STAGES) {
    if (stageIds.has(stage.id)) throw new Error(`Duplicate onboarding stage id: ${stage.id}`);
    stageIds.add(stage.id);
    if (stage.requiredScript && !scripts[stage.requiredScript]) throw new Error(`Missing package script required by onboarding: ${stage.requiredScript}`);
    if (stage.requiredFile && !fs.existsSync(path.join(ROOT, stage.requiredFile))) throw new Error(`Missing tool required by onboarding: ${stage.requiredFile}`);
  }
  if (HARD_INVARIANTS.length < 15) throw new Error("Onboarding invariant set is unexpectedly incomplete.");
  return scripts;
}

function writeReceipt(receipt) { fs.writeFileSync(RECEIPT_PATH, `${JSON.stringify(receipt, null, 2)}\n`, "utf8"); }

function runStage(stage) {
  const startedAt = new Date().toISOString();
  console.log(`\n=== [${stage.id}] ${stage.label} ===`);
  console.log(`phase=${stage.phase}`);
  console.log(`command=${stage.command} ${stage.args.join(" ")}`);
  const result = spawnSync(stage.command, stage.args, { cwd: ROOT, stdio: "inherit" });
  const exitCode = Number.isInteger(result.status) ? result.status : 1;
  return { id: stage.id, label: stage.label, phase: stage.phase, command: `${stage.command} ${stage.args.join(" ")}`, startedAt, finishedAt: new Date().toISOString(), exitCode, state: exitCode === 0 ? "PASSED" : "FAILED" };
}

function main() {
  const documents = fingerprintDocuments();
  validateManifest();
  console.log("FRAME CONN TOOLCHAIN ONBOARDING DRILL");
  console.log("This is an execution drill, not a documentation acknowledgement.");
  console.log("Onboarding is incomplete unless every required stage passes in order.");
  console.log("\nHARD ASSISTANT INVARIANTS:");
  HARD_INVARIANTS.forEach((rule, index) => console.log(`${index + 1}. ${rule}`));
  const receipt = { schema_version: 1, kind: "frame_conn_toolchain_onboarding_receipt", repositoryRoot: ROOT, startedAt: new Date().toISOString(), state: "RUNNING", selfTest: SELF_TEST, documentation: documents, hardInvariants: HARD_INVARIANTS, stages: [] };
  if (SELF_TEST) {
    receipt.state = "COMPLETE";
    receipt.finishedAt = new Date().toISOString();
    receipt.note = "Manifest/document/package registration self-test only; run npm run toolchain:onboard for the full execution drill.";
    writeReceipt(receipt);
    console.log(`\nOnboarding harness self-test PASS. Receipt: ${RECEIPT_PATH}`);
    return;
  }
  for (const stage of STAGES) {
    const stageReceipt = runStage(stage);
    receipt.stages.push(stageReceipt);
    writeReceipt(receipt);
    if (stageReceipt.state !== "PASSED") {
      receipt.state = "FAILED";
      receipt.failedStage = stageReceipt.id;
      receipt.finishedAt = new Date().toISOString();
      writeReceipt(receipt);
      console.error(`\nONBOARDING FAILED CLOSED at ${stageReceipt.id}.`);
      console.error(`Receipt: ${RECEIPT_PATH}`);
      process.exitCode = 1;
      return;
    }
  }
  receipt.state = "COMPLETE";
  receipt.finishedAt = new Date().toISOString();
  receipt.completedStageCount = receipt.stages.length;
  writeReceipt(receipt);
  console.log("\nFRAME CONN TOOLCHAIN ONBOARDING COMPLETE");
  console.log(`Executed ${receipt.completedStageCount} required stages in canonical/branch order.`);
  console.log(`Receipt: ${RECEIPT_PATH}`);
}

try { main(); } catch (error) {
  const failed = { schema_version: 1, kind: "frame_conn_toolchain_onboarding_receipt", state: "FAILED", finishedAt: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) };
  try { writeReceipt(failed); } catch {}
  console.error(error);
  process.exitCode = 1;
}

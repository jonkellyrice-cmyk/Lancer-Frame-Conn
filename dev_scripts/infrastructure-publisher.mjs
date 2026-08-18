#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const INFRASTRUCTURE_PUBLISHER_SCHEMA_VERSION = 1;
const DEFAULT_PROTECTED_PREFIXES = [".github/workflows/"];

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizeRepoPath(value) {
  const normalized = String(value ?? "").trim().replaceAll("\\", "/").replace(/^\.\/+/, "");
  if (!normalized || normalized === "." || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error(`Invalid repository path: ${value}`);
  }
  return normalized;
}

function isProtectedInfrastructurePath(repoPath) {
  const normalized = normalizeRepoPath(repoPath);
  return DEFAULT_PROTECTED_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

function readJson(filePath, label) {
  if (!filePath) throw new Error(`${label} path is required.`);
  try {
    return JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function readProposedContent(change, manifestDirectory) {
  if (typeof change.content === "string") return change.content;
  if (typeof change.content_file === "string" && change.content_file.trim()) {
    const source = path.resolve(manifestDirectory, change.content_file);
    return fs.readFileSync(source, "utf8");
  }
  throw new Error("Infrastructure publication change requires content or content_file.");
}

function affectedPaths(capabilityGapRecord) {
  const values = capabilityGapRecord?.capability_gap?.affected_paths_or_refs ?? [];
  return new Set((Array.isArray(values) ? values : []).map(normalizeRepoPath));
}

export function validateInfrastructurePublicationManifest(manifest, options = {}) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("Infrastructure Publisher requires a manifest object.");
  }
  if ((manifest.schema_version ?? 1) !== 1) throw new Error("Unsupported infrastructure publication schema.");
  const gap = manifest.capability_gap_record;
  if (!gap || gap.state !== "CAPABILITY_GAP" || !gap.capability_gap) {
    throw new Error("Publication requires an orchestrator CAPABILITY_GAP record.");
  }

  const authorization = manifest.authorization;
  if (!authorization || authorization.explicit !== true) {
    throw new Error("Explicit user authorization is required.");
  }

  const gapFingerprint = String(gap.request?.fingerprint ?? "").trim();
  const authorizedFingerprint = String(authorization.request_fingerprint ?? "").trim();
  if (!gapFingerprint || gapFingerprint !== authorizedFingerprint) {
    throw new Error("Authorization request fingerprint does not match the capability gap.");
  }

  const changes = manifest.changes;
  if (!Array.isArray(changes) || changes.length !== 1) {
    throw new Error("Infrastructure Publisher v1 permits exactly one file change per authorization.");
  }

  const change = changes[0];
  const repoPath = normalizeRepoPath(change.path);
  if (!isProtectedInfrastructurePath(repoPath)) {
    throw new Error(`Path is outside the v1 protected infrastructure surface: ${repoPath}`);
  }

  const authorizedPaths = new Set(
    (Array.isArray(authorization.authorized_paths) ? authorization.authorized_paths : []).map(normalizeRepoPath)
  );
  if (!authorizedPaths.has(repoPath)) {
    throw new Error(`Path was not explicitly authorized: ${repoPath}`);
  }

  const gapAffected = affectedPaths(gap);
  if (!gapAffected.has(repoPath)) {
    throw new Error(`Path is not listed by the capability gap: ${repoPath}`);
  }

  const repository = String(manifest.repository ?? options.repository ?? process.env.GITHUB_REPOSITORY ?? "").trim();
  const branch = String(manifest.branch ?? options.branch ?? process.env.GITHUB_REF_NAME ?? "").trim();
  if (!repository || !/^[^/\s]+\/[^/\s]+$/.test(repository)) throw new Error("repository must be owner/name.");
  if (!branch) throw new Error("branch is required.");

  const manifestDirectory = options.manifestDirectory ?? process.cwd();
  const content = readProposedContent(change, manifestDirectory);
  const proposedSha256 = sha256(content);
  if (!/^[a-f0-9]{64}$/i.test(String(change.expected_proposed_sha256 ?? ""))) {
    throw new Error("expected_proposed_sha256 is required.");
  }
  if (proposedSha256 !== String(change.expected_proposed_sha256).toLowerCase()) {
    throw new Error("Proposed content SHA-256 does not match the authorized manifest.");
  }

  const expectedCurrentSha256 = change.expected_current_sha256 == null
    ? null
    : String(change.expected_current_sha256).toLowerCase();
  if (expectedCurrentSha256 !== null && !/^[a-f0-9]{64}$/.test(expectedCurrentSha256)) {
    throw new Error("expected_current_sha256 must be null for create or a 64-character SHA-256 digest.");
  }

  return {
    schema_version: INFRASTRUCTURE_PUBLISHER_SCHEMA_VERSION,
    repository,
    branch,
    path: repoPath,
    content,
    expected_current_sha256: expectedCurrentSha256,
    expected_proposed_sha256: proposedSha256,
    request_fingerprint: gapFingerprint,
    authorization_scope: "single_protected_infrastructure_file"
  };
}

function githubHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "frame-conn-infrastructure-publisher",
    Authorization: `Bearer ${token}`
  };
}

async function githubRequest(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub request failed (${response.status}): ${body}`);
  }
  return response.json();
}

async function readCurrentGitHubFile(validated, token) {
  const endpoint = `https://api.github.com/repos/${validated.repository}/contents/${validated.path}?ref=${encodeURIComponent(validated.branch)}`;
  const response = await fetch(endpoint, { headers: githubHeaders(token) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub read failed (${response.status}): ${await response.text()}`);
  const payload = await response.json();
  const content = Buffer.from(String(payload.content ?? "").replace(/\s/g, ""), "base64").toString("utf8");
  return { blob_sha: payload.sha, sha256: sha256(content), content };
}

export async function preflightInfrastructurePublication(validated, token) {
  const current = await readCurrentGitHubFile(validated, token);
  if (validated.expected_current_sha256 === null) {
    if (current) throw new Error(`Authorized create target already exists: ${validated.path}`);
  } else {
    if (!current) throw new Error(`Authorized update target does not exist: ${validated.path}`);
    if (current.sha256 !== validated.expected_current_sha256) {
      throw new Error(
        `Current infrastructure content drifted for ${validated.path}. ` +
        `Expected ${validated.expected_current_sha256}, found ${current.sha256}.`
      );
    }
  }
  return current;
}

export async function publishInfrastructureFile(validated, token, commitMessage) {
  const current = await preflightInfrastructurePublication(validated, token);
  const endpoint = `https://api.github.com/repos/${validated.repository}/contents/${validated.path}`;
  const body = {
    message: commitMessage,
    content: Buffer.from(validated.content, "utf8").toString("base64"),
    branch: validated.branch,
    ...(current?.blob_sha ? { sha: current.blob_sha } : {})
  };
  const payload = await githubRequest(endpoint, {
    method: "PUT",
    headers: { ...githubHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return {
    schema_version: INFRASTRUCTURE_PUBLISHER_SCHEMA_VERSION,
    kind: "frame_conn_infrastructure_publication_receipt",
    state: "PUBLISHED",
    request_fingerprint: validated.request_fingerprint,
    repository: validated.repository,
    branch: validated.branch,
    path: validated.path,
    proposed_sha256: validated.expected_proposed_sha256,
    commit_sha: payload?.commit?.sha ?? null,
    normal_authority_resumed: true,
    permitted_next_action: "canonical_toolchain"
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
  const content = "name: Example\non: workflow_dispatch\n";
  const fingerprint = "a".repeat(64);
  const manifest = {
    schema_version: 1,
    repository: "example/repo",
    branch: "main",
    capability_gap_record: {
      state: "CAPABILITY_GAP",
      request: { fingerprint },
      capability_gap: { affected_paths_or_refs: [".github/workflows/example.yml"] }
    },
    authorization: {
      explicit: true,
      request_fingerprint: fingerprint,
      authorized_paths: [".github/workflows/example.yml"]
    },
    changes: [{
      path: ".github/workflows/example.yml",
      content,
      expected_current_sha256: null,
      expected_proposed_sha256: sha256(content)
    }]
  };
  const validated = validateInfrastructurePublicationManifest(manifest);
  if (validated.path !== ".github/workflows/example.yml") throw new Error("Path validation failed.");
  const unauthorized = structuredClone(manifest);
  unauthorized.authorization.explicit = false;
  let blocked = false;
  try { validateInfrastructurePublicationManifest(unauthorized); } catch { blocked = true; }
  if (!blocked) throw new Error("Explicit authorization guard failed.");
  const multi = structuredClone(manifest);
  multi.changes.push(structuredClone(multi.changes[0]));
  blocked = false;
  try { validateInfrastructurePublicationManifest(multi); } catch { blocked = true; }
  if (!blocked) throw new Error("Single-file authorization guard failed.");
  console.log("Infrastructure Publisher self-test passed.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.has("self-test")) return selfTest();

  const manifestPath = String(args.values.get("manifest") ?? "").trim();
  const manifest = readJson(manifestPath, "Infrastructure publication manifest");
  const validated = validateInfrastructurePublicationManifest(manifest, {
    manifestDirectory: path.dirname(path.resolve(manifestPath))
  });

  const token = String(process.env.GITHUB_TOKEN ?? "").trim();
  if (!token) throw new Error("GITHUB_TOKEN is required for GitHub infrastructure preflight/publication.");

  const current = await preflightInfrastructurePublication(validated, token);
  const preflight = {
    schema_version: INFRASTRUCTURE_PUBLISHER_SCHEMA_VERSION,
    kind: "frame_conn_infrastructure_publication_preflight",
    state: "READY",
    request_fingerprint: validated.request_fingerprint,
    repository: validated.repository,
    branch: validated.branch,
    path: validated.path,
    current_sha256: current?.sha256 ?? null,
    proposed_sha256: validated.expected_proposed_sha256,
    explicit_authorization_verified: true,
    permitted_next_action: args.flags.has("publish") ? "publish_authorized_exception" : "none"
  };

  if (!args.flags.has("publish")) {
    process.stdout.write(`${JSON.stringify(preflight, null, 2)}\n`);
    return;
  }

  const message = String(
    manifest.commit_message ??
    `infrastructure: authorized publication for ${validated.path}`
  ).trim();
  const receipt = await publishInfrastructureFile(validated, token, message);
  const output = String(args.values.get("output") ?? "").trim();
  if (output) fs.writeFileSync(path.resolve(output), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {
    console.error(error?.stack || String(error));
    process.exitCode = 1;
  });
}

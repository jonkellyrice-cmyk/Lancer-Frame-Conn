import path from "node:path";

export const ABSTRACTION_LOCK_SCHEMA_VERSION = 1;
export const ABSTRACTION_LOCK_KIND = "frame_conn_abstraction_lock";

export const ABSTRACTION_OUTCOMES = Object.freeze({
  ALLOW: "ALLOW",
  VIOLATION: "ABSTRACTION_VIOLATION",
  GAP: "ABSTRACTION_GAP",
});

export const FRAME_CONN_TOOLCHAIN_SURFACES = Object.freeze([
  "symbol-families",
  "dependency-graph",
  "dependency-watershed",
  "integration-surface-atlas",
  "runtime-signal-map",
  "effect-atlas",
  "native-contract-catalog",
  "patch-corridor",
  "corridor-context",
  "patch-staging",
  "change-propagation",
  "filepatcher",
  "canonical-validation",
]);

const DIRECT_SOURCE_SURFACES = new Set([
  "github-search",
  "generic-repository-search",
  "direct-source-read",
  "ad-hoc-file-read",
  "guessed-file-read",
]);

function normalizeRepositoryPath(value) {
  const raw = String(value ?? "").trim().replaceAll("\\", "/");
  if (!raw) return null;
  const normalized = path.posix.normalize(raw).replace(/^\.\//, "");
  if (!normalized || normalized === "." || normalized.startsWith("../") || path.posix.isAbsolute(normalized)) {
    return null;
  }
  return normalized;
}

function uniquePaths(values = []) {
  return [...new Set(values.map(normalizeRepositoryPath).filter(Boolean))].sort();
}

function scopeAuthorizedPaths(scopeLock) {
  return new Set(uniquePaths(scopeLock?.authorized_paths ?? scopeLock?.declared_paths ?? []));
}

function pathIsInsideScope(repositoryPath, scopeLock) {
  const authorized = scopeAuthorizedPaths(scopeLock);
  if (authorized.size === 0) return true;
  return authorized.has(repositoryPath);
}

function result(outcome, details = {}) {
  return {
    schema_version: ABSTRACTION_LOCK_SCHEMA_VERSION,
    kind: ABSTRACTION_LOCK_KIND,
    outcome,
    allowed: outcome === ABSTRACTION_OUTCOMES.ALLOW,
    ...details,
  };
}

export function createSourceAccessGrant({ paths = [], issuedBy, evidence, scopeLock } = {}) {
  const grantedPaths = uniquePaths(paths);
  const issuer = String(issuedBy ?? "").trim();
  const evidenceRef = String(evidence ?? "").trim();

  if (!issuer || !evidenceRef || grantedPaths.length === 0) {
    return result(ABSTRACTION_OUTCOMES.GAP, {
      reason: "source-access-grant-requires-paths-issuer-and-evidence",
      permitted_escalation: "return-to-higher-level-toolchain-evidence",
    });
  }

  const outsideScope = grantedPaths.filter((repositoryPath) => !pathIsInsideScope(repositoryPath, scopeLock));
  if (outsideScope.length > 0) {
    return result(ABSTRACTION_OUTCOMES.VIOLATION, {
      reason: "source-access-grant-cannot-broaden-scope-lock",
      denied_paths: outsideScope,
    });
  }

  return result(ABSTRACTION_OUTCOMES.ALLOW, {
    grant: {
      schema_version: 1,
      kind: "frame_conn_source_access_grant",
      issued_by: issuer,
      evidence: evidenceRef,
      paths: grantedPaths,
    },
  });
}

export function evaluateAbstractionAccess({
  scopeLock,
  surface,
  path: requestedPath,
  grant,
  evidenceGap,
  permittedEscalation,
} = {}) {
  if (!scopeLock?.locked && scopeLock?.state !== "LOCKED") {
    return result(ABSTRACTION_OUTCOMES.GAP, {
      reason: "scope-lock-required-before-abstraction-lock",
      permitted_escalation: "establish-scope-lock",
    });
  }

  const requestedSurface = String(surface ?? "").trim().toLowerCase();
  if (!requestedSurface) {
    return result(ABSTRACTION_OUTCOMES.GAP, {
      reason: "repository-surface-not-declared",
      permitted_escalation: "declare-existing-toolchain-surface",
    });
  }

  if (evidenceGap) {
    return result(ABSTRACTION_OUTCOMES.GAP, {
      reason: String(evidenceGap),
      permitted_escalation: permittedEscalation ? String(permittedEscalation) : "return-to-higher-level-toolchain-evidence",
    });
  }

  if (FRAME_CONN_TOOLCHAIN_SURFACES.includes(requestedSurface)) {
    return result(ABSTRACTION_OUTCOMES.ALLOW, {
      surface: requestedSurface,
      authority: "established-toolchain-abstraction",
    });
  }

  if (!DIRECT_SOURCE_SURFACES.has(requestedSurface)) {
    return result(ABSTRACTION_OUTCOMES.VIOLATION, {
      reason: "surface-not-authorized-by-abstraction-lock",
      surface: requestedSurface,
    });
  }

  const repositoryPath = normalizeRepositoryPath(requestedPath);
  if (!repositoryPath) {
    return result(ABSTRACTION_OUTCOMES.VIOLATION, {
      reason: "generic-or-guessed-source-exploration-denied",
      surface: requestedSurface,
    });
  }

  if (!pathIsInsideScope(repositoryPath, scopeLock)) {
    return result(ABSTRACTION_OUTCOMES.VIOLATION, {
      reason: "requested-source-outside-scope-lock",
      path: repositoryPath,
    });
  }

  const grantPaths = uniquePaths(grant?.paths ?? []);
  if (grant?.kind !== "frame_conn_source_access_grant" || !grant?.issued_by || !grant?.evidence || !grantPaths.includes(repositoryPath)) {
    return result(ABSTRACTION_OUTCOMES.VIOLATION, {
      reason: "lower-level-source-access-requires-higher-level-grant",
      path: repositoryPath,
      surface: requestedSurface,
    });
  }

  return result(ABSTRACTION_OUTCOMES.ALLOW, {
    surface: requestedSurface,
    path: repositoryPath,
    authority: "bounded-source-access-grant",
    grant: {
      issued_by: grant.issued_by,
      evidence: grant.evidence,
    },
  });
}

export function createDefaultAbstractionLock(scopeLock) {
  if (!scopeLock?.locked && scopeLock?.state !== "LOCKED") {
    return result(ABSTRACTION_OUTCOMES.GAP, {
      reason: "scope-lock-required-before-abstraction-lock",
      permitted_escalation: "establish-scope-lock",
    });
  }

  return {
    schema_version: ABSTRACTION_LOCK_SCHEMA_VERSION,
    kind: ABSTRACTION_LOCK_KIND,
    state: "LOCKED",
    locked: true,
    scope_lock_fingerprint: scopeLock.fingerprint ?? null,
    repository_read_mode: "toolchain_abstraction_first",
    direct_source_exploration: "grant_required",
    generic_github_search: "denied_for_repository_investigation",
    assistant_may_self_authorize_descent: false,
    permitted_surfaces: [...FRAME_CONN_TOOLCHAIN_SURFACES],
  };
}

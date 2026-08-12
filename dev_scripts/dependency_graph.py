from __future__ import annotations

import json
import re
from collections import defaultdict, deque
from pathlib import Path
from typing import Iterable


SCRIPT_DIR = Path(__file__).resolve().parent
REPOSITORY_ROOT = SCRIPT_DIR.parent
OUTPUT_PATH = SCRIPT_DIR / "dependency-graph-report.json"


# ============================================================
# Repository scope
# ============================================================

# The analyzer is repository-wide by default. These directories are excluded
# because they are documentation, development tooling, generated output,
# dependencies, caches, or repository metadata rather than production runtime.
EXCLUDED_DIRECTORY_NAMES = {
    ".git",
    ".github",
    ".next",
    ".pytest_cache",
    "__pycache__",
    "backups",
    "build",
    "coverage",
    "dev_scripts",
    "dist",
    "docs",
    "documentation",
    "node_modules",
    "patch-history",
    "test",
    "tests",
}

EXCLUDED_FILE_NAMES = {
    "package.json",
    "package-lock.json",
    "npm-shrinkwrap.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "dependency-graph-report.json",
}

# Files that can participate directly in runtime/code/style/template/data flow.
# Images, fonts, audio, and similar leaf assets are intentionally not graph
# nodes. References to those assets are presentation details rather than code
# architecture.
SOURCE_EXTENSIONS = {
    ".js",
    ".mjs",
    ".cjs",
    ".jsx",
    ".ts",
    ".tsx",
    ".mts",
    ".cts",
    ".css",
    ".scss",
    ".html",
    ".hbs",
    ".handlebars",
}

JAVASCRIPT_EXTENSIONS = {
    ".js",
    ".mjs",
    ".cjs",
    ".jsx",
    ".ts",
    ".tsx",
    ".mts",
    ".cts",
}

STYLE_EXTENSIONS = {
    ".css",
    ".scss",
}

TEMPLATE_EXTENSIONS = {
    ".html",
    ".hbs",
    ".handlebars",
}

MODULE_EXTENSIONS = (
    ".js",
    ".mjs",
    ".cjs",
    ".jsx",
    ".ts",
    ".tsx",
    ".mts",
    ".cts",
    ".json",
    ".css",
    ".scss",
    ".html",
    ".hbs",
    ".handlebars",
)

RUNTIME_MANIFEST_NAMES = {
    "module.json",
    "system.json",
}

HIGH_FAN_IN_THRESHOLD = 4
HIGH_FAN_OUT_THRESHOLD = 5


# ============================================================
# Dependency extraction patterns
# ============================================================

# These expressions deliberately permit line breaks inside ES module
# declarations because Frame Helm uses heavily multiline import formatting.
STATIC_IMPORT_FROM_PATTERN = re.compile(
    r"\bimport\s+(?!\()(?:(?!;).)*?\bfrom\s*[\"']([^\"']+)[\"']",
    re.DOTALL,
)
SIDE_EFFECT_IMPORT_PATTERN = re.compile(
    r"\bimport\s*[\"']([^\"']+)[\"']",
    re.DOTALL,
)
STATIC_EXPORT_FROM_PATTERN = re.compile(
    r"\bexport\s+(?:(?!;).)*?\bfrom\s*[\"']([^\"']+)[\"']",
    re.DOTALL,
)
DYNAMIC_IMPORT_PATTERN = re.compile(
    r"\bimport\s*\(\s*[\"']([^\"']+)[\"']\s*\)",
    re.DOTALL,
)
REQUIRE_PATTERN = re.compile(
    r"\brequire\s*\(\s*[\"']([^\"']+)[\"']\s*\)",
    re.DOTALL,
)
STYLE_IMPORT_PATTERN = re.compile(
    r"@(?:import|use|forward)\s+(?:url\(\s*)?[\"']([^\"']+)[\"']\s*\)?",
    re.IGNORECASE,
)
TEMPLATE_REFERENCE_PATTERN = re.compile(
    r"(?:src|href)\s*=\s*[\"']([^\"']+)[\"']",
    re.IGNORECASE,
)


# ============================================================
# Path helpers and repository discovery
# ============================================================


def repository_relative(path: Path) -> str:
    return path.resolve().relative_to(REPOSITORY_ROOT.resolve()).as_posix()


def is_excluded_path(path: Path) -> bool:
    relative = path.resolve().relative_to(REPOSITORY_ROOT.resolve())

    if path.name in EXCLUDED_FILE_NAMES:
        return True

    return any(
        part.lower() in EXCLUDED_DIRECTORY_NAMES
        for part in relative.parts[:-1]
    )


def is_runtime_manifest(path: Path) -> bool:
    return path.name.lower() in RUNTIME_MANIFEST_NAMES


def is_scannable_runtime_file(path: Path) -> bool:
    if not path.is_file() or is_excluded_path(path):
        return False

    if is_runtime_manifest(path):
        return True

    return path.suffix.lower() in SOURCE_EXTENSIONS


def iter_runtime_files() -> Iterable[Path]:
    for path in REPOSITORY_ROOT.rglob("*"):
        if is_scannable_runtime_file(path):
            yield path.resolve()


def architectural_folder(path: Path) -> str:
    relative = Path(repository_relative(path))
    parts = relative.parts

    if len(parts) <= 1:
        return "."

    root = parts[0]

    if root == "scripts" and len(parts) >= 2 and parts[1].startswith("feature_"):
        return f"scripts/{parts[1]}"

    if root == "styles" and len(parts) >= 2 and parts[1].startswith("ui_"):
        return f"styles/{parts[1]}"

    return root


def normalize_local_reference(value: str) -> str:
    value = value.strip()
    value = value.split("#", 1)[0].split("?", 1)[0]
    return value


# ============================================================
# Source reading and dependency extraction
# ============================================================


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return ""


def strip_javascript_comments(text: str) -> str:
    """Remove comments while preserving quoted strings and line positions."""
    pattern = re.compile(
        r"(?P<string>\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)"
        r"|(?P<line>//[^\n\r]*)"
        r"|(?P<block>/\*.*?\*/)",
        re.DOTALL,
    )

    def replace(match: re.Match[str]) -> str:
        if match.group("string") is not None:
            return match.group("string")

        value = match.group(0)
        return "".join("\n" if character == "\n" else " " for character in value)

    return pattern.sub(replace, text)


def manifest_runtime_references(path: Path) -> list[str]:
    try:
        data = json.loads(read_text(path))
    except json.JSONDecodeError:
        return []

    if not isinstance(data, dict):
        return []

    references: list[str] = []

    for key in ("scripts", "esmodules", "styles"):
        values = data.get(key, [])

        if isinstance(values, str):
            references.append(values)
        elif isinstance(values, list):
            references.extend(
                value
                for value in values
                if isinstance(value, str)
            )

    return references


def extract_dependency_specifiers(path: Path) -> list[str]:
    text = read_text(path)

    if not text:
        return []

    suffix = path.suffix.lower()
    specifiers: list[str] = []

    if is_runtime_manifest(path):
        specifiers.extend(manifest_runtime_references(path))

    elif suffix in JAVASCRIPT_EXTENSIONS:
        text = strip_javascript_comments(text)

        for pattern in (
            STATIC_IMPORT_FROM_PATTERN,
            SIDE_EFFECT_IMPORT_PATTERN,
            STATIC_EXPORT_FROM_PATTERN,
            DYNAMIC_IMPORT_PATTERN,
            REQUIRE_PATTERN,
        ):
            specifiers.extend(pattern.findall(text))

    elif suffix in STYLE_EXTENSIONS:
        specifiers.extend(STYLE_IMPORT_PATTERN.findall(text))

    elif suffix in TEMPLATE_EXTENSIONS:
        specifiers.extend(TEMPLATE_REFERENCE_PATTERN.findall(text))

    normalized = [
        normalize_local_reference(value)
        for value in specifiers
        if normalize_local_reference(value)
    ]

    return list(dict.fromkeys(normalized))


def is_local_specifier(specifier: str) -> bool:
    if specifier.startswith(("http://", "https://", "data:", "#")):
        return False

    if specifier.startswith((".", "/")):
        return True

    # Foundry manifests normally use repository-root-relative paths such as
    # scripts/foo.js and styles/foo.css rather than ./scripts/foo.js.
    return "/" in specifier or Path(specifier).suffix.lower() in SOURCE_EXTENSIONS


def candidate_paths(importer: Path, specifier: str) -> list[Path]:
    normalized = normalize_local_reference(specifier)

    if is_runtime_manifest(importer):
        base = REPOSITORY_ROOT / normalized.lstrip("/")
    elif normalized.startswith("/"):
        base = REPOSITORY_ROOT / normalized.lstrip("/")
    else:
        base = importer.parent / normalized

    base = base.resolve()
    candidates: list[Path] = [base]

    if not base.suffix:
        candidates.extend(
            base.with_suffix(extension)
            for extension in MODULE_EXTENSIONS
        )
        candidates.extend(
            base / f"index{extension}"
            for extension in MODULE_EXTENSIONS
        )

    return candidates


def resolve_local_dependency(importer: Path, specifier: str) -> Path | None:
    repository_root = REPOSITORY_ROOT.resolve()

    for candidate in candidate_paths(importer, specifier):
        try:
            candidate.relative_to(repository_root)
        except ValueError:
            continue

        if candidate.is_file():
            return candidate.resolve()

    return None


# ============================================================
# Static graph analysis
# ============================================================


def find_cycles(dependencies: dict[Path, set[Path]]) -> list[list[Path]]:
    state: dict[Path, int] = {path: 0 for path in dependencies}
    stack: list[Path] = []
    stack_index: dict[Path, int] = {}
    canonical_cycles: dict[tuple[str, ...], list[Path]] = {}

    def canonical_key(cycle: list[Path]) -> tuple[str, ...]:
        body = cycle[:-1]
        names = [repository_relative(path) for path in body]
        rotations = [
            tuple(names[index:] + names[:index])
            for index in range(len(names))
        ]
        return min(rotations)

    def visit(path: Path) -> None:
        state[path] = 1
        stack_index[path] = len(stack)
        stack.append(path)

        for dependency in dependencies[path]:
            if dependency not in state:
                continue

            if state[dependency] == 0:
                visit(dependency)
            elif state[dependency] == 1:
                start = stack_index[dependency]
                cycle = stack[start:] + [dependency]
                canonical_cycles.setdefault(canonical_key(cycle), cycle)

        stack.pop()
        stack_index.pop(path, None)
        state[path] = 2

    for path in dependencies:
        if state[path] == 0:
            visit(path)

    return sorted(
        canonical_cycles.values(),
        key=lambda cycle: [repository_relative(path) for path in cycle],
    )


def cross_layer_reason(importer: Path, dependency: Path) -> str | None:
    importer_relative = repository_relative(importer)
    dependency_relative = repository_relative(dependency)

    if importer_relative.startswith("scripts/") and dependency_relative.startswith("styles/"):
        return "runtime/domain source depends directly on presentation source"

    return None


# ============================================================
# Runtime-flow classification
# ============================================================


def classify_role(path: Path) -> str:
    relative = repository_relative(path)
    name = path.name.lower()
    suffix = path.suffix.lower()

    if is_runtime_manifest(path):
        return "runtime-manifest"
    if suffix in TEMPLATE_EXTENSIONS:
        return "template-resource"
    if suffix in STYLE_EXTENSIONS:
        return "presentation-style"
    if "/components/" in f"/{relative}":
        return "presentation-component"
    if "contract" in name or name == "dsl.js":
        return "primitive-contract"
    if "registry-core" in name:
        return "registry-primitive"
    if "registry" in name:
        return "registry-composition"
    if "orchestrator" in name:
        return "runtime-orchestrator"
    if "bridge" in name:
        return "system-bridge"
    if name.endswith("-feature.js") or "/feature_" in relative:
        return "feature-runtime"
    if name.startswith("ui-") or "/ui_" in relative:
        return "presentation-runtime"

    return "runtime-module"


def terminal_kinds_for_file(
    path: Path,
    manifest_loaded_files: dict[Path, str],
) -> set[str]:
    relative = repository_relative(path)
    suffix = path.suffix.lower()
    text = read_text(path)
    kinds: set[str] = set()

    if is_runtime_manifest(path):
        kinds.add("foundry-runtime-manifest")

    manifest_kind = manifest_loaded_files.get(path)
    if manifest_kind:
        kinds.add(manifest_kind)

    if suffix in JAVASCRIPT_EXTENSIONS:
        uncommented = strip_javascript_comments(text)

        if re.search(r"\bHooks\s*\.\s*(?:on|once)\s*\(", uncommented):
            kinds.add("foundry-hook-boundary")

        if re.search(r"\b(?:Application|ApplicationV2)\b", uncommented) and (
            "render" in uncommented or "activateListeners" in uncommented
        ):
            kinds.add("user-facing-application-boundary")

        if "PIXI." in uncommented or "canvas.interface" in uncommented:
            kinds.add("canvas-presentation-boundary")

        if "system-bridge" in relative.lower() and (
            "execute" in uncommented or "resolve" in uncommented
        ):
            kinds.add("native-system-bridge-boundary")

    return kinds


def discover_manifest_loaded_files(
    source_set: set[Path],
) -> tuple[set[Path], dict[Path, str]]:
    manifests = {
        path
        for path in source_set
        if is_runtime_manifest(path)
    }
    loaded: dict[Path, str] = {}

    for manifest in manifests:
        try:
            data = json.loads(read_text(manifest))
        except json.JSONDecodeError:
            continue

        if not isinstance(data, dict):
            continue

        for key, terminal_kind in (
            ("scripts", "foundry-script-entrypoint"),
            ("esmodules", "foundry-esmodule-entrypoint"),
            ("styles", "foundry-style-entrypoint"),
        ):
            values = data.get(key, [])
            if isinstance(values, str):
                values = [values]
            if not isinstance(values, list):
                continue

            for value in values:
                if not isinstance(value, str):
                    continue

                resolved = resolve_local_dependency(manifest, value)
                if resolved in source_set:
                    loaded[resolved] = terminal_kind

    return manifests, loaded


def reachable_terminals_from_file(
    start: Path,
    reverse_dependencies: dict[Path, set[Path]],
    terminal_kinds: dict[Path, set[str]],
) -> dict[Path, set[str]]:
    """
    Follow contribution flow from a low-level file toward its consumers.

    Import edges point consumer -> dependency. Runtime contribution therefore
    flows in the opposite direction, through reverse_dependencies.
    """
    found: dict[Path, set[str]] = {}
    visited: set[Path] = set()
    queue: deque[Path] = deque([start])

    while queue:
        path = queue.popleft()
        if path in visited:
            continue
        visited.add(path)

        if terminal_kinds.get(path):
            found[path] = set(terminal_kinds[path])

        for consumer in reverse_dependencies.get(path, set()):
            if consumer not in visited:
                queue.append(consumer)

    return found


def contributing_files_to_head(
    head: Path,
    dependencies: dict[Path, set[Path]],
) -> set[Path]:
    visited: set[Path] = set()
    queue: deque[Path] = deque([head])

    while queue:
        path = queue.popleft()
        if path in visited:
            continue
        visited.add(path)

        for dependency in dependencies.get(path, set()):
            if dependency not in visited:
                queue.append(dependency)

    return visited


def expected_flow_description(path: Path) -> str:
    role = classify_role(path)

    expectations = {
        "primitive-contract": "be consumed by a feature, service, registry, or other runtime module",
        "registry-primitive": "feed a registry composition surface",
        "feature-runtime": "feed feature registration, runtime orchestration, hooks, UI, or execution",
        "presentation-component": "feed a stable UI surface or presentation composition root",
        "presentation-runtime": "feed a user-facing application, canvas boundary, or UI registry",
        "registry-composition": "feed a runtime/application composition root or externally loaded entrypoint",
        "runtime-orchestrator": "terminate at an externally loaded runtime entrypoint or Foundry hook boundary",
        "system-bridge": "feed native-system execution or a runtime consumer",
        "presentation-style": "feed a stylesheet entrypoint",
        "template-resource": "be referenced by runtime presentation code or a runtime manifest",
        "runtime-module": "feed another production runtime module or a legitimate endpoint",
    }

    return expectations.get(role, "contribute to a legitimate production runtime endpoint")


# ============================================================
# Report construction
# ============================================================


def main() -> int:
    source_files = sorted(set(iter_runtime_files()), key=repository_relative)
    source_set = set(source_files)

    dependencies: dict[Path, set[Path]] = {
        path: set()
        for path in source_files
    }
    reverse_dependencies: dict[Path, set[Path]] = defaultdict(set)
    broken_by_file: dict[Path, list[dict[str, str]]] = defaultdict(list)

    for importer in source_files:
        seen_broken_specifiers: set[str] = set()

        for raw_specifier in extract_dependency_specifiers(importer):
            specifier = raw_specifier.strip()

            if not specifier or not is_local_specifier(specifier):
                continue

            resolved = resolve_local_dependency(importer, specifier)

            if resolved is None:
                if specifier not in seen_broken_specifiers:
                    broken_by_file[importer].append(
                        {
                            "specifier": specifier,
                            "reason": "local dependency does not resolve to an existing repository file",
                        }
                    )
                    seen_broken_specifiers.add(specifier)
                continue

            # A valid local asset may exist without being a graph node. Only
            # runtime/source files participate in architecture counts.
            if resolved not in source_set:
                continue

            dependencies[importer].add(resolved)
            reverse_dependencies[resolved].add(importer)

    dependency_edge_count = sum(len(values) for values in dependencies.values())
    cycles = find_cycles(dependencies)

    manifests, manifest_loaded_files = discover_manifest_loaded_files(source_set)

    terminal_kinds: dict[Path, set[str]] = {
        path: terminal_kinds_for_file(path, manifest_loaded_files)
        for path in source_files
    }

    # Templates are resources rather than executable streams. If presentation
    # code references one, it participates normally; otherwise it is not treated
    # as a suspicious executable orphan merely because Foundry may resolve it by
    # string path at runtime.
    non_executable_resources = {
        path
        for path in source_files
        if path.suffix.lower() in TEMPLATE_EXTENSIONS
    }

    broken_dependencies = [
        {
            "file": repository_relative(path),
            "dependencies": broken_by_file[path],
        }
        for path in source_files
        if broken_by_file.get(path)
    ]

    suspicious_orphans = []
    for path in source_files:
        if path in manifests or path in non_executable_resources:
            continue
        if terminal_kinds[path] or reverse_dependencies[path]:
            continue

        suspicious_orphans.append(
            {
                "file": repository_relative(path),
                "role": classify_role(path),
                "dependency_count": len(dependencies[path]),
                "reason": "no production runtime file consumes this file and it is not a recognized endpoint",
            }
        )

    unexpected_cross_layer_dependencies = []
    for importer in source_files:
        for dependency in sorted(dependencies[importer], key=repository_relative):
            reason = cross_layer_reason(importer, dependency)
            if reason:
                unexpected_cross_layer_dependencies.append(
                    {
                        "from": repository_relative(importer),
                        "to": repository_relative(dependency),
                        "reason": reason,
                    }
                )

    # --------------------------------------------------------
    # Folder-level dependency architecture
    # --------------------------------------------------------

    folder_counts: dict[str, int] = defaultdict(int)
    folder_internal_edges: dict[str, int] = defaultdict(int)
    folder_edges: dict[tuple[str, str], int] = defaultdict(int)

    for path in source_files:
        folder_counts[architectural_folder(path)] += 1

    for importer in source_files:
        source_folder = architectural_folder(importer)

        for dependency in dependencies[importer]:
            target_folder = architectural_folder(dependency)
            folder_edges[(source_folder, target_folder)] += 1

            if source_folder == target_folder:
                folder_internal_edges[source_folder] += 1

    architecture_folders = [
        {
            "folder": folder,
            "file_count": folder_counts[folder],
            "internal_dependency_edges": folder_internal_edges[folder],
            "outbound_dependency_edges": sum(
                count
                for (source, target), count in folder_edges.items()
                if source == folder and source != target
            ),
            "inbound_dependency_edges": sum(
                count
                for (source, target), count in folder_edges.items()
                if target == folder and source != target
            ),
        }
        for folder in sorted(folder_counts)
    ]

    architecture_folder_edges = [
        {
            "from": source,
            "to": target,
            "count": count,
        }
        for (source, target), count in sorted(folder_edges.items())
        if source != target
    ]

    high_fan_in = [
        {
            "file": repository_relative(path),
            "reverse_dependency_count": len(reverse_dependencies[path]),
            "dependency_count": len(dependencies[path]),
        }
        for path in source_files
        if len(reverse_dependencies[path]) >= HIGH_FAN_IN_THRESHOLD
    ]
    high_fan_in.sort(
        key=lambda item: (-int(item["reverse_dependency_count"]), str(item["file"]))
    )

    high_fan_out = [
        {
            "file": repository_relative(path),
            "dependency_count": len(dependencies[path]),
            "reverse_dependency_count": len(reverse_dependencies[path]),
        }
        for path in source_files
        if len(dependencies[path]) >= HIGH_FAN_OUT_THRESHOLD
    ]
    high_fan_out.sort(
        key=lambda item: (-int(item["dependency_count"]), str(item["file"]))
    )

    cycle_records = [
        {
            "cycle": [repository_relative(path) for path in cycle],
        }
        for cycle in cycles
    ]

    # --------------------------------------------------------
    # Runtime contribution flow: tributaries -> rivers
    # --------------------------------------------------------

    reachable_terminals: dict[Path, dict[Path, set[str]]] = {
        path: reachable_terminals_from_file(
            path,
            reverse_dependencies,
            terminal_kinds,
        )
        for path in source_files
    }

    flow_participants = [
        path
        for path in source_files
        if path not in non_executable_resources
    ]

    files_reaching_terminal = {
        path
        for path in flow_participants
        if reachable_terminals[path]
    }

    terminal_kind_contributors: dict[str, set[Path]] = defaultdict(set)
    terminal_kind_files: dict[str, set[Path]] = defaultdict(set)

    for path in flow_participants:
        for terminal, kinds in reachable_terminals[path].items():
            for kind in kinds:
                terminal_kind_contributors[kind].add(path)
                terminal_kind_files[kind].add(terminal)

    major_streams = [
        {
            "terminal_kind": kind,
            "contributing_file_count": len(terminal_kind_contributors[kind]),
            "terminal_count": len(terminal_kind_files[kind]),
            "terminals": sorted(
                repository_relative(path)
                for path in terminal_kind_files[kind]
            ),
            "status": "complete",
        }
        for kind in sorted(
            terminal_kind_contributors,
            key=lambda candidate: (
                -len(terminal_kind_contributors[candidate]),
                candidate,
            ),
        )
    ]

    # A stopped stream is reported only at its head: a file with no production
    # consumer and no legitimate terminal classification. Its underlying
    # contributors are summarized instead of individually dumped.
    dead_end_candidates = []

    for head in source_files:
        if head in manifests or head in non_executable_resources:
            continue
        if terminal_kinds[head] or reverse_dependencies[head]:
            continue

        contributors = contributing_files_to_head(head, dependencies)
        contributor_examples = sorted(
            repository_relative(path)
            for path in contributors
            if path != head
        )[:8]

        dead_end_candidates.append(
            {
                "stopped_at": repository_relative(head),
                "role": classify_role(head),
                "expected_flow": expected_flow_description(head),
                "actual_outcome": "flow has no production consumer or recognized runtime endpoint",
                "contributing_file_count": max(0, len(contributors) - 1),
                "contributor_examples": contributor_examples,
                "direct_dependencies": sorted(
                    repository_relative(path)
                    for path in dependencies[head]
                ),
            }
        )

    dead_end_candidates.sort(key=lambda item: str(item["stopped_at"]))

    folder_flow: list[dict[str, object]] = []

    for folder in sorted(folder_counts):
        members = [
            path
            for path in flow_participants
            if architectural_folder(path) == folder
        ]

        kinds: set[str] = set()
        complete_count = 0

        for path in members:
            if reachable_terminals[path]:
                complete_count += 1

            for terminal_map_kinds in reachable_terminals[path].values():
                kinds.update(terminal_map_kinds)

        folder_flow.append(
            {
                "folder": folder,
                "flow_file_count": len(members),
                "files_reaching_recognized_terminal": complete_count,
                "terminal_kinds_reached": sorted(kinds),
                "status": (
                    "complete"
                    if complete_count == len(members)
                    else "review"
                ),
            }
        )

    broken_reference_count = sum(
        len(record["dependencies"])
        for record in broken_dependencies
    )

    structural_problem_count = (
        broken_reference_count
        + len(cycle_records)
        + len(suspicious_orphans)
        + len(unexpected_cross_layer_dependencies)
    )

    runtime_flow_problem_count = len(dead_end_candidates)

    report = {
        "schema_version": 3,
        "scope": {
            "mode": "repository-runtime",
            "repository_root": ".",
            "excluded_directories": sorted(EXCLUDED_DIRECTORY_NAMES),
            "excluded_files": sorted(EXCLUDED_FILE_NAMES),
            "runtime_file_extensions": sorted(SOURCE_EXTENSIONS),
            "runtime_manifests": sorted(RUNTIME_MANIFEST_NAMES),
        },
        "summary": {
            "files_scanned": len(source_files),
            "dependency_edges": dependency_edge_count,
            "broken_dependency_references": broken_reference_count,
            "files_with_broken_dependencies": len(broken_dependencies),
            "cycles": len(cycle_records),
            "suspicious_orphans": len(suspicious_orphans),
            "unexpected_cross_layer_dependencies": len(unexpected_cross_layer_dependencies),
            "runtime_flow_dead_ends": runtime_flow_problem_count,
            "files_reaching_runtime_terminal": len(files_reaching_terminal),
            "recognized_runtime_terminal_files": sum(
                1
                for kinds in terminal_kinds.values()
                if kinds
            ),
            "major_runtime_streams": len(major_streams),
            "high_fan_in_files": len(high_fan_in),
            "high_fan_out_files": len(high_fan_out),
            "problem_count": structural_problem_count + runtime_flow_problem_count,
            "healthy": (
                structural_problem_count == 0
                and runtime_flow_problem_count == 0
            ),
        },
        "architecture": {
            "folders": architecture_folders,
            "folder_edges": architecture_folder_edges,
            "hubs": {
                "high_fan_in": high_fan_in,
                "high_fan_out": high_fan_out,
            },
        },
        "runtime_flow": {
            "direction": "low-level contributors -> consumers -> recognized runtime terminals",
            "major_streams": major_streams,
            "folder_flow": folder_flow,
            "terminal_files": [
                {
                    "file": repository_relative(path),
                    "kinds": sorted(kinds),
                }
                for path, kinds in sorted(
                    terminal_kinds.items(),
                    key=lambda item: repository_relative(item[0]),
                )
                if kinds
            ],
            "dead_end_candidates": dead_end_candidates,
        },
        "problems": {
            "broken_dependencies": broken_dependencies,
            "cycles": cycle_records,
            "suspicious_orphans": suspicious_orphans,
            "unexpected_cross_layer_dependencies": unexpected_cross_layer_dependencies,
            "runtime_flow_dead_ends": dead_end_candidates,
        },
    }

    OUTPUT_PATH.write_text(
        json.dumps(report, indent=2) + "\n",
        encoding="utf-8",
    )

    print(
        f"Dependency and runtime-flow report written to "
        f"{repository_relative(OUTPUT_PATH)}"
    )
    print(f"Runtime files scanned: {len(source_files)}")
    print(f"Dependency edges: {dependency_edge_count}")
    print(f"Broken references: {broken_reference_count}")
    print(f"Cycles: {len(cycle_records)}")
    print(f"Suspicious orphans: {len(suspicious_orphans)}")
    print(f"Runtime-flow dead ends: {runtime_flow_problem_count}")
    print(f"Recognized runtime streams: {len(major_streams)}")
    print(
        "Unexpected scripts -> styles edges: "
        f"{len(unexpected_cross_layer_dependencies)}"
    )

    # Only an unresolved local dependency is a hard command failure. Structural
    # and runtime-flow findings are review signals written into the report.
    return 1 if broken_reference_count else 0


if __name__ == "__main__":
    raise SystemExit(main())

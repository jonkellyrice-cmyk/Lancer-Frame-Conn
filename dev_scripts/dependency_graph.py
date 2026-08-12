from __future__ import annotations

import json
import re
from collections import defaultdict, deque
from pathlib import Path
from typing import Iterable


SCRIPT_DIR = Path(__file__).resolve().parent
REPOSITORY_ROOT = SCRIPT_DIR.parent

SCAN_ROOTS = (
    REPOSITORY_ROOT / "scripts",
    REPOSITORY_ROOT / "styles",
)

OUTPUT_PATH = SCRIPT_DIR / "dependency-graph-report.json"

SOURCE_EXTENSIONS = {
    ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".mts", ".cts", ".css"
}

JAVASCRIPT_EXTENSIONS = {
    ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".mts", ".cts"
}

MODULE_EXTENSIONS = (
    ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".mts", ".cts", ".json", ".css"
)

# These patterns deliberately permit line breaks inside ES module declarations.
# They are bounded by the from-clause/string literal rather than by a single line,
# which matches Frame Helm's heavily multiline import formatting.
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
CSS_IMPORT_PATTERN = re.compile(
    r"@import\s+(?:url\(\s*)?[\"']([^\"']+)[\"']\s*\)?",
    re.IGNORECASE,
)

KNOWN_ENTRYPOINTS = {
    "scripts/runtime-orchestrator.js",
    "styles/ui-orchestrator.css",
}

HIGH_FAN_IN_THRESHOLD = 4
HIGH_FAN_OUT_THRESHOLD = 5


def repository_relative(path: Path) -> str:
    return path.resolve().relative_to(REPOSITORY_ROOT.resolve()).as_posix()


def iter_source_files() -> Iterable[Path]:
    for root in SCAN_ROOTS:
        if not root.exists():
            continue

        for path in root.rglob("*"):
            if path.is_file() and path.suffix.lower() in SOURCE_EXTENSIONS:
                yield path.resolve()


def architectural_folder(path: Path) -> str:
    relative = Path(repository_relative(path))
    parts = relative.parts

    if not parts:
        return "."

    root = parts[0]

    if root == "scripts":
        if len(parts) >= 2 and parts[1].startswith("feature_"):
            return f"scripts/{parts[1]}"
        return "scripts"

    if root == "styles":
        if len(parts) >= 2 and parts[1].startswith("ui_"):
            return f"styles/{parts[1]}"
        return "styles"

    return root


def strip_javascript_comments(text: str) -> str:
    """
    Remove comments before dependency extraction while preserving quoted text.

    This is intentionally lightweight rather than a full JavaScript parser, but
    it avoids counting import-looking examples in ordinary // and /* */ comments.
    """
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
        return "".join("\n" if char == "\n" else " " for char in value)

    return pattern.sub(replace, text)


def extract_dependency_specifiers(path: Path) -> list[str]:
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return []

    suffix = path.suffix.lower()
    specifiers: list[str] = []

    if suffix in JAVASCRIPT_EXTENSIONS:
        text = strip_javascript_comments(text)
        for pattern in (
            STATIC_IMPORT_FROM_PATTERN,
            SIDE_EFFECT_IMPORT_PATTERN,
            STATIC_EXPORT_FROM_PATTERN,
            DYNAMIC_IMPORT_PATTERN,
            REQUIRE_PATTERN,
        ):
            specifiers.extend(pattern.findall(text))

    if suffix == ".css":
        specifiers.extend(CSS_IMPORT_PATTERN.findall(text))

    # Preserve declaration order while removing duplicate specifiers from the
    # same source file.
    return list(dict.fromkeys(specifiers))


def is_local_specifier(specifier: str) -> bool:
    return specifier.startswith(".") or specifier.startswith("/")


def candidate_paths(importer: Path, specifier: str) -> list[Path]:
    if specifier.startswith("/"):
        base = REPOSITORY_ROOT / specifier.lstrip("/")
    else:
        base = importer.parent / specifier

    base = base.resolve()
    candidates: list[Path] = [base]

    if not base.suffix:
        candidates.extend(base.with_suffix(extension) for extension in MODULE_EXTENSIONS)
        candidates.extend(base / f"index{extension}" for extension in MODULE_EXTENSIONS)

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


def reachable_from_entrypoints(
    dependencies: dict[Path, set[Path]],
    source_by_relative: dict[str, Path],
) -> set[Path]:
    roots = [
        source_by_relative[path]
        for path in KNOWN_ENTRYPOINTS
        if path in source_by_relative
    ]

    visited: set[Path] = set()
    queue: deque[Path] = deque(roots)

    while queue:
        path = queue.popleft()
        if path in visited:
            continue

        visited.add(path)
        queue.extend(
            dependency
            for dependency in dependencies.get(path, set())
            if dependency not in visited
        )

    return visited


def cross_layer_reason(importer: Path, dependency: Path) -> str | None:
    importer_relative = repository_relative(importer)
    dependency_relative = repository_relative(dependency)

    if importer_relative.startswith("scripts/") and dependency_relative.startswith("styles/"):
        return "runtime/domain source depends directly on presentation source"

    return None


def main() -> int:
    source_files = sorted(set(iter_source_files()), key=repository_relative)
    source_set = set(source_files)
    source_by_relative = {repository_relative(path): path for path in source_files}

    dependencies: dict[Path, set[Path]] = {path: set() for path in source_files}
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

            # Existing local files outside scripts/styles are valid but are not
            # included in the compact architectural graph.
            if resolved not in source_set:
                continue

            dependencies[importer].add(resolved)
            reverse_dependencies[resolved].add(importer)

    dependency_edge_count = sum(len(values) for values in dependencies.values())
    cycles = find_cycles(dependencies)
    reachable = reachable_from_entrypoints(dependencies, source_by_relative)

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
        relative = repository_relative(path)

        if relative in KNOWN_ENTRYPOINTS or reverse_dependencies[path]:
            continue

        suspicious_orphans.append(
            {
                "file": relative,
                "dependency_count": len(dependencies[path]),
                "reason": "no scanned source file depends on this file",
                "reachable_from_known_entrypoint": path in reachable,
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
        {"from": source, "to": target, "count": count}
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
        {"cycle": [repository_relative(path) for path in cycle]}
        for cycle in cycles
    ]

    broken_reference_count = sum(
        len(record["dependencies"])
        for record in broken_dependencies
    )

    problem_count = (
        broken_reference_count
        + len(cycle_records)
        + len(suspicious_orphans)
        + len(unexpected_cross_layer_dependencies)
    )

    report = {
        "schema_version": 2,
        "scope": ["scripts", "styles"],
        "summary": {
            "files_scanned": len(source_files),
            "dependency_edges": dependency_edge_count,
            "broken_dependency_references": broken_reference_count,
            "files_with_broken_dependencies": len(broken_dependencies),
            "cycles": len(cycle_records),
            "suspicious_orphans": len(suspicious_orphans),
            "unexpected_cross_layer_dependencies": len(unexpected_cross_layer_dependencies),
            "high_fan_in_files": len(high_fan_in),
            "high_fan_out_files": len(high_fan_out),
            "problem_count": problem_count,
            "healthy": problem_count == 0,
        },
        "architecture": {
            "known_entrypoints": sorted(KNOWN_ENTRYPOINTS),
            "folders": architecture_folders,
            "folder_edges": architecture_folder_edges,
            "hubs": {
                "high_fan_in": high_fan_in,
                "high_fan_out": high_fan_out,
            },
        },
        "problems": {
            "broken_dependencies": broken_dependencies,
            "cycles": cycle_records,
            "suspicious_orphans": suspicious_orphans,
            "unexpected_cross_layer_dependencies": unexpected_cross_layer_dependencies,
        },
    }

    OUTPUT_PATH.write_text(
        json.dumps(report, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Dependency architecture report written to {repository_relative(OUTPUT_PATH)}")
    print(f"Files scanned: {len(source_files)}")
    print(f"Dependency edges: {dependency_edge_count}")
    print(f"Broken references: {broken_reference_count}")
    print(f"Cycles: {len(cycle_records)}")
    print(f"Suspicious orphans: {len(suspicious_orphans)}")
    print(f"Unexpected scripts -> styles edges: {len(unexpected_cross_layer_dependencies)}")

    # Only an actually unresolved local dependency is a hard command failure.
    # Architectural signals remain available for review in the JSON report.
    return 1 if broken_reference_count else 0


if __name__ == "__main__":
    raise SystemExit(main())

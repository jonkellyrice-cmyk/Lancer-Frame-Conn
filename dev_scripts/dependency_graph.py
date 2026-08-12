from __future__ import annotations

import json
import re
from collections import defaultdict
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
    ".js",
    ".mjs",
    ".cjs",
    ".jsx",
    ".ts",
    ".tsx",
    ".mts",
    ".cts",
    ".css",
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
)

JS_DEPENDENCY_PATTERNS = (
    re.compile(r"(?:^|\n)\s*import\s+(?:[^\n;]*?\s+from\s+)?[\"']([^\"']+)[\"']", re.MULTILINE),
    re.compile(r"(?:^|\n)\s*export\s+[^\n;]*?\s+from\s+[\"']([^\"']+)[\"']", re.MULTILINE),
    re.compile(r"\bimport\s*\(\s*[\"']([^\"']+)[\"']\s*\)"),
    re.compile(r"\brequire\s*\(\s*[\"']([^\"']+)[\"']\s*\)"),
)

CSS_IMPORT_PATTERN = re.compile(
    r"@import\s+(?:url\(\s*)?[\"']([^\"']+)[\"']\s*\)?",
    re.IGNORECASE,
)


def repository_relative(path: Path) -> str:
    return path.resolve().relative_to(REPOSITORY_ROOT.resolve()).as_posix()


def iter_source_files() -> Iterable[Path]:
    for root in SCAN_ROOTS:
        if not root.exists():
            continue

        for path in root.rglob("*"):
            if not path.is_file():
                continue

            if path.suffix.lower() not in SOURCE_EXTENSIONS:
                continue

            yield path.resolve()


def extract_dependency_specifiers(path: Path) -> list[str]:
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return []

    suffix = path.suffix.lower()
    specifiers: list[str] = []

    if suffix in JAVASCRIPT_EXTENSIONS:
        for pattern in JS_DEPENDENCY_PATTERNS:
            specifiers.extend(pattern.findall(text))

    if suffix == ".css":
        specifiers.extend(CSS_IMPORT_PATTERN.findall(text))

    return specifiers


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
    for candidate in candidate_paths(importer, specifier):
        try:
            candidate.relative_to(REPOSITORY_ROOT.resolve())
        except ValueError:
            continue

        if candidate.is_file():
            return candidate.resolve()

    return None


def main() -> int:
    source_files = sorted(
        set(iter_source_files()),
        key=repository_relative,
    )
    source_set = set(source_files)

    dependencies: dict[Path, set[Path]] = {
        path: set()
        for path in source_files
    }
    reverse_dependencies: dict[Path, set[Path]] = defaultdict(set)
    broken_by_file: dict[Path, list[dict[str, str]]] = defaultdict(list)

    broken_reference_count = 0

    for importer in source_files:
        seen_broken_specifiers: set[str] = set()

        for specifier in extract_dependency_specifiers(importer):
            specifier = specifier.strip()

            if not specifier or not is_local_specifier(specifier):
                continue

            resolved = resolve_local_dependency(importer, specifier)

            if resolved is None:
                if specifier not in seen_broken_specifiers:
                    broken_by_file[importer].append({
                        "specifier": specifier,
                        "reason": "local dependency does not resolve to an existing repository file",
                    })
                    seen_broken_specifiers.add(specifier)
                    broken_reference_count += 1
                continue

            # Existing local files outside scripts/styles are valid, but they
            # are intentionally outside this compact graph and therefore do
            # not affect dependency/reverse-dependency counts.
            if resolved not in source_set:
                continue

            dependencies[importer].add(resolved)
            reverse_dependencies[resolved].add(importer)

    file_records: list[dict[str, object]] = []

    for path in source_files:
        record: dict[str, object] = {
            "file": repository_relative(path),
            "dependency_count": len(dependencies[path]),
            "reverse_dependency_count": len(reverse_dependencies[path]),
        }

        broken = broken_by_file.get(path)
        if broken:
            record["broken_dependencies"] = broken

        file_records.append(record)

    files_with_broken_dependencies = sum(
        1
        for record in file_records
        if "broken_dependencies" in record
    )

    report = {
        "schema_version": 1,
        "scope": ["scripts", "styles"],
        "summary": {
            "files_scanned": len(source_files),
            "dependency_edges": sum(len(values) for values in dependencies.values()),
            "files_with_broken_dependencies": files_with_broken_dependencies,
            "broken_dependency_references": broken_reference_count,
            "healthy": broken_reference_count == 0,
        },
        "files": file_records,
    }

    OUTPUT_PATH.write_text(
        json.dumps(report, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Dependency graph report written to {repository_relative(OUTPUT_PATH)}")
    print(f"Files scanned: {len(source_files)}")
    print(f"Dependency edges: {report['summary']['dependency_edges']}")
    print(f"Broken dependency references: {broken_reference_count}")

    return 1 if broken_reference_count else 0


if __name__ == "__main__":
    raise SystemExit(main())

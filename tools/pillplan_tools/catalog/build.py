"""Build web/src/data/catalog.json from data-src/.

Usage: python -m pillplan_tools.catalog.build [--check]
"""

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path

from .csv_source import read_catalog
from .models import Catalog

ROOT = Path(__file__).resolve().parents[3]


@dataclass(frozen=True)
class Output:
    path: Path
    content: str


def render_json(catalog: Catalog) -> str:
    data = catalog.model_dump(by_alias=True, mode="json")
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


def outputs(root: Path) -> list[Output]:
    catalog = read_catalog(root / "data-src")
    return [
        Output(root / "web" / "src" / "data" / "catalog.json", render_json(catalog)),
    ]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if outputs are out of date")
    parser.add_argument("--root", type=Path, default=ROOT)
    args = parser.parse_args(argv)

    stale: list[Path] = []
    for output in outputs(args.root):
        current = output.path.read_text(encoding="utf-8") if output.path.exists() else None
        if current == output.content:
            continue
        if args.check:
            stale.append(output.path)
        else:
            output.path.parent.mkdir(parents=True, exist_ok=True)
            output.path.write_text(output.content, encoding="utf-8")
            print(f"wrote {output.path.relative_to(args.root)}")

    if stale:
        for path in stale:
            print(f"out of date: {path.relative_to(args.root)}", file=sys.stderr)
        print("run: uv run python -m pillplan_tools.catalog.build", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

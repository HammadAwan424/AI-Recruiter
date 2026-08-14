from pathlib import Path
from typing import TypeVar

from pydantic import BaseModel


ModelT = TypeVar("ModelT", bound=BaseModel)


BACKEND_ROOT = Path(__file__).resolve().parents[2]
FIXTURES_ROOT = BACKEND_ROOT / "tests" / "fixtures"
ARTIFACTS_ROOT = BACKEND_ROOT / "tests" / ".artifacts"


def fixture_path(feature: str, scenario: str, category: str, filename: str) -> Path:
    """Return the path to a committed fixture owned by a test scenario."""
    return FIXTURES_ROOT / feature / scenario / category / filename


def artifact_path(feature: str, scenario: str, filename: str) -> Path:
    """Return the path for a generated, gitignored workflow artifact."""
    return ARTIFACTS_ROOT / feature / scenario / filename


def read_stage_schema(
    feature: str,
    scenario: str,
    filename: str,
    schema: type[ModelT],
) -> ModelT:
    """Read a generated stage artifact, falling back to its committed contract.

    A manual workflow can therefore be run sequentially using fresh artifacts,
    while an individual stage remains runnable from a stable committed contract.
    """
    generated = artifact_path(feature, scenario, filename)
    source = generated if generated.exists() else fixture_path(
        feature, scenario, "contracts", filename
    )
    return read_schema(source, schema)


def write_stage_artifact(
    feature: str,
    scenario: str,
    filename: str,
    value: ModelT,
) -> Path:
    """Validate and write a generated stage result outside committed fixtures."""
    path = artifact_path(feature, scenario, filename)
    write_schema(path, value)
    return path


def write_schema(path: Path, value: ModelT) -> None:
    """Validate and persist a schema JSON file outside committed fixtures."""
    resolved_path = path.resolve()
    try:
        resolved_path.relative_to(FIXTURES_ROOT.resolve())
    except ValueError:
        pass
    else:
        raise ValueError(
            "Committed fixtures are read-only; write generated output under "
            "tests/.artifacts instead."
        )

    validated = type(value).model_validate(value)
    resolved_path.parent.mkdir(parents=True, exist_ok=True)
    resolved_path.write_text(validated.model_dump_json(indent=2), encoding="utf-8")


def read_schema(path: Path, schema: type[ModelT]) -> ModelT:
    """Validate an application schema at the fixture consumer boundary."""
    return schema.model_validate_json(path.read_text(encoding="utf-8"))

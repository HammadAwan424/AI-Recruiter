"""Small, explicit upgrade helper for databases created before the model refactor.

Fresh test/mock databases should continue to use ``Base.metadata.create_all``.
This module is for an existing database only and is intentionally not imported
from application startup: upgrades must be run deliberately with a backup.
"""

from dataclasses import dataclass
import json

from sqlalchemy import Engine, inspect, text

from app.database import Base
import app.models  # noqa: F401 - register every model with Base.metadata
from app.schemas.extraction import ParsedResumeProfile
from app.schemas.parsing import ParsingLLMOutput
from app.schemas.screening import EvidenceSet, FitFlag, ScreeningDimensionWeights


@dataclass(frozen=True)
class UpgradeReport:
    added_columns: tuple[str, ...]
    created_indexes: tuple[str, ...]
    unresolved_candidate_rows: int
    converted_json_rows: int


def _add_column_if_missing(connection, table: str, column: str, definition: str) -> bool:
    columns = {item["name"] for item in inspect(connection).get_columns(table)}
    if column in columns:
        return False
    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
    return True


def _decode_json(value):
    if value is None:
        return None
    while isinstance(value, str):
        value = json.loads(value)
    return value


def _canonical_profile(value, source_name: str) -> dict | None:
    value = _decode_json(value)
    if value is None:
        return None
    if not isinstance(value, dict):
        raise ValueError("parsed_profile must contain a JSON object")

    profile = value.get("profile", value)
    if not isinstance(profile, dict):
        raise ValueError("parsed_profile.profile must contain a JSON object")

    work_history = profile.get("work_history", profile.get("experience", [])) or []
    normalized_work_history = []
    for item in work_history:
        if not isinstance(item, dict):
            raise ValueError("parsed_profile work history entries must be objects")
        duration = item.get("duration", "") or ""
        normalized_work_history.append({
            "title": item.get("title", "") or "",
            "company": item.get("company", "") or "",
            "start_date": item.get("start_date", duration) or "",
            "end_date": item.get("end_date", "") or "",
        })

    normalized = ParsedResumeProfile(
        schema_version="extraction.parsed_resume_profile.v1",
        source_name=value.get("source_name") or source_name,
        profile=ParsingLLMOutput(
            skills=profile.get("skills", []) or [],
            work_history=normalized_work_history,
            education=profile.get("education", []) or [],
            certifications=profile.get("certifications", []) or [],
            needs_review=profile.get("needs_review", False),
            review_reason=profile.get("review_reason"),
        ),
    )
    return normalized.model_dump(mode="json")


def _canonical_screening_json(connection) -> int:
    converted_rows = 0
    application_rows = connection.execute(text(
        "SELECT id, cv_pdf_path, parsed_profile FROM applications"
    )).mappings()
    for row in application_rows:
        value = _canonical_profile(
            row["parsed_profile"],
            row["cv_pdf_path"] or f"application-{row['id']}.resume",
        )
        if value is not None:
            connection.execute(
                text("UPDATE applications SET parsed_profile = :value WHERE id = :id"),
                {"id": row["id"], "value": json.dumps(value)},
            )
            converted_rows += 1

    screening_rows = connection.execute(text(
        "SELECT id, evidence, fit_flags, weights_used FROM application_screenings"
    )).mappings()
    for row in screening_rows:
        evidence = EvidenceSet.model_validate(_decode_json(row["evidence"])).model_dump(mode="json")
        fit_flags = [
            FitFlag.model_validate(item).model_dump(mode="json")
            for item in (_decode_json(row["fit_flags"]) or [])
        ]
        weights = ScreeningDimensionWeights.model_validate(
            _decode_json(row["weights_used"])
        ).model_dump(mode="json")
        connection.execute(
            text(
                "UPDATE application_screenings "
                "SET evidence = :evidence, fit_flags = :fit_flags, weights_used = :weights "
                "WHERE id = :id"
            ),
            {
                "id": row["id"],
                "evidence": json.dumps(evidence),
                "fit_flags": json.dumps(fit_flags),
                "weights": json.dumps(weights),
            },
        )
        converted_rows += 1

    return converted_rows


def upgrade_existing_schema(engine: Engine) -> UpgradeReport:
    """Upgrade an existing database to the current model and contract shape.

    The function deliberately stops when candidate tenancy cannot be inferred.
    It does not delete duplicates or silently assign a candidate to a company;
    those records require an operator-led data cleanup before the final
    non-null/unique constraints can be enabled.
    """

    # Creates new tables, such as gmail_accounts, without changing old tables.
    Base.metadata.create_all(bind=engine)
    added_columns: list[str] = []

    with engine.begin() as connection:
        for table, column, definition in (
            ("candidates", "company_id", "INTEGER"),
            ("candidates", "normalized_email", "VARCHAR(320)"),
            ("applications", "gmail_account_id", "INTEGER"),
            ("offers", "status", "VARCHAR(32) DEFAULT 'PENDING_APPROVAL'"),
            ("gmail_accounts", "token_json", "TEXT"),
            ("gmail_accounts", "is_primary", "BOOLEAN DEFAULT TRUE"),
        ):
            if _add_column_if_missing(connection, table, column, definition):
                added_columns.append(f"{table}.{column}")

        connection.execute(text(
            "UPDATE candidates "
            "SET normalized_email = lower(trim(email)) "
            "WHERE normalized_email IS NULL"
        ))
        connection.execute(text(
            "UPDATE candidates "
            "SET company_id = ("
            "  SELECT j.company_id FROM applications a "
            "  JOIN jobs j ON j.id = a.job_id "
            "  WHERE a.candidate_id = candidates.id "
            "  ORDER BY a.id LIMIT 1"
            ") WHERE company_id IS NULL"
        ))

        connection.execute(text(
            "INSERT INTO gmail_accounts (company_id, email, provider, is_active, is_primary) "
            "SELECT c.id, 'company-' || c.id || '@gmail.local', 'gmail', TRUE, TRUE "
            "FROM companies c "
            "WHERE NOT EXISTS ("
            "  SELECT 1 FROM gmail_accounts ga WHERE ga.company_id = c.id"
            ")"
        ))
        connection.execute(text(
            "UPDATE applications SET gmail_account_id = ("
            "  SELECT ga.id FROM gmail_accounts ga "
            "  JOIN jobs j ON j.company_id = ga.company_id "
            "  WHERE j.id = applications.job_id "
            "  ORDER BY ga.id LIMIT 1"
            ") WHERE gmail_account_id IS NULL AND gmail_message_id IS NOT NULL"
        ))
        connection.execute(text(
            "UPDATE offers SET status = CASE "
            "WHEN signed_at IS NOT NULL THEN 'SIGNED' "
            "WHEN decline_reason IS NOT NULL THEN 'DECLINED' "
            "WHEN secure_token IS NOT NULL THEN 'SENT' "
            "ELSE 'PENDING_APPROVAL' END "
            "WHERE status IS NULL OR status = ''"
        ))

        converted_json_rows = _canonical_screening_json(connection)
        for table, column in (
            ("applications", "parsed_profile"),
            ("application_screenings", "evidence"),
            ("application_screenings", "fit_flags"),
            ("application_screenings", "weights_used"),
        ):
            column_info = next(
                item for item in inspect(connection).get_columns(table)
                if item["name"] == column
            )
            type_name = str(column_info["type"]).upper()
            if "JSON" not in type_name:
                if engine.dialect.name == "postgresql":
                    connection.execute(text(
                        f"ALTER TABLE {table} ALTER COLUMN {column} TYPE JSON "
                        f"USING CASE WHEN {column} IS NULL OR btrim({column}) = '' "
                        f"THEN NULL ELSE {column}::json END"
                    ))

        unresolved = connection.execute(text(
            "SELECT count(*) FROM candidates "
            "WHERE company_id IS NULL OR normalized_email IS NULL"
        )).scalar_one()
        if unresolved:
            raise RuntimeError(
                f"{unresolved} candidate(s) could not be assigned to a company; "
                "resolve them before enabling candidate tenancy constraints"
            )

        indexes = (
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_candidates_company_email "
            "ON candidates(company_id, normalized_email)",
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_applications_candidate_job "
            "ON applications(candidate_id, job_id)",
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_applications_mailbox_message "
            "ON applications(gmail_account_id, gmail_message_id)",
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_user_job_scopes_user_job "
            "ON user_job_scopes(user_id, job_id)",
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_job_distributions_job_board "
            "ON job_distributions(job_id, board)",
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_global_name "
            "ON roles(name) WHERE company_id IS NULL",
        )
        for statement in indexes:
            connection.execute(text(statement))

    return UpgradeReport(
        added_columns=tuple(added_columns),
        created_indexes=(
            "uq_candidates_company_email",
            "uq_applications_candidate_job",
            "uq_applications_mailbox_message",
            "uq_user_job_scopes_user_job",
            "uq_job_distributions_job_board",
            "uq_roles_global_name",
        ),
        unresolved_candidate_rows=0,
        converted_json_rows=converted_json_rows,
    )

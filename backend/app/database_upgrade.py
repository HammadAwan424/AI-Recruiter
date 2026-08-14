"""Small, explicit upgrade helper for databases created before the model refactor.

Fresh test/mock databases should continue to use ``Base.metadata.create_all``.
This module is for an existing database only and is intentionally not imported
from application startup: upgrades must be run deliberately with a backup.
"""

from dataclasses import dataclass

from sqlalchemy import Engine, inspect, text

from app.database import Base
import app.models  # noqa: F401 - register every model with Base.metadata


@dataclass(frozen=True)
class UpgradeReport:
    added_columns: tuple[str, ...]
    created_indexes: tuple[str, ...]
    unresolved_candidate_rows: int
    legacy_json_columns: tuple[str, ...]


def _add_column_if_missing(connection, table: str, column: str, definition: str) -> bool:
    columns = {item["name"] for item in inspect(connection).get_columns(table)}
    if column in columns:
        return False
    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
    return True


def upgrade_existing_schema(engine: Engine) -> UpgradeReport:
    """Add/refill the refactor's compatibility columns and uniqueness indexes.

    The function deliberately stops when candidate tenancy cannot be inferred.
    It does not delete duplicates or silently assign a candidate to a company;
    those records require an operator-led data cleanup before the final
    non-null/unique constraints can be enabled.
    """

    # Creates new tables, such as gmail_accounts, without changing old tables.
    Base.metadata.create_all(bind=engine)
    added_columns: list[str] = []
    legacy_json_columns: list[str] = []

    with engine.begin() as connection:
        for table, column, definition in (
            ("candidates", "company_id", "INTEGER"),
            ("candidates", "normalized_email", "VARCHAR(320)"),
            ("applications", "gmail_account_id", "INTEGER"),
            ("offers", "status", "VARCHAR(32) DEFAULT 'PENDING_APPROVAL'"),
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
            "INSERT INTO gmail_accounts (company_id, email, provider, is_active) "
            "SELECT c.id, 'company-' || c.id || '@gmail.local', 'gmail', TRUE "
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

        json_columns = (
            ("applications", "parsed_profile"),
            ("application_screenings", "evidence"),
            ("application_screenings", "fit_flags"),
            ("application_screenings", "weights_used"),
        )
        for table, column in json_columns:
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
                else:
                    # SQLite's JSON affinity is represented by the existing
                    # text column. Pydantic boundary validators still decode
                    # legacy values; a production PostgreSQL upgrade performs
                    # the physical conversion above.
                    legacy_json_columns.append(f"{table}.{column}")

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
        legacy_json_columns=tuple(legacy_json_columns),
    )

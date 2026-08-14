from enum import Enum

from sqlalchemy import Enum as SQLAlchemyEnum


class StrEnum(str, Enum):
    """Enum whose values can be passed to existing string-based service code."""


class ApplicationStatus(StrEnum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER_APPROVAL = "offer_approval"
    OFFER_SENT = "offer_sent"
    HIRED = "hired"


class ApplicationDisposition(StrEnum):
    ACTIVE = "active"
    REJECTED = "rejected"


class JobStatus(StrEnum):
    PUBLISHED = "published"
    PENDING_APPROVAL = "pending_approval"


class InterviewStatus(StrEnum):
    AWAITING_SELECTION = "AWAITING_SELECTION"
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    RESCHEDULED = "RESCHEDULED"


class MeetingType(StrEnum):
    GOOGLE_MEET = "GOOGLE_MEET"
    JITSI = "JITSI"
    IN_PERSON = "IN_PERSON"


class OfferStatus(StrEnum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVAL_REJECTED = "APPROVAL_REJECTED"
    SENT = "SENT"
    SIGNED = "SIGNED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"


class SignatureType(StrEnum):
    DRAWN = "DRAWN"
    TYPED = "TYPED"


class UserStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    REJECTED = "rejected"


class RoleName(StrEnum):
    SUPERADMIN = "superadmin"
    CEO = "ceo"
    RECRUITER = "recruiter"
    HIRING_MANAGER = "hiring_manager"
    INTERVIEWER = "interviewer"
    EMPLOYEE = "employee"


class RoleJobScope(StrEnum):
    OWN = "own"
    ALL = "all"


class JobDistributionStatus(StrEnum):
    PENDING = "pending"
    POSTED = "posted"
    FAILED = "failed"


def db_enum(enum_type: type[StrEnum], name: str) -> SQLAlchemyEnum:
    """Create a portable SQLAlchemy enum that stores the enum values as strings."""

    return SQLAlchemyEnum(
        enum_type,
        name=name,
        native_enum=False,
        create_constraint=True,
        validate_strings=True,
        values_callable=lambda cls: [member.value for member in cls],
    )

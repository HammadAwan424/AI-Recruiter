from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, ForeignKey, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base, BaseModelMixin
from app.domain.enums import RoleJobScope, RoleName, db_enum


class Role(Base, BaseModelMixin):
    __tablename__ = "roles"
    __table_args__ = (
        UniqueConstraint("name", "company_id", name="uq_roles_name_company"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    name: Mapped[RoleName] = mapped_column(
        db_enum(RoleName, "role_name_registry"), nullable=False, index=True
    )
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    job_scope: Mapped[RoleJobScope] = mapped_column(
        db_enum(RoleJobScope, "role_job_scope"), default=RoleJobScope.OWN, nullable=False
    )

    # Audit Trail
    created_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    updated_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # ORM Relationships
    company = relationship("Company", foreign_keys=[company_id])
    role_permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])


Index(
    "uq_roles_global_name",
    Role.name,
    unique=True,
    sqlite_where=Role.company_id.is_(None),
    postgresql_where=Role.company_id.is_(None),
)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

from typing import Any, Dict

class BaseModelMixin:
    """Mixin to provide automated dictionary payload mapping to SQLAlchemy models."""

    def update_from_dict(self, data: Dict[str, Any], exclude_none: bool = False):
        """Updates model instance attributes directly from a dictionary."""
        for key, value in data.items():
            if hasattr(self, key) and (not exclude_none or value is not None):
                setattr(self, key, value)
        return self

    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """Constructs a model instance filtering out keys that are not model attributes."""
        valid_keys = {c.name for c in cls.__table__.columns}
        filtered_data = {k: v for k, v in data.items() if k in valid_keys}
        return cls(**filtered_data)


Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
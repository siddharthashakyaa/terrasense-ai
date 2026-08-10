"""
SQLAlchemy engine, session factory and declarative base.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and ensures it's closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Create all tables directly from the SQLAlchemy models.

    This is a convenience path for local development / quick-start so the
    app works out of the box without requiring an Alembic migration step.
    It is idempotent (CREATE TABLE IF NOT EXISTS semantics) and safe to
    call on every startup.

    For production deployments, set AUTO_CREATE_TABLES=false and manage
    the schema with Alembic instead:
        alembic upgrade head
    See backend/alembic/ and the "Database Migrations" section of the README.
    """
    if not settings.AUTO_CREATE_TABLES:
        return
    from app.db import models  # noqa: F401  (ensure models are registered)
    Base.metadata.create_all(bind=engine)

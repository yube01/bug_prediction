"""
Database connection for Neon PostgreSQL via SQLAlchemy async.
Reads DATABASE_URL from .env — expected format:
  postgresql+asyncpg://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
"""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

# Neon requires SSL; asyncpg uses a different URL scheme
_raw_url = settings.DATABASE_URL

# Convert standard postgresql:// to postgresql+asyncpg:// if needed
if _raw_url.startswith("postgresql://"):
    _db_url = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgres://"):
    _db_url = _raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
else:
    _db_url = _raw_url

# Neon free-tier needs SSL — asyncpg handles this via connect_args
engine = create_async_engine(
    _db_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    connect_args={"ssl": True} if "neon.tech" in _db_url else {},
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def get_db():
    """FastAPI dependency — yields an async DB session."""
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_tables():
    """Create all tables defined in models.py (safe to call repeatedly)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created / verified")

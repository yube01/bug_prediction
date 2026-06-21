"""
ORM models — User and SearchHistory tables.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    searches = relationship("SearchHistory", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"


class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    repo_name = Column(String(255), nullable=False)       # e.g. "facebook/react"
    branch = Column(String(255), nullable=False, default="main")
    total_commits = Column(Integer, default=0)
    high_risk_count = Column(Integer, default=0)
    medium_risk_count = Column(Integer, default=0)
    low_risk_count = Column(Integer, default=0)
    searched_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="searches")

    def __repr__(self):
        return f"<SearchHistory {self.repo_name} by user {self.user_id}>"

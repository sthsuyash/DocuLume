"""Collection sharing model."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class CollectionShare(Base):
    __tablename__ = "collection_shares"

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id", ondelete="CASCADE"), nullable=False, index=True)
    invited_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    shared_with_email = Column(String(255), nullable=False, index=True)
    shared_with_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    permission = Column(String(20), default="read", nullable=False)
    accepted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    collection = relationship("Collection", back_populates="shares")
    invited_by = relationship("User", foreign_keys=[invited_by_user_id])
    shared_with = relationship("User", foreign_keys=[shared_with_user_id])

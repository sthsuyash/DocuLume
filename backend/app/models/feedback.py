"""Message feedback model (thumbs up/down)."""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base


class FeedbackValue(str, enum.Enum):
    UP = "up"
    DOWN = "down"


class Feedback(Base):
    __tablename__ = "message_feedback"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    value = Column(SQLEnum(FeedbackValue), nullable=False)
    comment = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    message = relationship("Message", back_populates="feedback")
    user = relationship("User")

    def __repr__(self):
        return f"<Feedback {self.id}: {self.value} on message {self.message_id}>"

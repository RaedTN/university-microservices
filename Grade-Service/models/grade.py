"""SQLAlchemy models for grade entities."""
from sqlalchemy import Column, Float, Integer, String

from database.session import Base


class Grade(Base):
    """Represents a grade linked to a student and course."""

    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, index=True, nullable=False)
    course_id = Column(Integer, nullable=False)
    grade = Column(Float, nullable=False)
    student_email = Column(String, nullable=True)


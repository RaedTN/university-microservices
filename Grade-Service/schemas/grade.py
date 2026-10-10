"""Pydantic schemas used by the grade service."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class GradeBase(BaseModel):
    student_id: int = Field(..., ge=1, description="Student identifier")
    course_id: int = Field(..., ge=1, description="Course identifier")
    grade: float = Field(..., ge=0, le=20, description="Grade value (0-20 scale)")


class GradeCreate(GradeBase):
    """Schema for creating a grade."""


class GradeUpdate(BaseModel):
    grade: float = Field(..., ge=0, le=20, description="Updated grade value (0-20 scale)")


class GradeOut(GradeBase):
    id: int

    class Config:
        orm_mode = True


class StudentGrades(BaseModel):
    student_id: int
    notes: List[GradeOut]
    moyenne: Optional[float]


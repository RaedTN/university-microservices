"""Grade service API routes."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import AsyncSessionLocal, get_session
from models.grade import Grade
from schemas.grade import GradeCreate, GradeOut, GradeUpdate, StudentGrades

router = APIRouter()


@router.post("", response_model=GradeOut, status_code=status.HTTP_201_CREATED)
async def create_grade(grade_data: GradeCreate, session: AsyncSession = Depends(get_session)):
    """Create a new grade."""
    grade = Grade(
        student_id=grade_data.student_id,
        course_id=grade_data.course_id,
        grade=grade_data.grade
    )
    session.add(grade)
    await session.commit()
    await session.refresh(grade)
    return grade


@router.put("/{grade_id}", response_model=GradeOut)
async def update_grade(
    grade_id: int, grade_data: GradeUpdate, session: AsyncSession = Depends(get_session)
):
    """Update an existing grade."""
    result = await session.execute(select(Grade).where(Grade.id == grade_id))
    grade = result.scalar_one_or_none()
    if not grade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grade not found")
    grade.grade = grade_data.grade  # GradeUpdate only has grade field
    await session.commit()
    await session.refresh(grade)
    return grade


@router.delete("/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grade(grade_id: int, session: AsyncSession = Depends(get_session)):
    """Delete a grade."""
    result = await session.execute(select(Grade).where(Grade.id == grade_id))
    grade = result.scalar_one_or_none()
    if not grade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grade not found")
    await session.delete(grade)
    await session.commit()
    return None


@router.get("/student/{student_id}", response_model=StudentGrades)
async def get_student_grades(student_id: int, session: AsyncSession = Depends(get_session)):
    """Get all grades for a student and calculate average."""
    result = await session.execute(select(Grade).where(Grade.student_id == student_id))
    grades = result.scalars().all()
    
    if not grades:
        return StudentGrades(student_id=student_id, notes=[], moyenne=None)
    
    grade_list = [GradeOut.from_orm(g) for g in grades]
    average = sum(g.grade for g in grades) / len(grades)
    
    return StudentGrades(student_id=student_id, notes=grade_list, moyenne=round(average, 2))


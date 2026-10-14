"""Grade service API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_session
from models.grade import Grade
from schemas.grade import EmailGrades, GradeCreate, GradeOut, GradeUpdate, StudentGrades

router = APIRouter()

STAFF = {"ADMIN", "ENSEIGNANT"}


def current_user(request: Request) -> dict:
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    return user


def require_staff(request: Request) -> dict:
    user = current_user(request)
    if user.get("role") not in STAFF:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return user


def _average(grades) -> float | None:
    if not grades:
        return None
    return round(sum(g.grade for g in grades) / len(grades), 2)


@router.post("", response_model=GradeOut, status_code=status.HTTP_201_CREATED)
async def create_grade(
    grade_data: GradeCreate, request: Request, session: AsyncSession = Depends(get_session)
):
    """Create a new grade. Teachers and admins only."""
    require_staff(request)
    grade = Grade(
        student_id=grade_data.student_id,
        course_id=grade_data.course_id,
        grade=grade_data.grade,
        student_email=grade_data.student_email,
    )
    session.add(grade)
    await session.commit()
    await session.refresh(grade)
    return grade


@router.put("/{grade_id}", response_model=GradeOut)
async def update_grade(
    grade_id: int, grade_data: GradeUpdate, request: Request, session: AsyncSession = Depends(get_session)
):
    """Update an existing grade. Teachers and admins only."""
    require_staff(request)
    result = await session.execute(select(Grade).where(Grade.id == grade_id))
    grade = result.scalar_one_or_none()
    if not grade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grade not found")
    grade.grade = grade_data.grade
    await session.commit()
    await session.refresh(grade)
    return grade


@router.delete("/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grade(grade_id: int, request: Request, session: AsyncSession = Depends(get_session)):
    """Delete a grade. Teachers and admins only."""
    require_staff(request)
    result = await session.execute(select(Grade).where(Grade.id == grade_id))
    grade = result.scalar_one_or_none()
    if not grade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grade not found")
    await session.delete(grade)
    await session.commit()
    return None


@router.get("/by-email", response_model=EmailGrades)
async def get_grades_by_email(email: str, request: Request, session: AsyncSession = Depends(get_session)):
    """Grades for one email. Students may only request their own email."""
    user = current_user(request)
    role = user.get("role")
    caller = str(user.get("sub") or "")
    if role == "ETUDIANT" and caller.lower() != email.lower():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if role not in STAFF and role != "ETUDIANT":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    result = await session.execute(select(Grade).where(Grade.student_email == email))
    grades = result.scalars().all()
    return EmailGrades(
        student_email=email,
        notes=[GradeOut.from_orm(g) for g in grades],
        moyenne=_average(grades),
    )


@router.get("/student/{student_id}", response_model=StudentGrades)
async def get_student_grades(student_id: int, request: Request, session: AsyncSession = Depends(get_session)):
    """Get grades for a numeric student id and calculate the average."""
    user = current_user(request)
    role = user.get("role")
    caller = str(user.get("sub") or "").lower()
    if role not in STAFF and role != "ETUDIANT":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    result = await session.execute(select(Grade).where(Grade.student_id == student_id))
    grades = list(result.scalars().all())
    if role == "ETUDIANT":
        grades = [g for g in grades if g.student_email and g.student_email.lower() == caller]

    return StudentGrades(
        student_id=student_id,
        notes=[GradeOut.from_orm(g) for g in grades],
        moyenne=_average(grades),
    )
